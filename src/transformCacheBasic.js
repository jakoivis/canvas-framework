
module.exports = TransformCacheBasic;

/**
 * @class      TransformCacheBasic
 *
 * @param {object}  imageData  ImageData to cache
 */
function TransformCacheBasic(imageData)
{
    'use strict';

    if (!(this instanceof TransformCacheBasic))
    {
        return new TransformCacheBasic(imageData);
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
        createIndexedCache();
    }

    function createIndexedCache()
    {
        data = [];

        var width = imageData.width;
        var height = imageData.height;
        var dataLength = width * height;
        var x;
        var y;

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
    };

    init();

}