;(function() {
    'use strict';
    
    window.Layer = Layer;
    
    // TODO F MED: options enable events
    // TODO F MED: canvas size, fullscreen
    // TODO F MED: remove fullscreen
    
    function Layer(options)
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
                    graphics = graphics.slice(0,i).concat(graphics.slice(i+1));
                    return;
                }
            }
        }
        
        me.getGraphicAtPoint = function(x, y)
        {
            var result = null;
            
            for(var i = 0; i < graphics.length; i++)
            {
                // TODO Feature Priority low: add distance tolerance, alpha tolerance
                // TODO Feature Priority medium: think about the order of graphics: which one is on top (first, last)-> reduce loopings
                // TODO Feature Priority low: graphic should check wheter it is interactive to speed up the test. is it faster???
                if(graphics[i].hasGlobalPixelAt(x, y))
                {
                    result = graphics[i];
                }
            }
            
            return result;
        }
        
        me.render = function()
        {
            for(var i = 0; i < graphics.length; i++)
            {
                graphics[i].clear();
                graphics[i].render();
            }
        }
        
        me.update = function()
        {
            for(var i = 0; i < graphics.length; i++)
            {
                graphics[i].update();
            }
        }
        
        init();
        
        return this;
    }
})();