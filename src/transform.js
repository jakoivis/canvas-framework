
var TransformCache = require('./transformCache.js');

module.exports = Transform;

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
        pixelCache = new TransformCache(imageDataOriginal, 4);
        // me.updateCache();
    }

    /**
     * Must be called when image data has been changed.
     * Called initially
     */
    // me.updateCache = function()
    // {
    //     pixelCache = [];

    //     var width = imageDataOriginal.width;
    //     var height = imageDataOriginal.height;
    //     var dataLength = width * height;
    //     var x;
    //     var y;

    //     for (var i = 0; i < dataLength; i++)
    //     {
    //         x = (i % width);
    //         y = Math.floor(i / width);

    //         pixelCache.push({
    //             approximate: me.isApproximated(width, height, x, y),
    //             x: x,
    //             y: y,
    //             i: i,
    //             tx: 0, // translated positions. These are evaluated
    //             ty: 0 // in evaluatePixel function if needed
    //         });
    //     }
    // };

    // me.getApproximateCacheIndex1 = function(width, height, x, y, index)
    // {
    //     // if(x )
    // };

    // me.isApproximated = function(width, height, x, y)
    // {
    //     // points marked with x will be calculated
    //     // points marked with - will be approximated
    //     // last should be calculated on right and bottom
    //     //   0 1 2 3 4 5
    //     // 0 x - x - x x
    //     // 1 - - - - - x
    //     // 2 x - x - x x
    //     // 3 - - - - - x
    //     // 4 x - x - x x
    //     // 5 x x x x x x

    //     return ! (
    //         (y % 4 === 0 && x % 4 === 0) ||
    //         (x === width-1 || y === height-1)
    //     );
    // };

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
        for (var srcIndex = 0; srcIndex < length; srcIndex++)
        {
            evaluatePixel(srcIndex, uint32Src, uint32Dst, parameters, pixelCache.data, srcWidth);
        }
        // console.timeEnd("transform2");

        imageDataDst.data.set(uint8CDst);

        return imageDataDst;
    }

    function transform2(evaluatePixel, userParameters)
    {
        var imageData = imageDataModified;
        var imageDataNew = context.createImageData(imageData);

        var imageDataPixels = imageData.data;
        var newImageDataPixels = imageDataNew.data;

        var result = [];
        var length = newImageDataPixels.length;
        var parameters = {
            imageData: imageData
        };

        userParameters = userParameters || {};

        for(var property in userParameters)
        {
            parameters[property] = userParameters[property];
        }

        for (var i = 0; i < length; i += 4)
        {
            parameters.r = imageDataPixels[i];
            parameters.g = imageDataPixels[i+1];
            parameters.b = imageDataPixels[i+2];
            parameters.a = imageDataPixels[i+3];
            parameters.x = (i % (imageData.width << 2)) >> 2;
            parameters.y = Math.floor(i / (imageData.width << 2));

            result = evaluatePixel(parameters);

            newImageDataPixels[i]   = result[0]; // R
            newImageDataPixels[i+1] = result[1]; // G
            newImageDataPixels[i+2] = result[2]; // B
            newImageDataPixels[i+3] = result[3]; // A
        }

        return imageDataNew;
    }

    init();
}

Transform.sampleLinear = function(imageData, x, y)
{
    var data = imageData.data;
    var index = y * (imageData.width << 2) + (x << 2);

    return [
        data[index],
        data[index+1],
        data[index+2],
        data[index+3]
    ];
};

Transform.distance = function(x1, y1, x2, y2)
{
    var distanceX = x1-x2;
    var distanceY = y1-y2;
    return Math.sqrt(distanceX*distanceX + distanceY*distanceY);
};

Transform.degreesToRadians = function(degree)
{
    return (degree/180.0)*3.14159265;
};

Transform.Invert = function(p)
{
    return [255-p.r, 255-p.g, 255-p.b, p.a];
};

Transform.GrayScale = function(p)
{
    var average = (p.r + p.g + p.b) /3;
    return [average, average, average, p.a];
};

Transform.Alpha = function(p)
{
    return [p.r, p.g, p.b, p.value];
};

// Weighted alpha blend between two images.
// Used for drawing images with alpha colors
// on top of other images
Transform.WeightedAlphaBlend = function(p)
{
    var p2 = Transform.sampleLinear(p.imageData2, p.x, p.y);
    var p2a = p2[3];
    var p2aPct = p2a / 255;

    if(p2a === 255)
    {
        return [p2[0], p2[1], p2[2], p2[3]];
    }
    else if(p2a === 0)
    {
        return [p.r, p.g, p.b, p.a];
    }

    return [
        getGetColorFromGradient(p.r, p2[0], p2aPct),
        getGetColorFromGradient(p.g, p2[1], p2aPct),
        getGetColorFromGradient(p.b, p2[2], p2aPct),
        p.a > p2a ? p.a : p2a
    ];
};

Transform.Rotate = function(p)
{
    var degree = p.degree;

    var radian = Transform.degreesToRadians(degree);
    var tx = Math.round(p.x*Math.cos(radian) - p.y*Math.sin(radian));
    var ty = Math.round(p.x*Math.sin(radian) + p.y*Math.cos(radian));

    return Transform.sampleLinear(p.imageData, tx, ty);
};

Transform.Swirl = function(srcIndex, src32, dst32, p, pixelCache, srcWidth)
{
    var cache = pixelCache[srcIndex];

    if(cache.approximate)
    {
        Transform.SwirlApproximation(srcIndex, src32, dst32, p, pixelCache, srcWidth);
        return;
    }

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
    var tx = Math.cos(radian)*radius;
    var ty = Math.sin(radian)*radius;

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

Transform.SwirlApproximation = function(srcIndex, src32, dst32, p, pixelCache, srcWidth)
{

};

Transform.SwirlOld = function(p)
{
    var originX = p.originX;
    var originY = p.originY;
    var degree = p.degree;
    var radius = p.radius;

    var distance = Transform.distance(p.x, p.y, originX, originY);

    // radian is the greater the farther the pixel is from origin
    var radian = Transform.degreesToRadians(degree * distance);
    var tx = originX + Math.cos(radian)*radius;
    var ty = originY - Math.sin(radian)*radius;

    tx -= originX;
    ty -= originY;

    tx = Math.round(p.x - tx);
    ty = Math.round(p.y - ty);

    return Transform.sampleLinear(p.imageData, tx, ty);
};

/**
 * Get color value between two color component at the specified position
 * @param colorComponent1 color component e.g. red value from 0 to 255
 * @param colorComponent2 color component e.g. red value from 0 to 255
 * @param position Position of the color in gradient. Number value from 0 to 1
 * @return number between 0 to 255
 */
function getGetColorFromGradient(colorComponent1, colorComponent2, position)
{
    return colorComponent1 - position * (colorComponent1 - colorComponent2);
}

Transform.descriptions = {
    Invert: {
        arguments: []
    },
    GrayScale: {
        arguments: []
    },
    Alpha: {
        arguments: [
            {
                name:"value",
                min: 0,
                max: 255,
                default: 255,
                type: "number",
                description: "Control the alpha channel of pixels."
            }
        ]
    },
    Rotate: {
        arguments: []
    },
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
