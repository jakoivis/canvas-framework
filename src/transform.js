
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

    me.do = function(evaluatePixel, factor)
    {
        modifiedImageData = transform(evaluatePixel, factor);

        return me;
    }

    function transform(evaluatePixel, factor)
    {
        var imageDataPixels = imageData.data;
        var newImageData = context.createImageData(imageData);
        var newImageDataPixels = newImageData.data;
        var result = [];
        var length = newImageDataPixels.length;

        for (var i = 0; i < length; i += 4)
        {
            result = evaluatePixel(
                imageDataPixels[i],
                imageDataPixels[i+1],
                imageDataPixels[i+2],
                imageDataPixels[i+3],
                imageData,
                (i%(imageData.width*4)/4),
                Math.floor(i/(imageData.width*4)),
                i);

            newImageDataPixels[i]   = result[0]; // r
            newImageDataPixels[i+1] = result[1]; // g
            newImageDataPixels[i+2] = result[2]; // b
            newImageDataPixels[i+3] = result[3]; // a
        }

        return newImageData;
    };

    Transform.sampleLinear = function(imageData, x, y)
    {
        return [
            imageData.data[y * imageData.width*4 + x*4],
            imageData.data[y * imageData.width*4 + x*4+1],
            imageData.data[y * imageData.width*4 + x*4+2],
            imageData.data[y * imageData.width*4 + x*4+3]
        ];
    };

    Transform.Invert = function(r, g, b, a)
    {
        return [255-r, 255-g, 255-b, a];
    };

    Transform.GrayScale = function(r, g, b, a)
    {
        var average = (r + g + b) /3;
        return [average, average, average, a];
    };

    Transform.Rotate = function(r, g, b, a, imageData, x, y, i)
    {
        var degree = 19;
        var radian = (degree/180.0)*3.14159265;
        var tx = Math.round(x*Math.cos(radian) - y*Math.sin(radian));
        var ty = Math.round(x*Math.sin(radian) + y*Math.cos(radian));

        return Transform.sampleLinear(imageData, tx, ty);
    }

    Transform.Swirl = function(r, g, b, a, imageData, x, y, i)
    {
        var originX = 0;
        var originY = 0;
        var degree = 5;
        var radius = 20;

        // calculate distance of pixel from origin
        var distanceX = x-originX;
        var distanceY = y-originY;
        var distance = Math.sqrt(distanceX*distanceX + distanceY*distanceY);

        // radian is the greater the farther the pixel is from origin
        var radian = ((degree * distance)/180.0)*3.14159265;
        var tx = originX + Math.cos(radian)*radius;
        var ty = originY - Math.sin(radian)*radius;

        tx -= originX;
        ty -= originY;

        tx = Math.round(x - tx);
        ty = Math.round(y - ty);

        return Transform.sampleLinear(imageData, tx, ty);
    }
}
