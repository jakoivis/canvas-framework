
module.exports = TransformCache;

/**
 * @class      TransformCache
 *
 * @param {object}  imageData  ImageData to cache
 * @param {number}  [level=2]  Level of caching
 */
function TransformCache(imageData, level)
{
    'use strict';

    if (!(this instanceof TransformCache))
    {
        return new TransformCache(imageData);
    }

    var me = this;

    var data;

    Object.defineProperty(this, "data", {
        get: function()
        {
            return data;
        }
    });

    function init()
    {
        level = level || 2;
        level = level < 1 ? 1 : level;

        me.createCache();
    }

    me.createCache = function()
    {
        data = [];

        var width = imageData.width;
        var height = imageData.height;
        var dataLength = width * height;
        var lineLastIndex;
        var colLastIndex;
        var x;
        var y;
        var pixel1;
        var pixel2;
        var approximated;

        for (var i = 0; i < dataLength; i++)
        {
            x = (i % width);
            y = Math.floor(i / width);

            approximated = me.isApproximated(width, height, x, y);
            lineLastIndex = y * width + width-1;
            colLastIndex = (height-1) * width + x;

            if(y % level === 0 || y === height-1)
            {
                pixel1 = i - (x % level);
                pixel2 = i + (level - (x % level));
                pixel2 = pixel2 > lineLastIndex ? lineLastIndex : pixel2;
                // metohod: point on line calculation
                // arg: position between the two points 1 third or something
            }
            else if(x % level === 0 || x === width-1)
            {
                pixel1 = i - (y % level) * width;
                pixel2 = i + (level - (y % level)) * width;
                pixel2 = pixel2 > colLastIndex ? colLastIndex : pixel2;
                // metohod: point on line calculation
                // arg: position between the two points 1 third or something
            }
            else
            {
                pixel1 = undefined;
                pixel2 = undefined;
                // approximated = true;
                // method: take x from pixel1 and y from pixel2
            }

            // console.log(x, y, pixel1, pixel2, approximated);

            data.push({
                approximate: approximated,
                ai1: pixel1,
                ai2: pixel2,
                x: x,
                y: y,
                i: i,
                tx: 0, // translated positions. These are evaluated
                ty: 0 // in evaluatePixel function if needed
            });
        }
    };

    me.isApproximated = function(width, height, x, y)
    {
        // points marked with x will be calculated
        // points marked with - will be approximated
        // last should be calculated on right and bottom
        //   0 1 2 3 4 5
        // 0 x - x - x x
        // 1 - - - - - x
        // 2 x - x - x x
        // 3 - - - - - x
        // 4 x - x - x x
        // 5 x x x x x x

        return ! (
            (y % level === 0 && x % level === 0)
            ||
            (x === width-1 || y === height-1)
        );
    }

    init();

}