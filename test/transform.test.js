describe("Transform:", function() {

    ClassTester.classTest(Transform);

    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");
    var testImage = ImageTester.createTestImage();
    var transform;

    beforeEach(function() {
        transform = new Transform(testImage, context);
        context.clearRect(0, 0, canvas.width, canvas.height);
    });

    afterEach(function() {
    });

    describe("transforms", function() {

        it("Invert", function() {
            transform.do(Transform.Invert);
            var result = transform.getImageData();
            context.putImageData(result, 0, 0);
            ImageTester.expectPixelToBe(canvas, 0, 0, ImageTester.COLOR32_CORNER_INVERTED);
        });

        it("GrayScale", function() {
            transform.do(Transform.GrayScale);
            var result = transform.getImageData();
            context.putImageData(result, 0, 0);
            ImageTester.expectPixelToBe(canvas, 0, 0, ImageTester.COLOR32_CORNER_GRAYSCALE);
        });
    });

    describe("chaining", function() {

        it("do returns instance of Transform", function() {
            // var x = transform.do(Transform.GrayScale);
        });

        it("value returned to variable is imageData", function() {
            // var x = transform.do(Transform.GrayScale).do(Transform.Invert).getImageData();
        });
    });

    describe("", function() {

        it("sampleLinear", function() {
            var pixel = Transform.sampleLinear(testImage, 0, 0);
            expect(pixel[0]).toEqual(0);    // R
            expect(pixel[1]).toEqual(255);  // G
            expect(pixel[2]).toEqual(255);  // B
            expect(pixel[3]).toEqual(255);  // A

            // console.log(testImage.data);
            pixel = Transform.sampleLinear(testImage, 19, 19);
            expect(pixel[0]).toEqual(0);    // R
            expect(pixel[1]).toEqual(255);  // G
            expect(pixel[2]).toEqual(255);  // B
            expect(pixel[3]).toEqual(255);  // A
        });
    })

});