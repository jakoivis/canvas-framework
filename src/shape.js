
"use strict";

module.exports = Shape;

function Shape (options)
{
    if (!(this instanceof Shape))
    {
        return new Shape(options);
    }

    var me = this;
    var renderContext;

    var TYPE_FUNCTION = 0;
    var TYPE_SETTER = 1;

    me.x = 0;
    me.y = 0;

    var clearRect = {};

    var stack = [];

    function init()
    {
        if (options)
        {
            me.x = options.x || 0;
            me.y = options.y || 0;
        }
    }

    me.render = function()
    {
        var stackItem;

        for(var i = 0; i < stack.length; i++)
        {
            stackItem = stack[i];

            if(stackItem.type === TYPE_FUNCTION)
            {
                renderContext[stackItem.member].apply(renderContext, stackItem.arguments);
            }
            else if (stackItem.type === TYPE_SETTER)
            {
                renderContext[stackItem.member] = stackItem.value;
            }
        }
    };

    me.clear = function()
    {
        var left = clearRect.left - clearRect.padding;
        var top = clearRect.top - clearRect.padding;
        var right = clearRect.right + clearRect.padding;
        var bottom = clearRect.bottom + clearRect.padding;
        var width = right - left;
        var height = bottom - top;

        renderContext.clearRect(left, top, width, height);
    };

    me.setRenderContext = function(context)
    {
        renderContext = context;
    };

    me.beginPath = function()
    {
        storeFunction("beginPath", arguments);
    };

    me.closePath = function()
    {
        storeFunction("closePath", arguments);
    };

    me.moveTo = function(x, y)
    {
        translateXY(arguments);
        setDimensionsXY(arguments);
        storeFunction("moveTo", arguments);
    };

    me.lineTo = function(x, y)
    {
        translateXY(arguments);
        setDimensionsXY(arguments);
        storeFunction("lineTo", arguments);
    };

    me.fill = function()
    {
        storeFunction("fill", arguments);
    };

    me.stroke = function()
    {
        storeFunction("stroke", arguments);
    };

    Object.defineProperty(this, "fillStyle", {
        set: function(value)
        {
            storeProperty("fillStyle", value);
        }
    });

    Object.defineProperty(this, "strokeStyle", {
        set: function(value)
        {
            storeProperty("strokeStyle", value);
        }
    });

    Object.defineProperty(this, "lineCap", {
        set: function(value)
        {
            storeProperty("lineCap", value);
        }
    });

    Object.defineProperty(this, "lineWidth", {
        set: function(value)
        {
            storeProperty("lineWidth", value);
            setDimensionsPadding(value/2);
        }
    });

    function storeFunction(name, args)
    {
        stack.push({member: name, type: TYPE_FUNCTION, arguments: args});
    }

    function storeProperty(name, value)
    {
        stack.push({member: name, type: TYPE_SETTER, value: value});
    }

    function translateXY(args)
    {
        args[0] += me.x;
        args[1] += me.y;
    }

    function translateXYXY(args)
    {
        args[0] += me.x;
        args[1] += me.y;
        args[2] += me.x;
        args[3] += me.y;
    }

    function setDimensionsPadding(padding)
    {
        if(padding > clearRect.padding)
        {
            clearRect.padding = Math.ceil(padding);
        }
    }

    function setDimensionsXY(args)
    {
        if(clearRect.hasOwnProperty("left"))
        {
            expandDimensions(args[0], args[1]);
        }
        else
        {
            setInitialDimensions(args[0], args[1]);
        }
    }

    function setInitialDimensions(x, y)
    {
        clearRect.left = x;
        clearRect.right = x;
        clearRect.top = y;
        clearRect.bottom = y;
        clearRect.padding = 0;
    }

    function expandDimensions(x, y)
    {
        if(x < clearRect.left)
        {
            clearRect.left = x;
        }
        else if(x > clearRect.right)
        {
            clearRect.right = x+1;
        }

        if(y < clearRect.top)
        {
            clearRect.top = y;
        }
        else if(y > clearRect.bottom)
        {
            clearRect.bottom = y;
        }
    }

    me.box = function(x, y, width, height)
    {
        me.beginPath();
        me.moveTo(x, y);
        me.lineTo(width, y);
        me.lineTo(width, height);
        me.lineTo(x, height);
        me.closePath();
    }

    init();

    return this;
}