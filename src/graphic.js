
'use strict';

// TODO F MED: options events + other
// TODO F: remove transition
// TODO F: make transition switchable feature
// TODO F HI: invalidation
// TODO bug: renred width and height needs to be stored. when image data has changed clearing would not clear correct width and height
// TODO: unit tests for transition... think about moving that away from graphic

module.exports = function(options)
{
    if (!(this instanceof Graphic))
    {
        return new Graphic(options);
    }

    var me = this;
    var renderContext;

    var _imageData;
    var imageData8ClampedView;
    var imageData32View;

    var renderedX;
    var renderedY;

    var dummyFunction = function() {}

    me.x = 0;
    me.y = 0;

    me.onRollOver;
    me.onRollOut;
    me.onClick;

    var update = dummyFunction;

    function init()
    {
        if (options)
        {
            if (options.imageData)
            {
                me.setImageData(options.imageData);
            }

            me.x = options.x || 0;
            me.y = options.y || 0;

            me.onRollOver = options.onRollOver;
            me.onRollOut = options.onRollOut;
            me.onClick = options.onClick;

            update = options.update || dummyFunction;
        }
    }

    me.getImageData = function()
    {
        return _imageData;
    }

    me.setImageData = function(imageData)
    {
        _imageData = imageData;
        imageData8ClampedView = _imageData.data;
        imageData32View = new Uint32Array(imageData8ClampedView.buffer);
    }

    me.setRenderContext = function(context)
    {
        renderContext = context;
    };

    me.render = function()
    {
        saveRenderedPosition();
        renderContext.putImageData(_imageData, me.x, me.y);
    }

    me.clear = function()
    {
        renderContext.clearRect(renderedX-1, renderedY-1, _imageData.width+1, _imageData.height+1);
    }

    me.update = function()
    {
        update.call(this);
    }

    me.globalToLocal = function(x, y)
    {
        return {
            x: x - me.x,
            y: y - me.y
        }
    }

    me.localToGlobal = function(x, y)
    {
        return {
            x: me.x + x,
            y: me.y + y
        }
    }

    me.hasGlobalPixelAt = function(x, y)
    {
        var result = false;

        if (isGlobalPositionWithinBoundaries(x, y))
        {
            var distanceFromLeft = x - me.x;
            var distanceFromTop = y - me.y;
            var pixel32 = getPixel32At(distanceFromLeft, distanceFromTop);

            if (pixel32 !== 0)
            {
                result = true;
            }
        }

        return result;
    }

    function isGlobalPositionWithinBoundaries(x, y)
    {
        //var distanceFromLeft = x - me.x;
        //var distanceFromTop = y - me.y;
        //var distanceFromRight = x - (me.x + _imageData.width);
        //var distanceFromBottom = y - (me.y + _imageData.height);
        //return (distanceFromLeft >= 0 && distanceFromRight <= 0
        //    && distanceFromTop >= 0 && distanceFromBottom <= 0);

        // the below statement implements the same functionality as above
        return ((x - me.x) >= 0
                && (y - me.y) >= 0
                && (x - (me.x + _imageData.width)) <= 0
                && (y - (me.y + _imageData.height)) <= 0);
    }

    function saveRenderedPosition()
    {
        renderedX = me.x;
        renderedY = me.y;
    }

    function getPixel32At(x, y)
    {
        return imageData32View[y * _imageData.width + x];
    }

    init();

    return this;
}
