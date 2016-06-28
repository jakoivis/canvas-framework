
module.exports = TransformCache;

/**
 * @class      TransformCache
 *
 * @param {object}  imageData  ImageData to cache
 * @param {number}  [level=2]  Level of caching
 */
function TransformCache(imageData, level, functions)
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

    var loopIndices;

    Object.defineProperty(this, "loopIndices", {
        get: function()
        {
            return loopIndices;
        }
    });

    function init()
    {
        level = level || 2;
        level = level < 1 ? 1 : level;

        createIndexedCache();
    }

    /**
     * Crea
     */
    function createIndexedCache()
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
        var approximate;
        var pixel1Dist
        var fn;

        var indices1 = [];
        var indices2 = [];
        var indices3 = [];

        for (var i = 0; i < dataLength; i++)
        {
            x = (i % width);
            y = Math.floor(i / width);

            approximate = isApproximated(width, height, x, y);

            if(!approximate)
            {
                pixel1 = -1;
                pixel2 = -1;
                pixel1Dist = 0;
                fn = functions[0];
                indices1.push(i);
            }
            else if(y % level === 0 || y === height-1)
            {
                lineLastIndex = y * width + width-1;
                pixel1Dist = x % level;

                pixel1 = i - pixel1Dist;
                pixel2 = i + (level - pixel1Dist);
                pixel2 = pixel2 > lineLastIndex ? lineLastIndex : pixel2;
                fn = functions[1];
                indices2.push(i);

                // metohod: point on line calculation
                // arg: position between the two points 1 third or something
            }
            else if(x % level === 0 || x === width-1)
            {
                colLastIndex = (height-1) * width + x;
                pixel1Dist = y % level;

                pixel1 = i - pixel1Dist * width;
                pixel2 = i + (level - pixel1Dist) * width;
                pixel2 = pixel2 > colLastIndex ? colLastIndex : pixel2;
                fn = functions[1];
                indices2.push(i);

                // metohod: point on line calculation
                // arg: position between the two points 1 third or something
            }
            else
            {
                pixel1 = i - 1;
                pixel2 = i - width;
                fn = functions[2];
                indices3.push(i);

                // method: take x from pixel1 and y from pixel2
            }

            // console.log(x, y, pixel1, pixel2, approximated);

            data.push({
                approximate: approximate,
                i1: pixel1,
                i2: pixel2,
                i1Dist: pixel1Dist,
                fn: fn,
                x: x,
                y: y,
                i: i,
                tx: 0, // translated positions. These are evaluated
                ty: 0 // in evaluatePixel function if needed
            });
        }

        loopIndices = indices1.concat(indices2.concat(indices3));
    };

    function isApproximated(width, height, x, y)
    {
        // x calculated, - approximated
        // e.g. 6x6 level=2
        //   0 1 2 3 4 5
        // 0 x - x - x x
        // 1 - - - - - -
        // 2 x - x - x x
        // 3 - - - - - -
        // 4 x - x - x x
        // 5 x - x - x x

        return ! (
            // normal pattern
            (y % level === 0 && x % level === 0) ||

            // fix bottom edge in uneven situations
            (y === height-1 && x % level === 0) ||

            // fix right edge in uneven situations
            (x === width-1 && y % level === 0) ||

            // last is always included
            (x === width-1 && y === height-1)
        );
    };

    me.logProperty = function(property)
    {
        var width = imageData.width;
        var height = imageData.height;
        var str = "";

        for(var y = 0; y < height; y++ )
        {
            for(var x = 0; x < width; x++ )
            {
                str += Number(data[y*width+x][property]) + " ";

                if(x === width-1)
                {
                    console.log(str);
                    str = "";
                }
            }
        }
    };

    init();

}