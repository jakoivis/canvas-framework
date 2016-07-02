
var ImageDataUtil = {

    // R  "rgba(255,0,0,1)"; = 4278190335 = FF0000FF
    // G  "rgba(0,255,0,1)"; = 4278255360 = FF00FF00
    // B  "rgba(0,0,255,1)"; = 4294901760 = FFFF0000
    // A1 "rgba(0,0,0,0.5)"; = 2130706432 = 7F000000
    // A2 "rgba(0,0,0,0)"    = 0          = 0

    RGBA32: {
        R: 0xFF0000FF,
        G: 0xFF00FF00,
        B: 0xFFFF0000,
        A1: 0x7F000000,
        A2: 0
    },

    /**
     * @return {Promise}
     */
    getImageTag: function ()
    {
        var resolveLoad;

        ImageDataUtil.loader = new ImageLoader({

            images:['assets/test.png'],

            onComplete: function() {

                resolveLoad(ImageDataUtil.loader.getItemAt(0).tag);
            }
        });

        return new Promise(function(resolve) {

            resolveLoad = resolve;
        });
    },

    /**
     * @return {Promise}
     */
    getImageData: function ()
    {
        return ImageDataUtil.getImageTag()
            .then(function(image) {

                return new CanvasUtil().getImageData(image);
            });
    },

    createTestImage: function()
    {
        var SIZE = 10;
        var canvas = document.createElement("canvas");
        var context = canvas.getContext("2d");
        canvas.width = SIZE;
        canvas.height = SIZE;

        context.fillStyle = "rgba(0,0,0,0.5)";
        context.fillRect(0,0,SIZE,SIZE);

        ImageDataUtil.setPixel32At(canvas, 0, 0, ImageDataUtil.RGBA32.R);
        ImageDataUtil.setPixel32At(canvas, SIZE-1, 0, ImageDataUtil.RGBA32.R);
        ImageDataUtil.setPixel32At(canvas, 0, SIZE-1, ImageDataUtil.RGBA32.R);
        ImageDataUtil.setPixel32At(canvas, SIZE-1, SIZE-1, ImageDataUtil.RGBA32.R);
        ImageDataUtil.setPixel32At(canvas, 1, 0, ImageDataUtil.RGBA32.A2);
        ImageDataUtil.setPixel32At(canvas, 2, 0, ImageDataUtil.RGBA32.A1);

        return context.getImageData(0, 0, SIZE, SIZE);
    },

    shouldHaveImageAt: function(canvas, x, y)
    {
        ImageDataUtil.getCanvasPixel32At(canvas, x+0,y+0).should.equal(ImageDataUtil.RGBA32.R);
        ImageDataUtil.getCanvasPixel32At(canvas, x+9,y+0).should.equal(ImageDataUtil.RGBA32.R);
        ImageDataUtil.getCanvasPixel32At(canvas, x+0,y+9).should.equal(ImageDataUtil.RGBA32.R);
        ImageDataUtil.getCanvasPixel32At(canvas, x+9,y+9).should.equal(ImageDataUtil.RGBA32.R);
    },

    shouldNotHaveImageAt: function(canvas, x, y)
    {
        ImageDataUtil.getCanvasPixel32At(canvas, x+0,y+0).should.equal(0);
        ImageDataUtil.getCanvasPixel32At(canvas, x+9,y+0).should.equal(0);
        ImageDataUtil.getCanvasPixel32At(canvas, x+0,y+9).should.equal(0);
        ImageDataUtil.getCanvasPixel32At(canvas, x+9,y+9).should.equal(0);
    },

    getCanvasPixel32At: function(canvas, x, y)
    {
        var context = canvas.getContext("2d");
        var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        var uint8CView = imageData.data;
        var uint32View = new Uint32Array(uint8CView.buffer);
        return uint32View[y * canvas.width + x];
    },

    setPixel32At(canvas, x, y, color)
    {
        var context = canvas.getContext("2d");
        var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        var uint8CView = imageData.data;
        var uint32View = new Uint32Array(uint8CView.buffer);
        uint32View[y * canvas.width + x] = color;
        imageData.data.set(uint8CView);
        context.putImageData(imageData, 0, 0);
    }
};

module.exports = ImageDataUtil;


