
'use strict';

module.exports = function(options)
{
    if (!(this instanceof Layer))
    {
        return new Layer(options);
    }

    var me = this;
    var canvas;
    var context;

    var hoveredGraphic;

    var graphics;

    var hasMouseMoveEvent;
    var hasClickEvent;

    var canvasStoredState;
    var fullScreenState;

    function init()
    {
        canvas = document.createElement("canvas");
        context = canvas.getContext("2d");
        graphics = [];

        if (options)
        {
            if (options.enableOnRollEvents)
            {
                me.enableOnRollEvents();
            }

            if (options.enableOnClickEvents)
            {
                me.enableOnClickEvents();
            }

            if (options.fullScreen)
            {
                me.enableFullScreen();
            }

            if (options.appendToBody)
            {
                document.body.appendChild(canvas);
            }
        }
    }

    me.getCanvas = function() { return canvas; }

    me.enableOnRollEvents = function()
    {
        if (!hasMouseMoveEvent)
        {
            canvas.addEventListener('mousemove', mouseMoveHandler);
            hasMouseMoveEvent = true;
        }
    }

    me.disableOnRollEvents = function()
    {
        if (hasMouseMoveEvent)
        {
            canvas.removeEventListener('mousemove', mouseMoveHandler);
            hasMouseMoveEvent = false;
        }
    }

    me.enableOnClickEvents = function()
    {
        if (!hasClickEvent)
        {
            canvas.addEventListener('click', clickHandler);
            hasClickEvent = true;
        }
    }

    me.disableOnClickEvents = function()
    {
        if (hasClickEvent)
        {
            canvas.removeEventListener('click', clickHandler);
            hasClickEvent = false;
        }
    }

    me.enableFullScreen = function()
    {
        if (!fullScreenState)
        {
            storeCanvasCurrentState();
            setCanvasFullScreenState();
            window.addEventListener('resize', updateCanvasFullScreen);
            fullScreenState = true;
        }
    }

    me.disableFullScreen = function()
    {
        if (fullScreenState)
        {
            window.removeEventListener('resize', updateCanvasFullScreen);
            restoreCanvasState();
            fullScreenState = false;
        }
    }

    function storeCanvasCurrentState()
    {
        canvasStoredState = {
            position: canvas.style.position,
            left: canvas.style.left,
            top: canvas.style.top,
            width: canvas.width,
            height: canvas.height
        };
    }

    function setCanvasFullScreenState()
    {
        canvas.style.position = "absolute";
        canvas.style.left = "0";
        canvas.style.top = "0";
        updateCanvasFullScreen();
    }

    function updateCanvasFullScreen()
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        me.render();
    }

    function restoreCanvasState()
    {
        canvas.style.position = canvasStoredState.position;
        canvas.style.left = canvasStoredState.left;
        canvas.style.top = canvasStoredState.top;
        canvas.width = canvasStoredState.width;
        canvas.height = canvasStoredState.height;
    }

    function mouseMoveHandler(event)
    {
        var graphic = me.getGraphicAtPoint(event.clientX, event.clientY);

        // test if we are hitting something different on this move
        if (graphic !== hoveredGraphic)
        {
            if (hoveredGraphic && hoveredGraphic.onRollOut)
            {
                hoveredGraphic.onRollOut.call(hoveredGraphic);
            }

            if (graphic && graphic.onRollOver)
            {
                graphic.onRollOver.call(graphic);
            }

            hoveredGraphic = graphic;
        }
    }

    function clickHandler(evnet)
    {
        var graphic = me.getGraphicAtPoint(event.clientX, event.clientY);

        if (graphic && graphic.onClick)
        {
            graphic.onClick.call(graphic);
        }
    }

    me.length = function()
    {
        return graphics.length;
    }

    me.addGraphic = function(graphic)
    {
        graphics.push(graphic);
        graphic.setRenderContext(context);
    }

    me.removeGraphic = function(graphic)
    {
        graphic.clear();

        for(var i = 0; i < graphics.length; i++)
        {
            if (graphic === graphics[i])
            {
                graphics.splice(i,1);
                return;
            }
        }
    }

    me.getGraphicAt = function(index)
    {
        return graphics[index];
    }

    me.getGraphicAtPoint = function(x, y)
    {
        var result = null;

        // take the topmost item on the screen.
        // i.e the first graphic from bottom of the
        // array that has pixel at the coordinates
        for(var i = graphics.length-1; i >= 0; i--)
        {
            if(graphics[i].hasGlobalPixelAt(x, y))
            {
                result = graphics[i];
                break;
            }
        }

        return result;
    }

    me.render = function()
    {
        invalidateGraphics();

        for(var i = 0; i < graphics.length; i++)
        {
            graphics[i].validateNow();
        }
    }

    me.update = function()
    {
        for(var i = 0; i < graphics.length; i++)
        {
            graphics[i].update();
        }
    }

    function invalidateGraphics()
    {
        for(var i = 0; i < graphics.length; i++)
        {
            if(graphics[i].isInvalid)
            {
                invalidateIntersectingGraphics(graphics[i].getRect());
            }
        }
    }

    function invalidateIntersectingGraphics(rectangle)
    {
        for(var i = 0; i < graphics.length; i++)
        {
            if(graphics[i].isIntersecting(rectangle))
            {
                graphics[i].invalidate(rectangle);
            }

            if(graphics[i].isIntersectingOldPosition(rectangle))
            {
                graphics[i].invalidate(rectangle);
            }
        }
    }

    init();

    return this;
}
