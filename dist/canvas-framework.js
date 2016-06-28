(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define(function () {
			return (root.SMath = factory());
		});
	} else if (typeof module === 'object' && module.exports) {
		module.exports = factory();
	} else {
		root.SMath = factory();
	}
}(this, function () {
	var PI2 = Math.PI * 2;

	SMath.DEFAULT_PARAMS = {resolution: 360};

	/**
	 * SMath constructor
	 * @param {Object} params - passed to the constructor
	 * @param {number} [params.resolution] - # of cached values for any function. Is overriden by optional specific values
	 * @param {number} [params.nbSin] - # of cached values for SMath#sin (defaults to the resolution)
	 * @param {number} [params.nbCos] - # of cached values for SMath#cos (defaults to the resolution)
	 * @param {number} [params.nbAtan] - # of caches values for SMath#atan (defaults to the resolution)
	 * @param {number} [params.minAtan] - Minimal value for the caching of atan (default: -20) - If asking a lower value, will return the lowest known
	 * @param {number} [params.maxAtan] - Maximal value for the caching of atan (default: 20) - If asking ahigher value, will return the highest known
	 */
	function SMath (params) {
		this.params = SMath._assign(null, SMath.DEFAULT_PARAMS, params);
		SMath._setDefaultValues(this.params);

		this.cosTable = new Float32Array(this.params.nbCos);
		this.cosFactor = this.params.nbCos / PI2;
		SMath._fillCache(this.cosTable, this.cosFactor, Math.cos);

		this.sinTable = new Float32Array(this.params.nbSin);
		this.sinFactor = this.params.nbSin / PI2;
		SMath._fillCache(this.sinTable, this.sinFactor, Math.sin);

		this.atanTable = new Float32Array(this.params.nbAtan);
		this.atanFactor = this.params.nbAtan / (this.params.maxAtan - this.params.minAtan)
		SMath._fillAtanCache(this.atanTable, this.atanFactor, this.params.minAtan);
	};

	SMath.prototype.cos = function (angle) {
		angle %= PI2;
		if (angle < 0) angle += PI2;
		return this.cosTable[(angle * this.cosFactor) | 0];
	};
	SMath.prototype.sin = function (angle) {
		angle %= PI2;
		if (angle < 0) angle += PI2;
		return this.sinTable[(angle * this.sinFactor) | 0];
	};

	SMath.prototype.atan = function (tan) {
		var index = ((tan - this.params.minAtan) * this.atanFactor) | 0;
		if (index < 0) {
			return - Math.PI / 2;
		} else if (index >= this.params.nbAtan) {
			return Math.PI / 2;
		}
		return this.atanTable[index];
	};

	SMath._setDefaultValues = function (params) {
		var functionNames = ["nbSin", "nbCos", "nbAtan"];
		for (var i = functionNames.length - 1; i >= 0; i--) {
			var key = functionNames[i];
			params[key] = params[key] || params.resolution;
		}
		params.minAtan = params.minAtan || -40;
		params.maxAtan = params.maxAtan || 40;
	};

	SMath._fillAtanCache = function (array, factor, min) {
		
		for (var i = 0; i < array.length; i++) {
			var tan = min + i / factor;
			array[i] = Math.atan(tan);
		}
	};

	SMath._fillCache = function (array, factor, mathFunction) {
		var length = array.length;
		for (var i = 0; i < length; i++) {
			array[i] = mathFunction(i / factor);
		}
	};

	SMath._assign = function (dst, src1, src2, etc) {
		return [].reduce.call(arguments, function (dst, src) {
			src = src || {};
			for (var k in src) {
				if (src.hasOwnProperty(k)) {
					dst[k] = src[k];
				}
			}
			return dst;
		}, dst || {});
	};

	return SMath;
}));

},{}],2:[function(require,module,exports){

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

},{"./transform.js":12}],4:[function(require,module,exports){

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
window.ImageLoader = require('./imageLoader/imageLoader.js');
window.Layer = require('./layer.js');
window.Transform = require('./transform.js');
window.TransformOriginal = require('./transformOriginal.js');
window.Graphic = require('./graphic.js');
window.Timer = require('./timer.js');
window.CanvasUtil = require('./canvasutil.js');
window.Shape = require('./shape.js');

},{"./canvasutil.js":2,"./graphic.js":3,"./imageLoader/imageLoader.js":4,"./layer.js":9,"./shape.js":10,"./timer.js":11,"./transform.js":12,"./transformOriginal.js":14}],9:[function(require,module,exports){

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

},{}],10:[function(require,module,exports){

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
},{}],11:[function(require,module,exports){

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

},{}],12:[function(require,module,exports){
var SMath = require("smath");
var TransformCacheBasic = require('./transformCacheBasic.js');

var sMath = new SMath({resolution:1200});

function Transform(imageDataOriginal, context)
{
    'use strict';

    if (!(this instanceof Transform))
    {
        return new Transform(imageData);
    }

    var me = this;
    var imageDataModified;
    var cacheInstance;

    function init()
    {
        imageDataModified = imageDataOriginal;
    }

    me.getImageData = function()
    {
        return imageDataModified;
    };

    /**
     * Perform transformation by remanipulating original data.
     * Can be used to appy only one transformation.
     */
    me.do = function(transformFn, parameters, customCache)
    {
        imageDataModified = transform(imageDataModified, transformFn, parameters, customCache);
    };

    me.reset = function()
    {
        imageDataModified = imageDataOriginal;
    };

    function getCache(transformFn, customCache)
    {
        if(!cacheInstance && !customCache)
        {
            cacheInstance = new transformFn.cache(imageDataOriginal);
        }
        else if(customCache)
        {
            cacheInstance = customCache;
        }

        return cacheInstance;
    }

    function transform(imageDataSrc, transformFn, parameters, customCache)
    {
        var cache = getCache(transformFn, customCache);

        var bufferSrc = imageDataSrc.data.buffer;
        var bufferDst = new ArrayBuffer(imageDataSrc.data.length);

        var uint32Src = new Uint32Array(bufferSrc);
        var uint32Dst = new Uint32Array(bufferDst);

        var uint8CSrc = new Uint8ClampedArray(bufferSrc);
        var uint8CDst = new Uint8ClampedArray(bufferDst);

        var imageDataDst = context.createImageData(imageDataSrc);

        var length = uint32Src.length;
        var width = imageDataSrc.width;
        var cacheData = cache.data;
        var result = [];

        // console.time("-2");

        for(var i = 0; i < length; i++)
        {
            transformFn(i, uint32Src, uint32Dst, parameters, width, cacheData);
        }

        // console.timeEnd("-2");

        imageDataDst.data.set(uint8CDst);

        return imageDataDst;
    }

    init();
}

Transform.Swirl = function(srcIndex, src32, dst32, p, width, cache)
{
    var pixelCache = cache[srcIndex];
    var originX = p.originX;
    var originY = p.originY;
    var radius = p.radius;

    var distanceX = pixelCache.x-originX;
    var distanceY = pixelCache.y-originY;
    var distance = Math.sqrt(distanceX*distanceX + distanceY*distanceY);

    var radian = p.angle * distance;

    var tx = (pixelCache.x + sMath.cos(radian) * radius) | 0;
    var ty = (pixelCache.y + sMath.sin(radian) * radius) | 0;

    if(tx < 0 || tx > width-1) {
        return;
    }

    dst32[srcIndex] = src32[ty * width + tx];
};

Transform.Swirl.cache = TransformCacheBasic;


Transform.descriptions = {
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

module.exports = Transform;
},{"./transformCacheBasic.js":13,"smath":1}],13:[function(require,module,exports){

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
},{}],14:[function(require,module,exports){

module.exports = TransformOriginal;

function TransformOriginal(imageDataOriginal, context)
{
    'use strict';

    if (!(this instanceof TransformOriginal))
    {
        return new TransformOriginal(imageData);
    }

    var me = this;
    var imageDataModified;

    function init()
    {
        imageDataModified = imageDataOriginal;
    }

    me.getImageData = function()
    {
        return imageDataModified;
    };

    /**
     * Perform transformation by remanipulating data.
     * Can be used to perform multiple transformations.
     * Reset must be called manually before executing
     * new transformations.
     *
     * @param      {function}  transformFn  The evaluate pixel
     * @param      {object}  parameters
     */
    me.do = function(transformFn, parameters)
    {
        imageDataModified = transform(transformFn, parameters);
    };

    me.reset = function()
    {
        imageDataModified = imageDataOriginal;
    };

    function transform(transformFn, userParameters)
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

            result = transformFn(parameters);

            newImageDataPixels[i]   = result[0]; // R
            newImageDataPixels[i+1] = result[1]; // G
            newImageDataPixels[i+2] = result[2]; // B
            newImageDataPixels[i+3] = result[3]; // A
        }

        return imageDataNew;
    }

    init();
}

TransformOriginal.sampleLinear = function(imageData, x, y)
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

TransformOriginal.distance = function(x1, y1, x2, y2)
{
    var distanceX = x1-x2;
    var distanceY = y1-y2;
    return Math.sqrt(distanceX*distanceX + distanceY*distanceY);
};

TransformOriginal.degreesToRadians = function(degree)
{
    return (degree/180.0)*3.14159265;
};

TransformOriginal.Invert = function(p)
{
    return [255-p.r, 255-p.g, 255-p.b, p.a];
};

TransformOriginal.GrayScale = function(p)
{
    var average = (p.r + p.g + p.b) /3;
    return [average, average, average, p.a];
};

TransformOriginal.Alpha = function(p)
{
    return [p.r, p.g, p.b, p.value];
};

// Weighted alpha blend between two images.
// Used for drawing images with alpha colors
// on top of other images
TransformOriginal.WeightedAlphaBlend = function(p)
{
    var p2 = TransformOriginal.sampleLinear(p.imageData2, p.x, p.y);
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

TransformOriginal.Rotate = function(p)
{
    var degree = p.degree;

    var radian = TransformOriginal.degreesToRadians(degree);
    var tx = Math.round(p.x*Math.cos(radian) - p.y*Math.sin(radian));
    var ty = Math.round(p.x*Math.sin(radian) + p.y*Math.cos(radian));

    return TransformOriginal.sampleLinear(p.imageData, tx, ty);
};

TransformOriginal.Swirl = function(p)
{
    var originX = p.originX;
    var originY = p.originY;
    var degree = p.degree;
    var radius = p.radius;

    var distance = TransformOriginal.distance(p.x, p.y, originX, originY);

    // radian is the greater the farther the pixel is from origin
    var radian = TransformOriginal.degreesToRadians(degree * distance);
    var tx = originX + Math.cos(radian)*radius;
    var ty = originY - Math.sin(radian)*radius;

    tx -= originX;
    ty -= originY;

    tx = Math.round(p.x - tx);
    ty = Math.round(p.y - ty);

    return TransformOriginal.sampleLinear(p.imageData, tx, ty);
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

TransformOriginal.descriptions = {
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

},{}]},{},[8])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvc21hdGgvc3JjL1NNYXRoLmpzIiwic3JjL2NhbnZhc3V0aWwuanMiLCJzcmMvZ3JhcGhpYy5qcyIsInNyYy9pbWFnZUxvYWRlci9pbWFnZUxvYWRlci5qcyIsInNyYy9pbWFnZUxvYWRlci9pbWFnZUxvYWRlckl0ZW0uanMiLCJzcmMvaW1hZ2VMb2FkZXIvcXVldWUuanMiLCJzcmMvaW1hZ2VMb2FkZXIvdGhyZWFkLmpzIiwic3JjL2luZGV4LmpzIiwic3JjL2xheWVyLmpzIiwic3JjL3NoYXBlLmpzIiwic3JjL3RpbWVyLmpzIiwic3JjL3RyYW5zZm9ybS5qcyIsInNyYy90cmFuc2Zvcm1DYWNoZUJhc2ljLmpzIiwic3JjL3RyYW5zZm9ybU9yaWdpbmFsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIoZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcblx0aWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuXHRcdGRlZmluZShmdW5jdGlvbiAoKSB7XG5cdFx0XHRyZXR1cm4gKHJvb3QuU01hdGggPSBmYWN0b3J5KCkpO1xuXHRcdH0pO1xuXHR9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKSB7XG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdH0gZWxzZSB7XG5cdFx0cm9vdC5TTWF0aCA9IGZhY3RvcnkoKTtcblx0fVxufSh0aGlzLCBmdW5jdGlvbiAoKSB7XG5cdHZhciBQSTIgPSBNYXRoLlBJICogMjtcblxuXHRTTWF0aC5ERUZBVUxUX1BBUkFNUyA9IHtyZXNvbHV0aW9uOiAzNjB9O1xuXG5cdC8qKlxuXHQgKiBTTWF0aCBjb25zdHJ1Y3RvclxuXHQgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zIC0gcGFzc2VkIHRvIHRoZSBjb25zdHJ1Y3RvclxuXHQgKiBAcGFyYW0ge251bWJlcn0gW3BhcmFtcy5yZXNvbHV0aW9uXSAtICMgb2YgY2FjaGVkIHZhbHVlcyBmb3IgYW55IGZ1bmN0aW9uLiBJcyBvdmVycmlkZW4gYnkgb3B0aW9uYWwgc3BlY2lmaWMgdmFsdWVzXG5cdCAqIEBwYXJhbSB7bnVtYmVyfSBbcGFyYW1zLm5iU2luXSAtICMgb2YgY2FjaGVkIHZhbHVlcyBmb3IgU01hdGgjc2luIChkZWZhdWx0cyB0byB0aGUgcmVzb2x1dGlvbilcblx0ICogQHBhcmFtIHtudW1iZXJ9IFtwYXJhbXMubmJDb3NdIC0gIyBvZiBjYWNoZWQgdmFsdWVzIGZvciBTTWF0aCNjb3MgKGRlZmF1bHRzIHRvIHRoZSByZXNvbHV0aW9uKVxuXHQgKiBAcGFyYW0ge251bWJlcn0gW3BhcmFtcy5uYkF0YW5dIC0gIyBvZiBjYWNoZXMgdmFsdWVzIGZvciBTTWF0aCNhdGFuIChkZWZhdWx0cyB0byB0aGUgcmVzb2x1dGlvbilcblx0ICogQHBhcmFtIHtudW1iZXJ9IFtwYXJhbXMubWluQXRhbl0gLSBNaW5pbWFsIHZhbHVlIGZvciB0aGUgY2FjaGluZyBvZiBhdGFuIChkZWZhdWx0OiAtMjApIC0gSWYgYXNraW5nIGEgbG93ZXIgdmFsdWUsIHdpbGwgcmV0dXJuIHRoZSBsb3dlc3Qga25vd25cblx0ICogQHBhcmFtIHtudW1iZXJ9IFtwYXJhbXMubWF4QXRhbl0gLSBNYXhpbWFsIHZhbHVlIGZvciB0aGUgY2FjaGluZyBvZiBhdGFuIChkZWZhdWx0OiAyMCkgLSBJZiBhc2tpbmcgYWhpZ2hlciB2YWx1ZSwgd2lsbCByZXR1cm4gdGhlIGhpZ2hlc3Qga25vd25cblx0ICovXG5cdGZ1bmN0aW9uIFNNYXRoIChwYXJhbXMpIHtcblx0XHR0aGlzLnBhcmFtcyA9IFNNYXRoLl9hc3NpZ24obnVsbCwgU01hdGguREVGQVVMVF9QQVJBTVMsIHBhcmFtcyk7XG5cdFx0U01hdGguX3NldERlZmF1bHRWYWx1ZXModGhpcy5wYXJhbXMpO1xuXG5cdFx0dGhpcy5jb3NUYWJsZSA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5wYXJhbXMubmJDb3MpO1xuXHRcdHRoaXMuY29zRmFjdG9yID0gdGhpcy5wYXJhbXMubmJDb3MgLyBQSTI7XG5cdFx0U01hdGguX2ZpbGxDYWNoZSh0aGlzLmNvc1RhYmxlLCB0aGlzLmNvc0ZhY3RvciwgTWF0aC5jb3MpO1xuXG5cdFx0dGhpcy5zaW5UYWJsZSA9IG5ldyBGbG9hdDMyQXJyYXkodGhpcy5wYXJhbXMubmJTaW4pO1xuXHRcdHRoaXMuc2luRmFjdG9yID0gdGhpcy5wYXJhbXMubmJTaW4gLyBQSTI7XG5cdFx0U01hdGguX2ZpbGxDYWNoZSh0aGlzLnNpblRhYmxlLCB0aGlzLnNpbkZhY3RvciwgTWF0aC5zaW4pO1xuXG5cdFx0dGhpcy5hdGFuVGFibGUgPSBuZXcgRmxvYXQzMkFycmF5KHRoaXMucGFyYW1zLm5iQXRhbik7XG5cdFx0dGhpcy5hdGFuRmFjdG9yID0gdGhpcy5wYXJhbXMubmJBdGFuIC8gKHRoaXMucGFyYW1zLm1heEF0YW4gLSB0aGlzLnBhcmFtcy5taW5BdGFuKVxuXHRcdFNNYXRoLl9maWxsQXRhbkNhY2hlKHRoaXMuYXRhblRhYmxlLCB0aGlzLmF0YW5GYWN0b3IsIHRoaXMucGFyYW1zLm1pbkF0YW4pO1xuXHR9O1xuXG5cdFNNYXRoLnByb3RvdHlwZS5jb3MgPSBmdW5jdGlvbiAoYW5nbGUpIHtcblx0XHRhbmdsZSAlPSBQSTI7XG5cdFx0aWYgKGFuZ2xlIDwgMCkgYW5nbGUgKz0gUEkyO1xuXHRcdHJldHVybiB0aGlzLmNvc1RhYmxlWyhhbmdsZSAqIHRoaXMuY29zRmFjdG9yKSB8IDBdO1xuXHR9O1xuXHRTTWF0aC5wcm90b3R5cGUuc2luID0gZnVuY3Rpb24gKGFuZ2xlKSB7XG5cdFx0YW5nbGUgJT0gUEkyO1xuXHRcdGlmIChhbmdsZSA8IDApIGFuZ2xlICs9IFBJMjtcblx0XHRyZXR1cm4gdGhpcy5zaW5UYWJsZVsoYW5nbGUgKiB0aGlzLnNpbkZhY3RvcikgfCAwXTtcblx0fTtcblxuXHRTTWF0aC5wcm90b3R5cGUuYXRhbiA9IGZ1bmN0aW9uICh0YW4pIHtcblx0XHR2YXIgaW5kZXggPSAoKHRhbiAtIHRoaXMucGFyYW1zLm1pbkF0YW4pICogdGhpcy5hdGFuRmFjdG9yKSB8IDA7XG5cdFx0aWYgKGluZGV4IDwgMCkge1xuXHRcdFx0cmV0dXJuIC0gTWF0aC5QSSAvIDI7XG5cdFx0fSBlbHNlIGlmIChpbmRleCA+PSB0aGlzLnBhcmFtcy5uYkF0YW4pIHtcblx0XHRcdHJldHVybiBNYXRoLlBJIC8gMjtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMuYXRhblRhYmxlW2luZGV4XTtcblx0fTtcblxuXHRTTWF0aC5fc2V0RGVmYXVsdFZhbHVlcyA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcblx0XHR2YXIgZnVuY3Rpb25OYW1lcyA9IFtcIm5iU2luXCIsIFwibmJDb3NcIiwgXCJuYkF0YW5cIl07XG5cdFx0Zm9yICh2YXIgaSA9IGZ1bmN0aW9uTmFtZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcblx0XHRcdHZhciBrZXkgPSBmdW5jdGlvbk5hbWVzW2ldO1xuXHRcdFx0cGFyYW1zW2tleV0gPSBwYXJhbXNba2V5XSB8fCBwYXJhbXMucmVzb2x1dGlvbjtcblx0XHR9XG5cdFx0cGFyYW1zLm1pbkF0YW4gPSBwYXJhbXMubWluQXRhbiB8fMKgLTQwO1xuXHRcdHBhcmFtcy5tYXhBdGFuID0gcGFyYW1zLm1heEF0YW4gfHwgNDA7XG5cdH07XG5cblx0U01hdGguX2ZpbGxBdGFuQ2FjaGUgPSBmdW5jdGlvbiAoYXJyYXksIGZhY3RvciwgbWluKSB7XG5cdFx0XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIHRhbiA9IG1pbiArIGkgLyBmYWN0b3I7XG5cdFx0XHRhcnJheVtpXSA9IE1hdGguYXRhbih0YW4pO1xuXHRcdH1cblx0fTtcblxuXHRTTWF0aC5fZmlsbENhY2hlID0gZnVuY3Rpb24gKGFycmF5LCBmYWN0b3IsIG1hdGhGdW5jdGlvbikge1xuXHRcdHZhciBsZW5ndGggPSBhcnJheS5sZW5ndGg7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuXHRcdFx0YXJyYXlbaV0gPSBtYXRoRnVuY3Rpb24oaSAvIGZhY3Rvcik7XG5cdFx0fVxuXHR9O1xuXG5cdFNNYXRoLl9hc3NpZ24gPSBmdW5jdGlvbiAoZHN0LCBzcmMxLCBzcmMyLCBldGMpIHtcblx0XHRyZXR1cm4gW10ucmVkdWNlLmNhbGwoYXJndW1lbnRzLCBmdW5jdGlvbiAoZHN0LCBzcmMpIHtcblx0XHRcdHNyYyA9IHNyYyB8fCB7fTtcblx0XHRcdGZvciAodmFyIGsgaW4gc3JjKSB7XG5cdFx0XHRcdGlmIChzcmMuaGFzT3duUHJvcGVydHkoaykpIHtcblx0XHRcdFx0XHRkc3Rba10gPSBzcmNba107XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHJldHVybiBkc3Q7XG5cdFx0fSwgZHN0IHx8IHt9KTtcblx0fTtcblxuXHRyZXR1cm4gU01hdGg7XG59KSk7XG4iLCJcclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgQ2FudmFzVXRpbCgpO1xyXG5cclxuZnVuY3Rpb24gQ2FudmFzVXRpbCgpXHJcbntcclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICBpZihDYW52YXNVdGlsLnByb3RvdHlwZS5zaW5nbGV0b25JbnN0YW5jZSlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gQ2FudmFzVXRpbC5wcm90b3R5cGUuc2luZ2xldG9uSW5zdGFuY2U7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIENhbnZhc1V0aWwpKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgQ2FudmFzVXRpbCgpO1xyXG4gICAgfVxyXG5cclxuICAgIENhbnZhc1V0aWwucHJvdG90eXBlLnNpbmdsZXRvbkluc3RhbmNlID0gdGhpcztcclxuXHJcbiAgICB2YXIgbWUgPSB0aGlzO1xyXG5cclxuICAgIHZhciBjYW52YXM7XHJcbiAgICB2YXIgY29udGV4dDtcclxuXHJcbiAgICBmdW5jdGlvbiBpbml0KClcclxuICAgIHtcclxuICAgICAgICBtZS5yZXNldFRlbXBDYW52YXMoKTtcclxuICAgIH1cclxuXHJcbiAgICBtZS5yZXNldFRlbXBDYW52YXMgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImNhbnZhc1wiKTtcclxuICAgICAgICBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBtZS5nZXRJbWFnZURhdGFGcm9tVGFnID0gZnVuY3Rpb24oaW1hZ2VUYWcpXHJcbiAgICB7XHJcbiAgICAgICAgdXBkYXRlQ2FudmFzU2l6ZShpbWFnZVRhZyk7XHJcbiAgICAgICAgY2xlYXJDYW52YXMoaW1hZ2VUYWcpO1xyXG4gICAgICAgIGRyYXdJbWFnZVRhZyhpbWFnZVRhZyk7XHJcbiAgICAgICAgcmV0dXJuIGdldEltYWdlRGF0YShpbWFnZVRhZyk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdXBkYXRlQ2FudmFzU2l6ZShpbWFnZVRhZylcclxuICAgIHtcclxuICAgICAgICBpZiAoY2FudmFzLndpZHRoIDwgaW1hZ2VUYWcud2lkdGgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjYW52YXMud2lkdGggPSBpbWFnZVRhZy53aWR0aDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKGNhbnZhcy5oZWlnaHQgPCBpbWFnZVRhZy5oZWlnaHQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gaW1hZ2VUYWcuaGVpZ2h0O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBjbGVhckNhbnZhcyhpbWFnZVRhZylcclxuICAgIHtcclxuICAgICAgICBjb250ZXh0LmNsZWFyUmVjdCgwLCAwLCBpbWFnZVRhZy53aWR0aCwgaW1hZ2VUYWcuaGVpZ2h0KTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBkcmF3SW1hZ2VUYWcoaW1hZ2VUYWcpXHJcbiAgICB7XHJcbiAgICAgICAgY29udGV4dC5kcmF3SW1hZ2UoaW1hZ2VUYWcsIDAsIDApO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGdldEltYWdlRGF0YShpbWFnZVRhZylcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gY29udGV4dC5nZXRJbWFnZURhdGEoMCwgMCwgaW1hZ2VUYWcud2lkdGgsIGltYWdlVGFnLmhlaWdodCk7XHJcbiAgICB9XHJcblxyXG4gICAgaW5pdCgpO1xyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcbiIsIlxyXG52YXIgVHJhbnNmb3JtID0gcmVxdWlyZSgnLi90cmFuc2Zvcm0uanMnKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gR3JhcGhpYyhvcHRpb25zKVxyXG57XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEdyYXBoaWMpKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBuZXcgR3JhcGhpYyhvcHRpb25zKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgbWUgPSB0aGlzO1xyXG4gICAgdmFyIHJlbmRlckNvbnRleHQ7XHJcblxyXG4gICAgdmFyIF9pbWFnZURhdGE7XHJcbiAgICB2YXIgaW1hZ2VEYXRhOENsYW1wZWRWaWV3O1xyXG4gICAgdmFyIGltYWdlRGF0YTMyVmlldztcclxuXHJcbiAgICB2YXIgcmVuZGVyZWRYO1xyXG4gICAgdmFyIHJlbmRlcmVkWTtcclxuXHJcbiAgICB2YXIgZHVtbXlGdW5jdGlvbiA9IGZ1bmN0aW9uKCkge31cclxuXHJcbiAgICBtZS54ID0gMDtcclxuICAgIG1lLnkgPSAwO1xyXG5cclxuICAgIG1lLm9uUm9sbE92ZXIgPSBudWxsO1xyXG4gICAgbWUub25Sb2xsT3V0ID0gbnVsbDtcclxuICAgIG1lLm9uQ2xpY2sgPSBudWxsO1xyXG5cclxuICAgIHZhciB1cGRhdGUgPSBkdW1teUZ1bmN0aW9uO1xyXG5cclxuICAgIGZ1bmN0aW9uIGluaXQoKVxyXG4gICAge1xyXG4gICAgICAgIGlmIChvcHRpb25zKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuaW1hZ2VEYXRhKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBtZS5zZXRJbWFnZURhdGEob3B0aW9ucy5pbWFnZURhdGEpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBtZS54ID0gb3B0aW9ucy54IHx8IDA7XHJcbiAgICAgICAgICAgIG1lLnkgPSBvcHRpb25zLnkgfHwgMDtcclxuXHJcbiAgICAgICAgICAgIG1lLm9uUm9sbE92ZXIgPSBvcHRpb25zLm9uUm9sbE92ZXI7XHJcbiAgICAgICAgICAgIG1lLm9uUm9sbE91dCA9IG9wdGlvbnMub25Sb2xsT3V0O1xyXG4gICAgICAgICAgICBtZS5vbkNsaWNrID0gb3B0aW9ucy5vbkNsaWNrO1xyXG5cclxuICAgICAgICAgICAgdXBkYXRlID0gb3B0aW9ucy51cGRhdGUgfHwgZHVtbXlGdW5jdGlvbjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbWUuZ2V0SW1hZ2VEYXRhID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBfaW1hZ2VEYXRhO1xyXG4gICAgfVxyXG5cclxuICAgIG1lLnNldEltYWdlRGF0YSA9IGZ1bmN0aW9uKGltYWdlRGF0YSlcclxuICAgIHtcclxuICAgICAgICBfaW1hZ2VEYXRhID0gaW1hZ2VEYXRhO1xyXG4gICAgICAgIGltYWdlRGF0YThDbGFtcGVkVmlldyA9IF9pbWFnZURhdGEuZGF0YTtcclxuICAgICAgICBpbWFnZURhdGEzMlZpZXcgPSBuZXcgVWludDMyQXJyYXkoaW1hZ2VEYXRhOENsYW1wZWRWaWV3LmJ1ZmZlcik7XHJcbiAgICB9XHJcblxyXG4gICAgbWUuc2V0UmVuZGVyQ29udGV4dCA9IGZ1bmN0aW9uKGNvbnRleHQpXHJcbiAgICB7XHJcbiAgICAgICAgcmVuZGVyQ29udGV4dCA9IGNvbnRleHQ7XHJcbiAgICB9O1xyXG5cclxuICAgIG1lLnJlbmRlciA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICBzYXZlUmVuZGVyZWRQb3NpdGlvbigpO1xyXG5cclxuICAgICAgICAvLyB2YXIgZXhpc3RpbmdJbWFnZURhdGEgPSByZW5kZXJDb250ZXh0LmdldEltYWdlRGF0YShtZS54LCBtZS55LCBfaW1hZ2VEYXRhLndpZHRoLCBfaW1hZ2VEYXRhLmhlaWdodCk7XHJcbiAgICAgICAgLy8gdmFyIHRyYW5zZm9ybSA9IG5ldyBUcmFuc2Zvcm0oZXhpc3RpbmdJbWFnZURhdGEsIHJlbmRlckNvbnRleHQpO1xyXG5cclxuICAgICAgICAvLyB0cmFuc2Zvcm0uZG8oVHJhbnNmb3JtLldlaWdodGVkQWxwaGFCbGVuZCwge2ltYWdlRGF0YTI6X2ltYWdlRGF0YX0pO1xyXG4gICAgICAgIC8vIHJlbmRlckNvbnRleHQucHV0SW1hZ2VEYXRhKHRyYW5zZm9ybS5nZXRJbWFnZURhdGEoKSwgbWUueCwgbWUueSk7XHJcbiAgICAgICAgcmVuZGVyQ29udGV4dC5wdXRJbWFnZURhdGEoX2ltYWdlRGF0YSwgbWUueCwgbWUueSk7XHJcbiAgICB9XHJcblxyXG4gICAgbWUuY2xlYXIgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgcmVuZGVyQ29udGV4dC5jbGVhclJlY3QocmVuZGVyZWRYLTEsIHJlbmRlcmVkWS0xLCBfaW1hZ2VEYXRhLndpZHRoKzEsIF9pbWFnZURhdGEuaGVpZ2h0KzEpO1xyXG4gICAgfVxyXG5cclxuICAgIG1lLnVwZGF0ZSA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICB1cGRhdGUuY2FsbCh0aGlzKTtcclxuICAgIH1cclxuXHJcbiAgICBtZS5nbG9iYWxUb0xvY2FsID0gZnVuY3Rpb24oeCwgeSlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB4OiB4IC0gbWUueCxcclxuICAgICAgICAgICAgeTogeSAtIG1lLnlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbWUubG9jYWxUb0dsb2JhbCA9IGZ1bmN0aW9uKHgsIHkpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgeDogbWUueCArIHgsXHJcbiAgICAgICAgICAgIHk6IG1lLnkgKyB5XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG1lLmhhc0dsb2JhbFBpeGVsQXQgPSBmdW5jdGlvbih4LCB5KVxyXG4gICAge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKGlzR2xvYmFsUG9zaXRpb25XaXRoaW5Cb3VuZGFyaWVzKHgsIHkpKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIGRpc3RhbmNlRnJvbUxlZnQgPSB4IC0gbWUueDtcclxuICAgICAgICAgICAgdmFyIGRpc3RhbmNlRnJvbVRvcCA9IHkgLSBtZS55O1xyXG4gICAgICAgICAgICB2YXIgcGl4ZWwzMiA9IGdldFBpeGVsMzJBdChkaXN0YW5jZUZyb21MZWZ0LCBkaXN0YW5jZUZyb21Ub3ApO1xyXG5cclxuICAgICAgICAgICAgaWYgKHBpeGVsMzIgIT09IDApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaXNHbG9iYWxQb3NpdGlvbldpdGhpbkJvdW5kYXJpZXMoeCwgeSlcclxuICAgIHtcclxuICAgICAgICAvL3ZhciBkaXN0YW5jZUZyb21MZWZ0ID0geCAtIG1lLng7XHJcbiAgICAgICAgLy92YXIgZGlzdGFuY2VGcm9tVG9wID0geSAtIG1lLnk7XHJcbiAgICAgICAgLy92YXIgZGlzdGFuY2VGcm9tUmlnaHQgPSB4IC0gKG1lLnggKyBfaW1hZ2VEYXRhLndpZHRoKTtcclxuICAgICAgICAvL3ZhciBkaXN0YW5jZUZyb21Cb3R0b20gPSB5IC0gKG1lLnkgKyBfaW1hZ2VEYXRhLmhlaWdodCk7XHJcbiAgICAgICAgLy9yZXR1cm4gKGRpc3RhbmNlRnJvbUxlZnQgPj0gMCAmJiBkaXN0YW5jZUZyb21SaWdodCA8PSAwXHJcbiAgICAgICAgLy8gICAgJiYgZGlzdGFuY2VGcm9tVG9wID49IDAgJiYgZGlzdGFuY2VGcm9tQm90dG9tIDw9IDApO1xyXG5cclxuICAgICAgICAvLyB0aGUgYmVsb3cgc3RhdGVtZW50IGltcGxlbWVudHMgdGhlIHNhbWUgZnVuY3Rpb25hbGl0eSBhcyBhYm92ZVxyXG4gICAgICAgIHJldHVybiAoKHggLSBtZS54KSA+PSAwXHJcbiAgICAgICAgICAgICAgICAmJiAoeSAtIG1lLnkpID49IDBcclxuICAgICAgICAgICAgICAgICYmICh4IC0gKG1lLnggKyBfaW1hZ2VEYXRhLndpZHRoKSkgPD0gMFxyXG4gICAgICAgICAgICAgICAgJiYgKHkgLSAobWUueSArIF9pbWFnZURhdGEuaGVpZ2h0KSkgPD0gMCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gc2F2ZVJlbmRlcmVkUG9zaXRpb24oKVxyXG4gICAge1xyXG4gICAgICAgIHJlbmRlcmVkWCA9IG1lLng7XHJcbiAgICAgICAgcmVuZGVyZWRZID0gbWUueTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXRQaXhlbDMyQXQoeCwgeSlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gaW1hZ2VEYXRhMzJWaWV3W3kgKiBfaW1hZ2VEYXRhLndpZHRoICsgeF07XHJcbiAgICB9XHJcblxyXG4gICAgaW5pdCgpO1xyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcbiIsIlxyXG52YXIgUXVldWUgPSByZXF1aXJlKCcuL3F1ZXVlJyk7XHJcbnZhciBUaHJlYWQgPSByZXF1aXJlKCcuL3RocmVhZCcpO1xyXG52YXIgSW1hZ2VMb2FkZXJJdGVtID0gcmVxdWlyZSgnLi9pbWFnZUxvYWRlckl0ZW0nKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gSW1hZ2VMb2FkZXI7XHJcblxyXG5mdW5jdGlvbiBJbWFnZUxvYWRlcihvcHRpb25zKVxyXG57XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEltYWdlTG9hZGVyKSlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IEltYWdlTG9hZGVyKG9wdGlvbnMpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBtZSA9IHRoaXM7XHJcbiAgICB2YXIgYXV0b2xvYWQ7XHJcbiAgICB2YXIgcXVldWU7XHJcbiAgICB2YXIgbnVtYmVyT2ZUaHJlYWRzO1xyXG4gICAgdmFyIG9uQ29tcGxldGVDYWxsYmFjaztcclxuICAgIHZhciBvbkZpbGVDb21wbGV0ZUNhbGxiYWNrO1xyXG4gICAgdmFyIG9uRmlsZVN0YXJ0Q2FsbGJhY2s7XHJcbiAgICB2YXIgaXNMb2FkaW5nO1xyXG5cclxuICAgIGluaXQob3B0aW9ucyk7XHJcblxyXG4gICAgbWUubG9hZCA9IGxvYWQ7XHJcbiAgICBtZS5pc0NvbXBsZXRlID0gaXNDb21wbGV0ZTtcclxuICAgIG1lLmdldFBlcmNlbnRMb2FkZWQgPSBnZXRQZXJjZW50TG9hZGVkO1xyXG4gICAgbWUuZ2V0SXRlbUF0ID0gZ2V0SXRlbUF0O1xyXG4gICAgbWUubGVuZ3RoID0gbGVuZ3RoO1xyXG5cclxuICAgIGZ1bmN0aW9uIGluaXQob3B0aW9ucylcclxuICAgIHtcclxuICAgICAgICBhcHBseU9wdGlvbnMob3B0aW9ucyk7XHJcblxyXG4gICAgICAgIGlzTG9hZGluZyA9IGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAoYXV0b2xvYWQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBsb2FkKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGFwcGx5T3B0aW9ucyhvcHRpb25zKVxyXG4gICAge1xyXG4gICAgICAgIGlmICghb3B0aW9ucyB8fCB0eXBlb2Ygb3B0aW9ucyAhPT0gXCJvYmplY3RcIilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk9wdGlvbnMgc2hvdWxkIGJlIGFuIE9iamVjdFwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHF1ZXVlID0gbmV3IFF1ZXVlKGdldEltYWdlcygpKTtcclxuICAgICAgICBvbkNvbXBsZXRlQ2FsbGJhY2sgPSBnZXRPbkNvbXBsZXRlKCk7XHJcbiAgICAgICAgb25GaWxlQ29tcGxldGVDYWxsYmFjayA9IGdldE9uRmlsZUNvbXBsZXRlKCk7XHJcbiAgICAgICAgb25GaWxlU3RhcnRDYWxsYmFjayA9IGdldE9uRmlsZVN0YXJ0KCk7XHJcbiAgICAgICAgYXV0b2xvYWQgPSBnZXRBdXRvbG9hZCgpO1xyXG4gICAgICAgIG51bWJlck9mVGhyZWFkcyA9IGdldE51bWJlck9mVGhyZWFkcygpO1xyXG5cclxuICAgICAgICB2YXIgZGVsYXlNaW4gPSBnZXRTaW11bGF0aW9uRGVsYXlNaW4oKTtcclxuICAgICAgICB2YXIgZGVsYXlNYXggPSBnZXRTaW11bGF0aW9uRGVsYXlNYXgoKTtcclxuXHJcbiAgICAgICAgSW1hZ2VMb2FkZXJJdGVtLnNldFNpbXVsYXRpb25EZWxheXMoZGVsYXlNaW4sIGRlbGF5TWF4KTtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0SW1hZ2VzKClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmICghb3B0aW9ucy5pbWFnZXMgfHwgIShvcHRpb25zLmltYWdlcyBpbnN0YW5jZW9mIEFycmF5KSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3B0aW9ucyBvYmplY3Qgc2hvdWxkIGhhdmUgJ2ltYWdlcycgcHJvcGVydHkgKHR5cGUgb2YgYXJyYXkpIGNvbnRhaW5pbmcgcGF0aHMgdG8gdGhlIGxvYWRlZCBpbWFnZXMuXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgb3B0aW9ucy5pbWFnZXMubGVuZ3RoOyBpKyspXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlmKCFvcHRpb25zLmltYWdlc1tpXSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPYmplY3RzIGluICdpbWFnZXMnIGNhbm5vdCBiZSBudWxsIG9yIHVuZGVmaW5lZFwiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG9wdGlvbnMuaW1hZ2VzW2ldICE9PSBcInN0cmluZ1wiICYmICFvcHRpb25zLmltYWdlc1tpXS5oYXNPd25Qcm9wZXJ0eShcInNyY1wiKSlcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPYmplY3RzIGluICdpbWFnZXMnIHByb3BlcnR5IHNob3VsZCBoYXZlIHNyYyBwcm9wZXJ0eVwiKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMuaW1hZ2VzLnNsaWNlKDApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0T25Db21wbGV0ZSgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5vbkNvbXBsZXRlICYmIHR5cGVvZiBvcHRpb25zLm9uQ29tcGxldGUgIT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiJ29uQ29tcGxldGUnIHByb3BlcnR5IHNob3VsZCBiZSBhIGZ1bmN0aW9uXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZ2V0VmFsdWUob3B0aW9ucy5vbkNvbXBsZXRlLCB1bmRlZmluZWQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0T25GaWxlQ29tcGxldGUoKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMub25GaWxlQ29tcGxldGUgJiYgdHlwZW9mIG9wdGlvbnMub25GaWxlQ29tcGxldGUgIT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiJ29uRmlsZUNvbXBsZXRlJyBwcm9wZXJ0eSBzaG91bGQgYmUgYSBmdW5jdGlvblwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGdldFZhbHVlKG9wdGlvbnMub25GaWxlQ29tcGxldGUsIHVuZGVmaW5lZCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBnZXRPbkZpbGVTdGFydCgpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5vbkZpbGVTdGFydCAmJiB0eXBlb2Ygb3B0aW9ucy5vbkZpbGVTdGFydCAhPT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCInb25GaWxlU3RhcnQnIHByb3BlcnR5IHNob3VsZCBiZSBhIGZ1bmN0aW9uXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZ2V0VmFsdWUob3B0aW9ucy5vbkZpbGVTdGFydCwgdW5kZWZpbmVkKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldEF1dG9sb2FkKClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHJldHVybiBnZXRWYWx1ZShvcHRpb25zLmF1dG9sb2FkLCB0cnVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldE51bWJlck9mVGhyZWFkcygpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBnZXRWYWx1ZShvcHRpb25zLm51bWJlck9mVGhyZWFkcywgMSk7XHJcbiAgICAgICAgICAgIHZhciBudW1iZXIgPSBwYXJzZUludCh2YWx1ZSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNOYU4obnVtYmVyKSB8fCBudW1iZXIgPCAxKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCInbnVtYmVyT2ZUaHJlYWRzJyBzaG91bGQgYmUgaW50ZWdlciBudW1iZXIgZ3JhdGVyIHRoYW4gMFwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIG51bWJlcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIGdldFNpbXVsYXRpb25EZWxheU1pbigpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBnZXRWYWx1ZShvcHRpb25zLnNpbXVsYXRpb25EZWxheU1pbiwgdW5kZWZpbmVkKTtcclxuICAgICAgICAgICAgdmFyIG51bWJlciA9IHBhcnNlSW50KHZhbHVlKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGFsbG93IHVuZGVmaW5lZCB2YWx1ZXMgYnV0IG90aGVyIHZhbHVlcyB0aGF0IGNhbm5vdCBiZSBjb252ZXJ0ZWQgdG8gbnVtYmVyIGFyZSBub3QgYWxsb3dlZFxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAndW5kZWZpbmVkJyAmJiAoaXNOYU4obnVtYmVyKSB8fCBudW1iZXIgPCAwKSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiJ3NpbXVsYXRpb25EZWxheU1pbicgc2hvdWxkIGJlIGEgbm9uLW5lZ2F0aXZlIGludGVnZXIgbnVtYmVyXCIpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAndW5kZWZpbmVkJylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbnVtYmVyID0gdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gbnVtYmVyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0U2ltdWxhdGlvbkRlbGF5TWF4KClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGdldFZhbHVlKG9wdGlvbnMuc2ltdWxhdGlvbkRlbGF5TWF4LCB1bmRlZmluZWQpO1xyXG4gICAgICAgICAgICB2YXIgbnVtYmVyID0gcGFyc2VJbnQodmFsdWUpO1xyXG5cclxuICAgICAgICAgICAgLy8gYWxsb3cgdW5kZWZpbmVkIHZhbHVlcyBidXQgb3RoZXIgdmFsdWVzIHRoYXQgY2Fubm90IGJlIGNvbnZlcnRlZCB0byBudW1iZXIgYXJlIG5vdCBhbGxvd2VkXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICd1bmRlZmluZWQnICYmIChpc05hTihudW1iZXIpIHx8IG51bWJlciA8IDApKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCInc2ltdWxhdGlvbkRlbGF5TWF4JyBzaG91bGQgYmUgYSBub24tbmVnYXRpdmUgaW50ZWdlciBudW1iZXJcIik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICd1bmRlZmluZWQnKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBudW1iZXIgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiBudW1iZXI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmdW5jdGlvbiBnZXRWYWx1ZSh2YWx1ZSwgZGVmYXVsdFZhbHVlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ3VuZGVmaW5lZCcgPyBkZWZhdWx0VmFsdWUgOiB2YWx1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbG9hZCgpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKGlzTG9hZGluZyA9PT0gZmFsc2UgJiYgaXNDb21wbGV0ZSgpID09PSBmYWxzZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlzTG9hZGluZyA9IHRydWU7XHJcbiAgICAgICAgICAgIGNyZWF0ZVRocmVhZHMoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gY3JlYXRlVGhyZWFkcygpXHJcbiAgICB7XHJcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IG51bWJlck9mVGhyZWFkczsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgbmV3IFRocmVhZCh7XHJcbiAgICAgICAgICAgICAgICBvblRocmVhZENvbXBsZXRlOiB0aHJlYWRDb21wbGV0ZUhhbmRsZXIsXHJcbiAgICAgICAgICAgICAgICBvbkZpbGVDb21wbGV0ZTogb25GaWxlQ29tcGxldGVIYW5kbGVyLFxyXG4gICAgICAgICAgICAgICAgb25GaWxlU3RhcnQ6IG9uRmlsZVN0YXJ0SGFuZGxlcixcclxuICAgICAgICAgICAgICAgIHF1ZXVlOiBxdWV1ZVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gb25GaWxlQ29tcGxldGVIYW5kbGVyKGl0ZW0pXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKG9uRmlsZUNvbXBsZXRlQ2FsbGJhY2spXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBvbkZpbGVDb21wbGV0ZUNhbGxiYWNrKGl0ZW0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBvbkZpbGVTdGFydEhhbmRsZXIoaXRlbSlcclxuICAgIHtcclxuICAgICAgICBpZiAob25GaWxlU3RhcnRDYWxsYmFjaylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG9uRmlsZVN0YXJ0Q2FsbGJhY2soaXRlbSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHRocmVhZENvbXBsZXRlSGFuZGxlcigpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKGlzQ29tcGxldGUoKSAmJiBvbkNvbXBsZXRlQ2FsbGJhY2spXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpc0xvYWRpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgb25Db21wbGV0ZUNhbGxiYWNrKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGlzQ29tcGxldGUoKVxyXG4gICAge1xyXG4gICAgICAgIHJldHVybiBxdWV1ZS5pc0NvbXBsZXRlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0UGVyY2VudExvYWRlZCgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHF1ZXVlLmdldFBlcmNlbnRMb2FkZWQoKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXRJdGVtQXQoaW5kZXgpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIHF1ZXVlLmdldEl0ZW1BdChpbmRleCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gbGVuZ3RoKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gcXVldWUubGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcbiIsIlxyXG5tb2R1bGUuZXhwb3J0cyA9IEltYWdlTG9hZGVySXRlbTtcclxuXHJcbmZ1bmN0aW9uIEltYWdlTG9hZGVySXRlbShvcHRpb25zKVxyXG57XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgdmFyIFNUQVRVUyA9IHtcclxuICAgICAgICBQRU5ESU5HOiBcInBlbmRpbmdcIixcclxuICAgICAgICBMT0FESU5HOiBcImxvYWRpbmdcIixcclxuICAgICAgICBDT01QTEVURTogXCJjb21wbGV0ZVwiLFxyXG4gICAgICAgIEZBSUxFRDogXCJmYWlsZWRcIlxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgbWUgPSB0aGlzO1xyXG5cclxuICAgIHZhciBvbkxvYWRDYWxsYmFjaztcclxuXHJcbiAgICBpbml0KCk7XHJcblxyXG4gICAgbWUubG9hZCA9IGZ1bmN0aW9uKG9uTG9hZClcclxuICAgIHtcclxuICAgICAgICBvbkxvYWRDYWxsYmFjayA9IG9uTG9hZDtcclxuXHJcbiAgICAgICAgc2V0U3RhdHVzTG9hZGluZygpO1xyXG5cclxuICAgICAgICBtZS50YWcuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIG9uTG9hZEhhbmRsZXIpO1xyXG4gICAgICAgIG1lLnRhZy5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIG9uRXJyb3JIYW5kbGVyKTtcclxuXHJcbiAgICAgICAgbWUudGFnLnNyYyA9IG1lLnNyYztcclxuICAgIH07XHJcblxyXG4gICAgbWUuaXNQZW5kaW5nID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gbWUuc3RhdHVzID09PSBTVEFUVVMuUEVORElORzsgfTtcclxuICAgIG1lLmlzQ29tcGxldGUgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBtZS5zdGF0dXMgPT09IFNUQVRVUy5DT01QTEVURTsgfTtcclxuICAgIG1lLmlzTG9hZGluZyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIG1lLnN0YXR1cyA9PT0gU1RBVFVTLkxPQURJTkc7IH07XHJcbiAgICBtZS5pc0ZhaWxlZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIG1lLnN0YXR1cyA9PT0gU1RBVFVTLkZBSUxFRDsgfTtcclxuXHJcbiAgICBmdW5jdGlvbiBpbml0KClcclxuICAgIHtcclxuICAgICAgICBzZXRQcm9wZXJ0aWVzKCk7XHJcbiAgICAgICAgc2V0U3RhdHVzUGVuZGluZygpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHNldFByb3BlcnRpZXMoKVxyXG4gICAge1xyXG4gICAgICAgIGZvcih2YXIgcHJvcGVydHkgaW4gb3B0aW9ucylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG1lW3Byb3BlcnR5XSA9IG9wdGlvbnNbcHJvcGVydHldO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbWUudGFnID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImltZ1wiKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBzZXRTdGF0dXNGYWlsZWQoKSB7IG1lLnN0YXR1cyA9IFNUQVRVUy5GQUlMRUQ7IH1cclxuICAgIGZ1bmN0aW9uIHNldFN0YXR1c0NvbXBsZXRlKCkgeyBtZS5zdGF0dXMgPSBTVEFUVVMuQ09NUExFVEU7IH1cclxuICAgIGZ1bmN0aW9uIHNldFN0YXR1c0xvYWRpbmcoKSB7IG1lLnN0YXR1cyA9IFNUQVRVUy5MT0FESU5HOyB9XHJcbiAgICBmdW5jdGlvbiBzZXRTdGF0dXNQZW5kaW5nKCkgeyBtZS5zdGF0dXMgPSBTVEFUVVMuUEVORElORzsgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVycygpXHJcbiAgICB7XHJcbiAgICAgICAgbWUudGFnLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBvbkxvYWRIYW5kbGVyKTtcclxuICAgICAgICBtZS50YWcucmVtb3ZlRXZlbnRMaXN0ZW5lcignZXJyb3InLCBvbkVycm9ySGFuZGxlcik7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gb25Mb2FkSGFuZGxlcihldmVudClcclxuICAgIHtcclxuICAgICAgICBpZiAoSW1hZ2VMb2FkZXJJdGVtLnNpbXVsYXRpb25EZWxheU1pbilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBmaW5hbGl6ZU9uTG9hZCgpO1xyXG5cclxuICAgICAgICAgICAgfSwgY2FsY3VsYXRlU2ltdWxhdGlvbkRlbGF5KCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBmaW5hbGl6ZU9uTG9hZCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBvbkVycm9ySGFuZGxlcihldmVudClcclxuICAgIHtcclxuICAgICAgICBpZiAoSW1hZ2VMb2FkZXJJdGVtLnNpbXVsYXRpb25EZWxheU1pbilcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBmaW5hbGl6ZU9uRXJyb3IoKTtcclxuXHJcbiAgICAgICAgICAgIH0sIGNhbGN1bGF0ZVNpbXVsYXRpb25EZWxheSgpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZmluYWxpemVPbkVycm9yKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGZpbmFsaXplT25Mb2FkKClcclxuICAgIHtcclxuICAgICAgICByZW1vdmVMaXN0ZW5lcnMoKTtcclxuICAgICAgICBzZXRTdGF0dXNDb21wbGV0ZSgpO1xyXG4gICAgICAgIG9uTG9hZENhbGxiYWNrKG1lKTtcclxuICAgICAgICBvbkxvYWRDYWxsYmFjayA9IHVuZGVmaW5lZDtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBmaW5hbGl6ZU9uRXJyb3IoKVxyXG4gICAge1xyXG4gICAgICAgIHJlbW92ZUxpc3RlbmVycygpO1xyXG4gICAgICAgIG1lLnRhZyA9IHVuZGVmaW5lZDtcclxuICAgICAgICBzZXRTdGF0dXNGYWlsZWQoKTtcclxuICAgICAgICBvbkxvYWRDYWxsYmFjayhtZSk7XHJcbiAgICAgICAgb25Mb2FkQ2FsbGJhY2sgPSB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gY2FsY3VsYXRlU2ltdWxhdGlvbkRlbGF5KClcclxuICAgIHtcclxuICAgICAgICB2YXIgbWF4ID0gSW1hZ2VMb2FkZXJJdGVtLnNpbXVsYXRpb25EZWxheU1heDtcclxuICAgICAgICB2YXIgbWluID0gSW1hZ2VMb2FkZXJJdGVtLnNpbXVsYXRpb25EZWxheU1pbjtcclxuXHJcbiAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4pICsgbWluKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxufVxyXG5cclxuSW1hZ2VMb2FkZXJJdGVtLnNldFNpbXVsYXRpb25EZWxheXMgPSBmdW5jdGlvbihtaW4sIG1heClcclxue1xyXG4gICAgdmFyIGRlbGF5TWluID0gbWluO1xyXG4gICAgdmFyIGRlbGF5TWF4ID0gbWF4O1xyXG5cclxuICAgIGlmIChkZWxheU1pbiAmJiAhZGVsYXlNYXgpXHJcbiAgICB7XHJcbiAgICAgICAgZGVsYXlNYXggPSBkZWxheU1pbjtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKGRlbGF5TWF4ICYmICFkZWxheU1pbilcclxuICAgIHtcclxuICAgICAgICBkZWxheU1pbiA9IGRlbGF5TWF4O1xyXG4gICAgfVxyXG5cclxuICAgIEltYWdlTG9hZGVySXRlbS5zaW11bGF0aW9uRGVsYXlNaW4gPSBkZWxheU1pbjtcclxuICAgIEltYWdlTG9hZGVySXRlbS5zaW11bGF0aW9uRGVsYXlNYXggPSBkZWxheU1heDtcclxufTtcclxuIiwidmFyIEltYWdlTG9hZGVySXRlbSA9IHJlcXVpcmUoJy4vaW1hZ2VMb2FkZXJJdGVtJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFF1ZXVlO1xyXG5cclxuZnVuY3Rpb24gUXVldWUoaW1hZ2VzKVxyXG57XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgdmFyIGl0ZW1zO1xyXG4gICAgdmFyIG1lID0gdGhpcztcclxuXHJcbiAgICBtZS5sZW5ndGggPSAwO1xyXG5cclxuICAgIGluaXQoKTtcclxuXHJcbiAgICBtZS5nZXRJdGVtQXQgPSBmdW5jdGlvbihpbmRleClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gaXRlbXNbaW5kZXhdO1xyXG4gICAgfTtcclxuXHJcbiAgICBtZS5pc0NvbXBsZXRlID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIHZhciByZXN1bHQgPSB0cnVlO1xyXG4gICAgICAgIHZhciBpdGVtO1xyXG5cclxuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgaXRlbXMubGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpdGVtID0gaXRlbXNbaV07XHJcblxyXG4gICAgICAgICAgICBpZiAoaXRlbS5pc1BlbmRpbmcoKSB8fCBpdGVtLmlzTG9hZGluZygpKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfTtcclxuXHJcbiAgICBtZS5nZXROZXh0UGVuZGluZ0l0ZW0gPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHJlc3VsdDtcclxuXHJcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGl0ZW1zLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKGl0ZW1zW2ldLmlzUGVuZGluZygpKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBpdGVtc1tpXTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfTtcclxuXHJcbiAgICBtZS5nZXRQZXJjZW50TG9hZGVkID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBpdGVtO1xyXG4gICAgICAgIHZhciBpID0gMDtcclxuICAgICAgICB2YXIgbGVuID0gaXRlbXMubGVuZ3RoO1xyXG5cclxuICAgICAgICBmb3IoaTsgaSA8IGxlbjsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaXRlbSA9IGl0ZW1zW2ldO1xyXG5cclxuICAgICAgICAgICAgaWYgKGl0ZW0uaXNQZW5kaW5nKCkgfHwgaXRlbS5pc0xvYWRpbmcoKSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBpIC8gbGVuO1xyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiBpbml0KClcclxuICAgIHtcclxuICAgICAgICBpdGVtcyA9IGNyZWF0ZUl0ZW1zKGltYWdlcyk7XHJcbiAgICAgICAgbWUubGVuZ3RoID0gaXRlbXMubGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGNyZWF0ZUl0ZW1zKGltYWdlcylcclxuICAgIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW107XHJcblxyXG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBpbWFnZXMubGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGltYWdlc1tpXSA9PT0gXCJzdHJpbmdcIilcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gobmV3IEltYWdlTG9hZGVySXRlbSh7XHJcbiAgICAgICAgICAgICAgICAgICAgc3JjOiBpbWFnZXNbaV1cclxuICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKG5ldyBJbWFnZUxvYWRlckl0ZW0oaW1hZ2VzW2ldKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuIiwiXHJcbm1vZHVsZS5leHBvcnRzID0gVGhyZWFkO1xyXG5cclxuZnVuY3Rpb24gVGhyZWFkKG9wdGlvbnMpXHJcbntcclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICB2YXIgbWUgPSB0aGlzO1xyXG4gICAgdmFyIG9uVGhyZWFkQ29tcGxldGVDYWxsYmFjaztcclxuICAgIHZhciBvbkZpbGVDb21wbGV0ZUNhbGxiYWNrO1xyXG4gICAgdmFyIG9uRmlsZVN0YXJ0Q2FsbGJhY2s7XHJcbiAgICB2YXIgcXVldWU7XHJcblxyXG4gICAgaW5pdCgpO1xyXG5cclxuICAgIGZ1bmN0aW9uIGluaXQoKVxyXG4gICAge1xyXG4gICAgICAgIG9uVGhyZWFkQ29tcGxldGVDYWxsYmFjayA9IG9wdGlvbnMub25UaHJlYWRDb21wbGV0ZTtcclxuICAgICAgICBvbkZpbGVDb21wbGV0ZUNhbGxiYWNrID0gb3B0aW9ucy5vbkZpbGVDb21wbGV0ZTtcclxuICAgICAgICBvbkZpbGVTdGFydENhbGxiYWNrID0gb3B0aW9ucy5vbkZpbGVTdGFydDtcclxuICAgICAgICBxdWV1ZSA9IG9wdGlvbnMucXVldWU7XHJcblxyXG4gICAgICAgIHByb2Nlc3NOZXh0SXRlbSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHByb2Nlc3NOZXh0SXRlbSgpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGltYWdlTG9hZGVySXRlbSA9IHF1ZXVlLmdldE5leHRQZW5kaW5nSXRlbSgpO1xyXG5cclxuICAgICAgICBpZiAodHlwZW9mIGltYWdlTG9hZGVySXRlbSA9PT0gJ3VuZGVmaW5lZCcpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBvblRocmVhZENvbXBsZXRlQ2FsbGJhY2soKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaW1hZ2VMb2FkZXJJdGVtLmxvYWQob25Mb2FkSGFuZGxlcik7XHJcbiAgICAgICAgICAgIG9uRmlsZVN0YXJ0Q2FsbGJhY2soaW1hZ2VMb2FkZXJJdGVtKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gb25Mb2FkSGFuZGxlcihpdGVtKVxyXG4gICAge1xyXG4gICAgICAgIG9uRmlsZUNvbXBsZXRlQ2FsbGJhY2soaXRlbSk7XHJcbiAgICAgICAgcHJvY2Vzc05leHRJdGVtKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbn1cclxuIiwid2luZG93LkltYWdlTG9hZGVyID0gcmVxdWlyZSgnLi9pbWFnZUxvYWRlci9pbWFnZUxvYWRlci5qcycpO1xyXG53aW5kb3cuTGF5ZXIgPSByZXF1aXJlKCcuL2xheWVyLmpzJyk7XHJcbndpbmRvdy5UcmFuc2Zvcm0gPSByZXF1aXJlKCcuL3RyYW5zZm9ybS5qcycpO1xyXG53aW5kb3cuVHJhbnNmb3JtT3JpZ2luYWwgPSByZXF1aXJlKCcuL3RyYW5zZm9ybU9yaWdpbmFsLmpzJyk7XHJcbndpbmRvdy5HcmFwaGljID0gcmVxdWlyZSgnLi9ncmFwaGljLmpzJyk7XHJcbndpbmRvdy5UaW1lciA9IHJlcXVpcmUoJy4vdGltZXIuanMnKTtcclxud2luZG93LkNhbnZhc1V0aWwgPSByZXF1aXJlKCcuL2NhbnZhc3V0aWwuanMnKTtcclxud2luZG93LlNoYXBlID0gcmVxdWlyZSgnLi9zaGFwZS5qcycpO1xyXG4iLCJcclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBMYXllcihvcHRpb25zKVxyXG57XHJcbiAgICAndXNlIHN0cmljdCc7XHJcblxyXG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIExheWVyKSlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IExheWVyKG9wdGlvbnMpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBtZSA9IHRoaXM7XHJcbiAgICB2YXIgY2FudmFzO1xyXG4gICAgdmFyIGNvbnRleHQ7XHJcblxyXG4gICAgdmFyIGhvdmVyZWRHcmFwaGljO1xyXG5cclxuICAgIHZhciBncmFwaGljcztcclxuXHJcbiAgICB2YXIgaGFzTW91c2VNb3ZlRXZlbnQ7XHJcbiAgICB2YXIgaGFzQ2xpY2tFdmVudDtcclxuXHJcbiAgICB2YXIgY2FudmFzU3RvcmVkU3RhdGU7XHJcbiAgICB2YXIgZnVsbFNjcmVlblN0YXRlO1xyXG5cclxuICAgIGZ1bmN0aW9uIGluaXQoKVxyXG4gICAge1xyXG4gICAgICAgIGlmKG9wdGlvbnMgJiYgb3B0aW9ucy50YXJnZXQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChvcHRpb25zLnRhcmdldCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcclxuICAgICAgICBncmFwaGljcyA9IFtdO1xyXG5cclxuICAgICAgICBpZihvcHRpb25zKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuZW5hYmxlT25Sb2xsRXZlbnRzKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBtZS5lbmFibGVPblJvbGxFdmVudHMoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuZW5hYmxlT25DbGlja0V2ZW50cylcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbWUuZW5hYmxlT25DbGlja0V2ZW50cygpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAob3B0aW9ucy53aWR0aClcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgY2FudmFzLndpZHRoID0gb3B0aW9ucy53aWR0aDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuaGVpZ2h0KVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gb3B0aW9ucy5oZWlnaHQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmZ1bGxTY3JlZW4pXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG1lLmVuYWJsZUZ1bGxTY3JlZW4oKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYob3B0aW9ucy5jbGlja1Rocm91Z2gpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNhbnZhcy5zdHlsZVtcInBvaW50ZXItZXZlbnRzXCJdID0gXCJub25lXCI7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmFwcGVuZFRvQm9keSlcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChjYW52YXMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG1lLmdldENhbnZhcyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gY2FudmFzOyB9XHJcbiAgICBtZS5nZXRDb250ZXh0ID0gZnVuY3Rpb24oKSB7IHJldHVybiBjb250ZXh0OyB9XHJcblxyXG4gICAgbWUuZW5hYmxlT25Sb2xsRXZlbnRzID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIGlmICghaGFzTW91c2VNb3ZlRXZlbnQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgbW91c2VNb3ZlSGFuZGxlcik7XHJcbiAgICAgICAgICAgIGhhc01vdXNlTW92ZUV2ZW50ID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbWUuZGlzYWJsZU9uUm9sbEV2ZW50cyA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICBpZiAoaGFzTW91c2VNb3ZlRXZlbnQpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjYW52YXMucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgbW91c2VNb3ZlSGFuZGxlcik7XHJcbiAgICAgICAgICAgIGhhc01vdXNlTW92ZUV2ZW50ID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG1lLmVuYWJsZU9uQ2xpY2tFdmVudHMgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKCFoYXNDbGlja0V2ZW50KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgY2xpY2tIYW5kbGVyKTtcclxuICAgICAgICAgICAgaGFzQ2xpY2tFdmVudCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG1lLmRpc2FibGVPbkNsaWNrRXZlbnRzID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIGlmIChoYXNDbGlja0V2ZW50KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2FudmFzLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgY2xpY2tIYW5kbGVyKTtcclxuICAgICAgICAgICAgaGFzQ2xpY2tFdmVudCA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBtZS5lbmFibGVGdWxsU2NyZWVuID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIGlmICghZnVsbFNjcmVlblN0YXRlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc3RvcmVDYW52YXNDdXJyZW50U3RhdGUoKTtcclxuICAgICAgICAgICAgc2V0Q2FudmFzRnVsbFNjcmVlblN0YXRlKCk7XHJcbiAgICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdyZXNpemUnLCB1cGRhdGVDYW52YXNGdWxsU2NyZWVuKTtcclxuICAgICAgICAgICAgZnVsbFNjcmVlblN0YXRlID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbWUuZGlzYWJsZUZ1bGxTY3JlZW4gPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgaWYgKGZ1bGxTY3JlZW5TdGF0ZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdyZXNpemUnLCB1cGRhdGVDYW52YXNGdWxsU2NyZWVuKTtcclxuICAgICAgICAgICAgcmVzdG9yZUNhbnZhc1N0YXRlKCk7XHJcbiAgICAgICAgICAgIGZ1bGxTY3JlZW5TdGF0ZSA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBzdG9yZUNhbnZhc0N1cnJlbnRTdGF0ZSgpXHJcbiAgICB7XHJcbiAgICAgICAgY2FudmFzU3RvcmVkU3RhdGUgPSB7XHJcbiAgICAgICAgICAgIHBvc2l0aW9uOiBjYW52YXMuc3R5bGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgIGxlZnQ6IGNhbnZhcy5zdHlsZS5sZWZ0LFxyXG4gICAgICAgICAgICB0b3A6IGNhbnZhcy5zdHlsZS50b3AsXHJcbiAgICAgICAgICAgIHdpZHRoOiBjYW52YXMud2lkdGgsXHJcbiAgICAgICAgICAgIGhlaWdodDogY2FudmFzLmhlaWdodFxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gc2V0Q2FudmFzRnVsbFNjcmVlblN0YXRlKClcclxuICAgIHtcclxuICAgICAgICBjYW52YXMuc3R5bGUucG9zaXRpb24gPSBcImFic29sdXRlXCI7XHJcbiAgICAgICAgY2FudmFzLnN0eWxlLmxlZnQgPSBcIjBcIjtcclxuICAgICAgICBjYW52YXMuc3R5bGUudG9wID0gXCIwXCI7XHJcbiAgICAgICAgdXBkYXRlQ2FudmFzRnVsbFNjcmVlbigpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHVwZGF0ZUNhbnZhc0Z1bGxTY3JlZW4oKVxyXG4gICAge1xyXG4gICAgICAgIGNhbnZhcy53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xyXG4gICAgICAgIGNhbnZhcy5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XHJcbiAgICAgICAgbWUucmVuZGVyKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcmVzdG9yZUNhbnZhc1N0YXRlKClcclxuICAgIHtcclxuICAgICAgICBjYW52YXMuc3R5bGUucG9zaXRpb24gPSBjYW52YXNTdG9yZWRTdGF0ZS5wb3NpdGlvbjtcclxuICAgICAgICBjYW52YXMuc3R5bGUubGVmdCA9IGNhbnZhc1N0b3JlZFN0YXRlLmxlZnQ7XHJcbiAgICAgICAgY2FudmFzLnN0eWxlLnRvcCA9IGNhbnZhc1N0b3JlZFN0YXRlLnRvcDtcclxuICAgICAgICBjYW52YXMud2lkdGggPSBjYW52YXNTdG9yZWRTdGF0ZS53aWR0aDtcclxuICAgICAgICBjYW52YXMuaGVpZ2h0ID0gY2FudmFzU3RvcmVkU3RhdGUuaGVpZ2h0O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIG1vdXNlTW92ZUhhbmRsZXIoZXZlbnQpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGdyYXBoaWMgPSBtZS5nZXRHcmFwaGljQXRQb2ludChldmVudC5jbGllbnRYLCBldmVudC5jbGllbnRZKTtcclxuXHJcbiAgICAgICAgLy8gdGVzdCBpZiB3ZSBhcmUgaGl0dGluZyBzb21ldGhpbmcgZGlmZmVyZW50IG9uIHRoaXMgbW92ZVxyXG4gICAgICAgIGlmIChncmFwaGljICE9PSBob3ZlcmVkR3JhcGhpYylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmIChob3ZlcmVkR3JhcGhpYyAmJiBob3ZlcmVkR3JhcGhpYy5vblJvbGxPdXQpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGhvdmVyZWRHcmFwaGljLm9uUm9sbE91dC5jYWxsKGhvdmVyZWRHcmFwaGljKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKGdyYXBoaWMgJiYgZ3JhcGhpYy5vblJvbGxPdmVyKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBncmFwaGljLm9uUm9sbE92ZXIuY2FsbChncmFwaGljKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaG92ZXJlZEdyYXBoaWMgPSBncmFwaGljO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBjbGlja0hhbmRsZXIoZXZuZXQpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIGdyYXBoaWMgPSBtZS5nZXRHcmFwaGljQXRQb2ludChldmVudC5jbGllbnRYLCBldmVudC5jbGllbnRZKTtcclxuXHJcbiAgICAgICAgaWYgKGdyYXBoaWMgJiYgZ3JhcGhpYy5vbkNsaWNrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZ3JhcGhpYy5vbkNsaWNrLmNhbGwoZ3JhcGhpYyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG1lLmxlbmd0aCA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gZ3JhcGhpY3MubGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIG1lLmFkZEdyYXBoaWMgPSBmdW5jdGlvbihncmFwaGljKVxyXG4gICAge1xyXG4gICAgICAgIGdyYXBoaWNzLnB1c2goZ3JhcGhpYyk7XHJcbiAgICAgICAgZ3JhcGhpYy5zZXRSZW5kZXJDb250ZXh0KGNvbnRleHQpO1xyXG4gICAgfVxyXG5cclxuICAgIG1lLnJlbW92ZUdyYXBoaWMgPSBmdW5jdGlvbihncmFwaGljKVxyXG4gICAge1xyXG4gICAgICAgIGdyYXBoaWMuY2xlYXIoKTtcclxuXHJcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGdyYXBoaWNzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWYgKGdyYXBoaWMgPT09IGdyYXBoaWNzW2ldKVxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBncmFwaGljcy5zcGxpY2UoaSwxKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBtZS5yZW1vdmVBbGxHcmFwaGljcyA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgZ3JhcGhpY3MubGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBncmFwaGljc1tpXS5jbGVhcigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ3JhcGhpY3MgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICBtZS5nZXRHcmFwaGljQXQgPSBmdW5jdGlvbihpbmRleClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gZ3JhcGhpY3NbaW5kZXhdO1xyXG4gICAgfVxyXG5cclxuICAgIG1lLmdldEdyYXBoaWNBdFBvaW50ID0gZnVuY3Rpb24oeCwgeSlcclxuICAgIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gbnVsbDtcclxuXHJcbiAgICAgICAgLy8gdGFrZSB0aGUgdG9wbW9zdCBpdGVtIG9uIHRoZSBzY3JlZW4uXHJcbiAgICAgICAgLy8gaS5lIHRoZSBmaXJzdCBncmFwaGljIGZyb20gYm90dG9tIG9mIHRoZVxyXG4gICAgICAgIC8vIGFycmF5IHRoYXQgaGFzIHBpeGVsIGF0IHRoZSBjb29yZGluYXRlc1xyXG4gICAgICAgIGZvcih2YXIgaSA9IGdyYXBoaWNzLmxlbmd0aC0xOyBpID49IDA7IGktLSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlmKGdyYXBoaWNzW2ldLmhhc0dsb2JhbFBpeGVsQXQoeCwgeSkpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGdyYXBoaWNzW2ldO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgbWUucmVuZGVyID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBpO1xyXG5cclxuICAgICAgICBmb3IoaSA9IDA7IGkgPCBncmFwaGljcy5sZW5ndGg7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGdyYXBoaWNzW2ldLmNsZWFyKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IoaSA9IDA7IGkgPCBncmFwaGljcy5sZW5ndGg7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGdyYXBoaWNzW2ldLnJlbmRlcigpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBtZS51cGRhdGUgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGdyYXBoaWNzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgZ3JhcGhpY3NbaV0udXBkYXRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGluaXQoKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxufVxyXG4iLCJcclxuXCJ1c2Ugc3RyaWN0XCI7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFNoYXBlO1xyXG5cclxuZnVuY3Rpb24gU2hhcGUgKG9wdGlvbnMpXHJcbntcclxuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBTaGFwZSkpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBTaGFwZShvcHRpb25zKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgbWUgPSB0aGlzO1xyXG4gICAgdmFyIHJlbmRlckNvbnRleHQ7XHJcblxyXG4gICAgdmFyIFRZUEVfRlVOQ1RJT04gPSAwO1xyXG4gICAgdmFyIFRZUEVfU0VUVEVSID0gMTtcclxuXHJcbiAgICBtZS54ID0gMDtcclxuICAgIG1lLnkgPSAwO1xyXG5cclxuICAgIHZhciBjbGVhclJlY3QgPSB7fTtcclxuXHJcbiAgICB2YXIgc3RhY2sgPSBbXTtcclxuXHJcbiAgICBmdW5jdGlvbiBpbml0KClcclxuICAgIHtcclxuICAgICAgICBpZiAob3B0aW9ucylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG1lLnggPSBvcHRpb25zLnggfHwgMDtcclxuICAgICAgICAgICAgbWUueSA9IG9wdGlvbnMueSB8fCAwO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBtZS5yZW5kZXIgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgdmFyIHN0YWNrSXRlbTtcclxuXHJcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IHN0YWNrLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc3RhY2tJdGVtID0gc3RhY2tbaV07XHJcblxyXG4gICAgICAgICAgICBpZihzdGFja0l0ZW0udHlwZSA9PT0gVFlQRV9GVU5DVElPTilcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmVuZGVyQ29udGV4dFtzdGFja0l0ZW0ubWVtYmVyXS5hcHBseShyZW5kZXJDb250ZXh0LCBzdGFja0l0ZW0uYXJndW1lbnRzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmIChzdGFja0l0ZW0udHlwZSA9PT0gVFlQRV9TRVRURVIpXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJlbmRlckNvbnRleHRbc3RhY2tJdGVtLm1lbWJlcl0gPSBzdGFja0l0ZW0udmFsdWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIG1lLmNsZWFyID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIHZhciBsZWZ0ID0gY2xlYXJSZWN0LmxlZnQgLSBjbGVhclJlY3QucGFkZGluZztcclxuICAgICAgICB2YXIgdG9wID0gY2xlYXJSZWN0LnRvcCAtIGNsZWFyUmVjdC5wYWRkaW5nO1xyXG4gICAgICAgIHZhciByaWdodCA9IGNsZWFyUmVjdC5yaWdodCArIGNsZWFyUmVjdC5wYWRkaW5nO1xyXG4gICAgICAgIHZhciBib3R0b20gPSBjbGVhclJlY3QuYm90dG9tICsgY2xlYXJSZWN0LnBhZGRpbmc7XHJcbiAgICAgICAgdmFyIHdpZHRoID0gcmlnaHQgLSBsZWZ0O1xyXG4gICAgICAgIHZhciBoZWlnaHQgPSBib3R0b20gLSB0b3A7XHJcblxyXG4gICAgICAgIHJlbmRlckNvbnRleHQuY2xlYXJSZWN0KGxlZnQsIHRvcCwgd2lkdGgsIGhlaWdodCk7XHJcbiAgICB9O1xyXG5cclxuICAgIG1lLnNldFJlbmRlckNvbnRleHQgPSBmdW5jdGlvbihjb250ZXh0KVxyXG4gICAge1xyXG4gICAgICAgIHJlbmRlckNvbnRleHQgPSBjb250ZXh0O1xyXG4gICAgfTtcclxuXHJcbiAgICBtZS5iZWdpblBhdGggPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgc3RvcmVGdW5jdGlvbihcImJlZ2luUGF0aFwiLCBhcmd1bWVudHMpO1xyXG4gICAgfTtcclxuXHJcbiAgICBtZS5jbG9zZVBhdGggPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgc3RvcmVGdW5jdGlvbihcImNsb3NlUGF0aFwiLCBhcmd1bWVudHMpO1xyXG4gICAgfTtcclxuXHJcbiAgICBtZS5tb3ZlVG8gPSBmdW5jdGlvbih4LCB5KVxyXG4gICAge1xyXG4gICAgICAgIHRyYW5zbGF0ZVhZKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgc2V0RGltZW5zaW9uc1hZKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgc3RvcmVGdW5jdGlvbihcIm1vdmVUb1wiLCBhcmd1bWVudHMpO1xyXG4gICAgfTtcclxuXHJcbiAgICBtZS5saW5lVG8gPSBmdW5jdGlvbih4LCB5KVxyXG4gICAge1xyXG4gICAgICAgIHRyYW5zbGF0ZVhZKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgc2V0RGltZW5zaW9uc1hZKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgc3RvcmVGdW5jdGlvbihcImxpbmVUb1wiLCBhcmd1bWVudHMpO1xyXG4gICAgfTtcclxuXHJcbiAgICBtZS5maWxsID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIHN0b3JlRnVuY3Rpb24oXCJmaWxsXCIsIGFyZ3VtZW50cyk7XHJcbiAgICB9O1xyXG5cclxuICAgIG1lLnN0cm9rZSA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICBzdG9yZUZ1bmN0aW9uKFwic3Ryb2tlXCIsIGFyZ3VtZW50cyk7XHJcbiAgICB9O1xyXG5cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcImZpbGxTdHlsZVwiLCB7XHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbih2YWx1ZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHN0b3JlUHJvcGVydHkoXCJmaWxsU3R5bGVcIiwgdmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcInN0cm9rZVN0eWxlXCIsIHtcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKHZhbHVlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc3RvcmVQcm9wZXJ0eShcInN0cm9rZVN0eWxlXCIsIHZhbHVlKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgXCJsaW5lQ2FwXCIsIHtcclxuICAgICAgICBzZXQ6IGZ1bmN0aW9uKHZhbHVlKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc3RvcmVQcm9wZXJ0eShcImxpbmVDYXBcIiwgdmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcImxpbmVXaWR0aFwiLCB7XHJcbiAgICAgICAgc2V0OiBmdW5jdGlvbih2YWx1ZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHN0b3JlUHJvcGVydHkoXCJsaW5lV2lkdGhcIiwgdmFsdWUpO1xyXG4gICAgICAgICAgICBzZXREaW1lbnNpb25zUGFkZGluZyh2YWx1ZS8yKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBmdW5jdGlvbiBzdG9yZUZ1bmN0aW9uKG5hbWUsIGFyZ3MpXHJcbiAgICB7XHJcbiAgICAgICAgc3RhY2sucHVzaCh7bWVtYmVyOiBuYW1lLCB0eXBlOiBUWVBFX0ZVTkNUSU9OLCBhcmd1bWVudHM6IGFyZ3N9KTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBzdG9yZVByb3BlcnR5KG5hbWUsIHZhbHVlKVxyXG4gICAge1xyXG4gICAgICAgIHN0YWNrLnB1c2goe21lbWJlcjogbmFtZSwgdHlwZTogVFlQRV9TRVRURVIsIHZhbHVlOiB2YWx1ZX0pO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHRyYW5zbGF0ZVhZKGFyZ3MpXHJcbiAgICB7XHJcbiAgICAgICAgYXJnc1swXSArPSBtZS54O1xyXG4gICAgICAgIGFyZ3NbMV0gKz0gbWUueTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB0cmFuc2xhdGVYWVhZKGFyZ3MpXHJcbiAgICB7XHJcbiAgICAgICAgYXJnc1swXSArPSBtZS54O1xyXG4gICAgICAgIGFyZ3NbMV0gKz0gbWUueTtcclxuICAgICAgICBhcmdzWzJdICs9IG1lLng7XHJcbiAgICAgICAgYXJnc1szXSArPSBtZS55O1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHNldERpbWVuc2lvbnNQYWRkaW5nKHBhZGRpbmcpXHJcbiAgICB7XHJcbiAgICAgICAgaWYocGFkZGluZyA+IGNsZWFyUmVjdC5wYWRkaW5nKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2xlYXJSZWN0LnBhZGRpbmcgPSBNYXRoLmNlaWwocGFkZGluZyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHNldERpbWVuc2lvbnNYWShhcmdzKVxyXG4gICAge1xyXG4gICAgICAgIGlmKGNsZWFyUmVjdC5oYXNPd25Qcm9wZXJ0eShcImxlZnRcIikpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBleHBhbmREaW1lbnNpb25zKGFyZ3NbMF0sIGFyZ3NbMV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzZXRJbml0aWFsRGltZW5zaW9ucyhhcmdzWzBdLCBhcmdzWzFdKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gc2V0SW5pdGlhbERpbWVuc2lvbnMoeCwgeSlcclxuICAgIHtcclxuICAgICAgICBjbGVhclJlY3QubGVmdCA9IHg7XHJcbiAgICAgICAgY2xlYXJSZWN0LnJpZ2h0ID0geDtcclxuICAgICAgICBjbGVhclJlY3QudG9wID0geTtcclxuICAgICAgICBjbGVhclJlY3QuYm90dG9tID0geTtcclxuICAgICAgICBjbGVhclJlY3QucGFkZGluZyA9IDA7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZXhwYW5kRGltZW5zaW9ucyh4LCB5KVxyXG4gICAge1xyXG4gICAgICAgIGlmKHggPCBjbGVhclJlY3QubGVmdClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNsZWFyUmVjdC5sZWZ0ID0geDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZih4ID4gY2xlYXJSZWN0LnJpZ2h0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgY2xlYXJSZWN0LnJpZ2h0ID0geCsxO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYoeSA8IGNsZWFyUmVjdC50b3ApXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjbGVhclJlY3QudG9wID0geTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZih5ID4gY2xlYXJSZWN0LmJvdHRvbSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNsZWFyUmVjdC5ib3R0b20gPSB5O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBtZS5ib3ggPSBmdW5jdGlvbih4LCB5LCB3aWR0aCwgaGVpZ2h0KVxyXG4gICAge1xyXG4gICAgICAgIG1lLmJlZ2luUGF0aCgpO1xyXG4gICAgICAgIG1lLm1vdmVUbyh4LCB5KTtcclxuICAgICAgICBtZS5saW5lVG8od2lkdGggKyB4LCB5KTtcclxuICAgICAgICBtZS5saW5lVG8od2lkdGggKyB4LCBoZWlnaHQgKyB5KTtcclxuICAgICAgICBtZS5saW5lVG8oeCwgaGVpZ2h0ICsgeSk7XHJcbiAgICAgICAgbWUuY2xvc2VQYXRoKCk7XHJcbiAgICB9O1xyXG5cclxuICAgIGluaXQoKTtcclxuXHJcbiAgICByZXR1cm4gdGhpcztcclxufSIsIlxyXG4vLyBUaW1lciBjbGFzcyBpbXBsZW1lbnRzIHRoZSBtYWluIGxvb3Agb2YgdGhlIGFwcGxpY2F0aW9uIGFuZCB0aGUgY2FsbGJhY3MgdGhhdCBoYW5kbGVcclxuLy8gYXBwbGljYXRpb24gcHJvY2Vzc2luZyBpbiBtYWluIGxvb3AuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gVGltZXIob3B0aW9ucylcclxue1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgIGlmKFRpbWVyLnByb3RvdHlwZS5zaW5nbGV0b25JbnN0YW5jZSlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gVGltZXIucHJvdG90eXBlLnNpbmdsZXRvbkluc3RhbmNlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBUaW1lcikpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBUaW1lcihvcHRpb25zKTtcclxuICAgIH1cclxuXHJcbiAgICBUaW1lci5wcm90b3R5cGUuc2luZ2xldG9uSW5zdGFuY2UgPSB0aGlzO1xyXG5cclxuICAgIHZhciBtZSA9IHRoaXM7XHJcblxyXG4gICAgbWUucmVuZGVyQ2FsbGJhY2s7XHJcbiAgICBtZS51cGRhdGVDYWxsYmFjaztcclxuICAgIG1lLm1lYXN1cmVDYWxsYmFjaztcclxuXHJcbiAgICAvLyBGcmFtZSByYXRlXHJcbiAgICB2YXIgZnJhbWVSYXRlID0gMzA7XHJcbiAgICBtZS5nZXRGcmFtZXJhdGUgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGZyYW1lUmF0ZTsgfVxyXG4gICAgbWUuc2V0RnJhbWVyYXRlID0gZnVuY3Rpb24odmFsdWUpXHJcbiAgICB7XHJcbiAgICAgICAgZnJhbWVSYXRlID0gdmFsdWU7XHJcblxyXG4gICAgICAgIC8vIG9uZSBzZWNvbmQgLyBmcmFtZSByYXRlID0gdGltZSBvZiBhIHBlcmlvZFxyXG4gICAgICAgIHBlcmlvZCA9IE1hdGgucm91bmQoMTAwMCAvIGZyYW1lUmF0ZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVGltZSBpbiBtaWxsaXNlY29uZHMgd2UgaGF2ZSB0aW1lIHRvIHBlcmZvcm0gYWxsIG9wZXJhdGlvbnNcclxuICAgIHZhciBwZXJpb2Q7XHJcbiAgICBtZS5nZXRQZXJpb2QgPSBmdW5jdGlvbigpIHsgcmV0dXJuIHBlcmlvZDsgfVxyXG5cclxuICAgIC8vIFRpbWUgYmVmb3JlIHRoZSBvcGVyYXRpb25zXHJcbiAgICB2YXIgYmVmb3JlVGltZTtcclxuICAgIG1lLmdldEJlZm9yZVRpbWUgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGJlZm9yZVRpbWU7IH1cclxuXHJcbiAgICAvLyBUaW1lIGFmdGVyIHRoZSBvcGVyYXRpb25zXHJcbiAgICB2YXIgYWZ0ZXJUaW1lO1xyXG4gICAgbWUuZ2V0QWZ0ZXJUaW1lID0gZnVuY3Rpb24oKSB7IHJldHVybiBhZnRlclRpbWU7IH1cclxuXHJcbiAgICAvLyBUaW1lIHRoYXQgZWxhcHNlZCBkdXJpbmcgdGhlIHByb2Nlc3Npbmcgb2Ygb3BlcmF0aW9uc1xyXG4gICAgdmFyIHRpbWVEaWZmO1xyXG4gICAgbWUuZ2V0VGltZURpZmYgPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRpbWVEaWZmOyB9XHJcblxyXG4gICAgLy8gU2xlZXAgdGltZSBpcyB0aGUgdGltZSBsZWZ0IGFmdGVyIHRoZSBvcGVyYXRpb25zXHJcbiAgICB2YXIgc2xlZXBUaW1lO1xyXG4gICAgbWUuZ2V0U2xlZXBUaW1lID0gZnVuY3Rpb24oKSB7IHJldHVybiBzbGVlcFRpbWU7IH1cclxuXHJcbiAgICAvLyBPdmVyIHNsZWVwIHRpbWUgaXMgdGhlIHRpbWUgYmV0d2VlbiB0aGUgdGltZXIgZXZlbnRzIHdpdGhvdXQgdGhlIGRlbGF5IGl0c2VsZi5cclxuICAgIC8vIFRoaXMgaXMgb25seSBwbHVzIG1pbnVzIGZldyBtaWxsaXNlY29uZHMuXHJcbiAgICB2YXIgb3ZlclNsZWVwVGltZTtcclxuICAgIG1lLmdldE92ZXJTbGVlcFRpbWUgPSBmdW5jdGlvbigpIHsgcmV0dXJuIG92ZXJTbGVlcFRpbWU7IH1cclxuXHJcbiAgICAvLyBUaW1lIGluIG1pbGxpc2Vjb25kcyB0aGUgbG9vcCBpcyBkZWxheWVkIGR1ZSB0byB0aGUgaGVhdnkgcHJvY2Vzc2luZy5cclxuICAgIC8vIERyYXdpbmcgb2YgZnJhbWVzIGFyZSBza2lwcGVkIGlmIHRoaXMgaXMgZ3JlYXRlciB0aGFuIHRoZSB0aW1lIG9mIGEgcGVyaW9kLlxyXG4gICAgdmFyIGV4Y2VzcztcclxuICAgIG1lLmdldEV4Y2VzcyA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gZXhjZXNzOyB9XHJcblxyXG4gICAgdmFyIGdhbWVUaW1lcklkO1xyXG5cclxuICAgIHZhciBkdW1teUZ1bmN0aW9uID0gZnVuY3Rpb24oKSB7fTtcclxuXHJcbiAgICBmdW5jdGlvbiBpbml0KClcclxuICAgIHtcclxuICAgICAgICBpZiAob3B0aW9ucylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG1lLnJlbmRlckNhbGxiYWNrID0gb3B0aW9ucy5yZW5kZXJDYWxsYmFjayB8fCBkdW1teUZ1bmN0aW9uO1xyXG4gICAgICAgICAgICBtZS51cGRhdGVDYWxsYmFjayA9IG9wdGlvbnMudXBkYXRlQ2FsbGJhY2sgfHwgZHVtbXlGdW5jdGlvbjtcclxuICAgICAgICAgICAgbWUubWVhc3VyZUNhbGxiYWNrID0gb3B0aW9ucy5tZWFzdXJlQ2FsbGJhY2sgfHwgZHVtbXlGdW5jdGlvbjtcclxuXHJcbiAgICAgICAgICAgIG1lLnNldEZyYW1lcmF0ZShvcHRpb25zLmZyYW1lUmF0ZSB8fCAzMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2VcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIG1lLnJlbmRlckNhbGxiYWNrID0gZHVtbXlGdW5jdGlvbjtcclxuICAgICAgICAgICAgbWUudXBkYXRlQ2FsbGJhY2sgPSBkdW1teUZ1bmN0aW9uO1xyXG4gICAgICAgICAgICBtZS5tZWFzdXJlQ2FsbGJhY2sgPSBkdW1teUZ1bmN0aW9uO1xyXG5cclxuICAgICAgICAgICAgbWUuc2V0RnJhbWVyYXRlKDMwKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGJlZm9yZVRpbWUgPSAwO1xyXG4gICAgICAgIGFmdGVyVGltZSA9IDA7XHJcbiAgICAgICAgdGltZURpZmYgPSAwO1xyXG4gICAgICAgIHNsZWVwVGltZSA9IDA7XHJcbiAgICAgICAgb3ZlclNsZWVwVGltZSA9IDA7XHJcbiAgICAgICAgZXhjZXNzID0gMDtcclxuICAgIH1cclxuXHJcbiAgICBtZS5zdGFydCA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICBiZWZvcmVUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcbiAgICAgICAgYWZ0ZXJUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcbiAgICAgICAgZ2FtZVRpbWVySWQgPSBzZXRUaW1lb3V0KHJ1biwgcGVyaW9kKTtcclxuICAgIH1cclxuXHJcbiAgICBtZS5zdG9wID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIGNsZWFyVGltZW91dChnYW1lVGltZXJJZCk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8vIE1haW4gbG9vcCBvZiB0aGUgZ2FtZS5cclxuICAgIC8vIEdhbWUgbG9vcCBzdGFydHMgd2l0aCB0aGUgc3RhcnRUaW1lciBjYWxsLiBJdCBpcyBjYWxsZWQgb25jZVxyXG4gICAgLy8gYW5kIGFmdGVyd2FyZHMgdGhlIHRpbWVyIGlzIGNhbGxlZCBpbnNpZGUgdGhlIGdhbWUgbG9vcC5cclxuICAgIGZ1bmN0aW9uIHJ1bihldmVudClcclxuICAgIHtcclxuICAgICAgICAvLyBnZXQgc3RhcnQgdGltZVxyXG4gICAgICAgIGJlZm9yZVRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuXHJcbiAgICAgICAgLy8gZ2V0IHRoZSB0aW1lIHRoYXQgZWxhcHNlZCBmcm9tIHRoZSBwcmV2aW91cyBydW4gZnVuY3Rpb24gY2FsbCxcclxuICAgICAgICAvLyBub3QgaW5jbHVkaW5nIHRoZSBkZWxheSBpdHNlbGYuXHJcbiAgICAgICAgb3ZlclNsZWVwVGltZSA9IChiZWZvcmVUaW1lIC0gYWZ0ZXJUaW1lKSAtIHNsZWVwVGltZTtcclxuXHJcbiAgICAgICAgbWUudXBkYXRlQ2FsbGJhY2soKTtcclxuICAgICAgICBtZS5yZW5kZXJDYWxsYmFjaygpO1xyXG5cclxuICAgICAgICAvLyBnZXQgZW5kIHRpbWVcclxuICAgICAgICBhZnRlclRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuXHJcbiAgICAgICAgLy8gZ2V0IHRpbWUgZGlmZmVyZW5jZSBpLmUuIGVsYXBzZWQgdGltZS5cclxuICAgICAgICB0aW1lRGlmZiA9IGFmdGVyVGltZSAtIGJlZm9yZVRpbWU7XHJcblxyXG4gICAgICAgIC8vIGNhbGN1bGF0ZSBuZXcgZGVsYXlcclxuICAgICAgICAvLyBvdmVyU2xlZXBUaW1lIGlzIHJlZHVjZWQgdG8gYmFsYW5jZSB0aGUgdGltZXIgZXJyb3IgZnJvbSBwcmV2aXVzIHJvdW5kLlxyXG4gICAgICAgIHNsZWVwVGltZSA9IChwZXJpb2QgLSB0aW1lRGlmZikgLSBvdmVyU2xlZXBUaW1lO1xyXG5cclxuICAgICAgICBpZihzbGVlcFRpbWUgPD0gMClcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIC8vIHByb2Nlc3NpbmcgYSBmcmFtZSB0YWtlcyBtb3JlIHRpbWUgdGhhbiB0aGUgdGltZSBvZiBhIHBlcmlvZFxyXG5cclxuICAgICAgICAgICAgLy8gc3RvcmUgdGhlIG5lZ2F0aXZlIHNsZWVwIHRpbWVcclxuICAgICAgICAgICAgZXhjZXNzIC09IHNsZWVwVGltZTtcclxuXHJcbiAgICAgICAgICAgIC8vIHNldCBhIG1pbmltdW0gc2xlZXAgdGltZVxyXG4gICAgICAgICAgICBzbGVlcFRpbWUgPSAyO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gc2V0IHRoZSBuZXdseSBjYWxjdWxhdGVkIGRlbGF5XHJcbiAgICAgICAgZ2FtZVRpbWVySWQgPSBzZXRUaW1lb3V0KHJ1biwgc2xlZXBUaW1lKTtcclxuXHJcbiAgICAgICAgLy8gY29tcGVuc2F0ZSB0aGUgcHJvY2Vzc2luZ3Mgb2YgYWxsIGRlbGF5ZWQgcnVuIGNhbGxzXHJcbiAgICAgICAgLy8gYnkgdXBkYXRpbmcgZXZlcnl0aGluZyBlbHNlIGJ1dCBkcmF3aW5nLlxyXG4gICAgICAgIHdoaWxlIChleGNlc3MgPiBwZXJpb2QpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBtZS51cGRhdGVDYWxsYmFjaygpO1xyXG4gICAgICAgICAgICBleGNlc3MgLT0gcGVyaW9kO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbWUubWVhc3VyZUNhbGxiYWNrKCk7XHJcbiAgICB9XHJcblxyXG4gICAgaW5pdCgpO1xyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG59XHJcbiIsInZhciBTTWF0aCA9IHJlcXVpcmUoXCJzbWF0aFwiKTtcclxudmFyIFRyYW5zZm9ybUNhY2hlQmFzaWMgPSByZXF1aXJlKCcuL3RyYW5zZm9ybUNhY2hlQmFzaWMuanMnKTtcclxuXHJcbnZhciBzTWF0aCA9IG5ldyBTTWF0aCh7cmVzb2x1dGlvbjoxMjAwfSk7XHJcblxyXG5mdW5jdGlvbiBUcmFuc2Zvcm0oaW1hZ2VEYXRhT3JpZ2luYWwsIGNvbnRleHQpXHJcbntcclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgVHJhbnNmb3JtKSlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFRyYW5zZm9ybShpbWFnZURhdGEpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBtZSA9IHRoaXM7XHJcbiAgICB2YXIgaW1hZ2VEYXRhTW9kaWZpZWQ7XHJcbiAgICB2YXIgY2FjaGVJbnN0YW5jZTtcclxuXHJcbiAgICBmdW5jdGlvbiBpbml0KClcclxuICAgIHtcclxuICAgICAgICBpbWFnZURhdGFNb2RpZmllZCA9IGltYWdlRGF0YU9yaWdpbmFsO1xyXG4gICAgfVxyXG5cclxuICAgIG1lLmdldEltYWdlRGF0YSA9IGZ1bmN0aW9uKClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gaW1hZ2VEYXRhTW9kaWZpZWQ7XHJcbiAgICB9O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogUGVyZm9ybSB0cmFuc2Zvcm1hdGlvbiBieSByZW1hbmlwdWxhdGluZyBvcmlnaW5hbCBkYXRhLlxyXG4gICAgICogQ2FuIGJlIHVzZWQgdG8gYXBweSBvbmx5IG9uZSB0cmFuc2Zvcm1hdGlvbi5cclxuICAgICAqL1xyXG4gICAgbWUuZG8gPSBmdW5jdGlvbih0cmFuc2Zvcm1GbiwgcGFyYW1ldGVycywgY3VzdG9tQ2FjaGUpXHJcbiAgICB7XHJcbiAgICAgICAgaW1hZ2VEYXRhTW9kaWZpZWQgPSB0cmFuc2Zvcm0oaW1hZ2VEYXRhTW9kaWZpZWQsIHRyYW5zZm9ybUZuLCBwYXJhbWV0ZXJzLCBjdXN0b21DYWNoZSk7XHJcbiAgICB9O1xyXG5cclxuICAgIG1lLnJlc2V0ID0gZnVuY3Rpb24oKVxyXG4gICAge1xyXG4gICAgICAgIGltYWdlRGF0YU1vZGlmaWVkID0gaW1hZ2VEYXRhT3JpZ2luYWw7XHJcbiAgICB9O1xyXG5cclxuICAgIGZ1bmN0aW9uIGdldENhY2hlKHRyYW5zZm9ybUZuLCBjdXN0b21DYWNoZSlcclxuICAgIHtcclxuICAgICAgICBpZighY2FjaGVJbnN0YW5jZSAmJiAhY3VzdG9tQ2FjaGUpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBjYWNoZUluc3RhbmNlID0gbmV3IHRyYW5zZm9ybUZuLmNhY2hlKGltYWdlRGF0YU9yaWdpbmFsKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZihjdXN0b21DYWNoZSlcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGNhY2hlSW5zdGFuY2UgPSBjdXN0b21DYWNoZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBjYWNoZUluc3RhbmNlO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHRyYW5zZm9ybShpbWFnZURhdGFTcmMsIHRyYW5zZm9ybUZuLCBwYXJhbWV0ZXJzLCBjdXN0b21DYWNoZSlcclxuICAgIHtcclxuICAgICAgICB2YXIgY2FjaGUgPSBnZXRDYWNoZSh0cmFuc2Zvcm1GbiwgY3VzdG9tQ2FjaGUpO1xyXG5cclxuICAgICAgICB2YXIgYnVmZmVyU3JjID0gaW1hZ2VEYXRhU3JjLmRhdGEuYnVmZmVyO1xyXG4gICAgICAgIHZhciBidWZmZXJEc3QgPSBuZXcgQXJyYXlCdWZmZXIoaW1hZ2VEYXRhU3JjLmRhdGEubGVuZ3RoKTtcclxuXHJcbiAgICAgICAgdmFyIHVpbnQzMlNyYyA9IG5ldyBVaW50MzJBcnJheShidWZmZXJTcmMpO1xyXG4gICAgICAgIHZhciB1aW50MzJEc3QgPSBuZXcgVWludDMyQXJyYXkoYnVmZmVyRHN0KTtcclxuXHJcbiAgICAgICAgdmFyIHVpbnQ4Q1NyYyA9IG5ldyBVaW50OENsYW1wZWRBcnJheShidWZmZXJTcmMpO1xyXG4gICAgICAgIHZhciB1aW50OENEc3QgPSBuZXcgVWludDhDbGFtcGVkQXJyYXkoYnVmZmVyRHN0KTtcclxuXHJcbiAgICAgICAgdmFyIGltYWdlRGF0YURzdCA9IGNvbnRleHQuY3JlYXRlSW1hZ2VEYXRhKGltYWdlRGF0YVNyYyk7XHJcblxyXG4gICAgICAgIHZhciBsZW5ndGggPSB1aW50MzJTcmMubGVuZ3RoO1xyXG4gICAgICAgIHZhciB3aWR0aCA9IGltYWdlRGF0YVNyYy53aWR0aDtcclxuICAgICAgICB2YXIgY2FjaGVEYXRhID0gY2FjaGUuZGF0YTtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gW107XHJcblxyXG4gICAgICAgIC8vIGNvbnNvbGUudGltZShcIi0yXCIpO1xyXG5cclxuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0cmFuc2Zvcm1GbihpLCB1aW50MzJTcmMsIHVpbnQzMkRzdCwgcGFyYW1ldGVycywgd2lkdGgsIGNhY2hlRGF0YSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBjb25zb2xlLnRpbWVFbmQoXCItMlwiKTtcclxuXHJcbiAgICAgICAgaW1hZ2VEYXRhRHN0LmRhdGEuc2V0KHVpbnQ4Q0RzdCk7XHJcblxyXG4gICAgICAgIHJldHVybiBpbWFnZURhdGFEc3Q7XHJcbiAgICB9XHJcblxyXG4gICAgaW5pdCgpO1xyXG59XHJcblxyXG5UcmFuc2Zvcm0uU3dpcmwgPSBmdW5jdGlvbihzcmNJbmRleCwgc3JjMzIsIGRzdDMyLCBwLCB3aWR0aCwgY2FjaGUpXHJcbntcclxuICAgIHZhciBwaXhlbENhY2hlID0gY2FjaGVbc3JjSW5kZXhdO1xyXG4gICAgdmFyIG9yaWdpblggPSBwLm9yaWdpblg7XHJcbiAgICB2YXIgb3JpZ2luWSA9IHAub3JpZ2luWTtcclxuICAgIHZhciByYWRpdXMgPSBwLnJhZGl1cztcclxuXHJcbiAgICB2YXIgZGlzdGFuY2VYID0gcGl4ZWxDYWNoZS54LW9yaWdpblg7XHJcbiAgICB2YXIgZGlzdGFuY2VZID0gcGl4ZWxDYWNoZS55LW9yaWdpblk7XHJcbiAgICB2YXIgZGlzdGFuY2UgPSBNYXRoLnNxcnQoZGlzdGFuY2VYKmRpc3RhbmNlWCArIGRpc3RhbmNlWSpkaXN0YW5jZVkpO1xyXG5cclxuICAgIHZhciByYWRpYW4gPSBwLmFuZ2xlICogZGlzdGFuY2U7XHJcblxyXG4gICAgdmFyIHR4ID0gKHBpeGVsQ2FjaGUueCArIHNNYXRoLmNvcyhyYWRpYW4pICogcmFkaXVzKSB8IDA7XHJcbiAgICB2YXIgdHkgPSAocGl4ZWxDYWNoZS55ICsgc01hdGguc2luKHJhZGlhbikgKiByYWRpdXMpIHwgMDtcclxuXHJcbiAgICBpZih0eCA8IDAgfHwgdHggPiB3aWR0aC0xKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGRzdDMyW3NyY0luZGV4XSA9IHNyYzMyW3R5ICogd2lkdGggKyB0eF07XHJcbn07XHJcblxyXG5UcmFuc2Zvcm0uU3dpcmwuY2FjaGUgPSBUcmFuc2Zvcm1DYWNoZUJhc2ljO1xyXG5cclxuXHJcblRyYW5zZm9ybS5kZXNjcmlwdGlvbnMgPSB7XHJcbiAgICBTd2lybDoge1xyXG4gICAgICAgIGFyZ3VtZW50czogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcIm9yaWdpblhcIixcclxuICAgICAgICAgICAgICAgIG1pbjogTnVtYmVyLk1JTl9WQUxVRSxcclxuICAgICAgICAgICAgICAgIG1heDogTnVtYmVyLk1BWF9WQUxVRSxcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IDAsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiBcIm51bWJlclwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQ2VudGVyIHBvc2l0aW9uIG9mIHRoZSB0cmFuc2Zvcm0gb24gWCBheGlzLlwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwib3JpZ2luWVwiLFxyXG4gICAgICAgICAgICAgICAgbWluOiBOdW1iZXIuTUlOX1ZBTFVFLFxyXG4gICAgICAgICAgICAgICAgbWF4OiBOdW1iZXIuTUFYX1ZBTFVFLFxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogMCxcclxuICAgICAgICAgICAgICAgIHR5cGU6IFwibnVtYmVyXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJDZW50ZXIgcG9zaXRpb24gb2YgdGhlIHRyYW5zZm9ybSBvbiBZIGF4aXMuXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJhbmdsZVwiLFxyXG4gICAgICAgICAgICAgICAgbWluOiBOdW1iZXIuTUlOX1ZBTFVFLFxyXG4gICAgICAgICAgICAgICAgbWF4OiBOdW1iZXIuTUFYX1ZBTFVFLFxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogMC4wMzQ5LFxyXG4gICAgICAgICAgICAgICAgdHlwZTogXCJudW1iZXJcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkFuZ2xlIG9mIHRoZSB0d2lzdCBpbiByYWRpYW5zLlwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwicmFkaXVzXCIsXHJcbiAgICAgICAgICAgICAgICBtaW46IE51bWJlci5NSU5fVkFMVUUsXHJcbiAgICAgICAgICAgICAgICBtYXg6IE51bWJlci5NQVhfVkFMVUUsXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiAyMCxcclxuICAgICAgICAgICAgICAgIHR5cGU6IFwibnVtYmVyXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIF1cclxuICAgIH1cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gVHJhbnNmb3JtOyIsIlxyXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zZm9ybUNhY2hlQmFzaWM7XHJcblxyXG4vKipcclxuICogQGNsYXNzICAgICAgVHJhbnNmb3JtQ2FjaGVCYXNpY1xyXG4gKlxyXG4gKiBAcGFyYW0ge29iamVjdH0gIGltYWdlRGF0YSAgSW1hZ2VEYXRhIHRvIGNhY2hlXHJcbiAqL1xyXG5mdW5jdGlvbiBUcmFuc2Zvcm1DYWNoZUJhc2ljKGltYWdlRGF0YSlcclxue1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBUcmFuc2Zvcm1DYWNoZUJhc2ljKSlcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gbmV3IFRyYW5zZm9ybUNhY2hlQmFzaWMoaW1hZ2VEYXRhKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgbWUgPSB0aGlzO1xyXG5cclxuICAgIHZhciBkYXRhO1xyXG5cclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLCBcImRhdGFcIiwge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24oKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcmV0dXJuIGRhdGE7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgZnVuY3Rpb24gaW5pdCgpXHJcbiAgICB7XHJcbiAgICAgICAgY3JlYXRlSW5kZXhlZENhY2hlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gY3JlYXRlSW5kZXhlZENhY2hlKClcclxuICAgIHtcclxuICAgICAgICBkYXRhID0gW107XHJcblxyXG4gICAgICAgIHZhciB3aWR0aCA9IGltYWdlRGF0YS53aWR0aDtcclxuICAgICAgICB2YXIgaGVpZ2h0ID0gaW1hZ2VEYXRhLmhlaWdodDtcclxuICAgICAgICB2YXIgZGF0YUxlbmd0aCA9IHdpZHRoICogaGVpZ2h0O1xyXG4gICAgICAgIHZhciB4O1xyXG4gICAgICAgIHZhciB5O1xyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGFMZW5ndGg7IGkrKylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHggPSAoaSAlIHdpZHRoKTtcclxuICAgICAgICAgICAgeSA9IE1hdGguZmxvb3IoaSAvIHdpZHRoKTtcclxuXHJcbiAgICAgICAgICAgIGRhdGEucHVzaCh7XHJcbiAgICAgICAgICAgICAgICB4OiB4LFxyXG4gICAgICAgICAgICAgICAgeTogeSxcclxuICAgICAgICAgICAgICAgIGk6IGlcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBpbml0KCk7XHJcblxyXG59IiwiXHJcbm1vZHVsZS5leHBvcnRzID0gVHJhbnNmb3JtT3JpZ2luYWw7XHJcblxyXG5mdW5jdGlvbiBUcmFuc2Zvcm1PcmlnaW5hbChpbWFnZURhdGFPcmlnaW5hbCwgY29udGV4dClcclxue1xyXG4gICAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBUcmFuc2Zvcm1PcmlnaW5hbCkpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBUcmFuc2Zvcm1PcmlnaW5hbChpbWFnZURhdGEpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBtZSA9IHRoaXM7XHJcbiAgICB2YXIgaW1hZ2VEYXRhTW9kaWZpZWQ7XHJcblxyXG4gICAgZnVuY3Rpb24gaW5pdCgpXHJcbiAgICB7XHJcbiAgICAgICAgaW1hZ2VEYXRhTW9kaWZpZWQgPSBpbWFnZURhdGFPcmlnaW5hbDtcclxuICAgIH1cclxuXHJcbiAgICBtZS5nZXRJbWFnZURhdGEgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIGltYWdlRGF0YU1vZGlmaWVkO1xyXG4gICAgfTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFBlcmZvcm0gdHJhbnNmb3JtYXRpb24gYnkgcmVtYW5pcHVsYXRpbmcgZGF0YS5cclxuICAgICAqIENhbiBiZSB1c2VkIHRvIHBlcmZvcm0gbXVsdGlwbGUgdHJhbnNmb3JtYXRpb25zLlxyXG4gICAgICogUmVzZXQgbXVzdCBiZSBjYWxsZWQgbWFudWFsbHkgYmVmb3JlIGV4ZWN1dGluZ1xyXG4gICAgICogbmV3IHRyYW5zZm9ybWF0aW9ucy5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gICAgICB7ZnVuY3Rpb259ICB0cmFuc2Zvcm1GbiAgVGhlIGV2YWx1YXRlIHBpeGVsXHJcbiAgICAgKiBAcGFyYW0gICAgICB7b2JqZWN0fSAgcGFyYW1ldGVyc1xyXG4gICAgICovXHJcbiAgICBtZS5kbyA9IGZ1bmN0aW9uKHRyYW5zZm9ybUZuLCBwYXJhbWV0ZXJzKVxyXG4gICAge1xyXG4gICAgICAgIGltYWdlRGF0YU1vZGlmaWVkID0gdHJhbnNmb3JtKHRyYW5zZm9ybUZuLCBwYXJhbWV0ZXJzKTtcclxuICAgIH07XHJcblxyXG4gICAgbWUucmVzZXQgPSBmdW5jdGlvbigpXHJcbiAgICB7XHJcbiAgICAgICAgaW1hZ2VEYXRhTW9kaWZpZWQgPSBpbWFnZURhdGFPcmlnaW5hbDtcclxuICAgIH07XHJcblxyXG4gICAgZnVuY3Rpb24gdHJhbnNmb3JtKHRyYW5zZm9ybUZuLCB1c2VyUGFyYW1ldGVycylcclxuICAgIHtcclxuICAgICAgICB2YXIgaW1hZ2VEYXRhID0gaW1hZ2VEYXRhTW9kaWZpZWQ7XHJcbiAgICAgICAgdmFyIGltYWdlRGF0YU5ldyA9IGNvbnRleHQuY3JlYXRlSW1hZ2VEYXRhKGltYWdlRGF0YSk7XHJcblxyXG4gICAgICAgIHZhciBpbWFnZURhdGFQaXhlbHMgPSBpbWFnZURhdGEuZGF0YTtcclxuICAgICAgICB2YXIgbmV3SW1hZ2VEYXRhUGl4ZWxzID0gaW1hZ2VEYXRhTmV3LmRhdGE7XHJcblxyXG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcclxuICAgICAgICB2YXIgbGVuZ3RoID0gbmV3SW1hZ2VEYXRhUGl4ZWxzLmxlbmd0aDtcclxuICAgICAgICB2YXIgcGFyYW1ldGVycyA9IHtcclxuICAgICAgICAgICAgaW1hZ2VEYXRhOiBpbWFnZURhdGFcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB1c2VyUGFyYW1ldGVycyA9IHVzZXJQYXJhbWV0ZXJzIHx8IHt9O1xyXG5cclxuICAgICAgICBmb3IodmFyIHByb3BlcnR5IGluIHVzZXJQYXJhbWV0ZXJzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcGFyYW1ldGVyc1twcm9wZXJ0eV0gPSB1c2VyUGFyYW1ldGVyc1twcm9wZXJ0eV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSA0KVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgcGFyYW1ldGVycy5yID0gaW1hZ2VEYXRhUGl4ZWxzW2ldO1xyXG4gICAgICAgICAgICBwYXJhbWV0ZXJzLmcgPSBpbWFnZURhdGFQaXhlbHNbaSsxXTtcclxuICAgICAgICAgICAgcGFyYW1ldGVycy5iID0gaW1hZ2VEYXRhUGl4ZWxzW2krMl07XHJcbiAgICAgICAgICAgIHBhcmFtZXRlcnMuYSA9IGltYWdlRGF0YVBpeGVsc1tpKzNdO1xyXG4gICAgICAgICAgICBwYXJhbWV0ZXJzLnggPSAoaSAlIChpbWFnZURhdGEud2lkdGggPDwgMikpID4+IDI7XHJcbiAgICAgICAgICAgIHBhcmFtZXRlcnMueSA9IE1hdGguZmxvb3IoaSAvIChpbWFnZURhdGEud2lkdGggPDwgMikpO1xyXG5cclxuICAgICAgICAgICAgcmVzdWx0ID0gdHJhbnNmb3JtRm4ocGFyYW1ldGVycyk7XHJcblxyXG4gICAgICAgICAgICBuZXdJbWFnZURhdGFQaXhlbHNbaV0gICA9IHJlc3VsdFswXTsgLy8gUlxyXG4gICAgICAgICAgICBuZXdJbWFnZURhdGFQaXhlbHNbaSsxXSA9IHJlc3VsdFsxXTsgLy8gR1xyXG4gICAgICAgICAgICBuZXdJbWFnZURhdGFQaXhlbHNbaSsyXSA9IHJlc3VsdFsyXTsgLy8gQlxyXG4gICAgICAgICAgICBuZXdJbWFnZURhdGFQaXhlbHNbaSszXSA9IHJlc3VsdFszXTsgLy8gQVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGltYWdlRGF0YU5ldztcclxuICAgIH1cclxuXHJcbiAgICBpbml0KCk7XHJcbn1cclxuXHJcblRyYW5zZm9ybU9yaWdpbmFsLnNhbXBsZUxpbmVhciA9IGZ1bmN0aW9uKGltYWdlRGF0YSwgeCwgeSlcclxue1xyXG4gICAgdmFyIGRhdGEgPSBpbWFnZURhdGEuZGF0YTtcclxuICAgIHZhciBpbmRleCA9IHkgKiAoaW1hZ2VEYXRhLndpZHRoIDw8IDIpICsgKHggPDwgMik7XHJcblxyXG4gICAgcmV0dXJuIFtcclxuICAgICAgICBkYXRhW2luZGV4XSxcclxuICAgICAgICBkYXRhW2luZGV4KzFdLFxyXG4gICAgICAgIGRhdGFbaW5kZXgrMl0sXHJcbiAgICAgICAgZGF0YVtpbmRleCszXVxyXG4gICAgXTtcclxufTtcclxuXHJcblRyYW5zZm9ybU9yaWdpbmFsLmRpc3RhbmNlID0gZnVuY3Rpb24oeDEsIHkxLCB4MiwgeTIpXHJcbntcclxuICAgIHZhciBkaXN0YW5jZVggPSB4MS14MjtcclxuICAgIHZhciBkaXN0YW5jZVkgPSB5MS15MjtcclxuICAgIHJldHVybiBNYXRoLnNxcnQoZGlzdGFuY2VYKmRpc3RhbmNlWCArIGRpc3RhbmNlWSpkaXN0YW5jZVkpO1xyXG59O1xyXG5cclxuVHJhbnNmb3JtT3JpZ2luYWwuZGVncmVlc1RvUmFkaWFucyA9IGZ1bmN0aW9uKGRlZ3JlZSlcclxue1xyXG4gICAgcmV0dXJuIChkZWdyZWUvMTgwLjApKjMuMTQxNTkyNjU7XHJcbn07XHJcblxyXG5UcmFuc2Zvcm1PcmlnaW5hbC5JbnZlcnQgPSBmdW5jdGlvbihwKVxyXG57XHJcbiAgICByZXR1cm4gWzI1NS1wLnIsIDI1NS1wLmcsIDI1NS1wLmIsIHAuYV07XHJcbn07XHJcblxyXG5UcmFuc2Zvcm1PcmlnaW5hbC5HcmF5U2NhbGUgPSBmdW5jdGlvbihwKVxyXG57XHJcbiAgICB2YXIgYXZlcmFnZSA9IChwLnIgKyBwLmcgKyBwLmIpIC8zO1xyXG4gICAgcmV0dXJuIFthdmVyYWdlLCBhdmVyYWdlLCBhdmVyYWdlLCBwLmFdO1xyXG59O1xyXG5cclxuVHJhbnNmb3JtT3JpZ2luYWwuQWxwaGEgPSBmdW5jdGlvbihwKVxyXG57XHJcbiAgICByZXR1cm4gW3AuciwgcC5nLCBwLmIsIHAudmFsdWVdO1xyXG59O1xyXG5cclxuLy8gV2VpZ2h0ZWQgYWxwaGEgYmxlbmQgYmV0d2VlbiB0d28gaW1hZ2VzLlxyXG4vLyBVc2VkIGZvciBkcmF3aW5nIGltYWdlcyB3aXRoIGFscGhhIGNvbG9yc1xyXG4vLyBvbiB0b3Agb2Ygb3RoZXIgaW1hZ2VzXHJcblRyYW5zZm9ybU9yaWdpbmFsLldlaWdodGVkQWxwaGFCbGVuZCA9IGZ1bmN0aW9uKHApXHJcbntcclxuICAgIHZhciBwMiA9IFRyYW5zZm9ybU9yaWdpbmFsLnNhbXBsZUxpbmVhcihwLmltYWdlRGF0YTIsIHAueCwgcC55KTtcclxuICAgIHZhciBwMmEgPSBwMlszXTtcclxuICAgIHZhciBwMmFQY3QgPSBwMmEgLyAyNTU7XHJcblxyXG4gICAgaWYocDJhID09PSAyNTUpXHJcbiAgICB7XHJcbiAgICAgICAgcmV0dXJuIFtwMlswXSwgcDJbMV0sIHAyWzJdLCBwMlszXV07XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmKHAyYSA9PT0gMClcclxuICAgIHtcclxuICAgICAgICByZXR1cm4gW3AuciwgcC5nLCBwLmIsIHAuYV07XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIFtcclxuICAgICAgICBnZXRHZXRDb2xvckZyb21HcmFkaWVudChwLnIsIHAyWzBdLCBwMmFQY3QpLFxyXG4gICAgICAgIGdldEdldENvbG9yRnJvbUdyYWRpZW50KHAuZywgcDJbMV0sIHAyYVBjdCksXHJcbiAgICAgICAgZ2V0R2V0Q29sb3JGcm9tR3JhZGllbnQocC5iLCBwMlsyXSwgcDJhUGN0KSxcclxuICAgICAgICBwLmEgPiBwMmEgPyBwLmEgOiBwMmFcclxuICAgIF07XHJcbn07XHJcblxyXG5UcmFuc2Zvcm1PcmlnaW5hbC5Sb3RhdGUgPSBmdW5jdGlvbihwKVxyXG57XHJcbiAgICB2YXIgZGVncmVlID0gcC5kZWdyZWU7XHJcblxyXG4gICAgdmFyIHJhZGlhbiA9IFRyYW5zZm9ybU9yaWdpbmFsLmRlZ3JlZXNUb1JhZGlhbnMoZGVncmVlKTtcclxuICAgIHZhciB0eCA9IE1hdGgucm91bmQocC54Kk1hdGguY29zKHJhZGlhbikgLSBwLnkqTWF0aC5zaW4ocmFkaWFuKSk7XHJcbiAgICB2YXIgdHkgPSBNYXRoLnJvdW5kKHAueCpNYXRoLnNpbihyYWRpYW4pICsgcC55Kk1hdGguY29zKHJhZGlhbikpO1xyXG5cclxuICAgIHJldHVybiBUcmFuc2Zvcm1PcmlnaW5hbC5zYW1wbGVMaW5lYXIocC5pbWFnZURhdGEsIHR4LCB0eSk7XHJcbn07XHJcblxyXG5UcmFuc2Zvcm1PcmlnaW5hbC5Td2lybCA9IGZ1bmN0aW9uKHApXHJcbntcclxuICAgIHZhciBvcmlnaW5YID0gcC5vcmlnaW5YO1xyXG4gICAgdmFyIG9yaWdpblkgPSBwLm9yaWdpblk7XHJcbiAgICB2YXIgZGVncmVlID0gcC5kZWdyZWU7XHJcbiAgICB2YXIgcmFkaXVzID0gcC5yYWRpdXM7XHJcblxyXG4gICAgdmFyIGRpc3RhbmNlID0gVHJhbnNmb3JtT3JpZ2luYWwuZGlzdGFuY2UocC54LCBwLnksIG9yaWdpblgsIG9yaWdpblkpO1xyXG5cclxuICAgIC8vIHJhZGlhbiBpcyB0aGUgZ3JlYXRlciB0aGUgZmFydGhlciB0aGUgcGl4ZWwgaXMgZnJvbSBvcmlnaW5cclxuICAgIHZhciByYWRpYW4gPSBUcmFuc2Zvcm1PcmlnaW5hbC5kZWdyZWVzVG9SYWRpYW5zKGRlZ3JlZSAqIGRpc3RhbmNlKTtcclxuICAgIHZhciB0eCA9IG9yaWdpblggKyBNYXRoLmNvcyhyYWRpYW4pKnJhZGl1cztcclxuICAgIHZhciB0eSA9IG9yaWdpblkgLSBNYXRoLnNpbihyYWRpYW4pKnJhZGl1cztcclxuXHJcbiAgICB0eCAtPSBvcmlnaW5YO1xyXG4gICAgdHkgLT0gb3JpZ2luWTtcclxuXHJcbiAgICB0eCA9IE1hdGgucm91bmQocC54IC0gdHgpO1xyXG4gICAgdHkgPSBNYXRoLnJvdW5kKHAueSAtIHR5KTtcclxuXHJcbiAgICByZXR1cm4gVHJhbnNmb3JtT3JpZ2luYWwuc2FtcGxlTGluZWFyKHAuaW1hZ2VEYXRhLCB0eCwgdHkpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdldCBjb2xvciB2YWx1ZSBiZXR3ZWVuIHR3byBjb2xvciBjb21wb25lbnQgYXQgdGhlIHNwZWNpZmllZCBwb3NpdGlvblxyXG4gKiBAcGFyYW0gY29sb3JDb21wb25lbnQxIGNvbG9yIGNvbXBvbmVudCBlLmcuIHJlZCB2YWx1ZSBmcm9tIDAgdG8gMjU1XHJcbiAqIEBwYXJhbSBjb2xvckNvbXBvbmVudDIgY29sb3IgY29tcG9uZW50IGUuZy4gcmVkIHZhbHVlIGZyb20gMCB0byAyNTVcclxuICogQHBhcmFtIHBvc2l0aW9uIFBvc2l0aW9uIG9mIHRoZSBjb2xvciBpbiBncmFkaWVudC4gTnVtYmVyIHZhbHVlIGZyb20gMCB0byAxXHJcbiAqIEByZXR1cm4gbnVtYmVyIGJldHdlZW4gMCB0byAyNTVcclxuICovXHJcbmZ1bmN0aW9uIGdldEdldENvbG9yRnJvbUdyYWRpZW50KGNvbG9yQ29tcG9uZW50MSwgY29sb3JDb21wb25lbnQyLCBwb3NpdGlvbilcclxue1xyXG4gICAgcmV0dXJuIGNvbG9yQ29tcG9uZW50MSAtIHBvc2l0aW9uICogKGNvbG9yQ29tcG9uZW50MSAtIGNvbG9yQ29tcG9uZW50Mik7XHJcbn1cclxuXHJcblRyYW5zZm9ybU9yaWdpbmFsLmRlc2NyaXB0aW9ucyA9IHtcclxuICAgIEludmVydDoge1xyXG4gICAgICAgIGFyZ3VtZW50czogW11cclxuICAgIH0sXHJcbiAgICBHcmF5U2NhbGU6IHtcclxuICAgICAgICBhcmd1bWVudHM6IFtdXHJcbiAgICB9LFxyXG4gICAgQWxwaGE6IHtcclxuICAgICAgICBhcmd1bWVudHM6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTpcInZhbHVlXCIsXHJcbiAgICAgICAgICAgICAgICBtaW46IDAsXHJcbiAgICAgICAgICAgICAgICBtYXg6IDI1NSxcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IDI1NSxcclxuICAgICAgICAgICAgICAgIHR5cGU6IFwibnVtYmVyXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJDb250cm9sIHRoZSBhbHBoYSBjaGFubmVsIG9mIHBpeGVscy5cIlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXVxyXG4gICAgfSxcclxuICAgIFJvdGF0ZToge1xyXG4gICAgICAgIGFyZ3VtZW50czogW11cclxuICAgIH0sXHJcbiAgICBTd2lybDoge1xyXG4gICAgICAgIGFyZ3VtZW50czogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcIm9yaWdpblhcIixcclxuICAgICAgICAgICAgICAgIG1pbjogTnVtYmVyLk1JTl9WQUxVRSxcclxuICAgICAgICAgICAgICAgIG1heDogTnVtYmVyLk1BWF9WQUxVRSxcclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IDAsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiBcIm51bWJlclwiLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQ2VudGVyIHBvc2l0aW9uIG9mIHRoZSB0cmFuc2Zvcm0gb24gWCBheGlzLlwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwib3JpZ2luWVwiLFxyXG4gICAgICAgICAgICAgICAgbWluOiBOdW1iZXIuTUlOX1ZBTFVFLFxyXG4gICAgICAgICAgICAgICAgbWF4OiBOdW1iZXIuTUFYX1ZBTFVFLFxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogMCxcclxuICAgICAgICAgICAgICAgIHR5cGU6IFwibnVtYmVyXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJDZW50ZXIgcG9zaXRpb24gb2YgdGhlIHRyYW5zZm9ybSBvbiBZIGF4aXMuXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJhbmdsZVwiLFxyXG4gICAgICAgICAgICAgICAgbWluOiBOdW1iZXIuTUlOX1ZBTFVFLFxyXG4gICAgICAgICAgICAgICAgbWF4OiBOdW1iZXIuTUFYX1ZBTFVFLFxyXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogMC4wMzQ5LFxyXG4gICAgICAgICAgICAgICAgdHlwZTogXCJudW1iZXJcIixcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkFuZ2xlIG9mIHRoZSB0d2lzdCBpbiByYWRpYW5zLlwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwicmFkaXVzXCIsXHJcbiAgICAgICAgICAgICAgICBtaW46IE51bWJlci5NSU5fVkFMVUUsXHJcbiAgICAgICAgICAgICAgICBtYXg6IE51bWJlci5NQVhfVkFMVUUsXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiAyMCxcclxuICAgICAgICAgICAgICAgIHR5cGU6IFwibnVtYmVyXCIsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIF1cclxuICAgIH1cclxufTtcclxuIl19
