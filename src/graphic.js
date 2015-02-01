
'use strict';

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

    var renderedRectangle = {left:0, top:0, right:0, bottom:0, width:0, height:0};
    var currentRectangle = {left:0, top:0, right:0, bottom:0, width:0, height:0};

    var dummyFunction = function() {}

    me.onRollOver;
    me.onRollOut;
    me.onClick;

    var update = dummyFunction;

    var isInvalid = true;
    var invalidationRects = [];

    var x = 0;
    var y = 0;

    Object.defineProperty(this, "x", {
        get: function() { return x; },
        set: function(value)
        {
            if(value !== x)
            {
                x = value;
                currentRectangle.left = x;
                currentRectangle.right = currentRectangle.left + currentRectangle.width;
                me.invalidate();
            }
        }
    });

    Object.defineProperty(this, "y", {
        get: function() { return y; },
        set: function(value)
        {
            if(value !== y)
            {
                y = value;
                currentRectangle.top = y;
                currentRectangle.bottom = currentRectangle.top + currentRectangle.height;
                me.invalidate();
            }
        }
    });

    Object.defineProperty(this, "isInvalid", {
        get: function() { return isInvalid; }
    });

    Object.defineProperty(this, "invalidationRects", {
        get: function() { return invalidationRects; }
    });

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

        currentRectangle.width = _imageData.width;
        currentRectangle.height = _imageData.height;
        currentRectangle.right = currentRectangle.left + currentRectangle.width;
        currentRectangle.bottom = currentRectangle.top + currentRectangle.height;

        imageData8ClampedView = _imageData.data;
        imageData32View = new Uint32Array(imageData8ClampedView.buffer);
        me.invalidate();
    }

    me.setRenderContext = function(context)
    {
        renderContext = context;
    };

    me.validateNow = function()
    {
        if(isInvalid)
        {
            me.clear();
            me.render();
            isInvalid = false;
        }
    }

    me.invalidate = function(rectangle)
    {
        isInvalid = true;

        if(rectangle)
        {
            invalidationRects.push(rectangle);
        }
        // else
        // {
        //     invalidationRects.push(renderedRectangle);
        // }
    }

    me.render = function()
    {
        saveRenderedRectangle(x, y, _imageData.width, _imageData.height);
        // renderContext.putImageData(_imageData, x, y);
        console.log(invalidationRects.length);
        while(invalidationRects.length)
        {
            var rect = me.getDirtyRect(invalidationRects.shift());
            renderContext.putImageData(_imageData, x, y, rect.left, rect.top, rect.width, rect.height);
        }
    }

    me.clear = function()
    {
        renderContext.clearRect(
            renderedRectangle.left-1,
            renderedRectangle.top-1,
            renderedRectangle.width+2,
            renderedRectangle.height+2);
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

    me.isIntersecting = function(rectangle)
    {
        return (rectangle.left <= currentRectangle.right &&
                  currentRectangle.left <= rectangle.right &&
                  rectangle.top <= currentRectangle.bottom &&
                  currentRectangle.top <= rectangle.bottom)
    }

    me.isIntersectingOldPosition = function(rectangle)
    {
        return (rectangle.left <= renderedRectangle.right &&
                  renderedRectangle.left <= rectangle.right &&
                  rectangle.top <= renderedRectangle.bottom &&
                  renderedRectangle.top <= rectangle.bottom)
    }

    function isGlobalPositionWithinBoundaries(_x, _y)
    {
        return ((_x - x) >= 0
                && (_y - y) >= 0
                && (_x - (x + _imageData.width)) <= 0
                && (_y - (y + _imageData.height)) <= 0);
    }

    function saveRenderedRectangle(_x, _y, width, height)
    {
        renderedRectangle.left = _x;
        renderedRectangle.top = _y;
        renderedRectangle.right = _x + width;
        renderedRectangle.bottom = _y + height;
        renderedRectangle.width = width;
        renderedRectangle.height = height;
    }

    function getPixel32At(_x, _y)
    {
        return imageData32View[_y * _imageData.width + _x];
    }

    me.getRect = function()
    {
        return {
            left: currentRectangle.left,
            right: currentRectangle.right,
            top: currentRectangle.top,
            bottom: currentRectangle.bottom,
            width: currentRectangle.width,
            height: currentRectangle.height
        };
    }

    // This is temporarily public just to make unit tests for it
    me.getDirtyRect = function(interseptingRect)
    {
        var left = interseptingRect.left - x;
        var top = interseptingRect.top - y;

        var width = interseptingRect.width - Math.abs(left);
        var height = interseptingRect.height - Math.abs(top);

        var rect = {
            left: left < 0 ? 0 : left,
            top: top < 0 ? 0 : top,
            width: width > currentRectangle.width ? currentRectangle.width : width,
            height: height > currentRectangle.height ? currentRectangle.height : height
        };

        return rect;
    }

    init();

    return this;
}
