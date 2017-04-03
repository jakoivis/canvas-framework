
module.exports = TransformOriginal;

function TransformOriginal(imageDataOriginal, context)
{
    'use strict';

    if (!(this instanceof TransformOriginal))
    {
        return new TransformOriginal(imageData);
    }

    var me = this;
    var imageDataModified;

    function init()
    {
        imageDataModified = imageDataOriginal;
    }

    me.getImageData = function()
    {
        return imageDataModified;
    };

    /**
     * Perform transformation by remanipulating data.
     * Can be used to perform multiple transformations.
     * Reset must be called manually before executing
     * new transformations.
     *
     * @param      {function}  transformFn  The evaluate pixel
     * @param      {object}  parameters
     */
    me.do = function(transformFn, parameters)
    {
        imageDataModified = transform(transformFn, parameters);
    };

    me.reset = function()
    {
        imageDataModified = imageDataOriginal;
    };

    function transform(transformFn, userParameters)
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

            result = transformFn(parameters);

            newImageDataPixels[i]   = result[0]; // R
            newImageDataPixels[i+1] = result[1]; // G
            newImageDataPixels[i+2] = result[2]; // B
            newImageDataPixels[i+3] = result[3]; // A
        }

        return imageDataNew;
    }

    init();
}

TransformOriginal.sampleLinear = function(imageData, x, y)
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

TransformOriginal.distance = function(x1, y1, x2, y2)
{
    var distanceX = x1-x2;
    var distanceY = y1-y2;
    return Math.sqrt(distanceX*distanceX + distanceY*distanceY);
};

TransformOriginal.degreesToRadians = function(degree)
{
    return (degree/180.0)*3.14159265;
};

TransformOriginal.Invert = function(p)
{
    return [255-p.r, 255-p.g, 255-p.b, p.a];
};

TransformOriginal.GrayScale = function(p)
{
    var average = (p.r + p.g + p.b) /3;
    return [average, average, average, p.a];
};

TransformOriginal.Alpha = function(p)
{
    return [p.r, p.g, p.b, p.value];
};

// Weighted alpha blend between two images.
// Used for drawing images with alpha colors
// on top of other images
TransformOriginal.WeightedAlphaBlend = function(p)
{
    var p2 = TransformOriginal.sampleLinear(p.imageData2, p.x, p.y);
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

TransformOriginal.Rotate = function(p)
{
    var degree = p.degree;

    var radian = TransformOriginal.degreesToRadians(degree);
    var tx = Math.round(p.x*Math.cos(radian) - p.y*Math.sin(radian));
    var ty = Math.round(p.x*Math.sin(radian) + p.y*Math.cos(radian));

    return TransformOriginal.sampleLinear(p.imageData, tx, ty);
};

TransformOriginal.Swirl = function(p)
{
    var originX = p.originX;
    var originY = p.originY;
    var degree = p.degree;
    var radius = p.radius;

    var distance = TransformOriginal.distance(p.x, p.y, originX, originY);

    // radian is the greater the farther the pixel is from origin
    var radian = TransformOriginal.degreesToRadians(degree * distance);
    var tx = originX + Math.cos(radian)*radius;
    var ty = originY - Math.sin(radian)*radius;

    tx -= originX;
    ty -= originY;

    tx = Math.round(p.x - tx);
    ty = Math.round(p.y - ty);

    return TransformOriginal.sampleLinear(p.imageData, tx, ty);
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

TransformOriginal.descriptions = {
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
