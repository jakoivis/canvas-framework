var SMath = require("smath");
var TransformCacheBasic = require('./transformCacheBasic.js');

var sMath = new SMath({resolution:1200});

function Transform(imageDataOriginal, context)
{
    'use strict';

    if (!(this instanceof Transform))
    {
        return new Transform(imageData);
    }

    var me = this;
    var imageDataModified;
    var cacheInstance;

    function init()
    {
        imageDataModified = imageDataOriginal;
    }

    me.getImageData = function()
    {
        return imageDataModified;
    };

    /**
     * Perform transformation by remanipulating original data.
     * Can be used to appy only one transformation.
     */
    me.do = function(transformFn, parameters, customCache)
    {
        imageDataModified = transform(imageDataModified, transformFn, parameters, customCache);
    };

    me.reset = function()
    {
        imageDataModified = imageDataOriginal;
    };

    function getCache(transformFn, customCache)
    {
        if(!cacheInstance && !customCache)
        {
            cacheInstance = new transformFn.cache(imageDataOriginal);
        }
        else if(customCache)
        {
            cacheInstance = customCache;
        }

        return cacheInstance;
    }

    function transform(imageDataSrc, transformFn, parameters, customCache)
    {
        var cache = getCache(transformFn, customCache);

        var bufferSrc = imageDataSrc.data.buffer;
        var bufferDst = new ArrayBuffer(imageDataSrc.data.length);

        var uint32Src = new Uint32Array(bufferSrc);
        var uint32Dst = new Uint32Array(bufferDst);

        var uint8CSrc = new Uint8ClampedArray(bufferSrc);
        var uint8CDst = new Uint8ClampedArray(bufferDst);

        var imageDataDst = context.createImageData(imageDataSrc);

        var length = uint32Src.length;
        var width = imageDataSrc.width;
        var cacheData = cache.data;
        var result = [];

        // console.time("-2");

        for(var i = 0; i < length; i++)
        {
            transformFn(i, uint32Src, uint32Dst, parameters, width, cacheData);
        }

        // console.timeEnd("-2");

        imageDataDst.data.set(uint8CDst);

        return imageDataDst;
    }

    init();
}

Transform.Swirl = function(srcIndex, src32, dst32, p, width, cache)
{
    var pixelCache = cache[srcIndex];
    var originX = p.originX;
    var originY = p.originY;
    var radius = p.radius;

    var distanceX = pixelCache.x-originX;
    var distanceY = pixelCache.y-originY;
    var distance = Math.sqrt(distanceX*distanceX + distanceY*distanceY);

    var radian = p.angle * distance;

    var tx = (pixelCache.x + sMath.cos(radian) * radius) | 0;
    var ty = (pixelCache.y + sMath.sin(radian) * radius) | 0;

    if(tx < 0 || tx > width-1) {
        return;
    }

    dst32[srcIndex] = src32[ty * width + tx];
};

Transform.Swirl.cache = TransformCacheBasic;


Transform.descriptions = {
    Swirl: {
        arguments: [
            {
                name: "originX",
                min: Number.MIN_VALUE,
                max: Number.MAX_VALUE,
                default: 0,
                type: "number",
                description: "Center position of the transform on X axis."
            },
            {
                name: "originY",
                min: Number.MIN_VALUE,
                max: Number.MAX_VALUE,
                default: 0,
                type: "number",
                description: "Center position of the transform on Y axis."
            },
            {
                name: "angle",
                min: Number.MIN_VALUE,
                max: Number.MAX_VALUE,
                default: 0.0349,
                type: "number",
                description: "Angle of the twist in radians."
            },
            {
                name: "radius",
                min: Number.MIN_VALUE,
                max: Number.MAX_VALUE,
                default: 20,
                type: "number",
                description: ""
            },
        ]
    }
};

module.exports = Transform;