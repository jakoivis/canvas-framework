
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

    me.onRollOver;
    me.onRollOut;
    me.onClick;

    var update = dummyFunction;

    var isInvalid = true;

    var x = 0;
    var y = 0;

    Object.defineProperty(this, "x", {
        get: function() { return x; },
        set: function(value) { if(value !== x) { x = value; invalidate() } }
    });

    Object.defineProperty(this, "y", {
        get: function() { return y; },
        set: function(value) { if(value !== y) { y = value; invalidate() } }
    });

    function init()
    {
        if (options)
        {
            if (options.imageData)
            {
                me.setImageData(options.imageData);
            }

            x = options.x || 0;
            y = options.y || 0;

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

    me.validate = function()
    {
        if(isInvalid)
        {
            me.clear();
            me.render();
            isInvalid = false;
        }
    }

    function invalidate()
    {
        isInvalid = true;
    }

    me.render = function()
    {
        console.log(this.name);
        saveRenderedPosition();
        renderContext.putImageData(_imageData, x, y);
    }

    me.clear = function()
    {
        renderContext.clearRect(renderedX-1, renderedY-1, _imageData.width+2, _imageData.height+2);
    }

    me.update = function()
    {
        update.call(this);
    }

    me.globalToLocal = function(_x, _y)
    {
        return {
            x: _x - x,
            y: _y - y
        }
    }

    me.localToGlobal = function(_x, _y)
    {
        return {
            x: x + _x,
            y: y + _y
        }
    }

    me.hasGlobalPixelAt = function(_x, _y)
    {
        var result = false;

        if (isGlobalPositionWithinBoundaries(_x, _y))
        {
            var distanceFromLeft = _x - x;
            var distanceFromTop = _y - y;
            var pixel32 = getPixel32At(distanceFromLeft, distanceFromTop);

            if (pixel32 !== 0)
            {
                result = true;
            }
        }

        return result;
    }

    function isGlobalPositionWithinBoundaries(_x, _y)
    {
        return ((_x - x) >= 0
                && (_y - y) >= 0
                && (_x - (x + _imageData.width)) <= 0
                && (_y - (y + _imageData.height)) <= 0);
    }

    function saveRenderedPosition()
    {
        renderedX = x;
        renderedY = y;
    }

    function getPixel32At(_x, _y)
    {
        return imageData32View[_y * _imageData.width + _x];
    }

    init();

    return this;
}
