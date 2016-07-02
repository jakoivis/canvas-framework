

module.exports = function Graphic(options)
{
    'use strict';

    if (!(this instanceof Graphic))
    {
        return new Graphic(options);
    }

    var me = this;
    var renderContext = null;

    var renderedX = null;
    var renderedY = null;

    var dummyFunction = function() {}

    me.x = 0;
    me.y = 0;

    me.onRollOver = null;
    me.onRollOut = null;
    me.onClick = null;

    var update = dummyFunction;

    var imageData = null;
    var uint8CView = null;
    var uint32View = null;
    var width = 0;
    var height = 0;

    Object.defineProperty(this, "imageData", {
        get: function() { return imageData; },
        set: function(value)
        {
            imageData = value;

            uint8CView = imageData.data;
            uint32View = new Uint32Array(uint8CView.buffer);

            width = imageData.width;
            height = imageData.height;
        }
    });

    Object.defineProperty(this, "uint32View", {
        get: function() { return uint32View; }
    });

    Object.defineProperty(this, "uint8CView", {
        get: function() { return uint8CView; }
    });

    Object.defineProperty(this, "width", {
        get: function() { return width; }
    });

    Object.defineProperty(this, "height", {
        get: function() { return height; }
    });

    Object.defineProperty(this, "renderContext", {
        get: function(value) { return renderContext; },
        set: function(value) { renderContext = value; }
    });

    function init()
    {
        if (options)
        {
            if (options.imageData)
            {
                me.imageData = options.imageData;
            }

            me.x = options.x || 0;
            me.y = options.y || 0;

            me.onRollOver = options.onRollOver || null;
            me.onRollOut = options.onRollOut || null;
            me.onClick = options.onClick || null;

            update = options.update || dummyFunction;
        }
    }

    me.render = function()
    {
        saveRenderedPosition();

        renderContext.putImageData(imageData, me.x, me.y);
    }

    me.clear = function()
    {
        renderContext.clearRect(renderedX-1, renderedY-1, imageData.width+1, imageData.height+1);
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
        var localX = x - me.x;
        var localY = y - me.y;

        return localX >= 0
                && localY >= 0
                && localX < width
                && localY < height
                && !!uint32View[localY * width + localX];
    };

    me.getGlobalPixel32At = function(x, y)
    {
        var localX = x - me.x;
        var localY = y - me.y;

        return localX >= 0
                && localY >= 0
                && localX < width
                && localY < height
                ? uint32View[localY * width + localX]
                : 0;
    };

    me.getPixel32At = function(x, y)
    {
        return x >= 0
                && y >= 0
                && x < width
                && y < height
                ? uint32View[y * width + x]
                : 0;
    }

    function saveRenderedPosition()
    {
        renderedX = me.x;
        renderedY = me.y;
    }

    init();

    return this;
}
