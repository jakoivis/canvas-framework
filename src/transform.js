
'use strict';

module.exports = Transform;

function Transform(imageData, context)
{
    if (!(this instanceof Transform))
    {
        return new Transform(imageData);
    }

    var me = this;
    var modifiedImageData;

    me.getImageData = function()
    {
        return modifiedImageData;
    }

    me.do = function(pixelTransform, factor)
    {
        modifiedImageData = transform(pixelTransform, factor);

        return me;
    }

    function transform(pixelTransform, factor)
    {
        var imageDataPixels = imageData.data;
        var newImageData = context.createImageData(imageData);
        var newImageDataPixels = newImageData.data;
        var result = [];
        var length = newImageDataPixels.length;

        for (var i = 0; i < length; i += 4)
        {
            result = pixelTransform(
                imageDataPixels[i],
                imageDataPixels[i+1],
                imageDataPixels[i+2],
                imageDataPixels[i+3], factor, i);

            newImageDataPixels[i]   = result[0]; // r
            newImageDataPixels[i+1] = result[1]; // g
            newImageDataPixels[i+2] = result[2]; // b
            newImageDataPixels[i+3] = result[3]; // a
        }

        return newImageData;
    };

    Transform.Invert = function(r, g, b, a, factor, i)
    {
        return [255-r, 255-g, 255-b, a];
    };

    Transform.GrayScale = function(r, g, b, a)
    {
        var average = (r + g + b) /3;
        return [average, average, average, a];
    }
}
