(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
window.ImageLoader = require('./imageLoader/imageLoader.js');
window.Layer = require('./layer.js');
window.Transform = require('./transform.js');
window.Graphic = require('./graphic.js');
window.Timer = require('./timer.js');
window.CanvasUtil = require('./canvasutil.js');
window.Shape = require('./shape.js');

},{"./canvasutil.js":2,"./graphic.js":3,"./imageLoader/imageLoader.js":4,"./layer.js":8,"./shape.js":9,"./timer.js":10,"./transform.js":11}],2:[function(require,module,exports){

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

},{}],3:[function(require,module,exports){

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

},{"./transform.js":11}],4:[function(require,module,exports){

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

},{"./imageLoaderItem":5,"./queue":6,"./thread":7}],5:[function(require,module,exports){

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

},{}],6:[function(require,module,exports){
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

},{"./imageLoaderItem":5}],7:[function(require,module,exports){

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

},{}],8:[function(require,module,exports){

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
        for(var i = 0; i < graphics.length; i++)
        {
            graphics[i].clear();
        }

        for(var i = 0; i < graphics.length; i++)
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
    var imageCache;

    function init()
    {
        me.updateCache();
    }

    /**
     * Must be called when image data has been changed.
     * Called initially
     */
    me.updateCache = function()
    {
        pixelCache = [];

        var uint8COriginal = imageDataOriginal.data;

        var width = imageDataOriginal.width;
        var height = imageDataOriginal.height;
        var dataLength = width * height;

        imageCache = {
            width: width,
            numberOfPixels: dataLength
        }

        for (var i = 0; i < dataLength; i++)
        {
            // cache pitch should be 4, same as the number of components in color (rgba)

            // cache pixel position
            pixelCache.push({
                x: (i % width),
                y: Math.floor(i / width),
                // r: uint8COriginal[i],
                // g: uint8COriginal[i+1],
                // b: uint8COriginal[i+2],
                // a: uint8COriginal[i+3],
                i: i
            });
        }
    };

    me.getImageData = function()
    {
        return imageDataModified;
    };

    /**
     * Perform transformation by remanipulating original data.
     * Can be used to appy only one transformation.
     */
    me.do = function(evaluatePixel, factor)
    {
        imageDataModified = transform(imageDataModified, evaluatePixel, factor);
    };

    /**
     * Perform transformation by remanipulating data.
     * Can be used to perform multiple transformations.
     * Reset must be called manually before executing
     * new transformations.
     *
     * @param      {<type>}  evaluatePixel  The evaluate pixel
     * @param      {<type>}  factor         The factor
     */
    me.doOld = function(evaluatePixel, factor)
    {
        imageDataModified = transform2(evaluatePixel, factor);
    }

    me.reset = function()
    {
        imageDataModified = imageDataOriginal;
    };

    function transform(imageDataSrc, evaluatePixel, userParameters)
    {
        // var bufferSrc = new ArrayBuffer(imageDataSrc.data.length);
        var bufferSrc = imageDataSrc.data.buffer;
        var bufferDst = new ArrayBuffer(imageDataSrc.data.length);

        var uint32Src = new Uint32Array(bufferSrc);
        var uint32Dst = new Uint32Array(bufferDst);

        var uint8CSrc = new Uint8ClampedArray(bufferSrc);
        var uint8CDst = new Uint8ClampedArray(bufferDst);

        var imageDataDst = context.createImageData(imageDataSrc);

        // var uint8cData = imageDataSrc.data;
        // var uint8cDataNew = imageDataNew.data;

        var result = [];
        var length = imageCache.numberOfPixels;
        var parameters = {};

        userParameters = userParameters || {};

        for(var property in userParameters)
        {
            parameters[property] = userParameters[property];
        }

        // console.time("transform2");
        for (var i = 0; i < length; i++)
        {
            evaluatePixel(uint32Src, uint32Dst, parameters, pixelCache[i], imageCache);
        }
        // console.timeEnd("transform2");

        imageDataDst.data.set(uint8CDst);

        return imageDataDst;
    };

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
    };

    init();
}

function avg(sum, numberOfSamples)
{
    return sum / numberOfSamples;
}

function sum(values)
{
    var total = 0;

    for(var i = 0; i < values.length; i++)
    {
        total += values[i];
    }

    return total;
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
}

Transform.degreesToRadians = function(degree)
{
    return (degree/180.0)*3.14159265;
}

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
}

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
}

Transform.Rotate = function(p)
{
    var degree = p.degree;

    var radian = Transform.degreesToRadians(degree);
    var tx = Math.round(p.x*Math.cos(radian) - p.y*Math.sin(radian));
    var ty = Math.round(p.x*Math.sin(radian) + p.y*Math.cos(radian));

    return Transform.sampleLinear(p.imageData, tx, ty);
}

Transform.Swirl = function(src32, dst32, p, pixelCache, imageCache)
{
    var originX = p.originX;
    var originY = p.originY;
    var radius = p.radius;

    // var distance = Transform.distance(pixelCache.x, pixelCache.y, originX, originY);
    var distanceX = pixelCache.x-originX;
    var distanceY = pixelCache.y-originY;
    var distance = Math.sqrt(distanceX*distanceX + distanceY*distanceY);

    // radian is the greater the farther the pixel is from origin
    var radian = p.angle * distance;
    var tx = originX + Math.cos(radian)*radius;
    var ty = originY - Math.sin(radian)*radius;

    tx -= originX;
    ty -= originY;

    // tx = pixelCache.x - Math.round(tx);
    // ty = pixelCache.y - Math.round(ty);
    tx = (pixelCache.x - tx) | 0;
    ty = (pixelCache.y - ty) | 0;

    if(tx < 0 || ty < 0) {
        return;
    }

    // return Transform.sampleLinear(p.imageData, tx, ty);
    var srcIndex = ty * imageCache.width + tx;
    var dstIndex = pixelCache.i;

    dst32[dstIndex]   = src32[srcIndex];
}

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
}

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

},{}]},{},[1]);
