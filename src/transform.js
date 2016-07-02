
var CanvasUtil = require("./CanvasUtil.js");
var SMath = require("smath");

var sMath = new SMath({resolution:1200});

function Transform(imageDataOriginal)
{
    'use strict';

    if (!(this instanceof Transform))
    {
        return new Transform(imageData);
    }

    var me = this;
    var imageDataModified;
    var cache;

    function init()
    {
        imageDataModified = imageDataOriginal;
        cache = createCache(imageDataOriginal);
    }

    Object.defineProperty(this, "imageData", {
        get: function()
        {
            return imageDataModified;
        }
    });

    /**
     * Perform transformation by remanipulating original data.
     * Can be used to appy only one transformation.
     */
    me.do = function(transformFn, parameters)
    {
        imageDataModified = transform(transformFn, parameters, imageDataModified, cache);
    };

    me.reset = function()
    {
        imageDataModified = imageDataOriginal;
    };

    function createCache(imageData)
    {
        var width = imageData.width;
        var height = imageData.height;
        var dataLength = width * height;
        var x;
        var y;

        var data = [];

        for (var i = 0; i < dataLength; i++)
        {
            x = (i % width);
            y = Math.floor(i / width);

            data.push({
                x: x,
                y: y,
                i: i
            });
        }

        return data;
    }

    function transform(transformFn, parameters, imageDataSrc, cache)
    {
        var bufferSrc = imageDataSrc.data.buffer;
        var bufferDst = new ArrayBuffer(imageDataSrc.data.length);

        var uint32Src = new Uint32Array(bufferSrc);
        var uint32Dst = new Uint32Array(bufferDst);

        var uint8CSrc = new Uint8ClampedArray(bufferSrc);
        var uint8CDst = new Uint8ClampedArray(bufferDst);

        var imageDataDst = CanvasUtil.createImageData(imageDataSrc);

        var length = uint32Src.length;
        var width = imageDataSrc.width;
        var result = [];

        for(var i = 0; i < length; i++)
        {
            transformFn(i, uint32Src, uint32Dst, parameters, width, cache);
        }

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

    if(tx < 0 || ty < 0 || tx > width-1 || ty > 800) {
        return;
    }

    dst32[srcIndex] = src32[ty * width + tx];
};

// function isApproximated(width, height, x, y)
// {
//     // x calculated, - approximated
//     // e.g. 6x6 level=2
//     //   0 1 2 3 4 5
//     // 0 x - x - x x
//     // 1 - - - - - -
//     // 2 x - x - x x
//     // 3 - - - - - -
//     // 4 x - x - x x
//     // 5 x - x - x x

//     return ! (
//         // normal pattern
//         (y % level === 0 && x % level === 0) ||

//         // fix bottom edge in uneven situations
//         (y === height-1 && x % level === 0) ||

//         // fix right edge in uneven situations
//         (x === width-1 && y % level === 0) ||

//         // last is always included
//         (x === width-1 && y === height-1)
//     );
// };

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