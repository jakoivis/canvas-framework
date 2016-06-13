
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

    var cache;
    Object.defineProperty(this, "cache", {
        get: function()
        {
            return cache;
        }
    });

    function init()
    {
        level = level || 2;
        level = level < 1 ? 1 : level;
    }

    me.createCache = function()
    {
        cache = [];

        var width = imageData.width;
        var height = imageData.height;
        var dataLength = width * height;
        var x;
        var y;
        var p1;
        var p2;

        for (var i = 0; i < dataLength; i++)
        {
            x = (i % width);
            y = Math.floor(i / width);

            p1 = i - (x % level);
            p2 = i + (level - (x % level));
            console.log(x, p1, p2);

            cache.push({
                approximate: me.isApproximated(width, height, x, y),
                x: x,
                y: y,
                i: i,
                tx: 0, // translated positions. These are evaluated
                ty: 0 // in evaluatePixel function if needed
            });
        }
    };

    me.getApproximateCacheIndex1 = function(width, height, x, y, index)
    {
        // if(x )
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