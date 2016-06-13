var ImageTester = {

    COLOR32_CORNER: 4294967040, // abgr FFFFFF00
    COLOR32_R: 4278190335, // abgr FF0000FF
    COLOR32_G: 4278255360, // abgr FF00FF00
    COLOR32_B: 4294901760, // abgr FFFF0000
    COLOR32_CORNER_INVERTED: 4278190335, // agbr FF0000FF
    COLOR32_CORNER_GRAYSCALE: 4289374890, // agbr FFAAAAAA

    TEST_IMAGE_WIDTH: 20,
    TEST_IMAGE_HEIGHT: 20,

    expectImageDataSizeToBe: function(imageData, width, height)
    {
        expect(imageData.width).toEqual(width);
        expect(imageData.height).toEqual(height);

        var expectedDataLength = width * height * 4;

        expect(expectedDataLength).toEqual(imageData.data.length);
    },

    expectToHaveImageDataProperties: function(imageData)
    {
        var hasWidth = imageData.hasOwnProperty("width");
        var hasHeight = imageData.hasOwnProperty("height");
        var hasData = imageData.hasOwnProperty("data");

        expect(hasWidth).toEqual(true);
        expect(hasHeight).toEqual(true);
        expect(hasData).toEqual(true);
    },

    expectTestImagePositionToBeOnCanvas: function(canvas, x, y)
    {
        ImageTester.expectPixelToBe(canvas, x, y, ImageTester.COLOR32_CORNER);
        ImageTester.expectPixelToBe(canvas, x+ImageTester.TEST_IMAGE_WIDTH-1, y, ImageTester.COLOR32_CORNER);
        ImageTester.expectPixelToBe(canvas, x, y+ImageTester.TEST_IMAGE_HEIGHT-1, ImageTester.COLOR32_CORNER);
        ImageTester.expectPixelToBe(canvas, x+ImageTester.TEST_IMAGE_WIDTH-1, y+ImageTester.TEST_IMAGE_HEIGHT-1, ImageTester.COLOR32_CORNER);
    },

    expectTestImageToBeRemovedFromCanvas: function(canvas, x, y)
    {
        ImageTester.expectPixelToBe(canvas, x, y, 0);
        ImageTester.expectPixelToBe(canvas, x+ImageTester.TEST_IMAGE_WIDTH-1, y, 0);
        ImageTester.expectPixelToBe(canvas, x, y+ImageTester.TEST_IMAGE_HEIGHT-1, 0);
        ImageTester.expectPixelToBe(canvas, x+ImageTester.TEST_IMAGE_WIDTH-1, y+ImageTester.TEST_IMAGE_HEIGHT-1, 0);
    },

    expectPixelToBe: function(canvas, x, y, value)
    {
        var color = ImageTester.getPixel32(canvas, x, y);
        expect(color).toEqual(value);
    },

    createTestImage: function(width, height)
    {
        width = width || 20;
        height = height || 20;

        var canvas = createCanvas(width, height);
        var context = canvas.getContext("2d");
        var ypos = 0;

        drawTransparentLines();
        drawBackground();
        drawCorners();

        function drawBackground()
        {
            context.fillStyle = "#000000";
            context.fillRect(0,y(),width,height);
        }

        function drawTransparentLines()
        {
            context.fillStyle = "rgba(0,0,0,1)";
            context.fillRect(0,y(),width,2);
            context.fillStyle = "rgba(0,0,0,0.6)";
            context.fillRect(0,y(),width,2);
            context.fillStyle = "rgba(0,0,0,0.3)";
            context.fillRect(0,y(),width,2);
            context.fillStyle = "rgba(0,0,0,0)";
            context.fillRect(0,y(),width,2);
        }

        function drawCorners()
        {
            context.fillStyle = "#00FFFF";
            context.fillRect(0,0,1,1);
            context.fillRect(width-1, 0, 1, 1);
            context.fillRect(width-1, height-1, 1, 1);
            context.fillRect(0, height-1, 1, 1);
        }

        function y()
        {
            var _ypos = ypos;
            ypos += 2;
            return _ypos;
        }

        function createCanvas(width, height)
        {
            var canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            return canvas;
        }

        function getImageDataFromCanvas(canvas)
        {
            var context = canvas.getContext("2d");
            return context.getImageData(0, 0, canvas.width, canvas.height);
        }

        return getImageDataFromCanvas(canvas);
    },

    getPixel32: function(canvas, x, y)
    {
        var context = canvas.getContext("2d");
        var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        var uint32View = new Uint32Array(imageData.data.buffer);
        return uint32View[y * canvas.width + x];
    },

};

module.exports = ImageTester;