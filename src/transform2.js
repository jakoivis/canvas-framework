var SMath = require("smath");
var TransformCache = require('./transformCache.js');

module.exports = Transform;

var level = 2;

var sMath = new SMath({resolution:1200});

function Transform(imageDataOriginal, context)
{
    'use strict';

    if (!(this instanceof Transform))
    {
        return new Transform(imageData);
    }

    var me = this;

    var imageDataModified = imageDataOriginal;

    var pixelCache;

    function init()
    {
        pixelCache = new TransformCache(imageDataOriginal, level, [Transform.Swirl, Transform.Swirl_squareCache1, Transform.Swirl_squareCache2]);
    }

    me.getImageData = function()
    {
        return imageDataModified;
    };

    /**
     * Perform transformation by remanipulating original data.
     * Can be used to appy only one transformation.
     */
    me.do = function(evaluatePixel, parameters)
    {
        imageDataModified = transform(imageDataModified, evaluatePixel, parameters);
    };

    /**
     * Perform transformation by remanipulating data.
     * Can be used to perform multiple transformations.
     * Reset must be called manually before executing
     * new transformations.
     *
     * @param      {function}  evaluatePixel  The evaluate pixel
     * @param      {object}  parameters
     */
    me.doOld = function(evaluatePixel, parameters)
    {
        imageDataModified = transform2(evaluatePixel, parameters);
    };

    me.reset = function()
    {
        imageDataModified = imageDataOriginal;
    };

    function transform(imageDataSrc, evaluatePixel, parameters)
    {
        var bufferSrc = imageDataSrc.data.buffer;
        var bufferDst = new ArrayBuffer(imageDataSrc.data.length);

        var uint32Src = new Uint32Array(bufferSrc);
        var uint32Dst = new Uint32Array(bufferDst);

        var uint8CSrc = new Uint8ClampedArray(bufferSrc);
        var uint8CDst = new Uint8ClampedArray(bufferDst);

        var imageDataDst = context.createImageData(imageDataSrc);

        var length = uint32Src.length;
        var srcWidth = imageDataSrc.width;
        var result = [];

        // console.time("transform2");

        var loopIndices = pixelCache.loopIndices;
        var loopIndicesLen = loopIndices.length;
        var cacheData = pixelCache.data;
        var srcIndex;
        var cache;

        for(var i = 0; i < loopIndicesLen; i++)
        {
            srcIndex = loopIndices[i];
            cache = cacheData[srcIndex];

            cache.fn(srcIndex, uint32Src, uint32Dst, parameters, cache, cacheData, srcWidth);
        }

        // console.timeEnd("transform2");

        imageDataDst.data.set(uint8CDst);

        return imageDataDst;
    }

    init();
}

Transform.Swirl = function(srcIndex, src32, dst32, p, cache, pixelCache, srcWidth)
{
    // if(cache.approximate)
    // {
    //     Transform.SwirlApproximation(srcIndex, src32, dst32, p, pixelCache, srcWidth);
    //     return;
    // }

    var originX = p.originX;
    var originY = p.originY;
    var radius = p.radius;

    // var distance = Transform.distance(cache.x, cache.y, originX, originY);
    var distanceX = cache.x-originX;
    var distanceY = cache.y-originY;
    var distance = Math.sqrt(distanceX*distanceX + distanceY*distanceY);

    // radian is the greater the farther the pixel is from origin
    var radian = p.angle * distance;
    // var tx = originX + Math.cos(radian)*radius;
    // var ty = originY - Math.sin(radian)*radius;
    // var tx = Math.cos(radian)*radius;
    // var ty = Math.sin(radian)*radius;

    var tx = sMath.cos(radian)*radius;
    var ty = sMath.sin(radian)*radius;

    // tx -= originX;
    // ty -= originY;

    // tx = cache.x - Math.round(tx);
    // ty = cache.y - Math.round(ty);
    tx = (cache.x + tx) | 0;
    ty = (cache.y + ty) | 0;


    if(tx < 0 || ty < 0) {
        return;
    }

    // return Transform.sampleLinear(p.imageData, tx, ty);
    dst32[srcIndex] = src32[ty * srcWidth + tx];
    cache.tx = tx;
    cache.ty = ty;
};

Transform.Swirl_squareCache1 = function(srcIndex, src32, dst32, p, cache, pixelCache, srcWidth)
{
     // data.push({
     //            approximate: approximate,
     //            i1: pixel1,
     //            i2: pixel2,
     //            i1Dist: pixel1Dist,
     //            x: x,
     //            y: y,
     //            i: i,
     //            tx: 0, // translated positions. These are evaluated
     //            ty: 0 // in evaluatePixel function if needed
     //        });
    var cache1 = pixelCache[cache.i1];
    var cache2 = pixelCache[cache.i2];
    var p1x = cache1.tx;
    var p1y = cache1.ty;
    var p2x = cache2.tx;
    var p2y = cache2.ty;

    // if(cache.method === 1)
    // {
    var tx = (((p2x-p1x) / level) * cache.i1Dist + p1x) | 0;
    var ty = (((p2y-p1y) / level) * cache.i1Dist + p1y) | 0;
    // }
    // else if(cache.method === 2)
    // {
    //     tx = p1x;
    //     ty = p2y;
    // }

    dst32[srcIndex] = src32[ty * srcWidth + tx];
    cache.tx = tx;
    cache.ty = ty;
};

Transform.Swirl_squareCache2 = function(srcIndex, src32, dst32, p, cache, pixelCache, srcWidth)
{
    var cache1 = pixelCache[cache.i1];
    var cache2 = pixelCache[cache.i2];
    var p1x = cache1.tx;
    var p2y = cache2.ty;

    var tx = p1x;
    var ty = p2y;

    dst32[srcIndex] = src32[ty * srcWidth + tx];
    cache.tx = tx;
    cache.ty = ty;
}

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
