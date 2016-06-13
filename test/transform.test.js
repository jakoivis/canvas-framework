var ImageTester = require("./helpers/imageTester.js");

describe("Transform:", function() {

    // ClassTester.classTest(Transform);

    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");
    var testImage = ImageTester.createTestImage();
    var testImage2x2 = ImageTester.createTestImage(2,2);
    var transform;

    beforeEach(function() {
        transform = new Transform(testImage, context);
        context.clearRect(0, 0, canvas.width, canvas.height);
    });

    afterEach(function() {
    });

    xdescribe("Class", function() {

        it("Pixel evaluation functions are shared between instances", function() {
            var transform2 = new Transform(testImage, context);
            var isSame = transform.Invert === transform2.Invert;
            expect(isSame).toEqual(true);
        });
    });

    xdescribe("transforms", function() {

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

    xdescribe("chaining", function() {

        it("do returns instance of Transform", function() {
            // var x = transform.do(Transform.GrayScale);
        });

        it("value returned to variable is imageData", function() {
            // var x = transform.do(Transform.GrayScale).do(Transform.Invert).getImageData();
        });
    });

    xdescribe("", function() {

        it("sampleLinear", function() {
            var pixel = Transform.sampleLinear(testImage, 0, 0);
            expect(pixel[0]).toEqual(0);    // R
            expect(pixel[1]).toEqual(255);  // G
            expect(pixel[2]).toEqual(255);  // B
            expect(pixel[3]).toEqual(255);  // A

            pixel = Transform.sampleLinear(testImage, 19, 19);
            expect(pixel[0]).toEqual(0);    // R
            expect(pixel[1]).toEqual(255);  // G
            expect(pixel[2]).toEqual(255);  // B
            expect(pixel[3]).toEqual(255);  // A
        });
    });

    xdescribe("pixel evaluation function", function() {

        it("Pixel evaluation is performed correct number of times", function() {

            var foo = {bar: function() {return Transform.Invert}};
            spyOn(foo, "bar").and.callThrough();

            var transform = new Transform(testImage2x2, context);
            transform.do(foo.bar);

            expect(foo.bar.calls.count()).toEqual(4);
        });

        it("Pixel evaluation function gets color of the pixel", function() {

            var foo = {bar: function(p) {return Transform.Invert(p)}};
            spyOn(foo, "bar").and.callThrough();

            var transform = new Transform(testImage2x2, context);
            transform.do(foo.bar);

            var argument = foo.bar.calls.argsFor(0)[0];
            expect(argument.r).toEqual(0);
            expect(argument.g).toEqual(255);
            expect(argument.b).toEqual(255);
            expect(argument.a).toEqual(255);
        });

        // it("Pixel evaluation function gets coordinates of the pixel", function() {

        //     var foo = {bar: function(p) {return Transform.Invert(p)}};
        //     spyOn(foo, "bar").and.callThrough();

        //     var transform = new Transform(testImage2x2, context);
        //     transform.do(foo.bar);

        //     var argument = foo.bar.calls.argsFor(2)[0];
        //     console.log(argument);
        //     expect(argument.x).toEqual(0);
        //     expect(argument.y).toEqual(0);
        // });

        it("Pixel evaluation function gets custom parameters", function() {

            var foo = {bar: function(p) {return Transform.Invert(p)}};
            spyOn(foo, "bar").and.callThrough();

            var transform = new Transform(testImage2x2, context);
            transform.do(foo.bar, {test1:"test1", test2:"test2"});

            var argument = foo.bar.calls.argsFor(0)[0];
            expect(argument.test1).toEqual("test1");
            expect(argument.test2).toEqual("test2");
        });
    });

    xdescribe("resetting and cumulative effects", function() {

        it("first transform is done against original image", function() {

            var originalPixel1R = 0;
            var originalPixel1G = 255;
            var invertedPixel1R = 255;
            var invertedPixel1G = 0;

            // check the original pixel values match original image
            var pixel1R = testImage2x2.data[0];
            var pixel1G = testImage2x2.data[1];

            expect(pixel1R).toEqual(originalPixel1R);
            expect(pixel1G).toEqual(originalPixel1G);

            // do invert
            var transform = new Transform(testImage2x2, context);
            transform.do(Transform.Invert);

            // check that values are inverted
            pixel1R = transform.getImageData().data[0];
            pixel1G = transform.getImageData().data[1];

            expect(pixel1R).toEqual(invertedPixel1R);
            expect(pixel1G).toEqual(invertedPixel1G);
        });

        it("second transform is done against modified image", function() {

            var originalPixel1R = 0;
            var originalPixel1G = 255;

            // do invert twice
            var transform = new Transform(testImage2x2, context);
            transform.do(Transform.Invert);
            transform.do(Transform.Invert);

            // pixel values should match original image
            var pixel1R = transform.getImageData().data[0];
            var pixel1G = transform.getImageData().data[1];

            expect(pixel1R).toEqual(originalPixel1R);
            expect(pixel1G).toEqual(originalPixel1G);
        });

        it("reset sets the next transform done against original image", function() {

            var originalPixel1R = 0;
            var originalPixel1G = 255;
            var invertedPixel1R = 255;
            var invertedPixel1G = 0;

            // do invert
            var transform = new Transform(testImage2x2, context);
            transform.do(Transform.Invert);

            transform.reset();

            // pixel values should match the original image
            var pixel1R = transform.getImageData().data[0];
            var pixel1G = transform.getImageData().data[1];

            expect(pixel1R).toEqual(originalPixel1R);
            expect(pixel1G).toEqual(originalPixel1G);

            // invert again
            transform.do(Transform.Invert);

            // pixel values should be inverted
            pixel1R = transform.getImageData().data[0];
            pixel1G = transform.getImageData().data[1];

            expect(pixel1R).toEqual(invertedPixel1R);
            expect(pixel1G).toEqual(invertedPixel1G);

        });
    });

});