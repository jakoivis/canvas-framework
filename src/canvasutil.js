
module.exports = new CanvasUtil();

/**
 * @class CanvasUtil
 */
function CanvasUtil()
{
    'use strict';

    if(CanvasUtil.prototype.instance)
    {
        return CanvasUtil.prototype.instance;
    }

    if (!(this instanceof CanvasUtil))
    {
        return new CanvasUtil();
    }

    CanvasUtil.prototype.instance = this;

    var me = this;

    var _canvas = null;
    var _context = null;

    function init()
    {
        me.reset();
    }

    /**
     * Reset the temporal canvas
     */
    me.reset = function()
    {
        _canvas = document.createElement("canvas");
        _context = _canvas.getContext("2d");
    };

    /**
     * Get ImageData of CanvasImageSource
     *
     * @param  {canvasImageSource}  image   Source image
     * @return {ImageData}
     */
    me.getImageData = function(image)
    {
        updateCanvasSize(image);
        clearContext(image);
        drawImageToContext(image);
        return getImageData(image);
    }

    /**
     * Creates an image data.
     *
     * @param      {ImageData}  object
     */
    me.createImageData = function(imageData)
    {
        return _context.createImageData(imageData);
    }

    function updateCanvasSize(image)
    {
        if (_canvas.width < image.width)
        {
            _canvas.width = image.width;
        }

        if(_canvas.height < image.height)
        {
            _canvas.height = image.height;
        }
    }

    function clearContext(image)
    {
        _context.clearRect(0, 0, image.width, image.height);
    }

    function drawImageToContext(image)
    {
        _context.drawImage(image, 0, 0);
    }

    function getImageData(image)
    {
        return _context.getImageData(0, 0, image.width, image.height);
    }

    init();

    return this;
}
