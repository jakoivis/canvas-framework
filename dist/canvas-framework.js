(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

module.exports = new CanvasUtil();

function CanvasUtil()
{
    'use strict';

    if(CanvasUtil.prototype.singletonInstance)
    {
        return CanvasUtil.prototype.singletonInstance;
    }

    if (!(this instanceof CanvasUtil))
    {
        return new CanvasUtil();
    }

    CanvasUtil.prototype.singletonInstance = this;

    var me = this;

    var canvas;
    var context;

    function init()
    {
        me.resetTempCanvas();
    }

    me.resetTempCanvas = function()
    {
        canvas = document.createElement("canvas");
        context = canvas.getContext("2d");
    }

    me.getImageDataFromTag = function(imageTag)
    {
        updateCanvasSize(imageTag);
        clearCanvas(imageTag);
        drawImageTag(imageTag);
        return getImageData(imageTag);
    }

    function updateCanvasSize(imageTag)
    {
        if (canvas.width < imageTag.width)
        {
            canvas.width = imageTag.width;
        }

        if(canvas.height < imageTag.height)
        {
            canvas.height = imageTag.height;
        }
    }

    function clearCanvas(imageTag)
    {
        context.clearRect(0, 0, imageTag.width, imageTag.height);
    }

    function drawImageTag(imageTag)
    {
        context.drawImage(imageTag, 0, 0);
    }

    function getImageData(imageTag)
    {
        return context.getImageData(0, 0, imageTag.width, imageTag.height);
    }

    init();

    return this;
}

},{}],2:[function(require,module,exports){

var Transform = require('./transform.js');

module.exports = function Graphic(options)
{
    'use strict';

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

    me.onRollOver = null;
    me.onRollOut = null;
    me.onClick = null;

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

        // var existingImageData = renderContext.getImageData(me.x, me.y, _imageData.width, _imageData.height);
        // var transform = new Transform(existingImageData, renderContext);

        // transform.do(Transform.WeightedAlphaBlend, {imageData2:_imageData});
        // renderContext.putImageData(transform.getImageData(), me.x, me.y);
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

},{"./transform.js":11}],3:[function(require,module,exports){

var Queue = require('./queue');
var Thread = require('./thread');
var ImageLoaderItem = require('./imageLoaderItem');

module.exports = ImageLoader;

function ImageLoader(options)
{
    'use strict';

    if (!(this instanceof ImageLoader))
    {
        return new ImageLoader(options);
    }

    var me = this;
    var autoload;
    var queue;
    var numberOfThreads;
    var onCompleteCallback;
    var onFileCompleteCallback;
    var onFileStartCallback;
    var isLoading;

    init(options);

    me.load = load;
    me.isComplete = isComplete;
    me.getPercentLoaded = getPercentLoaded;
    me.getItemAt = getItemAt;
    me.length = length;

    function init(options)
    {
        applyOptions(options);

        isLoading = false;

        if (autoload)
        {
            load();
        }
    }

    function applyOptions(options)
    {
        if (!options || typeof options !== "object")
        {
            throw new Error("Options should be an Object");
        }

        queue = new Queue(getImages());
        onCompleteCallback = getOnComplete();
        onFileCompleteCallback = getOnFileComplete();
        onFileStartCallback = getOnFileStart();
        autoload = getAutoload();
        numberOfThreads = getNumberOfThreads();

        var delayMin = getSimulationDelayMin();
        var delayMax = getSimulationDelayMax();

        ImageLoaderItem.setSimulationDelays(delayMin, delayMax);

        function getImages()
        {
            if (!options.images || !(options.images instanceof Array))
            {
                throw new Error("Options object should have 'images' property (type of array) containing paths to the loaded images.");
            }

            for(var i = 0; i < options.images.length; i++)
            {
                if(!options.images[i])
                {
                    throw new Error("Objects in 'images' cannot be null or undefined");
                }

                if (typeof options.images[i] !== "string" && !options.images[i].hasOwnProperty("src"))
                {
                    throw new Error("Objects in 'images' property should have src property");
                }
            }

            return options.images.slice(0);
        }

        function getOnComplete()
        {
            if (options.onComplete && typeof options.onComplete !== "function")
            {
                throw new Error("'onComplete' property should be a function");
            }

            return getValue(options.onComplete, undefined);
        }

        function getOnFileComplete()
        {
            if (options.onFileComplete && typeof options.onFileComplete !== "function")
            {
                throw new Error("'onFileComplete' property should be a function");
            }

            return getValue(options.onFileComplete, undefined);
        }

        function getOnFileStart()
        {
            if (options.onFileStart && typeof options.onFileStart !== "function")
            {
                throw new Error("'onFileStart' property should be a function");
            }

            return getValue(options.onFileStart, undefined);
        }

        function getAutoload()
        {
            return getValue(options.autoload, true);
        }

        function getNumberOfThreads()
        {
            var value = getValue(options.numberOfThreads, 1);
            var number = parseInt(value);

            if (isNaN(number) || number < 1)
            {
                throw new Error("'numberOfThreads' should be integer number grater than 0");
            }

            return number;
        }

        function getSimulationDelayMin()
        {
            var value = getValue(options.simulationDelayMin, undefined);
            var number = parseInt(value);

            // allow undefined values but other values that cannot be converted to number are not allowed
            if (typeof value !== 'undefined' && (isNaN(number) || number < 0))
            {
                throw new Error("'simulationDelayMin' should be a non-negative integer number");
            }

            if (typeof value === 'undefined')
            {
                number = undefined;
            }

            return number;
        }

        function getSimulationDelayMax()
        {
            var value = getValue(options.simulationDelayMax, undefined);
            var number = parseInt(value);

            // allow undefined values but other values that cannot be converted to number are not allowed
            if (typeof value !== 'undefined' && (isNaN(number) || number < 0))
            {
                throw new Error("'simulationDelayMax' should be a non-negative integer number");
            }

            if (typeof value === 'undefined')
            {
                number = undefined;
            }

            return number;
        }

        function getValue(value, defaultValue)
        {
            return typeof value === 'undefined' ? defaultValue : value;
        }
    }

    function load()
    {
        if (isLoading === false && isComplete() === false)
        {
            isLoading = true;
            createThreads();
        }
    }

    function createThreads()
    {
        for(var i = 0; i < numberOfThreads; i++)
        {
            new Thread({
                onThreadComplete: threadCompleteHandler,
                onFileComplete: onFileCompleteHandler,
                onFileStart: onFileStartHandler,
                queue: queue
            });
        }
    }

    function onFileCompleteHandler(item)
    {
        if (onFileCompleteCallback)
        {
            onFileCompleteCallback(item);
        }
    }

    function onFileStartHandler(item)
    {
        if (onFileStartCallback)
        {
            onFileStartCallback(item);
        }
    }

    function threadCompleteHandler()
    {
        if (isComplete() && onCompleteCallback)
        {
            isLoading = false;
            onCompleteCallback();
        }
    }

    function isComplete()
    {
        return queue.isComplete();
    }

    function getPercentLoaded()
    {
        return queue.getPercentLoaded();
    }

    function getItemAt(index)
    {
        return queue.getItemAt(index);
    }

    function length()
    {
        return queue.length;
    }

    return this;
}

},{"./imageLoaderItem":4,"./queue":5,"./thread":6}],4:[function(require,module,exports){

module.exports = ImageLoaderItem;

function ImageLoaderItem(options)
{
    'use strict';

    var STATUS = {
        PENDING: "pending",
        LOADING: "loading",
        COMPLETE: "complete",
        FAILED: "failed"
    };

    var me = this;

    var onLoadCallback;

    init();

    me.load = function(onLoad)
    {
        onLoadCallback = onLoad;

        setStatusLoading();

        me.tag.addEventListener('load', onLoadHandler);
        me.tag.addEventListener('error', onErrorHandler);

        me.tag.src = me.src;
    };

    me.isPending = function () { return me.status === STATUS.PENDING; };
    me.isComplete = function () { return me.status === STATUS.COMPLETE; };
    me.isLoading = function () { return me.status === STATUS.LOADING; };
    me.isFailed = function () { return me.status === STATUS.FAILED; };

    function init()
    {
        setProperties();
        setStatusPending();
    }

    function setProperties()
    {
        for(var property in options)
        {
            me[property] = options[property];
        }

        me.tag = document.createElement("img");
    }

    function setStatusFailed() { me.status = STATUS.FAILED; }
    function setStatusComplete() { me.status = STATUS.COMPLETE; }
    function setStatusLoading() { me.status = STATUS.LOADING; }
    function setStatusPending() { me.status = STATUS.PENDING; }

    function removeListeners()
    {
        me.tag.removeEventListener('load', onLoadHandler);
        me.tag.removeEventListener('error', onErrorHandler);
    }

    function onLoadHandler(event)
    {
        if (ImageLoaderItem.simulationDelayMin)
        {
            setTimeout(function()
            {
                finalizeOnLoad();

            }, calculateSimulationDelay());
        }
        else
        {
            finalizeOnLoad();
        }
    }

    function onErrorHandler(event)
    {
        if (ImageLoaderItem.simulationDelayMin)
        {
            setTimeout(function()
            {
                finalizeOnError();

            }, calculateSimulationDelay());
        }
        else
        {
            finalizeOnError();
        }
    }

    function finalizeOnLoad()
    {
        removeListeners();
        setStatusComplete();
        onLoadCallback(me);
        onLoadCallback = undefined;
    }

    function finalizeOnError()
    {
        removeListeners();
        me.tag = undefined;
        setStatusFailed();
        onLoadCallback(me);
        onLoadCallback = undefined;
    }

    function calculateSimulationDelay()
    {
        var max = ImageLoaderItem.simulationDelayMax;
        var min = ImageLoaderItem.simulationDelayMin;

        return Math.floor(Math.random() * (max - min) + min);
    }

    return this;
}

ImageLoaderItem.setSimulationDelays = function(min, max)
{
    var delayMin = min;
    var delayMax = max;

    if (delayMin && !delayMax)
    {
        delayMax = delayMin;
    }
    else if (delayMax && !delayMin)
    {
        delayMin = delayMax;
    }

    ImageLoaderItem.simulationDelayMin = delayMin;
    ImageLoaderItem.simulationDelayMax = delayMax;
};

},{}],5:[function(require,module,exports){
var ImageLoaderItem = require('./imageLoaderItem');

module.exports = Queue;

function Queue(images)
{
    'use strict';

    var items;
    var me = this;

    me.length = 0;

    init();

    me.getItemAt = function(index)
    {
        return items[index];
    };

    me.isComplete = function()
    {
        var result = true;
        var item;

        for(var i = 0; i < items.length; i++)
        {
            item = items[i];

            if (item.isPending() || item.isLoading())
            {
                result = false;
                break;
            }
        }

        return result;
    };

    me.getNextPendingItem = function()
    {
        var result;

        for(var i = 0; i < items.length; i++)
        {
            if (items[i].isPending())
            {
                result = items[i];
                break;
            }
        }

        return result;
    };

    me.getPercentLoaded = function()
    {
        var item;
        var i = 0;
        var len = items.length;

        for(i; i < len; i++)
        {
            item = items[i];

            if (item.isPending() || item.isLoading())
            {
                break;
            }
        }

        return i / len;
    };

    function init()
    {
        items = createItems(images);
        me.length = items.length;
    }

    function createItems(images)
    {
        var result = [];

        for(var i = 0; i < images.length; i++)
        {
            if (typeof images[i] === "string")
            {
                result.push(new ImageLoaderItem({
                    src: images[i]
                }));
            }
            else
            {
                result.push(new ImageLoaderItem(images[i]));
            }
        }

        return result;
    }

    return this;
}

},{"./imageLoaderItem":4}],6:[function(require,module,exports){

module.exports = Thread;

function Thread(options)
{
    'use strict';

    var me = this;
    var onThreadCompleteCallback;
    var onFileCompleteCallback;
    var onFileStartCallback;
    var queue;

    init();

    function init()
    {
        onThreadCompleteCallback = options.onThreadComplete;
        onFileCompleteCallback = options.onFileComplete;
        onFileStartCallback = options.onFileStart;
        queue = options.queue;

        processNextItem();
    }

    function processNextItem()
    {
        var imageLoaderItem = queue.getNextPendingItem();

        if (typeof imageLoaderItem === 'undefined')
        {
            onThreadCompleteCallback();
        }
        else
        {
            imageLoaderItem.load(onLoadHandler);
            onFileStartCallback(imageLoaderItem);
        }
    }

    function onLoadHandler(item)
    {
        onFileCompleteCallback(item);
        processNextItem();
    }

    return this;
}

},{}],7:[function(require,module,exports){
window.ImageLoader = require('./imageLoader/imageLoader.js');
window.Layer = require('./layer.js');
window.Transform = require('./transform.js');
window.TransformCache = require('./transformCache.js');
window.Graphic = require('./graphic.js');
window.Timer = require('./timer.js');
window.CanvasUtil = require('./canvasutil.js');
window.Shape = require('./shape.js');

},{"./canvasutil.js":1,"./graphic.js":2,"./imageLoader/imageLoader.js":3,"./layer.js":8,"./shape.js":9,"./timer.js":10,"./transform.js":11,"./transformCache.js":12}],8:[function(require,module,exports){

module.exports = function Layer(options)
{
    'use strict';

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
        if(options && options.target)
        {
            canvas = document.getElementById(options.target);
        }
        else
        {
            canvas = document.createElement("canvas");
        }

        context = canvas.getContext("2d");
        graphics = [];

        if(options)
        {
            if (options.enableOnRollEvents)
            {
                me.enableOnRollEvents();
            }

            if (options.enableOnClickEvents)
            {
                me.enableOnClickEvents();
            }

            if (options.width)
            {
                canvas.width = options.width;
            }

            if (options.height)
            {
                canvas.height = options.height;
            }

            if (options.fullScreen)
            {
                me.enableFullScreen();
            }

            if(options.clickThrough)
            {
                canvas.style["pointer-events"] = "none";
            }

            if (options.appendToBody)
            {
                document.body.appendChild(canvas);
            }
        }
    }

    me.getCanvas = function() { return canvas; }
    me.getContext = function() { return context; }

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

    me.removeAllGraphics = function()
    {
        for(var i = 0; i < graphics.length; i++)
        {
            graphics[i].clear();
        }

        graphics = [];
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
        var i;

        for(i = 0; i < graphics.length; i++)
        {
            graphics[i].clear();
        }

        for(i = 0; i < graphics.length; i++)
        {
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

},{}],9:[function(require,module,exports){

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
        me.lineTo(width + x, y);
        me.lineTo(width + x, height + y);
        me.lineTo(x, height + y);
        me.closePath();
    };

    init();

    return this;
}
},{}],10:[function(require,module,exports){

// Timer class implements the main loop of the application and the callbacs that handle
// application processing in main loop.
module.exports = function Timer(options)
{
    'use strict';

    if(Timer.prototype.singletonInstance)
    {
        return Timer.prototype.singletonInstance;
    }

    if (!(this instanceof Timer))
    {
        return new Timer(options);
    }

    Timer.prototype.singletonInstance = this;

    var me = this;

    me.renderCallback;
    me.updateCallback;
    me.measureCallback;

    // Frame rate
    var frameRate = 30;
    me.getFramerate = function() { return frameRate; }
    me.setFramerate = function(value)
    {
        frameRate = value;

        // one second / frame rate = time of a period
        period = Math.round(1000 / frameRate);
    }

    // Time in milliseconds we have time to perform all operations
    var period;
    me.getPeriod = function() { return period; }

    // Time before the operations
    var beforeTime;
    me.getBeforeTime = function() { return beforeTime; }

    // Time after the operations
    var afterTime;
    me.getAfterTime = function() { return afterTime; }

    // Time that elapsed during the processing of operations
    var timeDiff;
    me.getTimeDiff = function() { return timeDiff; }

    // Sleep time is the time left after the operations
    var sleepTime;
    me.getSleepTime = function() { return sleepTime; }

    // Over sleep time is the time between the timer events without the delay itself.
    // This is only plus minus few milliseconds.
    var overSleepTime;
    me.getOverSleepTime = function() { return overSleepTime; }

    // Time in milliseconds the loop is delayed due to the heavy processing.
    // Drawing of frames are skipped if this is greater than the time of a period.
    var excess;
    me.getExcess = function() { return excess; }

    var gameTimerId;

    var dummyFunction = function() {};

    function init()
    {
        if (options)
        {
            me.renderCallback = options.renderCallback || dummyFunction;
            me.updateCallback = options.updateCallback || dummyFunction;
            me.measureCallback = options.measureCallback || dummyFunction;

            me.setFramerate(options.frameRate || 30);
        }
        else
        {
            me.renderCallback = dummyFunction;
            me.updateCallback = dummyFunction;
            me.measureCallback = dummyFunction;

            me.setFramerate(30);
        }

        beforeTime = 0;
        afterTime = 0;
        timeDiff = 0;
        sleepTime = 0;
        overSleepTime = 0;
        excess = 0;
    }

    me.start = function()
    {
        beforeTime = new Date().getTime();
        afterTime = new Date().getTime();
        gameTimerId = setTimeout(run, period);
    }

    me.stop = function()
    {
        clearTimeout(gameTimerId);
    }


    // Main loop of the game.
    // Game loop starts with the startTimer call. It is called once
    // and afterwards the timer is called inside the game loop.
    function run(event)
    {
        // get start time
        beforeTime = new Date().getTime();

        // get the time that elapsed from the previous run function call,
        // not including the delay itself.
        overSleepTime = (beforeTime - afterTime) - sleepTime;

        me.updateCallback();
        me.renderCallback();

        // get end time
        afterTime = new Date().getTime();

        // get time difference i.e. elapsed time.
        timeDiff = afterTime - beforeTime;

        // calculate new delay
        // overSleepTime is reduced to balance the timer error from previus round.
        sleepTime = (period - timeDiff) - overSleepTime;

        if(sleepTime <= 0)
        {
            // processing a frame takes more time than the time of a period

            // store the negative sleep time
            excess -= sleepTime;

            // set a minimum sleep time
            sleepTime = 2;
        }

        // set the newly calculated delay
        gameTimerId = setTimeout(run, sleepTime);

        // compensate the processings of all delayed run calls
        // by updating everything else but drawing.
        while (excess > period)
        {
            me.updateCallback();
            excess -= period;
        }

        me.measureCallback();
    }

    init();

    return this;
}

},{}],11:[function(require,module,exports){

var TransformCache = require('./transformCache.js');

module.exports = Transform;

function Transform(imageDataOriginal, context)
{
    'use strict';

    if (!(this instanceof Transform))
    {
        return new Transform(imageData);
    }

    var me = this;

    var imageDataModified = imageDataOriginal;

    var pixelCache;

    function init()
    {
        pixelCache = new TransformCache(imageDataOriginal, 4);
        // me.updateCache();
    }

    /**
     * Must be called when image data has been changed.
     * Called initially
     */
    // me.updateCache = function()
    // {
    //     pixelCache = [];

    //     var width = imageDataOriginal.width;
    //     var height = imageDataOriginal.height;
    //     var dataLength = width * height;
    //     var x;
    //     var y;

    //     for (var i = 0; i < dataLength; i++)
    //     {
    //         x = (i % width);
    //         y = Math.floor(i / width);

    //         pixelCache.push({
    //             approximate: me.isApproximated(width, height, x, y),
    //             x: x,
    //             y: y,
    //             i: i,
    //             tx: 0, // translated positions. These are evaluated
    //             ty: 0 // in evaluatePixel function if needed
    //         });
    //     }
    // };

    // me.getApproximateCacheIndex1 = function(width, height, x, y, index)
    // {
    //     // if(x )
    // };

    // me.isApproximated = function(width, height, x, y)
    // {
    //     // points marked with x will be calculated
    //     // points marked with - will be approximated
    //     // last should be calculated on right and bottom
    //     //   0 1 2 3 4 5
    //     // 0 x - x - x x
    //     // 1 - - - - - x
    //     // 2 x - x - x x
    //     // 3 - - - - - x
    //     // 4 x - x - x x
    //     // 5 x x x x x x

    //     return ! (
    //         (y % 4 === 0 && x % 4 === 0) ||
    //         (x === width-1 || y === height-1)
    //     );
    // };

    me.getImageData = function()
    {
        return imageDataModified;
    };

    /**
     * Perform transformation by remanipulating original data.
     * Can be used to appy only one transformation.
     */
    me.do = function(evaluatePixel, parameters)
    {
        imageDataModified = transform(imageDataModified, evaluatePixel, parameters);
    };

    /**
     * Perform transformation by remanipulating data.
     * Can be used to perform multiple transformations.
     * Reset must be called manually before executing
     * new transformations.
     *
     * @param      {function}  evaluatePixel  The evaluate pixel
     * @param      {object}  parameters
     */
    me.doOld = function(evaluatePixel, parameters)
    {
        imageDataModified = transform2(evaluatePixel, parameters);
    };

    me.reset = function()
    {
        imageDataModified = imageDataOriginal;
    };

    function transform(imageDataSrc, evaluatePixel, parameters)
    {
        var bufferSrc = imageDataSrc.data.buffer;
        var bufferDst = new ArrayBuffer(imageDataSrc.data.length);

        var uint32Src = new Uint32Array(bufferSrc);
        var uint32Dst = new Uint32Array(bufferDst);

        var uint8CSrc = new Uint8ClampedArray(bufferSrc);
        var uint8CDst = new Uint8ClampedArray(bufferDst);

        var imageDataDst = context.createImageData(imageDataSrc);

        var length = uint32Src.length;
        var srcWidth = imageDataSrc.width;
        var result = [];

        // console.time("transform2");
        for (var srcIndex = 0; srcIndex < length; srcIndex++)
        {
            evaluatePixel(srcIndex, uint32Src, uint32Dst, parameters, pixelCache.data, srcWidth);
        }
        // console.timeEnd("transform2");

        imageDataDst.data.set(uint8CDst);

        return imageDataDst;
    }

    function transform2(evaluatePixel, userParameters)
    {
        var imageData = imageDataModified;
        var imageDataNew = context.createImageData(imageData);

        var imageDataPixels = imageData.data;
        var newImageDataPixels = imageDataNew.data;

        var result = [];
        var length = newImageDataPixels.length;
        var parameters = {
            imageData: imageData
        };

        userParameters = userParameters || {};

        for(var property in userParameters)
        {
            parameters[property] = userParameters[property];
        }

        for (var i = 0; i < length; i += 4)
        {
            parameters.r = imageDataPixels[i];
            parameters.g = imageDataPixels[i+1];
            parameters.b = imageDataPixels[i+2];
            parameters.a = imageDataPixels[i+3];
            parameters.x = (i % (imageData.width << 2)) >> 2;
            parameters.y = Math.floor(i / (imageData.width << 2));

            result = evaluatePixel(parameters);

            newImageDataPixels[i]   = result[0]; // R
            newImageDataPixels[i+1] = result[1]; // G
            newImageDataPixels[i+2] = result[2]; // B
            newImageDataPixels[i+3] = result[3]; // A
        }

        return imageDataNew;
    }

    init();
}

Transform.sampleLinear = function(imageData, x, y)
{
    var data = imageData.data;
    var index = y * (imageData.width << 2) + (x << 2);

    return [
        data[index],
        data[index+1],
        data[index+2],
        data[index+3]
    ];
};

Transform.distance = function(x1, y1, x2, y2)
{
    var distanceX = x1-x2;
    var distanceY = y1-y2;
    return Math.sqrt(distanceX*distanceX + distanceY*distanceY);
};

Transform.degreesToRadians = function(degree)
{
    return (degree/180.0)*3.14159265;
};

Transform.Invert = function(p)
{
    return [255-p.r, 255-p.g, 255-p.b, p.a];
};

Transform.GrayScale = function(p)
{
    var average = (p.r + p.g + p.b) /3;
    return [average, average, average, p.a];
};

Transform.Alpha = function(p)
{
    return [p.r, p.g, p.b, p.value];
};

// Weighted alpha blend between two images.
// Used for drawing images with alpha colors
// on top of other images
Transform.WeightedAlphaBlend = function(p)
{
    var p2 = Transform.sampleLinear(p.imageData2, p.x, p.y);
    var p2a = p2[3];
    var p2aPct = p2a / 255;

    if(p2a === 255)
    {
        return [p2[0], p2[1], p2[2], p2[3]];
    }
    else if(p2a === 0)
    {
        return [p.r, p.g, p.b, p.a];
    }

    return [
        getGetColorFromGradient(p.r, p2[0], p2aPct),
        getGetColorFromGradient(p.g, p2[1], p2aPct),
        getGetColorFromGradient(p.b, p2[2], p2aPct),
        p.a > p2a ? p.a : p2a
    ];
};

Transform.Rotate = function(p)
{
    var degree = p.degree;

    var radian = Transform.degreesToRadians(degree);
    var tx = Math.round(p.x*Math.cos(radian) - p.y*Math.sin(radian));
    var ty = Math.round(p.x*Math.sin(radian) + p.y*Math.cos(radian));

    return Transform.sampleLinear(p.imageData, tx, ty);
};

Transform.Swirl = function(srcIndex, src32, dst32, p, pixelCache, srcWidth)
{
    var cache = pixelCache[srcIndex];

    if(cache.approximate)
    {
        Transform.SwirlApproximation(srcIndex, src32, dst32, p, pixelCache, srcWidth);
        return;
    }

    var originX = p.originX;
    var originY = p.originY;
    var radius = p.radius;

    // var distance = Transform.distance(cache.x, cache.y, originX, originY);
    var distanceX = cache.x-originX;
    var distanceY = cache.y-originY;
    var distance = Math.sqrt(distanceX*distanceX + distanceY*distanceY);

    // radian is the greater the farther the pixel is from origin
    var radian = p.angle * distance;
    // var tx = originX + Math.cos(radian)*radius;
    // var ty = originY - Math.sin(radian)*radius;
    var tx = Math.cos(radian)*radius;
    var ty = Math.sin(radian)*radius;

    // tx -= originX;
    // ty -= originY;

    // tx = cache.x - Math.round(tx);
    // ty = cache.y - Math.round(ty);
    tx = (cache.x + tx) | 0;
    ty = (cache.y + ty) | 0;


    if(tx < 0 || ty < 0) {
        return;
    }

    // return Transform.sampleLinear(p.imageData, tx, ty);
    dst32[srcIndex] = src32[ty * srcWidth + tx];
    cache.tx = tx;
    cache.ty = ty;
};

Transform.SwirlApproximation = function(srcIndex, src32, dst32, p, pixelCache, srcWidth)
{

};

Transform.SwirlOld = function(p)
{
    var originX = p.originX;
    var originY = p.originY;
    var degree = p.degree;
    var radius = p.radius;

    var distance = Transform.distance(p.x, p.y, originX, originY);

    // radian is the greater the farther the pixel is from origin
    var radian = Transform.degreesToRadians(degree * distance);
    var tx = originX + Math.cos(radian)*radius;
    var ty = originY - Math.sin(radian)*radius;

    tx -= originX;
    ty -= originY;

    tx = Math.round(p.x - tx);
    ty = Math.round(p.y - ty);

    return Transform.sampleLinear(p.imageData, tx, ty);
};

/**
 * Get color value between two color component at the specified position
 * @param colorComponent1 color component e.g. red value from 0 to 255
 * @param colorComponent2 color component e.g. red value from 0 to 255
 * @param position Position of the color in gradient. Number value from 0 to 1
 * @return number between 0 to 255
 */
function getGetColorFromGradient(colorComponent1, colorComponent2, position)
{
    return colorComponent1 - position * (colorComponent1 - colorComponent2);
}

Transform.descriptions = {
    Invert: {
        arguments: []
    },
    GrayScale: {
        arguments: []
    },
    Alpha: {
        arguments: [
            {
                name:"value",
                min: 0,
                max: 255,
                default: 255,
                type: "number",
                description: "Control the alpha channel of pixels."
            }
        ]
    },
    Rotate: {
        arguments: []
    },
    Swirl: {
        arguments: [
            {
                name: "originX",
                min: Number.MIN_VALUE,
                max: Number.MAX_VALUE,
                default: 0,
                type: "number",
                description: "Center position of the transform on X axis."
            },
            {
                name: "originY",
                min: Number.MIN_VALUE,
                max: Number.MAX_VALUE,
                default: 0,
                type: "number",
                description: "Center position of the transform on Y axis."
            },
            {
                name: "angle",
                min: Number.MIN_VALUE,
                max: Number.MAX_VALUE,
                default: 0.0349,
                type: "number",
                description: "Angle of the twist in radians."
            },
            {
                name: "radius",
                min: Number.MIN_VALUE,
                max: Number.MAX_VALUE,
                default: 20,
                type: "number",
                description: ""
            },
        ]
    }
};

},{"./transformCache.js":12}],12:[function(require,module,exports){

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

    var data;

    Object.defineProperty(this, "data", {
        get: function()
        {
            return data;
        }
    });

    function init()
    {
        level = level || 2;
        level = level < 1 ? 1 : level;

        me.createCache();
    }

    me.createCache = function()
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
        var approximated;

        for (var i = 0; i < dataLength; i++)
        {
            x = (i % width);
            y = Math.floor(i / width);

            approximated = me.isApproximated(width, height, x, y);
            lineLastIndex = y * width + width-1;
            colLastIndex = (height-1) * width + x;

            if(y % level === 0 || y === height-1)
            {
                pixel1 = i - (x % level);
                pixel2 = i + (level - (x % level));
                pixel2 = pixel2 > lineLastIndex ? lineLastIndex : pixel2;
                // metohod: point on line calculation
                // arg: position between the two points 1 third or something
            }
            else if(x % level === 0 || x === width-1)
            {
                pixel1 = i - (y % level) * width;
                pixel2 = i + (level - (y % level)) * width;
                pixel2 = pixel2 > colLastIndex ? colLastIndex : pixel2;
                // metohod: point on line calculation
                // arg: position between the two points 1 third or something
            }
            else
            {
                pixel1 = undefined;
                pixel2 = undefined;
                // approximated = true;
                // method: take x from pixel1 and y from pixel2
            }

            // console.log(x, y, pixel1, pixel2, approximated);

            data.push({
                approximate: approximated,
                ai1: pixel1,
                ai2: pixel2,
                x: x,
                y: y,
                i: i,
                tx: 0, // translated positions. These are evaluated
                ty: 0 // in evaluatePixel function if needed
            });
        }
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
},{}]},{},[7])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY2FudmFzdXRpbC5qcyIsInNyYy9ncmFwaGljLmpzIiwic3JjL2ltYWdlTG9hZGVyL2ltYWdlTG9hZGVyLmpzIiwic3JjL2ltYWdlTG9hZGVyL2ltYWdlTG9hZGVySXRlbS5qcyIsInNyYy9pbWFnZUxvYWRlci9xdWV1ZS5qcyIsInNyYy9pbWFnZUxvYWRlci90aHJlYWQuanMiLCJzcmMvaW5kZXguanMiLCJzcmMvbGF5ZXIuanMiLCJzcmMvc2hhcGUuanMiLCJzcmMvdGltZXIuanMiLCJzcmMvdHJhbnNmb3JtLmpzIiwic3JjL3RyYW5zZm9ybUNhY2hlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3haQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IENhbnZhc1V0aWwoKTtcclxuXHJcbmZ1bmN0aW9uIENhbnZhc1V0aWwoKVxyXG57XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgaWYoQ2FudmFzVXRpbC5wcm90b3R5cGUuc2luZ2xldG9uSW5zdGFuY2UpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIENhbnZhc1V0aWwucHJvdG90eXBlLnNpbmdsZXRvbkluc3RhbmNlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBDYW52YXNVdGlsKSlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IENhbnZhc1V0aWwoKTtcclxuICAgIH1cclxuXHJcbiAgICBDYW52YXNVdGlsLnByb3RvdHlwZS5zaW5nbGV0b25JbnN0YW5jZSA9IHRoaXM7XHJcblxyXG4gICAgdmFyIG1lID0gdGhpcztcclxuXHJcbiAgICB2YXIgY2FudmFzO1xyXG4gICAgdmFyIGNvbnRleHQ7XHJcblxyXG4gICAgZnVuY3Rpb24gaW5pdCgpXHJcbiAgICB7XHJcbiAgICAgICAgbWUucmVzZXRUZW1wQ2FudmFzKCk7XHJcbiAgICB9XHJcblxyXG4gICAgbWUucmVzZXRUZW1wQ2FudmFzID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIik7XHJcbiAgICAgICAgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XHJcbiAgICB9XHJcblxyXG4gICAgbWUuZ2V0SW1hZ2VEYXRhRnJvbVRhZyA9IGZ1bmN0aW9uKGltYWdlVGFnKVxyXG4gICAge1xyXG4gICAgICAgIHVwZGF0ZUNhbnZhc1NpemUoaW1hZ2VUYWcpO1xyXG4gICAgICAgIGNsZWFyQ2FudmFzKGltYWdlVGFnKTtcclxuICAgICAgICBkcmF3SW1hZ2VUYWcoaW1hZ2VUYWcpO1xyXG4gICAgICAgIHJldHVybiBnZXRJbWFnZURhdGEoaW1hZ2VUYWcpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHVwZGF0ZUNhbnZhc1NpemUoaW1hZ2VUYWcpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKGNhbnZhcy53aWR0aCA8IGltYWdlVGFnLndpZHRoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2FudmFzLndpZHRoID0gaW1hZ2VUYWcud2lkdGg7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZihjYW52YXMuaGVpZ2h0IDwgaW1hZ2VUYWcuaGVpZ2h0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2FudmFzLmhlaWdodCA9IGltYWdlVGFnLmhlaWdodDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gY2xlYXJDYW52YXMoaW1hZ2VUYWcpXHJcbiAgICB7XHJcbiAgICAgICAgY29udGV4dC5jbGVhclJlY3QoMCwgMCwgaW1hZ2VUYWcud2lkdGgsIGltYWdlVGFnLmhlaWdodCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZHJhd0ltYWdlVGFnKGltYWdlVGFnKVxyXG4gICAge1xyXG4gICAgICAgIGNvbnRleHQuZHJhd0ltYWdlKGltYWdlVGFnLCAwLCAwKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXRJbWFnZURhdGEoaW1hZ2VUYWcpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGNvbnRleHQuZ2V0SW1hZ2VEYXRhKDAsIDAsIGltYWdlVGFnLndpZHRoLCBpbWFnZVRhZy5oZWlnaHQpO1xyXG4gICAgfVxyXG5cclxuICAgIGluaXQoKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxufVxyXG4iLCJcclxudmFyIFRyYW5zZm9ybSA9IHJlcXVpcmUoJy4vdHJhbnNmb3JtLmpzJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIEdyYXBoaWMob3B0aW9ucylcclxue1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBHcmFwaGljKSlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IEdyYXBoaWMob3B0aW9ucyk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIG1lID0gdGhpcztcclxuICAgIHZhciByZW5kZXJDb250ZXh0O1xyXG5cclxuICAgIHZhciBfaW1hZ2VEYXRhO1xyXG4gICAgdmFyIGltYWdlRGF0YThDbGFtcGVkVmlldztcclxuICAgIHZhciBpbWFnZURhdGEzMlZpZXc7XHJcblxyXG4gICAgdmFyIHJlbmRlcmVkWDtcclxuICAgIHZhciByZW5kZXJlZFk7XHJcblxyXG4gICAgdmFyIGR1bW15RnVuY3Rpb24gPSBmdW5jdGlvbigpIHt9XHJcblxyXG4gICAgbWUueCA9IDA7XHJcbiAgICBtZS55ID0gMDtcclxuXHJcbiAgICBtZS5vblJvbGxPdmVyID0gbnVsbDtcclxuICAgIG1lLm9uUm9sbE91dCA9IG51bGw7XHJcbiAgICBtZS5vbkNsaWNrID0gbnVsbDtcclxuXHJcbiAgICB2YXIgdXBkYXRlID0gZHVtbXlGdW5jdGlvbjtcclxuXHJcbiAgICBmdW5jdGlvbiBpbml0KClcclxuICAgIHtcclxuICAgICAgICBpZiAob3B0aW9ucylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmltYWdlRGF0YSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbWUuc2V0SW1hZ2VEYXRhKG9wdGlvbnMuaW1hZ2VEYXRhKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbWUueCA9IG9wdGlvbnMueCB8fCAwO1xyXG4gICAgICAgICAgICBtZS55ID0gb3B0aW9ucy55IHx8IDA7XHJcblxyXG4gICAgICAgICAgICBtZS5vblJvbGxPdmVyID0gb3B0aW9ucy5vblJvbGxPdmVyO1xyXG4gICAgICAgICAgICBtZS5vblJvbGxPdXQgPSBvcHRpb25zLm9uUm9sbE91dDtcclxuICAgICAgICAgICAgbWUub25DbGljayA9IG9wdGlvbnMub25DbGljaztcclxuXHJcbiAgICAgICAgICAgIHVwZGF0ZSA9IG9wdGlvbnMudXBkYXRlIHx8IGR1bW15RnVuY3Rpb247XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG1lLmdldEltYWdlRGF0YSA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gX2ltYWdlRGF0YTtcclxuICAgIH1cclxuXHJcbiAgICBtZS5zZXRJbWFnZURhdGEgPSBmdW5jdGlvbihpbWFnZURhdGEpXHJcbiAgICB7XHJcbiAgICAgICAgX2ltYWdlRGF0YSA9IGltYWdlRGF0YTtcclxuICAgICAgICBpbWFnZURhdGE4Q2xhbXBlZFZpZXcgPSBfaW1hZ2VEYXRhLmRhdGE7XHJcbiAgICAgICAgaW1hZ2VEYXRhMzJWaWV3ID0gbmV3IFVpbnQzMkFycmF5KGltYWdlRGF0YThDbGFtcGVkVmlldy5idWZmZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIG1lLnNldFJlbmRlckNvbnRleHQgPSBmdW5jdGlvbihjb250ZXh0KVxyXG4gICAge1xyXG4gICAgICAgIHJlbmRlckNvbnRleHQgPSBjb250ZXh0O1xyXG4gICAgfTtcclxuXHJcbiAgICBtZS5yZW5kZXIgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgc2F2ZVJlbmRlcmVkUG9zaXRpb24oKTtcclxuXHJcbiAgICAgICAgLy8gdmFyIGV4aXN0aW5nSW1hZ2VEYXRhID0gcmVuZGVyQ29udGV4dC5nZXRJbWFnZURhdGEobWUueCwgbWUueSwgX2ltYWdlRGF0YS53aWR0aCwgX2ltYWdlRGF0YS5oZWlnaHQpO1xyXG4gICAgICAgIC8vIHZhciB0cmFuc2Zvcm0gPSBuZXcgVHJhbnNmb3JtKGV4aXN0aW5nSW1hZ2VEYXRhLCByZW5kZXJDb250ZXh0KTtcclxuXHJcbiAgICAgICAgLy8gdHJhbnNmb3JtLmRvKFRyYW5zZm9ybS5XZWlnaHRlZEFscGhhQmxlbmQsIHtpbWFnZURhdGEyOl9pbWFnZURhdGF9KTtcclxuICAgICAgICAvLyByZW5kZXJDb250ZXh0LnB1dEltYWdlRGF0YSh0cmFuc2Zvcm0uZ2V0SW1hZ2VEYXRhKCksIG1lLngsIG1lLnkpO1xyXG4gICAgICAgIHJlbmRlckNvbnRleHQucHV0SW1hZ2VEYXRhKF9pbWFnZURhdGEsIG1lLngsIG1lLnkpO1xyXG4gICAgfVxyXG5cclxuICAgIG1lLmNsZWFyID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIHJlbmRlckNvbnRleHQuY2xlYXJSZWN0KHJlbmRlcmVkWC0xLCByZW5kZXJlZFktMSwgX2ltYWdlRGF0YS53aWR0aCsxLCBfaW1hZ2VEYXRhLmhlaWdodCsxKTtcclxuICAgIH1cclxuXHJcbiAgICBtZS51cGRhdGUgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgdXBkYXRlLmNhbGwodGhpcyk7XHJcbiAgICB9XHJcblxyXG4gICAgbWUuZ2xvYmFsVG9Mb2NhbCA9IGZ1bmN0aW9uKHgsIHkpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgeDogeCAtIG1lLngsXHJcbiAgICAgICAgICAgIHk6IHkgLSBtZS55XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG1lLmxvY2FsVG9HbG9iYWwgPSBmdW5jdGlvbih4LCB5KVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHg6IG1lLnggKyB4LFxyXG4gICAgICAgICAgICB5OiBtZS55ICsgeVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBtZS5oYXNHbG9iYWxQaXhlbEF0ID0gZnVuY3Rpb24oeCwgeSlcclxuICAgIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmIChpc0dsb2JhbFBvc2l0aW9uV2l0aGluQm91bmRhcmllcyh4LCB5KSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBkaXN0YW5jZUZyb21MZWZ0ID0geCAtIG1lLng7XHJcbiAgICAgICAgICAgIHZhciBkaXN0YW5jZUZyb21Ub3AgPSB5IC0gbWUueTtcclxuICAgICAgICAgICAgdmFyIHBpeGVsMzIgPSBnZXRQaXhlbDMyQXQoZGlzdGFuY2VGcm9tTGVmdCwgZGlzdGFuY2VGcm9tVG9wKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChwaXhlbDMyICE9PSAwKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGlzR2xvYmFsUG9zaXRpb25XaXRoaW5Cb3VuZGFyaWVzKHgsIHkpXHJcbiAgICB7XHJcbiAgICAgICAgLy92YXIgZGlzdGFuY2VGcm9tTGVmdCA9IHggLSBtZS54O1xyXG4gICAgICAgIC8vdmFyIGRpc3RhbmNlRnJvbVRvcCA9IHkgLSBtZS55O1xyXG4gICAgICAgIC8vdmFyIGRpc3RhbmNlRnJvbVJpZ2h0ID0geCAtIChtZS54ICsgX2ltYWdlRGF0YS53aWR0aCk7XHJcbiAgICAgICAgLy92YXIgZGlzdGFuY2VGcm9tQm90dG9tID0geSAtIChtZS55ICsgX2ltYWdlRGF0YS5oZWlnaHQpO1xyXG4gICAgICAgIC8vcmV0dXJuIChkaXN0YW5jZUZyb21MZWZ0ID49IDAgJiYgZGlzdGFuY2VGcm9tUmlnaHQgPD0gMFxyXG4gICAgICAgIC8vICAgICYmIGRpc3RhbmNlRnJvbVRvcCA+PSAwICYmIGRpc3RhbmNlRnJvbUJvdHRvbSA8PSAwKTtcclxuXHJcbiAgICAgICAgLy8gdGhlIGJlbG93IHN0YXRlbWVudCBpbXBsZW1lbnRzIHRoZSBzYW1lIGZ1bmN0aW9uYWxpdHkgYXMgYWJvdmVcclxuICAgICAgICByZXR1cm4gKCh4IC0gbWUueCkgPj0gMFxyXG4gICAgICAgICAgICAgICAgJiYgKHkgLSBtZS55KSA+PSAwXHJcbiAgICAgICAgICAgICAgICAmJiAoeCAtIChtZS54ICsgX2ltYWdlRGF0YS53aWR0aCkpIDw9IDBcclxuICAgICAgICAgICAgICAgICYmICh5IC0gKG1lLnkgKyBfaW1hZ2VEYXRhLmhlaWdodCkpIDw9IDApO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHNhdmVSZW5kZXJlZFBvc2l0aW9uKClcclxuICAgIHtcclxuICAgICAgICByZW5kZXJlZFggPSBtZS54O1xyXG4gICAgICAgIHJlbmRlcmVkWSA9IG1lLnk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0UGl4ZWwzMkF0KHgsIHkpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGltYWdlRGF0YTMyVmlld1t5ICogX2ltYWdlRGF0YS53aWR0aCArIHhdO1xyXG4gICAgfVxyXG5cclxuICAgIGluaXQoKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxufVxyXG4iLCJcclxudmFyIFF1ZXVlID0gcmVxdWlyZSgnLi9xdWV1ZScpO1xyXG52YXIgVGhyZWFkID0gcmVxdWlyZSgnLi90aHJlYWQnKTtcclxudmFyIEltYWdlTG9hZGVySXRlbSA9IHJlcXVpcmUoJy4vaW1hZ2VMb2FkZXJJdGVtJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEltYWdlTG9hZGVyO1xyXG5cclxuZnVuY3Rpb24gSW1hZ2VMb2FkZXIob3B0aW9ucylcclxue1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBJbWFnZUxvYWRlcikpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBJbWFnZUxvYWRlcihvcHRpb25zKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgbWUgPSB0aGlzO1xyXG4gICAgdmFyIGF1dG9sb2FkO1xyXG4gICAgdmFyIHF1ZXVlO1xyXG4gICAgdmFyIG51bWJlck9mVGhyZWFkcztcclxuICAgIHZhciBvbkNvbXBsZXRlQ2FsbGJhY2s7XHJcbiAgICB2YXIgb25GaWxlQ29tcGxldGVDYWxsYmFjaztcclxuICAgIHZhciBvbkZpbGVTdGFydENhbGxiYWNrO1xyXG4gICAgdmFyIGlzTG9hZGluZztcclxuXHJcbiAgICBpbml0KG9wdGlvbnMpO1xyXG5cclxuICAgIG1lLmxvYWQgPSBsb2FkO1xyXG4gICAgbWUuaXNDb21wbGV0ZSA9IGlzQ29tcGxldGU7XHJcbiAgICBtZS5nZXRQZXJjZW50TG9hZGVkID0gZ2V0UGVyY2VudExvYWRlZDtcclxuICAgIG1lLmdldEl0ZW1BdCA9IGdldEl0ZW1BdDtcclxuICAgIG1lLmxlbmd0aCA9IGxlbmd0aDtcclxuXHJcbiAgICBmdW5jdGlvbiBpbml0KG9wdGlvbnMpXHJcbiAgICB7XHJcbiAgICAgICAgYXBwbHlPcHRpb25zKG9wdGlvbnMpO1xyXG5cclxuICAgICAgICBpc0xvYWRpbmcgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKGF1dG9sb2FkKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbG9hZCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBhcHBseU9wdGlvbnMob3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICBpZiAoIW9wdGlvbnMgfHwgdHlwZW9mIG9wdGlvbnMgIT09IFwib2JqZWN0XCIpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPcHRpb25zIHNob3VsZCBiZSBhbiBPYmplY3RcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBxdWV1ZSA9IG5ldyBRdWV1ZShnZXRJbWFnZXMoKSk7XHJcbiAgICAgICAgb25Db21wbGV0ZUNhbGxiYWNrID0gZ2V0T25Db21wbGV0ZSgpO1xyXG4gICAgICAgIG9uRmlsZUNvbXBsZXRlQ2FsbGJhY2sgPSBnZXRPbkZpbGVDb21wbGV0ZSgpO1xyXG4gICAgICAgIG9uRmlsZVN0YXJ0Q2FsbGJhY2sgPSBnZXRPbkZpbGVTdGFydCgpO1xyXG4gICAgICAgIGF1dG9sb2FkID0gZ2V0QXV0b2xvYWQoKTtcclxuICAgICAgICBudW1iZXJPZlRocmVhZHMgPSBnZXROdW1iZXJPZlRocmVhZHMoKTtcclxuXHJcbiAgICAgICAgdmFyIGRlbGF5TWluID0gZ2V0U2ltdWxhdGlvbkRlbGF5TWluKCk7XHJcbiAgICAgICAgdmFyIGRlbGF5TWF4ID0gZ2V0U2ltdWxhdGlvbkRlbGF5TWF4KCk7XHJcblxyXG4gICAgICAgIEltYWdlTG9hZGVySXRlbS5zZXRTaW11bGF0aW9uRGVsYXlzKGRlbGF5TWluLCBkZWxheU1heCk7XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldEltYWdlcygpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoIW9wdGlvbnMuaW1hZ2VzIHx8ICEob3B0aW9ucy5pbWFnZXMgaW5zdGFuY2VvZiBBcnJheSkpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk9wdGlvbnMgb2JqZWN0IHNob3VsZCBoYXZlICdpbWFnZXMnIHByb3BlcnR5ICh0eXBlIG9mIGFycmF5KSBjb250YWluaW5nIHBhdGhzIHRvIHRoZSBsb2FkZWQgaW1hZ2VzLlwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IG9wdGlvbnMuaW1hZ2VzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZighb3B0aW9ucy5pbWFnZXNbaV0pXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT2JqZWN0cyBpbiAnaW1hZ2VzJyBjYW5ub3QgYmUgbnVsbCBvciB1bmRlZmluZWRcIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBvcHRpb25zLmltYWdlc1tpXSAhPT0gXCJzdHJpbmdcIiAmJiAhb3B0aW9ucy5pbWFnZXNbaV0uaGFzT3duUHJvcGVydHkoXCJzcmNcIikpXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT2JqZWN0cyBpbiAnaW1hZ2VzJyBwcm9wZXJ0eSBzaG91bGQgaGF2ZSBzcmMgcHJvcGVydHlcIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBvcHRpb25zLmltYWdlcy5zbGljZSgwKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldE9uQ29tcGxldGUoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMub25Db21wbGV0ZSAmJiB0eXBlb2Ygb3B0aW9ucy5vbkNvbXBsZXRlICE9PSBcImZ1bmN0aW9uXCIpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIidvbkNvbXBsZXRlJyBwcm9wZXJ0eSBzaG91bGQgYmUgYSBmdW5jdGlvblwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGdldFZhbHVlKG9wdGlvbnMub25Db21wbGV0ZSwgdW5kZWZpbmVkKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldE9uRmlsZUNvbXBsZXRlKClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLm9uRmlsZUNvbXBsZXRlICYmIHR5cGVvZiBvcHRpb25zLm9uRmlsZUNvbXBsZXRlICE9PSBcImZ1bmN0aW9uXCIpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIidvbkZpbGVDb21wbGV0ZScgcHJvcGVydHkgc2hvdWxkIGJlIGEgZnVuY3Rpb25cIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBnZXRWYWx1ZShvcHRpb25zLm9uRmlsZUNvbXBsZXRlLCB1bmRlZmluZWQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0T25GaWxlU3RhcnQoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMub25GaWxlU3RhcnQgJiYgdHlwZW9mIG9wdGlvbnMub25GaWxlU3RhcnQgIT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiJ29uRmlsZVN0YXJ0JyBwcm9wZXJ0eSBzaG91bGQgYmUgYSBmdW5jdGlvblwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGdldFZhbHVlKG9wdGlvbnMub25GaWxlU3RhcnQsIHVuZGVmaW5lZCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBnZXRBdXRvbG9hZCgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICByZXR1cm4gZ2V0VmFsdWUob3B0aW9ucy5hdXRvbG9hZCwgdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBnZXROdW1iZXJPZlRocmVhZHMoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gZ2V0VmFsdWUob3B0aW9ucy5udW1iZXJPZlRocmVhZHMsIDEpO1xyXG4gICAgICAgICAgICB2YXIgbnVtYmVyID0gcGFyc2VJbnQodmFsdWUpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGlzTmFOKG51bWJlcikgfHwgbnVtYmVyIDwgMSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiJ251bWJlck9mVGhyZWFkcycgc2hvdWxkIGJlIGludGVnZXIgbnVtYmVyIGdyYXRlciB0aGFuIDBcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBudW1iZXI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBnZXRTaW11bGF0aW9uRGVsYXlNaW4oKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIHZhbHVlID0gZ2V0VmFsdWUob3B0aW9ucy5zaW11bGF0aW9uRGVsYXlNaW4sIHVuZGVmaW5lZCk7XHJcbiAgICAgICAgICAgIHZhciBudW1iZXIgPSBwYXJzZUludCh2YWx1ZSk7XHJcblxyXG4gICAgICAgICAgICAvLyBhbGxvdyB1bmRlZmluZWQgdmFsdWVzIGJ1dCBvdGhlciB2YWx1ZXMgdGhhdCBjYW5ub3QgYmUgY29udmVydGVkIHRvIG51bWJlciBhcmUgbm90IGFsbG93ZWRcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3VuZGVmaW5lZCcgJiYgKGlzTmFOKG51bWJlcikgfHwgbnVtYmVyIDwgMCkpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIidzaW11bGF0aW9uRGVsYXlNaW4nIHNob3VsZCBiZSBhIG5vbi1uZWdhdGl2ZSBpbnRlZ2VyIG51bWJlclwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG51bWJlciA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG51bWJlcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldFNpbXVsYXRpb25EZWxheU1heCgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBnZXRWYWx1ZShvcHRpb25zLnNpbXVsYXRpb25EZWxheU1heCwgdW5kZWZpbmVkKTtcclxuICAgICAgICAgICAgdmFyIG51bWJlciA9IHBhcnNlSW50KHZhbHVlKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGFsbG93IHVuZGVmaW5lZCB2YWx1ZXMgYnV0IG90aGVyIHZhbHVlcyB0aGF0IGNhbm5vdCBiZSBjb252ZXJ0ZWQgdG8gbnVtYmVyIGFyZSBub3QgYWxsb3dlZFxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAndW5kZWZpbmVkJyAmJiAoaXNOYU4obnVtYmVyKSB8fCBudW1iZXIgPCAwKSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiJ3NpbXVsYXRpb25EZWxheU1heCcgc2hvdWxkIGJlIGEgbm9uLW5lZ2F0aXZlIGludGVnZXIgbnVtYmVyXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbnVtYmVyID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbnVtYmVyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0VmFsdWUodmFsdWUsIGRlZmF1bHRWYWx1ZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICd1bmRlZmluZWQnID8gZGVmYXVsdFZhbHVlIDogdmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGxvYWQoKVxyXG4gICAge1xyXG4gICAgICAgIGlmIChpc0xvYWRpbmcgPT09IGZhbHNlICYmIGlzQ29tcGxldGUoKSA9PT0gZmFsc2UpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpc0xvYWRpbmcgPSB0cnVlO1xyXG4gICAgICAgICAgICBjcmVhdGVUaHJlYWRzKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGNyZWF0ZVRocmVhZHMoKVxyXG4gICAge1xyXG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBudW1iZXJPZlRocmVhZHM7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG5ldyBUaHJlYWQoe1xyXG4gICAgICAgICAgICAgICAgb25UaHJlYWRDb21wbGV0ZTogdGhyZWFkQ29tcGxldGVIYW5kbGVyLFxyXG4gICAgICAgICAgICAgICAgb25GaWxlQ29tcGxldGU6IG9uRmlsZUNvbXBsZXRlSGFuZGxlcixcclxuICAgICAgICAgICAgICAgIG9uRmlsZVN0YXJ0OiBvbkZpbGVTdGFydEhhbmRsZXIsXHJcbiAgICAgICAgICAgICAgICBxdWV1ZTogcXVldWVcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG9uRmlsZUNvbXBsZXRlSGFuZGxlcihpdGVtKVxyXG4gICAge1xyXG4gICAgICAgIGlmIChvbkZpbGVDb21wbGV0ZUNhbGxiYWNrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgb25GaWxlQ29tcGxldGVDYWxsYmFjayhpdGVtKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gb25GaWxlU3RhcnRIYW5kbGVyKGl0ZW0pXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKG9uRmlsZVN0YXJ0Q2FsbGJhY2spXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBvbkZpbGVTdGFydENhbGxiYWNrKGl0ZW0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB0aHJlYWRDb21wbGV0ZUhhbmRsZXIoKVxyXG4gICAge1xyXG4gICAgICAgIGlmIChpc0NvbXBsZXRlKCkgJiYgb25Db21wbGV0ZUNhbGxiYWNrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaXNMb2FkaW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgIG9uQ29tcGxldGVDYWxsYmFjaygpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBpc0NvbXBsZXRlKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gcXVldWUuaXNDb21wbGV0ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGdldFBlcmNlbnRMb2FkZWQoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBxdWV1ZS5nZXRQZXJjZW50TG9hZGVkKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0SXRlbUF0KGluZGV4KVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBxdWV1ZS5nZXRJdGVtQXQoaW5kZXgpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGxlbmd0aCgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHF1ZXVlLmxlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxufVxyXG4iLCJcclxubW9kdWxlLmV4cG9ydHMgPSBJbWFnZUxvYWRlckl0ZW07XHJcblxyXG5mdW5jdGlvbiBJbWFnZUxvYWRlckl0ZW0ob3B0aW9ucylcclxue1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgIHZhciBTVEFUVVMgPSB7XHJcbiAgICAgICAgUEVORElORzogXCJwZW5kaW5nXCIsXHJcbiAgICAgICAgTE9BRElORzogXCJsb2FkaW5nXCIsXHJcbiAgICAgICAgQ09NUExFVEU6IFwiY29tcGxldGVcIixcclxuICAgICAgICBGQUlMRUQ6IFwiZmFpbGVkXCJcclxuICAgIH07XHJcblxyXG4gICAgdmFyIG1lID0gdGhpcztcclxuXHJcbiAgICB2YXIgb25Mb2FkQ2FsbGJhY2s7XHJcblxyXG4gICAgaW5pdCgpO1xyXG5cclxuICAgIG1lLmxvYWQgPSBmdW5jdGlvbihvbkxvYWQpXHJcbiAgICB7XHJcbiAgICAgICAgb25Mb2FkQ2FsbGJhY2sgPSBvbkxvYWQ7XHJcblxyXG4gICAgICAgIHNldFN0YXR1c0xvYWRpbmcoKTtcclxuXHJcbiAgICAgICAgbWUudGFnLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBvbkxvYWRIYW5kbGVyKTtcclxuICAgICAgICBtZS50YWcuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCBvbkVycm9ySGFuZGxlcik7XHJcblxyXG4gICAgICAgIG1lLnRhZy5zcmMgPSBtZS5zcmM7XHJcbiAgICB9O1xyXG5cclxuICAgIG1lLmlzUGVuZGluZyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIG1lLnN0YXR1cyA9PT0gU1RBVFVTLlBFTkRJTkc7IH07XHJcbiAgICBtZS5pc0NvbXBsZXRlID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gbWUuc3RhdHVzID09PSBTVEFUVVMuQ09NUExFVEU7IH07XHJcbiAgICBtZS5pc0xvYWRpbmcgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBtZS5zdGF0dXMgPT09IFNUQVRVUy5MT0FESU5HOyB9O1xyXG4gICAgbWUuaXNGYWlsZWQgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBtZS5zdGF0dXMgPT09IFNUQVRVUy5GQUlMRUQ7IH07XHJcblxyXG4gICAgZnVuY3Rpb24gaW5pdCgpXHJcbiAgICB7XHJcbiAgICAgICAgc2V0UHJvcGVydGllcygpO1xyXG4gICAgICAgIHNldFN0YXR1c1BlbmRpbmcoKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBzZXRQcm9wZXJ0aWVzKClcclxuICAgIHtcclxuICAgICAgICBmb3IodmFyIHByb3BlcnR5IGluIG9wdGlvbnMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBtZVtwcm9wZXJ0eV0gPSBvcHRpb25zW3Byb3BlcnR5XTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1lLnRhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbWdcIik7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gc2V0U3RhdHVzRmFpbGVkKCkgeyBtZS5zdGF0dXMgPSBTVEFUVVMuRkFJTEVEOyB9XHJcbiAgICBmdW5jdGlvbiBzZXRTdGF0dXNDb21wbGV0ZSgpIHsgbWUuc3RhdHVzID0gU1RBVFVTLkNPTVBMRVRFOyB9XHJcbiAgICBmdW5jdGlvbiBzZXRTdGF0dXNMb2FkaW5nKCkgeyBtZS5zdGF0dXMgPSBTVEFUVVMuTE9BRElORzsgfVxyXG4gICAgZnVuY3Rpb24gc2V0U3RhdHVzUGVuZGluZygpIHsgbWUuc3RhdHVzID0gU1RBVFVTLlBFTkRJTkc7IH1cclxuXHJcbiAgICBmdW5jdGlvbiByZW1vdmVMaXN0ZW5lcnMoKVxyXG4gICAge1xyXG4gICAgICAgIG1lLnRhZy5yZW1vdmVFdmVudExpc3RlbmVyKCdsb2FkJywgb25Mb2FkSGFuZGxlcik7XHJcbiAgICAgICAgbWUudGFnLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgb25FcnJvckhhbmRsZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG9uTG9hZEhhbmRsZXIoZXZlbnQpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKEltYWdlTG9hZGVySXRlbS5zaW11bGF0aW9uRGVsYXlNaW4pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZmluYWxpemVPbkxvYWQoKTtcclxuXHJcbiAgICAgICAgICAgIH0sIGNhbGN1bGF0ZVNpbXVsYXRpb25EZWxheSgpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZmluYWxpemVPbkxvYWQoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gb25FcnJvckhhbmRsZXIoZXZlbnQpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKEltYWdlTG9hZGVySXRlbS5zaW11bGF0aW9uRGVsYXlNaW4pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZmluYWxpemVPbkVycm9yKCk7XHJcblxyXG4gICAgICAgICAgICB9LCBjYWxjdWxhdGVTaW11bGF0aW9uRGVsYXkoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGZpbmFsaXplT25FcnJvcigpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBmaW5hbGl6ZU9uTG9hZCgpXHJcbiAgICB7XHJcbiAgICAgICAgcmVtb3ZlTGlzdGVuZXJzKCk7XHJcbiAgICAgICAgc2V0U3RhdHVzQ29tcGxldGUoKTtcclxuICAgICAgICBvbkxvYWRDYWxsYmFjayhtZSk7XHJcbiAgICAgICAgb25Mb2FkQ2FsbGJhY2sgPSB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZmluYWxpemVPbkVycm9yKClcclxuICAgIHtcclxuICAgICAgICByZW1vdmVMaXN0ZW5lcnMoKTtcclxuICAgICAgICBtZS50YWcgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgc2V0U3RhdHVzRmFpbGVkKCk7XHJcbiAgICAgICAgb25Mb2FkQ2FsbGJhY2sobWUpO1xyXG4gICAgICAgIG9uTG9hZENhbGxiYWNrID0gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGNhbGN1bGF0ZVNpbXVsYXRpb25EZWxheSgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIG1heCA9IEltYWdlTG9hZGVySXRlbS5zaW11bGF0aW9uRGVsYXlNYXg7XHJcbiAgICAgICAgdmFyIG1pbiA9IEltYWdlTG9hZGVySXRlbS5zaW11bGF0aW9uRGVsYXlNaW47XHJcblxyXG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluKSArIG1pbik7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuXHJcbkltYWdlTG9hZGVySXRlbS5zZXRTaW11bGF0aW9uRGVsYXlzID0gZnVuY3Rpb24obWluLCBtYXgpXHJcbntcclxuICAgIHZhciBkZWxheU1pbiA9IG1pbjtcclxuICAgIHZhciBkZWxheU1heCA9IG1heDtcclxuXHJcbiAgICBpZiAoZGVsYXlNaW4gJiYgIWRlbGF5TWF4KVxyXG4gICAge1xyXG4gICAgICAgIGRlbGF5TWF4ID0gZGVsYXlNaW47XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmIChkZWxheU1heCAmJiAhZGVsYXlNaW4pXHJcbiAgICB7XHJcbiAgICAgICAgZGVsYXlNaW4gPSBkZWxheU1heDtcclxuICAgIH1cclxuXHJcbiAgICBJbWFnZUxvYWRlckl0ZW0uc2ltdWxhdGlvbkRlbGF5TWluID0gZGVsYXlNaW47XHJcbiAgICBJbWFnZUxvYWRlckl0ZW0uc2ltdWxhdGlvbkRlbGF5TWF4ID0gZGVsYXlNYXg7XHJcbn07XHJcbiIsInZhciBJbWFnZUxvYWRlckl0ZW0gPSByZXF1aXJlKCcuL2ltYWdlTG9hZGVySXRlbScpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBRdWV1ZTtcclxuXHJcbmZ1bmN0aW9uIFF1ZXVlKGltYWdlcylcclxue1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgIHZhciBpdGVtcztcclxuICAgIHZhciBtZSA9IHRoaXM7XHJcblxyXG4gICAgbWUubGVuZ3RoID0gMDtcclxuXHJcbiAgICBpbml0KCk7XHJcblxyXG4gICAgbWUuZ2V0SXRlbUF0ID0gZnVuY3Rpb24oaW5kZXgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGl0ZW1zW2luZGV4XTtcclxuICAgIH07XHJcblxyXG4gICAgbWUuaXNDb21wbGV0ZSA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gdHJ1ZTtcclxuICAgICAgICB2YXIgaXRlbTtcclxuXHJcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGl0ZW1zLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaXRlbSA9IGl0ZW1zW2ldO1xyXG5cclxuICAgICAgICAgICAgaWYgKGl0ZW0uaXNQZW5kaW5nKCkgfHwgaXRlbS5pc0xvYWRpbmcoKSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH07XHJcblxyXG4gICAgbWUuZ2V0TmV4dFBlbmRpbmdJdGVtID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIHZhciByZXN1bHQ7XHJcblxyXG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmIChpdGVtc1tpXS5pc1BlbmRpbmcoKSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gaXRlbXNbaV07XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH07XHJcblxyXG4gICAgbWUuZ2V0UGVyY2VudExvYWRlZCA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICB2YXIgaXRlbTtcclxuICAgICAgICB2YXIgaSA9IDA7XHJcbiAgICAgICAgdmFyIGxlbiA9IGl0ZW1zLmxlbmd0aDtcclxuXHJcbiAgICAgICAgZm9yKGk7IGkgPCBsZW47IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGl0ZW0gPSBpdGVtc1tpXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChpdGVtLmlzUGVuZGluZygpIHx8IGl0ZW0uaXNMb2FkaW5nKCkpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gaSAvIGxlbjtcclxuICAgIH07XHJcblxyXG4gICAgZnVuY3Rpb24gaW5pdCgpXHJcbiAgICB7XHJcbiAgICAgICAgaXRlbXMgPSBjcmVhdGVJdGVtcyhpbWFnZXMpO1xyXG4gICAgICAgIG1lLmxlbmd0aCA9IGl0ZW1zLmxlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBjcmVhdGVJdGVtcyhpbWFnZXMpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xyXG5cclxuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgaW1hZ2VzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBpbWFnZXNbaV0gPT09IFwic3RyaW5nXCIpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKG5ldyBJbWFnZUxvYWRlckl0ZW0oe1xyXG4gICAgICAgICAgICAgICAgICAgIHNyYzogaW1hZ2VzW2ldXHJcbiAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChuZXcgSW1hZ2VMb2FkZXJJdGVtKGltYWdlc1tpXSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcbiIsIlxyXG5tb2R1bGUuZXhwb3J0cyA9IFRocmVhZDtcclxuXHJcbmZ1bmN0aW9uIFRocmVhZChvcHRpb25zKVxyXG57XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgdmFyIG1lID0gdGhpcztcclxuICAgIHZhciBvblRocmVhZENvbXBsZXRlQ2FsbGJhY2s7XHJcbiAgICB2YXIgb25GaWxlQ29tcGxldGVDYWxsYmFjaztcclxuICAgIHZhciBvbkZpbGVTdGFydENhbGxiYWNrO1xyXG4gICAgdmFyIHF1ZXVlO1xyXG5cclxuICAgIGluaXQoKTtcclxuXHJcbiAgICBmdW5jdGlvbiBpbml0KClcclxuICAgIHtcclxuICAgICAgICBvblRocmVhZENvbXBsZXRlQ2FsbGJhY2sgPSBvcHRpb25zLm9uVGhyZWFkQ29tcGxldGU7XHJcbiAgICAgICAgb25GaWxlQ29tcGxldGVDYWxsYmFjayA9IG9wdGlvbnMub25GaWxlQ29tcGxldGU7XHJcbiAgICAgICAgb25GaWxlU3RhcnRDYWxsYmFjayA9IG9wdGlvbnMub25GaWxlU3RhcnQ7XHJcbiAgICAgICAgcXVldWUgPSBvcHRpb25zLnF1ZXVlO1xyXG5cclxuICAgICAgICBwcm9jZXNzTmV4dEl0ZW0oKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBwcm9jZXNzTmV4dEl0ZW0oKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBpbWFnZUxvYWRlckl0ZW0gPSBxdWV1ZS5nZXROZXh0UGVuZGluZ0l0ZW0oKTtcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBpbWFnZUxvYWRlckl0ZW0gPT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgb25UaHJlYWRDb21wbGV0ZUNhbGxiYWNrKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGltYWdlTG9hZGVySXRlbS5sb2FkKG9uTG9hZEhhbmRsZXIpO1xyXG4gICAgICAgICAgICBvbkZpbGVTdGFydENhbGxiYWNrKGltYWdlTG9hZGVySXRlbSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG9uTG9hZEhhbmRsZXIoaXRlbSlcclxuICAgIHtcclxuICAgICAgICBvbkZpbGVDb21wbGV0ZUNhbGxiYWNrKGl0ZW0pO1xyXG4gICAgICAgIHByb2Nlc3NOZXh0SXRlbSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcbiIsIndpbmRvdy5JbWFnZUxvYWRlciA9IHJlcXVpcmUoJy4vaW1hZ2VMb2FkZXIvaW1hZ2VMb2FkZXIuanMnKTtcclxud2luZG93LkxheWVyID0gcmVxdWlyZSgnLi9sYXllci5qcycpO1xyXG53aW5kb3cuVHJhbnNmb3JtID0gcmVxdWlyZSgnLi90cmFuc2Zvcm0uanMnKTtcclxud2luZG93LlRyYW5zZm9ybUNhY2hlID0gcmVxdWlyZSgnLi90cmFuc2Zvcm1DYWNoZS5qcycpO1xyXG53aW5kb3cuR3JhcGhpYyA9IHJlcXVpcmUoJy4vZ3JhcGhpYy5qcycpO1xyXG53aW5kb3cuVGltZXIgPSByZXF1aXJlKCcuL3RpbWVyLmpzJyk7XHJcbndpbmRvdy5DYW52YXNVdGlsID0gcmVxdWlyZSgnLi9jYW52YXN1dGlsLmpzJyk7XHJcbndpbmRvdy5TaGFwZSA9IHJlcXVpcmUoJy4vc2hhcGUuanMnKTtcclxuIiwiXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gTGF5ZXIob3B0aW9ucylcclxue1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBMYXllcikpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBMYXllcihvcHRpb25zKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgbWUgPSB0aGlzO1xyXG4gICAgdmFyIGNhbnZhcztcclxuICAgIHZhciBjb250ZXh0O1xyXG5cclxuICAgIHZhciBob3ZlcmVkR3JhcGhpYztcclxuXHJcbiAgICB2YXIgZ3JhcGhpY3M7XHJcblxyXG4gICAgdmFyIGhhc01vdXNlTW92ZUV2ZW50O1xyXG4gICAgdmFyIGhhc0NsaWNrRXZlbnQ7XHJcblxyXG4gICAgdmFyIGNhbnZhc1N0b3JlZFN0YXRlO1xyXG4gICAgdmFyIGZ1bGxTY3JlZW5TdGF0ZTtcclxuXHJcbiAgICBmdW5jdGlvbiBpbml0KClcclxuICAgIHtcclxuICAgICAgICBpZihvcHRpb25zICYmIG9wdGlvbnMudGFyZ2V0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQob3B0aW9ucy50YXJnZXQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XHJcbiAgICAgICAgZ3JhcGhpY3MgPSBbXTtcclxuXHJcbiAgICAgICAgaWYob3B0aW9ucylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmVuYWJsZU9uUm9sbEV2ZW50cylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbWUuZW5hYmxlT25Sb2xsRXZlbnRzKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmVuYWJsZU9uQ2xpY2tFdmVudHMpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG1lLmVuYWJsZU9uQ2xpY2tFdmVudHMoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMud2lkdGgpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNhbnZhcy53aWR0aCA9IG9wdGlvbnMud2lkdGg7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmhlaWdodClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY2FudmFzLmhlaWdodCA9IG9wdGlvbnMuaGVpZ2h0O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5mdWxsU2NyZWVuKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBtZS5lbmFibGVGdWxsU2NyZWVuKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmKG9wdGlvbnMuY2xpY2tUaHJvdWdoKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjYW52YXMuc3R5bGVbXCJwb2ludGVyLWV2ZW50c1wiXSA9IFwibm9uZVwiO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5hcHBlbmRUb0JvZHkpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoY2FudmFzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBtZS5nZXRDYW52YXMgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGNhbnZhczsgfVxyXG4gICAgbWUuZ2V0Q29udGV4dCA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gY29udGV4dDsgfVxyXG5cclxuICAgIG1lLmVuYWJsZU9uUm9sbEV2ZW50cyA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICBpZiAoIWhhc01vdXNlTW92ZUV2ZW50KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIG1vdXNlTW92ZUhhbmRsZXIpO1xyXG4gICAgICAgICAgICBoYXNNb3VzZU1vdmVFdmVudCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG1lLmRpc2FibGVPblJvbGxFdmVudHMgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKGhhc01vdXNlTW92ZUV2ZW50KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2FudmFzLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIG1vdXNlTW92ZUhhbmRsZXIpO1xyXG4gICAgICAgICAgICBoYXNNb3VzZU1vdmVFdmVudCA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBtZS5lbmFibGVPbkNsaWNrRXZlbnRzID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIGlmICghaGFzQ2xpY2tFdmVudClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGNsaWNrSGFuZGxlcik7XHJcbiAgICAgICAgICAgIGhhc0NsaWNrRXZlbnQgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBtZS5kaXNhYmxlT25DbGlja0V2ZW50cyA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICBpZiAoaGFzQ2xpY2tFdmVudClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNhbnZhcy5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIGNsaWNrSGFuZGxlcik7XHJcbiAgICAgICAgICAgIGhhc0NsaWNrRXZlbnQgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbWUuZW5hYmxlRnVsbFNjcmVlbiA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICBpZiAoIWZ1bGxTY3JlZW5TdGF0ZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHN0b3JlQ2FudmFzQ3VycmVudFN0YXRlKCk7XHJcbiAgICAgICAgICAgIHNldENhbnZhc0Z1bGxTY3JlZW5TdGF0ZSgpO1xyXG4gICAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdXBkYXRlQ2FudmFzRnVsbFNjcmVlbik7XHJcbiAgICAgICAgICAgIGZ1bGxTY3JlZW5TdGF0ZSA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG1lLmRpc2FibGVGdWxsU2NyZWVuID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIGlmIChmdWxsU2NyZWVuU3RhdGUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdXBkYXRlQ2FudmFzRnVsbFNjcmVlbik7XHJcbiAgICAgICAgICAgIHJlc3RvcmVDYW52YXNTdGF0ZSgpO1xyXG4gICAgICAgICAgICBmdWxsU2NyZWVuU3RhdGUgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gc3RvcmVDYW52YXNDdXJyZW50U3RhdGUoKVxyXG4gICAge1xyXG4gICAgICAgIGNhbnZhc1N0b3JlZFN0YXRlID0ge1xyXG4gICAgICAgICAgICBwb3NpdGlvbjogY2FudmFzLnN0eWxlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICBsZWZ0OiBjYW52YXMuc3R5bGUubGVmdCxcclxuICAgICAgICAgICAgdG9wOiBjYW52YXMuc3R5bGUudG9wLFxyXG4gICAgICAgICAgICB3aWR0aDogY2FudmFzLndpZHRoLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IGNhbnZhcy5oZWlnaHRcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHNldENhbnZhc0Z1bGxTY3JlZW5TdGF0ZSgpXHJcbiAgICB7XHJcbiAgICAgICAgY2FudmFzLnN0eWxlLnBvc2l0aW9uID0gXCJhYnNvbHV0ZVwiO1xyXG4gICAgICAgIGNhbnZhcy5zdHlsZS5sZWZ0ID0gXCIwXCI7XHJcbiAgICAgICAgY2FudmFzLnN0eWxlLnRvcCA9IFwiMFwiO1xyXG4gICAgICAgIHVwZGF0ZUNhbnZhc0Z1bGxTY3JlZW4oKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB1cGRhdGVDYW52YXNGdWxsU2NyZWVuKClcclxuICAgIHtcclxuICAgICAgICBjYW52YXMud2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcclxuICAgICAgICBjYW52YXMuaGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xyXG4gICAgICAgIG1lLnJlbmRlcigpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHJlc3RvcmVDYW52YXNTdGF0ZSgpXHJcbiAgICB7XHJcbiAgICAgICAgY2FudmFzLnN0eWxlLnBvc2l0aW9uID0gY2FudmFzU3RvcmVkU3RhdGUucG9zaXRpb247XHJcbiAgICAgICAgY2FudmFzLnN0eWxlLmxlZnQgPSBjYW52YXNTdG9yZWRTdGF0ZS5sZWZ0O1xyXG4gICAgICAgIGNhbnZhcy5zdHlsZS50b3AgPSBjYW52YXNTdG9yZWRTdGF0ZS50b3A7XHJcbiAgICAgICAgY2FudmFzLndpZHRoID0gY2FudmFzU3RvcmVkU3RhdGUud2lkdGg7XHJcbiAgICAgICAgY2FudmFzLmhlaWdodCA9IGNhbnZhc1N0b3JlZFN0YXRlLmhlaWdodDtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBtb3VzZU1vdmVIYW5kbGVyKGV2ZW50KVxyXG4gICAge1xyXG4gICAgICAgIHZhciBncmFwaGljID0gbWUuZ2V0R3JhcGhpY0F0UG9pbnQoZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSk7XHJcblxyXG4gICAgICAgIC8vIHRlc3QgaWYgd2UgYXJlIGhpdHRpbmcgc29tZXRoaW5nIGRpZmZlcmVudCBvbiB0aGlzIG1vdmVcclxuICAgICAgICBpZiAoZ3JhcGhpYyAhPT0gaG92ZXJlZEdyYXBoaWMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAoaG92ZXJlZEdyYXBoaWMgJiYgaG92ZXJlZEdyYXBoaWMub25Sb2xsT3V0KVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBob3ZlcmVkR3JhcGhpYy5vblJvbGxPdXQuY2FsbChob3ZlcmVkR3JhcGhpYyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChncmFwaGljICYmIGdyYXBoaWMub25Sb2xsT3ZlcilcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZ3JhcGhpYy5vblJvbGxPdmVyLmNhbGwoZ3JhcGhpYyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGhvdmVyZWRHcmFwaGljID0gZ3JhcGhpYztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gY2xpY2tIYW5kbGVyKGV2bmV0KVxyXG4gICAge1xyXG4gICAgICAgIHZhciBncmFwaGljID0gbWUuZ2V0R3JhcGhpY0F0UG9pbnQoZXZlbnQuY2xpZW50WCwgZXZlbnQuY2xpZW50WSk7XHJcblxyXG4gICAgICAgIGlmIChncmFwaGljICYmIGdyYXBoaWMub25DbGljaylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGdyYXBoaWMub25DbGljay5jYWxsKGdyYXBoaWMpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBtZS5sZW5ndGggPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGdyYXBoaWNzLmxlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICBtZS5hZGRHcmFwaGljID0gZnVuY3Rpb24oZ3JhcGhpYylcclxuICAgIHtcclxuICAgICAgICBncmFwaGljcy5wdXNoKGdyYXBoaWMpO1xyXG4gICAgICAgIGdyYXBoaWMuc2V0UmVuZGVyQ29udGV4dChjb250ZXh0KTtcclxuICAgIH1cclxuXHJcbiAgICBtZS5yZW1vdmVHcmFwaGljID0gZnVuY3Rpb24oZ3JhcGhpYylcclxuICAgIHtcclxuICAgICAgICBncmFwaGljLmNsZWFyKCk7XHJcblxyXG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBncmFwaGljcy5sZW5ndGg7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmIChncmFwaGljID09PSBncmFwaGljc1tpXSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZ3JhcGhpY3Muc3BsaWNlKGksMSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbWUucmVtb3ZlQWxsR3JhcGhpY3MgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGdyYXBoaWNzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZ3JhcGhpY3NbaV0uY2xlYXIoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdyYXBoaWNzID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgbWUuZ2V0R3JhcGhpY0F0ID0gZnVuY3Rpb24oaW5kZXgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGdyYXBoaWNzW2luZGV4XTtcclxuICAgIH1cclxuXHJcbiAgICBtZS5nZXRHcmFwaGljQXRQb2ludCA9IGZ1bmN0aW9uKHgsIHkpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IG51bGw7XHJcblxyXG4gICAgICAgIC8vIHRha2UgdGhlIHRvcG1vc3QgaXRlbSBvbiB0aGUgc2NyZWVuLlxyXG4gICAgICAgIC8vIGkuZSB0aGUgZmlyc3QgZ3JhcGhpYyBmcm9tIGJvdHRvbSBvZiB0aGVcclxuICAgICAgICAvLyBhcnJheSB0aGF0IGhhcyBwaXhlbCBhdCB0aGUgY29vcmRpbmF0ZXNcclxuICAgICAgICBmb3IodmFyIGkgPSBncmFwaGljcy5sZW5ndGgtMTsgaSA+PSAwOyBpLS0pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZihncmFwaGljc1tpXS5oYXNHbG9iYWxQaXhlbEF0KHgsIHkpKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBncmFwaGljc1tpXTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfVxyXG5cclxuICAgIG1lLnJlbmRlciA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICB2YXIgaTtcclxuXHJcbiAgICAgICAgZm9yKGkgPSAwOyBpIDwgZ3JhcGhpY3MubGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBncmFwaGljc1tpXS5jbGVhcigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yKGkgPSAwOyBpIDwgZ3JhcGhpY3MubGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBncmFwaGljc1tpXS5yZW5kZXIoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbWUudXBkYXRlID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBncmFwaGljcy5sZW5ndGg7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGdyYXBoaWNzW2ldLnVwZGF0ZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpbml0KCk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuIiwiXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBTaGFwZTtcclxuXHJcbmZ1bmN0aW9uIFNoYXBlIChvcHRpb25zKVxyXG57XHJcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgU2hhcGUpKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgU2hhcGUob3B0aW9ucyk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIG1lID0gdGhpcztcclxuICAgIHZhciByZW5kZXJDb250ZXh0O1xyXG5cclxuICAgIHZhciBUWVBFX0ZVTkNUSU9OID0gMDtcclxuICAgIHZhciBUWVBFX1NFVFRFUiA9IDE7XHJcblxyXG4gICAgbWUueCA9IDA7XHJcbiAgICBtZS55ID0gMDtcclxuXHJcbiAgICB2YXIgY2xlYXJSZWN0ID0ge307XHJcblxyXG4gICAgdmFyIHN0YWNrID0gW107XHJcblxyXG4gICAgZnVuY3Rpb24gaW5pdCgpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBtZS54ID0gb3B0aW9ucy54IHx8IDA7XHJcbiAgICAgICAgICAgIG1lLnkgPSBvcHRpb25zLnkgfHwgMDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbWUucmVuZGVyID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBzdGFja0l0ZW07XHJcblxyXG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBzdGFjay5sZW5ndGg7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHN0YWNrSXRlbSA9IHN0YWNrW2ldO1xyXG5cclxuICAgICAgICAgICAgaWYoc3RhY2tJdGVtLnR5cGUgPT09IFRZUEVfRlVOQ1RJT04pXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJlbmRlckNvbnRleHRbc3RhY2tJdGVtLm1lbWJlcl0uYXBwbHkocmVuZGVyQ29udGV4dCwgc3RhY2tJdGVtLmFyZ3VtZW50cyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoc3RhY2tJdGVtLnR5cGUgPT09IFRZUEVfU0VUVEVSKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZW5kZXJDb250ZXh0W3N0YWNrSXRlbS5tZW1iZXJdID0gc3RhY2tJdGVtLnZhbHVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBtZS5jbGVhciA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICB2YXIgbGVmdCA9IGNsZWFyUmVjdC5sZWZ0IC0gY2xlYXJSZWN0LnBhZGRpbmc7XHJcbiAgICAgICAgdmFyIHRvcCA9IGNsZWFyUmVjdC50b3AgLSBjbGVhclJlY3QucGFkZGluZztcclxuICAgICAgICB2YXIgcmlnaHQgPSBjbGVhclJlY3QucmlnaHQgKyBjbGVhclJlY3QucGFkZGluZztcclxuICAgICAgICB2YXIgYm90dG9tID0gY2xlYXJSZWN0LmJvdHRvbSArIGNsZWFyUmVjdC5wYWRkaW5nO1xyXG4gICAgICAgIHZhciB3aWR0aCA9IHJpZ2h0IC0gbGVmdDtcclxuICAgICAgICB2YXIgaGVpZ2h0ID0gYm90dG9tIC0gdG9wO1xyXG5cclxuICAgICAgICByZW5kZXJDb250ZXh0LmNsZWFyUmVjdChsZWZ0LCB0b3AsIHdpZHRoLCBoZWlnaHQpO1xyXG4gICAgfTtcclxuXHJcbiAgICBtZS5zZXRSZW5kZXJDb250ZXh0ID0gZnVuY3Rpb24oY29udGV4dClcclxuICAgIHtcclxuICAgICAgICByZW5kZXJDb250ZXh0ID0gY29udGV4dDtcclxuICAgIH07XHJcblxyXG4gICAgbWUuYmVnaW5QYXRoID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIHN0b3JlRnVuY3Rpb24oXCJiZWdpblBhdGhcIiwgYXJndW1lbnRzKTtcclxuICAgIH07XHJcblxyXG4gICAgbWUuY2xvc2VQYXRoID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIHN0b3JlRnVuY3Rpb24oXCJjbG9zZVBhdGhcIiwgYXJndW1lbnRzKTtcclxuICAgIH07XHJcblxyXG4gICAgbWUubW92ZVRvID0gZnVuY3Rpb24oeCwgeSlcclxuICAgIHtcclxuICAgICAgICB0cmFuc2xhdGVYWShhcmd1bWVudHMpO1xyXG4gICAgICAgIHNldERpbWVuc2lvbnNYWShhcmd1bWVudHMpO1xyXG4gICAgICAgIHN0b3JlRnVuY3Rpb24oXCJtb3ZlVG9cIiwgYXJndW1lbnRzKTtcclxuICAgIH07XHJcblxyXG4gICAgbWUubGluZVRvID0gZnVuY3Rpb24oeCwgeSlcclxuICAgIHtcclxuICAgICAgICB0cmFuc2xhdGVYWShhcmd1bWVudHMpO1xyXG4gICAgICAgIHNldERpbWVuc2lvbnNYWShhcmd1bWVudHMpO1xyXG4gICAgICAgIHN0b3JlRnVuY3Rpb24oXCJsaW5lVG9cIiwgYXJndW1lbnRzKTtcclxuICAgIH07XHJcblxyXG4gICAgbWUuZmlsbCA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICBzdG9yZUZ1bmN0aW9uKFwiZmlsbFwiLCBhcmd1bWVudHMpO1xyXG4gICAgfTtcclxuXHJcbiAgICBtZS5zdHJva2UgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgc3RvcmVGdW5jdGlvbihcInN0cm9rZVwiLCBhcmd1bWVudHMpO1xyXG4gICAgfTtcclxuXHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJmaWxsU3R5bGVcIiwge1xyXG4gICAgICAgIHNldDogZnVuY3Rpb24odmFsdWUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzdG9yZVByb3BlcnR5KFwiZmlsbFN0eWxlXCIsIHZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJzdHJva2VTdHlsZVwiLCB7XHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbih2YWx1ZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHN0b3JlUHJvcGVydHkoXCJzdHJva2VTdHlsZVwiLCB2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMsIFwibGluZUNhcFwiLCB7XHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbih2YWx1ZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHN0b3JlUHJvcGVydHkoXCJsaW5lQ2FwXCIsIHZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJsaW5lV2lkdGhcIiwge1xyXG4gICAgICAgIHNldDogZnVuY3Rpb24odmFsdWUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzdG9yZVByb3BlcnR5KFwibGluZVdpZHRoXCIsIHZhbHVlKTtcclxuICAgICAgICAgICAgc2V0RGltZW5zaW9uc1BhZGRpbmcodmFsdWUvMik7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgZnVuY3Rpb24gc3RvcmVGdW5jdGlvbihuYW1lLCBhcmdzKVxyXG4gICAge1xyXG4gICAgICAgIHN0YWNrLnB1c2goe21lbWJlcjogbmFtZSwgdHlwZTogVFlQRV9GVU5DVElPTiwgYXJndW1lbnRzOiBhcmdzfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gc3RvcmVQcm9wZXJ0eShuYW1lLCB2YWx1ZSlcclxuICAgIHtcclxuICAgICAgICBzdGFjay5wdXNoKHttZW1iZXI6IG5hbWUsIHR5cGU6IFRZUEVfU0VUVEVSLCB2YWx1ZTogdmFsdWV9KTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB0cmFuc2xhdGVYWShhcmdzKVxyXG4gICAge1xyXG4gICAgICAgIGFyZ3NbMF0gKz0gbWUueDtcclxuICAgICAgICBhcmdzWzFdICs9IG1lLnk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdHJhbnNsYXRlWFlYWShhcmdzKVxyXG4gICAge1xyXG4gICAgICAgIGFyZ3NbMF0gKz0gbWUueDtcclxuICAgICAgICBhcmdzWzFdICs9IG1lLnk7XHJcbiAgICAgICAgYXJnc1syXSArPSBtZS54O1xyXG4gICAgICAgIGFyZ3NbM10gKz0gbWUueTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBzZXREaW1lbnNpb25zUGFkZGluZyhwYWRkaW5nKVxyXG4gICAge1xyXG4gICAgICAgIGlmKHBhZGRpbmcgPiBjbGVhclJlY3QucGFkZGluZylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNsZWFyUmVjdC5wYWRkaW5nID0gTWF0aC5jZWlsKHBhZGRpbmcpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBzZXREaW1lbnNpb25zWFkoYXJncylcclxuICAgIHtcclxuICAgICAgICBpZihjbGVhclJlY3QuaGFzT3duUHJvcGVydHkoXCJsZWZ0XCIpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZXhwYW5kRGltZW5zaW9ucyhhcmdzWzBdLCBhcmdzWzFdKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc2V0SW5pdGlhbERpbWVuc2lvbnMoYXJnc1swXSwgYXJnc1sxXSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHNldEluaXRpYWxEaW1lbnNpb25zKHgsIHkpXHJcbiAgICB7XHJcbiAgICAgICAgY2xlYXJSZWN0LmxlZnQgPSB4O1xyXG4gICAgICAgIGNsZWFyUmVjdC5yaWdodCA9IHg7XHJcbiAgICAgICAgY2xlYXJSZWN0LnRvcCA9IHk7XHJcbiAgICAgICAgY2xlYXJSZWN0LmJvdHRvbSA9IHk7XHJcbiAgICAgICAgY2xlYXJSZWN0LnBhZGRpbmcgPSAwO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGV4cGFuZERpbWVuc2lvbnMoeCwgeSlcclxuICAgIHtcclxuICAgICAgICBpZih4IDwgY2xlYXJSZWN0LmxlZnQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjbGVhclJlY3QubGVmdCA9IHg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYoeCA+IGNsZWFyUmVjdC5yaWdodClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNsZWFyUmVjdC5yaWdodCA9IHgrMTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKHkgPCBjbGVhclJlY3QudG9wKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2xlYXJSZWN0LnRvcCA9IHk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYoeSA+IGNsZWFyUmVjdC5ib3R0b20pXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjbGVhclJlY3QuYm90dG9tID0geTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbWUuYm94ID0gZnVuY3Rpb24oeCwgeSwgd2lkdGgsIGhlaWdodClcclxuICAgIHtcclxuICAgICAgICBtZS5iZWdpblBhdGgoKTtcclxuICAgICAgICBtZS5tb3ZlVG8oeCwgeSk7XHJcbiAgICAgICAgbWUubGluZVRvKHdpZHRoICsgeCwgeSk7XHJcbiAgICAgICAgbWUubGluZVRvKHdpZHRoICsgeCwgaGVpZ2h0ICsgeSk7XHJcbiAgICAgICAgbWUubGluZVRvKHgsIGhlaWdodCArIHkpO1xyXG4gICAgICAgIG1lLmNsb3NlUGF0aCgpO1xyXG4gICAgfTtcclxuXHJcbiAgICBpbml0KCk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn0iLCJcclxuLy8gVGltZXIgY2xhc3MgaW1wbGVtZW50cyB0aGUgbWFpbiBsb29wIG9mIHRoZSBhcHBsaWNhdGlvbiBhbmQgdGhlIGNhbGxiYWNzIHRoYXQgaGFuZGxlXHJcbi8vIGFwcGxpY2F0aW9uIHByb2Nlc3NpbmcgaW4gbWFpbiBsb29wLlxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIFRpbWVyKG9wdGlvbnMpXHJcbntcclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICBpZihUaW1lci5wcm90b3R5cGUuc2luZ2xldG9uSW5zdGFuY2UpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIFRpbWVyLnByb3RvdHlwZS5zaW5nbGV0b25JbnN0YW5jZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgVGltZXIpKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgVGltZXIob3B0aW9ucyk7XHJcbiAgICB9XHJcblxyXG4gICAgVGltZXIucHJvdG90eXBlLnNpbmdsZXRvbkluc3RhbmNlID0gdGhpcztcclxuXHJcbiAgICB2YXIgbWUgPSB0aGlzO1xyXG5cclxuICAgIG1lLnJlbmRlckNhbGxiYWNrO1xyXG4gICAgbWUudXBkYXRlQ2FsbGJhY2s7XHJcbiAgICBtZS5tZWFzdXJlQ2FsbGJhY2s7XHJcblxyXG4gICAgLy8gRnJhbWUgcmF0ZVxyXG4gICAgdmFyIGZyYW1lUmF0ZSA9IDMwO1xyXG4gICAgbWUuZ2V0RnJhbWVyYXRlID0gZnVuY3Rpb24oKSB7IHJldHVybiBmcmFtZVJhdGU7IH1cclxuICAgIG1lLnNldEZyYW1lcmF0ZSA9IGZ1bmN0aW9uKHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIGZyYW1lUmF0ZSA9IHZhbHVlO1xyXG5cclxuICAgICAgICAvLyBvbmUgc2Vjb25kIC8gZnJhbWUgcmF0ZSA9IHRpbWUgb2YgYSBwZXJpb2RcclxuICAgICAgICBwZXJpb2QgPSBNYXRoLnJvdW5kKDEwMDAgLyBmcmFtZVJhdGUpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFRpbWUgaW4gbWlsbGlzZWNvbmRzIHdlIGhhdmUgdGltZSB0byBwZXJmb3JtIGFsbCBvcGVyYXRpb25zXHJcbiAgICB2YXIgcGVyaW9kO1xyXG4gICAgbWUuZ2V0UGVyaW9kID0gZnVuY3Rpb24oKSB7IHJldHVybiBwZXJpb2Q7IH1cclxuXHJcbiAgICAvLyBUaW1lIGJlZm9yZSB0aGUgb3BlcmF0aW9uc1xyXG4gICAgdmFyIGJlZm9yZVRpbWU7XHJcbiAgICBtZS5nZXRCZWZvcmVUaW1lID0gZnVuY3Rpb24oKSB7IHJldHVybiBiZWZvcmVUaW1lOyB9XHJcblxyXG4gICAgLy8gVGltZSBhZnRlciB0aGUgb3BlcmF0aW9uc1xyXG4gICAgdmFyIGFmdGVyVGltZTtcclxuICAgIG1lLmdldEFmdGVyVGltZSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gYWZ0ZXJUaW1lOyB9XHJcblxyXG4gICAgLy8gVGltZSB0aGF0IGVsYXBzZWQgZHVyaW5nIHRoZSBwcm9jZXNzaW5nIG9mIG9wZXJhdGlvbnNcclxuICAgIHZhciB0aW1lRGlmZjtcclxuICAgIG1lLmdldFRpbWVEaWZmID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aW1lRGlmZjsgfVxyXG5cclxuICAgIC8vIFNsZWVwIHRpbWUgaXMgdGhlIHRpbWUgbGVmdCBhZnRlciB0aGUgb3BlcmF0aW9uc1xyXG4gICAgdmFyIHNsZWVwVGltZTtcclxuICAgIG1lLmdldFNsZWVwVGltZSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gc2xlZXBUaW1lOyB9XHJcblxyXG4gICAgLy8gT3ZlciBzbGVlcCB0aW1lIGlzIHRoZSB0aW1lIGJldHdlZW4gdGhlIHRpbWVyIGV2ZW50cyB3aXRob3V0IHRoZSBkZWxheSBpdHNlbGYuXHJcbiAgICAvLyBUaGlzIGlzIG9ubHkgcGx1cyBtaW51cyBmZXcgbWlsbGlzZWNvbmRzLlxyXG4gICAgdmFyIG92ZXJTbGVlcFRpbWU7XHJcbiAgICBtZS5nZXRPdmVyU2xlZXBUaW1lID0gZnVuY3Rpb24oKSB7IHJldHVybiBvdmVyU2xlZXBUaW1lOyB9XHJcblxyXG4gICAgLy8gVGltZSBpbiBtaWxsaXNlY29uZHMgdGhlIGxvb3AgaXMgZGVsYXllZCBkdWUgdG8gdGhlIGhlYXZ5IHByb2Nlc3NpbmcuXHJcbiAgICAvLyBEcmF3aW5nIG9mIGZyYW1lcyBhcmUgc2tpcHBlZCBpZiB0aGlzIGlzIGdyZWF0ZXIgdGhhbiB0aGUgdGltZSBvZiBhIHBlcmlvZC5cclxuICAgIHZhciBleGNlc3M7XHJcbiAgICBtZS5nZXRFeGNlc3MgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGV4Y2VzczsgfVxyXG5cclxuICAgIHZhciBnYW1lVGltZXJJZDtcclxuXHJcbiAgICB2YXIgZHVtbXlGdW5jdGlvbiA9IGZ1bmN0aW9uKCkge307XHJcblxyXG4gICAgZnVuY3Rpb24gaW5pdCgpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKG9wdGlvbnMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBtZS5yZW5kZXJDYWxsYmFjayA9IG9wdGlvbnMucmVuZGVyQ2FsbGJhY2sgfHwgZHVtbXlGdW5jdGlvbjtcclxuICAgICAgICAgICAgbWUudXBkYXRlQ2FsbGJhY2sgPSBvcHRpb25zLnVwZGF0ZUNhbGxiYWNrIHx8IGR1bW15RnVuY3Rpb247XHJcbiAgICAgICAgICAgIG1lLm1lYXN1cmVDYWxsYmFjayA9IG9wdGlvbnMubWVhc3VyZUNhbGxiYWNrIHx8IGR1bW15RnVuY3Rpb247XHJcblxyXG4gICAgICAgICAgICBtZS5zZXRGcmFtZXJhdGUob3B0aW9ucy5mcmFtZVJhdGUgfHwgMzApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBtZS5yZW5kZXJDYWxsYmFjayA9IGR1bW15RnVuY3Rpb247XHJcbiAgICAgICAgICAgIG1lLnVwZGF0ZUNhbGxiYWNrID0gZHVtbXlGdW5jdGlvbjtcclxuICAgICAgICAgICAgbWUubWVhc3VyZUNhbGxiYWNrID0gZHVtbXlGdW5jdGlvbjtcclxuXHJcbiAgICAgICAgICAgIG1lLnNldEZyYW1lcmF0ZSgzMCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBiZWZvcmVUaW1lID0gMDtcclxuICAgICAgICBhZnRlclRpbWUgPSAwO1xyXG4gICAgICAgIHRpbWVEaWZmID0gMDtcclxuICAgICAgICBzbGVlcFRpbWUgPSAwO1xyXG4gICAgICAgIG92ZXJTbGVlcFRpbWUgPSAwO1xyXG4gICAgICAgIGV4Y2VzcyA9IDA7XHJcbiAgICB9XHJcblxyXG4gICAgbWUuc3RhcnQgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgYmVmb3JlVGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG4gICAgICAgIGFmdGVyVGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG4gICAgICAgIGdhbWVUaW1lcklkID0gc2V0VGltZW91dChydW4sIHBlcmlvZCk7XHJcbiAgICB9XHJcblxyXG4gICAgbWUuc3RvcCA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICBjbGVhclRpbWVvdXQoZ2FtZVRpbWVySWQpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvLyBNYWluIGxvb3Agb2YgdGhlIGdhbWUuXHJcbiAgICAvLyBHYW1lIGxvb3Agc3RhcnRzIHdpdGggdGhlIHN0YXJ0VGltZXIgY2FsbC4gSXQgaXMgY2FsbGVkIG9uY2VcclxuICAgIC8vIGFuZCBhZnRlcndhcmRzIHRoZSB0aW1lciBpcyBjYWxsZWQgaW5zaWRlIHRoZSBnYW1lIGxvb3AuXHJcbiAgICBmdW5jdGlvbiBydW4oZXZlbnQpXHJcbiAgICB7XHJcbiAgICAgICAgLy8gZ2V0IHN0YXJ0IHRpbWVcclxuICAgICAgICBiZWZvcmVUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcblxyXG4gICAgICAgIC8vIGdldCB0aGUgdGltZSB0aGF0IGVsYXBzZWQgZnJvbSB0aGUgcHJldmlvdXMgcnVuIGZ1bmN0aW9uIGNhbGwsXHJcbiAgICAgICAgLy8gbm90IGluY2x1ZGluZyB0aGUgZGVsYXkgaXRzZWxmLlxyXG4gICAgICAgIG92ZXJTbGVlcFRpbWUgPSAoYmVmb3JlVGltZSAtIGFmdGVyVGltZSkgLSBzbGVlcFRpbWU7XHJcblxyXG4gICAgICAgIG1lLnVwZGF0ZUNhbGxiYWNrKCk7XHJcbiAgICAgICAgbWUucmVuZGVyQ2FsbGJhY2soKTtcclxuXHJcbiAgICAgICAgLy8gZ2V0IGVuZCB0aW1lXHJcbiAgICAgICAgYWZ0ZXJUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcblxyXG4gICAgICAgIC8vIGdldCB0aW1lIGRpZmZlcmVuY2UgaS5lLiBlbGFwc2VkIHRpbWUuXHJcbiAgICAgICAgdGltZURpZmYgPSBhZnRlclRpbWUgLSBiZWZvcmVUaW1lO1xyXG5cclxuICAgICAgICAvLyBjYWxjdWxhdGUgbmV3IGRlbGF5XHJcbiAgICAgICAgLy8gb3ZlclNsZWVwVGltZSBpcyByZWR1Y2VkIHRvIGJhbGFuY2UgdGhlIHRpbWVyIGVycm9yIGZyb20gcHJldml1cyByb3VuZC5cclxuICAgICAgICBzbGVlcFRpbWUgPSAocGVyaW9kIC0gdGltZURpZmYpIC0gb3ZlclNsZWVwVGltZTtcclxuXHJcbiAgICAgICAgaWYoc2xlZXBUaW1lIDw9IDApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICAvLyBwcm9jZXNzaW5nIGEgZnJhbWUgdGFrZXMgbW9yZSB0aW1lIHRoYW4gdGhlIHRpbWUgb2YgYSBwZXJpb2RcclxuXHJcbiAgICAgICAgICAgIC8vIHN0b3JlIHRoZSBuZWdhdGl2ZSBzbGVlcCB0aW1lXHJcbiAgICAgICAgICAgIGV4Y2VzcyAtPSBzbGVlcFRpbWU7XHJcblxyXG4gICAgICAgICAgICAvLyBzZXQgYSBtaW5pbXVtIHNsZWVwIHRpbWVcclxuICAgICAgICAgICAgc2xlZXBUaW1lID0gMjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHNldCB0aGUgbmV3bHkgY2FsY3VsYXRlZCBkZWxheVxyXG4gICAgICAgIGdhbWVUaW1lcklkID0gc2V0VGltZW91dChydW4sIHNsZWVwVGltZSk7XHJcblxyXG4gICAgICAgIC8vIGNvbXBlbnNhdGUgdGhlIHByb2Nlc3NpbmdzIG9mIGFsbCBkZWxheWVkIHJ1biBjYWxsc1xyXG4gICAgICAgIC8vIGJ5IHVwZGF0aW5nIGV2ZXJ5dGhpbmcgZWxzZSBidXQgZHJhd2luZy5cclxuICAgICAgICB3aGlsZSAoZXhjZXNzID4gcGVyaW9kKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbWUudXBkYXRlQ2FsbGJhY2soKTtcclxuICAgICAgICAgICAgZXhjZXNzIC09IHBlcmlvZDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1lLm1lYXN1cmVDYWxsYmFjaygpO1xyXG4gICAgfVxyXG5cclxuICAgIGluaXQoKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxufVxyXG4iLCJcclxudmFyIFRyYW5zZm9ybUNhY2hlID0gcmVxdWlyZSgnLi90cmFuc2Zvcm1DYWNoZS5qcycpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUcmFuc2Zvcm07XHJcblxyXG5mdW5jdGlvbiBUcmFuc2Zvcm0oaW1hZ2VEYXRhT3JpZ2luYWwsIGNvbnRleHQpXHJcbntcclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgVHJhbnNmb3JtKSlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFRyYW5zZm9ybShpbWFnZURhdGEpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBtZSA9IHRoaXM7XHJcblxyXG4gICAgdmFyIGltYWdlRGF0YU1vZGlmaWVkID0gaW1hZ2VEYXRhT3JpZ2luYWw7XHJcblxyXG4gICAgdmFyIHBpeGVsQ2FjaGU7XHJcblxyXG4gICAgZnVuY3Rpb24gaW5pdCgpXHJcbiAgICB7XHJcbiAgICAgICAgcGl4ZWxDYWNoZSA9IG5ldyBUcmFuc2Zvcm1DYWNoZShpbWFnZURhdGFPcmlnaW5hbCwgNCk7XHJcbiAgICAgICAgLy8gbWUudXBkYXRlQ2FjaGUoKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIE11c3QgYmUgY2FsbGVkIHdoZW4gaW1hZ2UgZGF0YSBoYXMgYmVlbiBjaGFuZ2VkLlxyXG4gICAgICogQ2FsbGVkIGluaXRpYWxseVxyXG4gICAgICovXHJcbiAgICAvLyBtZS51cGRhdGVDYWNoZSA9IGZ1bmN0aW9uKClcclxuICAgIC8vIHtcclxuICAgIC8vICAgICBwaXhlbENhY2hlID0gW107XHJcblxyXG4gICAgLy8gICAgIHZhciB3aWR0aCA9IGltYWdlRGF0YU9yaWdpbmFsLndpZHRoO1xyXG4gICAgLy8gICAgIHZhciBoZWlnaHQgPSBpbWFnZURhdGFPcmlnaW5hbC5oZWlnaHQ7XHJcbiAgICAvLyAgICAgdmFyIGRhdGFMZW5ndGggPSB3aWR0aCAqIGhlaWdodDtcclxuICAgIC8vICAgICB2YXIgeDtcclxuICAgIC8vICAgICB2YXIgeTtcclxuXHJcbiAgICAvLyAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhTGVuZ3RoOyBpKyspXHJcbiAgICAvLyAgICAge1xyXG4gICAgLy8gICAgICAgICB4ID0gKGkgJSB3aWR0aCk7XHJcbiAgICAvLyAgICAgICAgIHkgPSBNYXRoLmZsb29yKGkgLyB3aWR0aCk7XHJcblxyXG4gICAgLy8gICAgICAgICBwaXhlbENhY2hlLnB1c2goe1xyXG4gICAgLy8gICAgICAgICAgICAgYXBwcm94aW1hdGU6IG1lLmlzQXBwcm94aW1hdGVkKHdpZHRoLCBoZWlnaHQsIHgsIHkpLFxyXG4gICAgLy8gICAgICAgICAgICAgeDogeCxcclxuICAgIC8vICAgICAgICAgICAgIHk6IHksXHJcbiAgICAvLyAgICAgICAgICAgICBpOiBpLFxyXG4gICAgLy8gICAgICAgICAgICAgdHg6IDAsIC8vIHRyYW5zbGF0ZWQgcG9zaXRpb25zLiBUaGVzZSBhcmUgZXZhbHVhdGVkXHJcbiAgICAvLyAgICAgICAgICAgICB0eTogMCAvLyBpbiBldmFsdWF0ZVBpeGVsIGZ1bmN0aW9uIGlmIG5lZWRlZFxyXG4gICAgLy8gICAgICAgICB9KTtcclxuICAgIC8vICAgICB9XHJcbiAgICAvLyB9O1xyXG5cclxuICAgIC8vIG1lLmdldEFwcHJveGltYXRlQ2FjaGVJbmRleDEgPSBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0LCB4LCB5LCBpbmRleClcclxuICAgIC8vIHtcclxuICAgIC8vICAgICAvLyBpZih4IClcclxuICAgIC8vIH07XHJcblxyXG4gICAgLy8gbWUuaXNBcHByb3hpbWF0ZWQgPSBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0LCB4LCB5KVxyXG4gICAgLy8ge1xyXG4gICAgLy8gICAgIC8vIHBvaW50cyBtYXJrZWQgd2l0aCB4IHdpbGwgYmUgY2FsY3VsYXRlZFxyXG4gICAgLy8gICAgIC8vIHBvaW50cyBtYXJrZWQgd2l0aCAtIHdpbGwgYmUgYXBwcm94aW1hdGVkXHJcbiAgICAvLyAgICAgLy8gbGFzdCBzaG91bGQgYmUgY2FsY3VsYXRlZCBvbiByaWdodCBhbmQgYm90dG9tXHJcbiAgICAvLyAgICAgLy8gICAwIDEgMiAzIDQgNVxyXG4gICAgLy8gICAgIC8vIDAgeCAtIHggLSB4IHhcclxuICAgIC8vICAgICAvLyAxIC0gLSAtIC0gLSB4XHJcbiAgICAvLyAgICAgLy8gMiB4IC0geCAtIHggeFxyXG4gICAgLy8gICAgIC8vIDMgLSAtIC0gLSAtIHhcclxuICAgIC8vICAgICAvLyA0IHggLSB4IC0geCB4XHJcbiAgICAvLyAgICAgLy8gNSB4IHggeCB4IHggeFxyXG5cclxuICAgIC8vICAgICByZXR1cm4gISAoXHJcbiAgICAvLyAgICAgICAgICh5ICUgNCA9PT0gMCAmJiB4ICUgNCA9PT0gMCkgfHxcclxuICAgIC8vICAgICAgICAgKHggPT09IHdpZHRoLTEgfHwgeSA9PT0gaGVpZ2h0LTEpXHJcbiAgICAvLyAgICAgKTtcclxuICAgIC8vIH07XHJcblxyXG4gICAgbWUuZ2V0SW1hZ2VEYXRhID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBpbWFnZURhdGFNb2RpZmllZDtcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBQZXJmb3JtIHRyYW5zZm9ybWF0aW9uIGJ5IHJlbWFuaXB1bGF0aW5nIG9yaWdpbmFsIGRhdGEuXHJcbiAgICAgKiBDYW4gYmUgdXNlZCB0byBhcHB5IG9ubHkgb25lIHRyYW5zZm9ybWF0aW9uLlxyXG4gICAgICovXHJcbiAgICBtZS5kbyA9IGZ1bmN0aW9uKGV2YWx1YXRlUGl4ZWwsIHBhcmFtZXRlcnMpXHJcbiAgICB7XHJcbiAgICAgICAgaW1hZ2VEYXRhTW9kaWZpZWQgPSB0cmFuc2Zvcm0oaW1hZ2VEYXRhTW9kaWZpZWQsIGV2YWx1YXRlUGl4ZWwsIHBhcmFtZXRlcnMpO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFBlcmZvcm0gdHJhbnNmb3JtYXRpb24gYnkgcmVtYW5pcHVsYXRpbmcgZGF0YS5cclxuICAgICAqIENhbiBiZSB1c2VkIHRvIHBlcmZvcm0gbXVsdGlwbGUgdHJhbnNmb3JtYXRpb25zLlxyXG4gICAgICogUmVzZXQgbXVzdCBiZSBjYWxsZWQgbWFudWFsbHkgYmVmb3JlIGV4ZWN1dGluZ1xyXG4gICAgICogbmV3IHRyYW5zZm9ybWF0aW9ucy5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gICAgICB7ZnVuY3Rpb259ICBldmFsdWF0ZVBpeGVsICBUaGUgZXZhbHVhdGUgcGl4ZWxcclxuICAgICAqIEBwYXJhbSAgICAgIHtvYmplY3R9ICBwYXJhbWV0ZXJzXHJcbiAgICAgKi9cclxuICAgIG1lLmRvT2xkID0gZnVuY3Rpb24oZXZhbHVhdGVQaXhlbCwgcGFyYW1ldGVycylcclxuICAgIHtcclxuICAgICAgICBpbWFnZURhdGFNb2RpZmllZCA9IHRyYW5zZm9ybTIoZXZhbHVhdGVQaXhlbCwgcGFyYW1ldGVycyk7XHJcbiAgICB9O1xyXG5cclxuICAgIG1lLnJlc2V0ID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIGltYWdlRGF0YU1vZGlmaWVkID0gaW1hZ2VEYXRhT3JpZ2luYWw7XHJcbiAgICB9O1xyXG5cclxuICAgIGZ1bmN0aW9uIHRyYW5zZm9ybShpbWFnZURhdGFTcmMsIGV2YWx1YXRlUGl4ZWwsIHBhcmFtZXRlcnMpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGJ1ZmZlclNyYyA9IGltYWdlRGF0YVNyYy5kYXRhLmJ1ZmZlcjtcclxuICAgICAgICB2YXIgYnVmZmVyRHN0ID0gbmV3IEFycmF5QnVmZmVyKGltYWdlRGF0YVNyYy5kYXRhLmxlbmd0aCk7XHJcblxyXG4gICAgICAgIHZhciB1aW50MzJTcmMgPSBuZXcgVWludDMyQXJyYXkoYnVmZmVyU3JjKTtcclxuICAgICAgICB2YXIgdWludDMyRHN0ID0gbmV3IFVpbnQzMkFycmF5KGJ1ZmZlckRzdCk7XHJcblxyXG4gICAgICAgIHZhciB1aW50OENTcmMgPSBuZXcgVWludDhDbGFtcGVkQXJyYXkoYnVmZmVyU3JjKTtcclxuICAgICAgICB2YXIgdWludDhDRHN0ID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KGJ1ZmZlckRzdCk7XHJcblxyXG4gICAgICAgIHZhciBpbWFnZURhdGFEc3QgPSBjb250ZXh0LmNyZWF0ZUltYWdlRGF0YShpbWFnZURhdGFTcmMpO1xyXG5cclxuICAgICAgICB2YXIgbGVuZ3RoID0gdWludDMyU3JjLmxlbmd0aDtcclxuICAgICAgICB2YXIgc3JjV2lkdGggPSBpbWFnZURhdGFTcmMud2lkdGg7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xyXG5cclxuICAgICAgICAvLyBjb25zb2xlLnRpbWUoXCJ0cmFuc2Zvcm0yXCIpO1xyXG4gICAgICAgIGZvciAodmFyIHNyY0luZGV4ID0gMDsgc3JjSW5kZXggPCBsZW5ndGg7IHNyY0luZGV4KyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBldmFsdWF0ZVBpeGVsKHNyY0luZGV4LCB1aW50MzJTcmMsIHVpbnQzMkRzdCwgcGFyYW1ldGVycywgcGl4ZWxDYWNoZS5kYXRhLCBzcmNXaWR0aCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIGNvbnNvbGUudGltZUVuZChcInRyYW5zZm9ybTJcIik7XHJcblxyXG4gICAgICAgIGltYWdlRGF0YURzdC5kYXRhLnNldCh1aW50OENEc3QpO1xyXG5cclxuICAgICAgICByZXR1cm4gaW1hZ2VEYXRhRHN0O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHRyYW5zZm9ybTIoZXZhbHVhdGVQaXhlbCwgdXNlclBhcmFtZXRlcnMpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGltYWdlRGF0YSA9IGltYWdlRGF0YU1vZGlmaWVkO1xyXG4gICAgICAgIHZhciBpbWFnZURhdGFOZXcgPSBjb250ZXh0LmNyZWF0ZUltYWdlRGF0YShpbWFnZURhdGEpO1xyXG5cclxuICAgICAgICB2YXIgaW1hZ2VEYXRhUGl4ZWxzID0gaW1hZ2VEYXRhLmRhdGE7XHJcbiAgICAgICAgdmFyIG5ld0ltYWdlRGF0YVBpeGVscyA9IGltYWdlRGF0YU5ldy5kYXRhO1xyXG5cclxuICAgICAgICB2YXIgcmVzdWx0ID0gW107XHJcbiAgICAgICAgdmFyIGxlbmd0aCA9IG5ld0ltYWdlRGF0YVBpeGVscy5sZW5ndGg7XHJcbiAgICAgICAgdmFyIHBhcmFtZXRlcnMgPSB7XHJcbiAgICAgICAgICAgIGltYWdlRGF0YTogaW1hZ2VEYXRhXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdXNlclBhcmFtZXRlcnMgPSB1c2VyUGFyYW1ldGVycyB8fCB7fTtcclxuXHJcbiAgICAgICAgZm9yKHZhciBwcm9wZXJ0eSBpbiB1c2VyUGFyYW1ldGVycylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHBhcmFtZXRlcnNbcHJvcGVydHldID0gdXNlclBhcmFtZXRlcnNbcHJvcGVydHldO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gNClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHBhcmFtZXRlcnMuciA9IGltYWdlRGF0YVBpeGVsc1tpXTtcclxuICAgICAgICAgICAgcGFyYW1ldGVycy5nID0gaW1hZ2VEYXRhUGl4ZWxzW2krMV07XHJcbiAgICAgICAgICAgIHBhcmFtZXRlcnMuYiA9IGltYWdlRGF0YVBpeGVsc1tpKzJdO1xyXG4gICAgICAgICAgICBwYXJhbWV0ZXJzLmEgPSBpbWFnZURhdGFQaXhlbHNbaSszXTtcclxuICAgICAgICAgICAgcGFyYW1ldGVycy54ID0gKGkgJSAoaW1hZ2VEYXRhLndpZHRoIDw8IDIpKSA+PiAyO1xyXG4gICAgICAgICAgICBwYXJhbWV0ZXJzLnkgPSBNYXRoLmZsb29yKGkgLyAoaW1hZ2VEYXRhLndpZHRoIDw8IDIpKTtcclxuXHJcbiAgICAgICAgICAgIHJlc3VsdCA9IGV2YWx1YXRlUGl4ZWwocGFyYW1ldGVycyk7XHJcblxyXG4gICAgICAgICAgICBuZXdJbWFnZURhdGFQaXhlbHNbaV0gICA9IHJlc3VsdFswXTsgLy8gUlxyXG4gICAgICAgICAgICBuZXdJbWFnZURhdGFQaXhlbHNbaSsxXSA9IHJlc3VsdFsxXTsgLy8gR1xyXG4gICAgICAgICAgICBuZXdJbWFnZURhdGFQaXhlbHNbaSsyXSA9IHJlc3VsdFsyXTsgLy8gQlxyXG4gICAgICAgICAgICBuZXdJbWFnZURhdGFQaXhlbHNbaSszXSA9IHJlc3VsdFszXTsgLy8gQVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGltYWdlRGF0YU5ldztcclxuICAgIH1cclxuXHJcbiAgICBpbml0KCk7XHJcbn1cclxuXHJcblRyYW5zZm9ybS5zYW1wbGVMaW5lYXIgPSBmdW5jdGlvbihpbWFnZURhdGEsIHgsIHkpXHJcbntcclxuICAgIHZhciBkYXRhID0gaW1hZ2VEYXRhLmRhdGE7XHJcbiAgICB2YXIgaW5kZXggPSB5ICogKGltYWdlRGF0YS53aWR0aCA8PCAyKSArICh4IDw8IDIpO1xyXG5cclxuICAgIHJldHVybiBbXHJcbiAgICAgICAgZGF0YVtpbmRleF0sXHJcbiAgICAgICAgZGF0YVtpbmRleCsxXSxcclxuICAgICAgICBkYXRhW2luZGV4KzJdLFxyXG4gICAgICAgIGRhdGFbaW5kZXgrM11cclxuICAgIF07XHJcbn07XHJcblxyXG5UcmFuc2Zvcm0uZGlzdGFuY2UgPSBmdW5jdGlvbih4MSwgeTEsIHgyLCB5Milcclxue1xyXG4gICAgdmFyIGRpc3RhbmNlWCA9IHgxLXgyO1xyXG4gICAgdmFyIGRpc3RhbmNlWSA9IHkxLXkyO1xyXG4gICAgcmV0dXJuIE1hdGguc3FydChkaXN0YW5jZVgqZGlzdGFuY2VYICsgZGlzdGFuY2VZKmRpc3RhbmNlWSk7XHJcbn07XHJcblxyXG5UcmFuc2Zvcm0uZGVncmVlc1RvUmFkaWFucyA9IGZ1bmN0aW9uKGRlZ3JlZSlcclxue1xyXG4gICAgcmV0dXJuIChkZWdyZWUvMTgwLjApKjMuMTQxNTkyNjU7XHJcbn07XHJcblxyXG5UcmFuc2Zvcm0uSW52ZXJ0ID0gZnVuY3Rpb24ocClcclxue1xyXG4gICAgcmV0dXJuIFsyNTUtcC5yLCAyNTUtcC5nLCAyNTUtcC5iLCBwLmFdO1xyXG59O1xyXG5cclxuVHJhbnNmb3JtLkdyYXlTY2FsZSA9IGZ1bmN0aW9uKHApXHJcbntcclxuICAgIHZhciBhdmVyYWdlID0gKHAuciArIHAuZyArIHAuYikgLzM7XHJcbiAgICByZXR1cm4gW2F2ZXJhZ2UsIGF2ZXJhZ2UsIGF2ZXJhZ2UsIHAuYV07XHJcbn07XHJcblxyXG5UcmFuc2Zvcm0uQWxwaGEgPSBmdW5jdGlvbihwKVxyXG57XHJcbiAgICByZXR1cm4gW3AuciwgcC5nLCBwLmIsIHAudmFsdWVdO1xyXG59O1xyXG5cclxuLy8gV2VpZ2h0ZWQgYWxwaGEgYmxlbmQgYmV0d2VlbiB0d28gaW1hZ2VzLlxyXG4vLyBVc2VkIGZvciBkcmF3aW5nIGltYWdlcyB3aXRoIGFscGhhIGNvbG9yc1xyXG4vLyBvbiB0b3Agb2Ygb3RoZXIgaW1hZ2VzXHJcblRyYW5zZm9ybS5XZWlnaHRlZEFscGhhQmxlbmQgPSBmdW5jdGlvbihwKVxyXG57XHJcbiAgICB2YXIgcDIgPSBUcmFuc2Zvcm0uc2FtcGxlTGluZWFyKHAuaW1hZ2VEYXRhMiwgcC54LCBwLnkpO1xyXG4gICAgdmFyIHAyYSA9IHAyWzNdO1xyXG4gICAgdmFyIHAyYVBjdCA9IHAyYSAvIDI1NTtcclxuXHJcbiAgICBpZihwMmEgPT09IDI1NSlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gW3AyWzBdLCBwMlsxXSwgcDJbMl0sIHAyWzNdXTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYocDJhID09PSAwKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBbcC5yLCBwLmcsIHAuYiwgcC5hXTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gW1xyXG4gICAgICAgIGdldEdldENvbG9yRnJvbUdyYWRpZW50KHAuciwgcDJbMF0sIHAyYVBjdCksXHJcbiAgICAgICAgZ2V0R2V0Q29sb3JGcm9tR3JhZGllbnQocC5nLCBwMlsxXSwgcDJhUGN0KSxcclxuICAgICAgICBnZXRHZXRDb2xvckZyb21HcmFkaWVudChwLmIsIHAyWzJdLCBwMmFQY3QpLFxyXG4gICAgICAgIHAuYSA+IHAyYSA/IHAuYSA6IHAyYVxyXG4gICAgXTtcclxufTtcclxuXHJcblRyYW5zZm9ybS5Sb3RhdGUgPSBmdW5jdGlvbihwKVxyXG57XHJcbiAgICB2YXIgZGVncmVlID0gcC5kZWdyZWU7XHJcblxyXG4gICAgdmFyIHJhZGlhbiA9IFRyYW5zZm9ybS5kZWdyZWVzVG9SYWRpYW5zKGRlZ3JlZSk7XHJcbiAgICB2YXIgdHggPSBNYXRoLnJvdW5kKHAueCpNYXRoLmNvcyhyYWRpYW4pIC0gcC55Kk1hdGguc2luKHJhZGlhbikpO1xyXG4gICAgdmFyIHR5ID0gTWF0aC5yb3VuZChwLngqTWF0aC5zaW4ocmFkaWFuKSArIHAueSpNYXRoLmNvcyhyYWRpYW4pKTtcclxuXHJcbiAgICByZXR1cm4gVHJhbnNmb3JtLnNhbXBsZUxpbmVhcihwLmltYWdlRGF0YSwgdHgsIHR5KTtcclxufTtcclxuXHJcblRyYW5zZm9ybS5Td2lybCA9IGZ1bmN0aW9uKHNyY0luZGV4LCBzcmMzMiwgZHN0MzIsIHAsIHBpeGVsQ2FjaGUsIHNyY1dpZHRoKVxyXG57XHJcbiAgICB2YXIgY2FjaGUgPSBwaXhlbENhY2hlW3NyY0luZGV4XTtcclxuXHJcbiAgICBpZihjYWNoZS5hcHByb3hpbWF0ZSlcclxuICAgIHtcclxuICAgICAgICBUcmFuc2Zvcm0uU3dpcmxBcHByb3hpbWF0aW9uKHNyY0luZGV4LCBzcmMzMiwgZHN0MzIsIHAsIHBpeGVsQ2FjaGUsIHNyY1dpZHRoKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIG9yaWdpblggPSBwLm9yaWdpblg7XHJcbiAgICB2YXIgb3JpZ2luWSA9IHAub3JpZ2luWTtcclxuICAgIHZhciByYWRpdXMgPSBwLnJhZGl1cztcclxuXHJcbiAgICAvLyB2YXIgZGlzdGFuY2UgPSBUcmFuc2Zvcm0uZGlzdGFuY2UoY2FjaGUueCwgY2FjaGUueSwgb3JpZ2luWCwgb3JpZ2luWSk7XHJcbiAgICB2YXIgZGlzdGFuY2VYID0gY2FjaGUueC1vcmlnaW5YO1xyXG4gICAgdmFyIGRpc3RhbmNlWSA9IGNhY2hlLnktb3JpZ2luWTtcclxuICAgIHZhciBkaXN0YW5jZSA9IE1hdGguc3FydChkaXN0YW5jZVgqZGlzdGFuY2VYICsgZGlzdGFuY2VZKmRpc3RhbmNlWSk7XHJcblxyXG4gICAgLy8gcmFkaWFuIGlzIHRoZSBncmVhdGVyIHRoZSBmYXJ0aGVyIHRoZSBwaXhlbCBpcyBmcm9tIG9yaWdpblxyXG4gICAgdmFyIHJhZGlhbiA9IHAuYW5nbGUgKiBkaXN0YW5jZTtcclxuICAgIC8vIHZhciB0eCA9IG9yaWdpblggKyBNYXRoLmNvcyhyYWRpYW4pKnJhZGl1cztcclxuICAgIC8vIHZhciB0eSA9IG9yaWdpblkgLSBNYXRoLnNpbihyYWRpYW4pKnJhZGl1cztcclxuICAgIHZhciB0eCA9IE1hdGguY29zKHJhZGlhbikqcmFkaXVzO1xyXG4gICAgdmFyIHR5ID0gTWF0aC5zaW4ocmFkaWFuKSpyYWRpdXM7XHJcblxyXG4gICAgLy8gdHggLT0gb3JpZ2luWDtcclxuICAgIC8vIHR5IC09IG9yaWdpblk7XHJcblxyXG4gICAgLy8gdHggPSBjYWNoZS54IC0gTWF0aC5yb3VuZCh0eCk7XHJcbiAgICAvLyB0eSA9IGNhY2hlLnkgLSBNYXRoLnJvdW5kKHR5KTtcclxuICAgIHR4ID0gKGNhY2hlLnggKyB0eCkgfCAwO1xyXG4gICAgdHkgPSAoY2FjaGUueSArIHR5KSB8IDA7XHJcblxyXG5cclxuICAgIGlmKHR4IDwgMCB8fCB0eSA8IDApIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gcmV0dXJuIFRyYW5zZm9ybS5zYW1wbGVMaW5lYXIocC5pbWFnZURhdGEsIHR4LCB0eSk7XHJcbiAgICBkc3QzMltzcmNJbmRleF0gPSBzcmMzMlt0eSAqIHNyY1dpZHRoICsgdHhdO1xyXG4gICAgY2FjaGUudHggPSB0eDtcclxuICAgIGNhY2hlLnR5ID0gdHk7XHJcbn07XHJcblxyXG5UcmFuc2Zvcm0uU3dpcmxBcHByb3hpbWF0aW9uID0gZnVuY3Rpb24oc3JjSW5kZXgsIHNyYzMyLCBkc3QzMiwgcCwgcGl4ZWxDYWNoZSwgc3JjV2lkdGgpXHJcbntcclxuXHJcbn07XHJcblxyXG5UcmFuc2Zvcm0uU3dpcmxPbGQgPSBmdW5jdGlvbihwKVxyXG57XHJcbiAgICB2YXIgb3JpZ2luWCA9IHAub3JpZ2luWDtcclxuICAgIHZhciBvcmlnaW5ZID0gcC5vcmlnaW5ZO1xyXG4gICAgdmFyIGRlZ3JlZSA9IHAuZGVncmVlO1xyXG4gICAgdmFyIHJhZGl1cyA9IHAucmFkaXVzO1xyXG5cclxuICAgIHZhciBkaXN0YW5jZSA9IFRyYW5zZm9ybS5kaXN0YW5jZShwLngsIHAueSwgb3JpZ2luWCwgb3JpZ2luWSk7XHJcblxyXG4gICAgLy8gcmFkaWFuIGlzIHRoZSBncmVhdGVyIHRoZSBmYXJ0aGVyIHRoZSBwaXhlbCBpcyBmcm9tIG9yaWdpblxyXG4gICAgdmFyIHJhZGlhbiA9IFRyYW5zZm9ybS5kZWdyZWVzVG9SYWRpYW5zKGRlZ3JlZSAqIGRpc3RhbmNlKTtcclxuICAgIHZhciB0eCA9IG9yaWdpblggKyBNYXRoLmNvcyhyYWRpYW4pKnJhZGl1cztcclxuICAgIHZhciB0eSA9IG9yaWdpblkgLSBNYXRoLnNpbihyYWRpYW4pKnJhZGl1cztcclxuXHJcbiAgICB0eCAtPSBvcmlnaW5YO1xyXG4gICAgdHkgLT0gb3JpZ2luWTtcclxuXHJcbiAgICB0eCA9IE1hdGgucm91bmQocC54IC0gdHgpO1xyXG4gICAgdHkgPSBNYXRoLnJvdW5kKHAueSAtIHR5KTtcclxuXHJcbiAgICByZXR1cm4gVHJhbnNmb3JtLnNhbXBsZUxpbmVhcihwLmltYWdlRGF0YSwgdHgsIHR5KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBHZXQgY29sb3IgdmFsdWUgYmV0d2VlbiB0d28gY29sb3IgY29tcG9uZW50IGF0IHRoZSBzcGVjaWZpZWQgcG9zaXRpb25cclxuICogQHBhcmFtIGNvbG9yQ29tcG9uZW50MSBjb2xvciBjb21wb25lbnQgZS5nLiByZWQgdmFsdWUgZnJvbSAwIHRvIDI1NVxyXG4gKiBAcGFyYW0gY29sb3JDb21wb25lbnQyIGNvbG9yIGNvbXBvbmVudCBlLmcuIHJlZCB2YWx1ZSBmcm9tIDAgdG8gMjU1XHJcbiAqIEBwYXJhbSBwb3NpdGlvbiBQb3NpdGlvbiBvZiB0aGUgY29sb3IgaW4gZ3JhZGllbnQuIE51bWJlciB2YWx1ZSBmcm9tIDAgdG8gMVxyXG4gKiBAcmV0dXJuIG51bWJlciBiZXR3ZWVuIDAgdG8gMjU1XHJcbiAqL1xyXG5mdW5jdGlvbiBnZXRHZXRDb2xvckZyb21HcmFkaWVudChjb2xvckNvbXBvbmVudDEsIGNvbG9yQ29tcG9uZW50MiwgcG9zaXRpb24pXHJcbntcclxuICAgIHJldHVybiBjb2xvckNvbXBvbmVudDEgLSBwb3NpdGlvbiAqIChjb2xvckNvbXBvbmVudDEgLSBjb2xvckNvbXBvbmVudDIpO1xyXG59XHJcblxyXG5UcmFuc2Zvcm0uZGVzY3JpcHRpb25zID0ge1xyXG4gICAgSW52ZXJ0OiB7XHJcbiAgICAgICAgYXJndW1lbnRzOiBbXVxyXG4gICAgfSxcclxuICAgIEdyYXlTY2FsZToge1xyXG4gICAgICAgIGFyZ3VtZW50czogW11cclxuICAgIH0sXHJcbiAgICBBbHBoYToge1xyXG4gICAgICAgIGFyZ3VtZW50czogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOlwidmFsdWVcIixcclxuICAgICAgICAgICAgICAgIG1pbjogMCxcclxuICAgICAgICAgICAgICAgIG1heDogMjU1LFxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogMjU1LFxyXG4gICAgICAgICAgICAgICAgdHlwZTogXCJudW1iZXJcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkNvbnRyb2wgdGhlIGFscGhhIGNoYW5uZWwgb2YgcGl4ZWxzLlwiXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdXHJcbiAgICB9LFxyXG4gICAgUm90YXRlOiB7XHJcbiAgICAgICAgYXJndW1lbnRzOiBbXVxyXG4gICAgfSxcclxuICAgIFN3aXJsOiB7XHJcbiAgICAgICAgYXJndW1lbnRzOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwib3JpZ2luWFwiLFxyXG4gICAgICAgICAgICAgICAgbWluOiBOdW1iZXIuTUlOX1ZBTFVFLFxyXG4gICAgICAgICAgICAgICAgbWF4OiBOdW1iZXIuTUFYX1ZBTFVFLFxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogMCxcclxuICAgICAgICAgICAgICAgIHR5cGU6IFwibnVtYmVyXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJDZW50ZXIgcG9zaXRpb24gb2YgdGhlIHRyYW5zZm9ybSBvbiBYIGF4aXMuXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJvcmlnaW5ZXCIsXHJcbiAgICAgICAgICAgICAgICBtaW46IE51bWJlci5NSU5fVkFMVUUsXHJcbiAgICAgICAgICAgICAgICBtYXg6IE51bWJlci5NQVhfVkFMVUUsXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiAwLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogXCJudW1iZXJcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkNlbnRlciBwb3NpdGlvbiBvZiB0aGUgdHJhbnNmb3JtIG9uIFkgYXhpcy5cIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImFuZ2xlXCIsXHJcbiAgICAgICAgICAgICAgICBtaW46IE51bWJlci5NSU5fVkFMVUUsXHJcbiAgICAgICAgICAgICAgICBtYXg6IE51bWJlci5NQVhfVkFMVUUsXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiAwLjAzNDksXHJcbiAgICAgICAgICAgICAgICB0eXBlOiBcIm51bWJlclwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQW5nbGUgb2YgdGhlIHR3aXN0IGluIHJhZGlhbnMuXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJyYWRpdXNcIixcclxuICAgICAgICAgICAgICAgIG1pbjogTnVtYmVyLk1JTl9WQUxVRSxcclxuICAgICAgICAgICAgICAgIG1heDogTnVtYmVyLk1BWF9WQUxVRSxcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IDIwLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogXCJudW1iZXJcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgXVxyXG4gICAgfVxyXG59O1xyXG4iLCJcclxubW9kdWxlLmV4cG9ydHMgPSBUcmFuc2Zvcm1DYWNoZTtcclxuXHJcbi8qKlxyXG4gKiBAY2xhc3MgICAgICBUcmFuc2Zvcm1DYWNoZVxyXG4gKlxyXG4gKiBAcGFyYW0ge29iamVjdH0gIGltYWdlRGF0YSAgSW1hZ2VEYXRhIHRvIGNhY2hlXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSAgW2xldmVsPTJdICBMZXZlbCBvZiBjYWNoaW5nXHJcbiAqL1xyXG5mdW5jdGlvbiBUcmFuc2Zvcm1DYWNoZShpbWFnZURhdGEsIGxldmVsKVxyXG57XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFRyYW5zZm9ybUNhY2hlKSlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFRyYW5zZm9ybUNhY2hlKGltYWdlRGF0YSk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIG1lID0gdGhpcztcclxuXHJcbiAgICB2YXIgZGF0YTtcclxuXHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJkYXRhXCIsIHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uKClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBkYXRhO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGZ1bmN0aW9uIGluaXQoKVxyXG4gICAge1xyXG4gICAgICAgIGxldmVsID0gbGV2ZWwgfHwgMjtcclxuICAgICAgICBsZXZlbCA9IGxldmVsIDwgMSA/IDEgOiBsZXZlbDtcclxuXHJcbiAgICAgICAgbWUuY3JlYXRlQ2FjaGUoKTtcclxuICAgIH1cclxuXHJcbiAgICBtZS5jcmVhdGVDYWNoZSA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICBkYXRhID0gW107XHJcblxyXG4gICAgICAgIHZhciB3aWR0aCA9IGltYWdlRGF0YS53aWR0aDtcclxuICAgICAgICB2YXIgaGVpZ2h0ID0gaW1hZ2VEYXRhLmhlaWdodDtcclxuICAgICAgICB2YXIgZGF0YUxlbmd0aCA9IHdpZHRoICogaGVpZ2h0O1xyXG4gICAgICAgIHZhciBsaW5lTGFzdEluZGV4O1xyXG4gICAgICAgIHZhciBjb2xMYXN0SW5kZXg7XHJcbiAgICAgICAgdmFyIHg7XHJcbiAgICAgICAgdmFyIHk7XHJcbiAgICAgICAgdmFyIHBpeGVsMTtcclxuICAgICAgICB2YXIgcGl4ZWwyO1xyXG4gICAgICAgIHZhciBhcHByb3hpbWF0ZWQ7XHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YUxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgeCA9IChpICUgd2lkdGgpO1xyXG4gICAgICAgICAgICB5ID0gTWF0aC5mbG9vcihpIC8gd2lkdGgpO1xyXG5cclxuICAgICAgICAgICAgYXBwcm94aW1hdGVkID0gbWUuaXNBcHByb3hpbWF0ZWQod2lkdGgsIGhlaWdodCwgeCwgeSk7XHJcbiAgICAgICAgICAgIGxpbmVMYXN0SW5kZXggPSB5ICogd2lkdGggKyB3aWR0aC0xO1xyXG4gICAgICAgICAgICBjb2xMYXN0SW5kZXggPSAoaGVpZ2h0LTEpICogd2lkdGggKyB4O1xyXG5cclxuICAgICAgICAgICAgaWYoeSAlIGxldmVsID09PSAwIHx8IHkgPT09IGhlaWdodC0xKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBwaXhlbDEgPSBpIC0gKHggJSBsZXZlbCk7XHJcbiAgICAgICAgICAgICAgICBwaXhlbDIgPSBpICsgKGxldmVsIC0gKHggJSBsZXZlbCkpO1xyXG4gICAgICAgICAgICAgICAgcGl4ZWwyID0gcGl4ZWwyID4gbGluZUxhc3RJbmRleCA/IGxpbmVMYXN0SW5kZXggOiBwaXhlbDI7XHJcbiAgICAgICAgICAgICAgICAvLyBtZXRvaG9kOiBwb2ludCBvbiBsaW5lIGNhbGN1bGF0aW9uXHJcbiAgICAgICAgICAgICAgICAvLyBhcmc6IHBvc2l0aW9uIGJldHdlZW4gdGhlIHR3byBwb2ludHMgMSB0aGlyZCBvciBzb21ldGhpbmdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmKHggJSBsZXZlbCA9PT0gMCB8fCB4ID09PSB3aWR0aC0xKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBwaXhlbDEgPSBpIC0gKHkgJSBsZXZlbCkgKiB3aWR0aDtcclxuICAgICAgICAgICAgICAgIHBpeGVsMiA9IGkgKyAobGV2ZWwgLSAoeSAlIGxldmVsKSkgKiB3aWR0aDtcclxuICAgICAgICAgICAgICAgIHBpeGVsMiA9IHBpeGVsMiA+IGNvbExhc3RJbmRleCA/IGNvbExhc3RJbmRleCA6IHBpeGVsMjtcclxuICAgICAgICAgICAgICAgIC8vIG1ldG9ob2Q6IHBvaW50IG9uIGxpbmUgY2FsY3VsYXRpb25cclxuICAgICAgICAgICAgICAgIC8vIGFyZzogcG9zaXRpb24gYmV0d2VlbiB0aGUgdHdvIHBvaW50cyAxIHRoaXJkIG9yIHNvbWV0aGluZ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcGl4ZWwxID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICAgICAgcGl4ZWwyID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICAgICAgLy8gYXBwcm94aW1hdGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIC8vIG1ldGhvZDogdGFrZSB4IGZyb20gcGl4ZWwxIGFuZCB5IGZyb20gcGl4ZWwyXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHgsIHksIHBpeGVsMSwgcGl4ZWwyLCBhcHByb3hpbWF0ZWQpO1xyXG5cclxuICAgICAgICAgICAgZGF0YS5wdXNoKHtcclxuICAgICAgICAgICAgICAgIGFwcHJveGltYXRlOiBhcHByb3hpbWF0ZWQsXHJcbiAgICAgICAgICAgICAgICBhaTE6IHBpeGVsMSxcclxuICAgICAgICAgICAgICAgIGFpMjogcGl4ZWwyLFxyXG4gICAgICAgICAgICAgICAgeDogeCxcclxuICAgICAgICAgICAgICAgIHk6IHksXHJcbiAgICAgICAgICAgICAgICBpOiBpLFxyXG4gICAgICAgICAgICAgICAgdHg6IDAsIC8vIHRyYW5zbGF0ZWQgcG9zaXRpb25zLiBUaGVzZSBhcmUgZXZhbHVhdGVkXHJcbiAgICAgICAgICAgICAgICB0eTogMCAvLyBpbiBldmFsdWF0ZVBpeGVsIGZ1bmN0aW9uIGlmIG5lZWRlZFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIG1lLmlzQXBwcm94aW1hdGVkID0gZnVuY3Rpb24od2lkdGgsIGhlaWdodCwgeCwgeSlcclxuICAgIHtcclxuICAgICAgICAvLyBwb2ludHMgbWFya2VkIHdpdGggeCB3aWxsIGJlIGNhbGN1bGF0ZWRcclxuICAgICAgICAvLyBwb2ludHMgbWFya2VkIHdpdGggLSB3aWxsIGJlIGFwcHJveGltYXRlZFxyXG4gICAgICAgIC8vIGxhc3Qgc2hvdWxkIGJlIGNhbGN1bGF0ZWQgb24gcmlnaHQgYW5kIGJvdHRvbVxyXG4gICAgICAgIC8vICAgMCAxIDIgMyA0IDVcclxuICAgICAgICAvLyAwIHggLSB4IC0geCB4XHJcbiAgICAgICAgLy8gMSAtIC0gLSAtIC0geFxyXG4gICAgICAgIC8vIDIgeCAtIHggLSB4IHhcclxuICAgICAgICAvLyAzIC0gLSAtIC0gLSB4XHJcbiAgICAgICAgLy8gNCB4IC0geCAtIHggeFxyXG4gICAgICAgIC8vIDUgeCB4IHggeCB4IHhcclxuXHJcbiAgICAgICAgcmV0dXJuICEgKFxyXG4gICAgICAgICAgICAoeSAlIGxldmVsID09PSAwICYmIHggJSBsZXZlbCA9PT0gMClcclxuICAgICAgICAgICAgfHxcclxuICAgICAgICAgICAgKHggPT09IHdpZHRoLTEgfHwgeSA9PT0gaGVpZ2h0LTEpXHJcbiAgICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICBpbml0KCk7XHJcblxyXG59Il19
