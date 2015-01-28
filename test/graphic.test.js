describe("Graphic:", function() {

    ClassTester.classTest(Graphic);

    var imageData = ImageTester.createTestImage();



    describe("options", function() {

        it("default values without options", function() {
            var graphic = new Graphic();
            expect(graphic.x).toEqual(0);
            expect(graphic.y).toEqual(0);
            expect(graphic.onRollOver).toEqual(undefined);
            expect(graphic.onRollOut).toEqual(undefined);
            expect(graphic.onClick).toEqual(undefined);
            expect(graphic.getImageData()).toEqual(undefined);
        });

        it("define values in options", function() {
            var graphic = new Graphic({
                x: 1,
                y: 2,
                onRollOver: function() {return 3;},
                onRollOut: function() {return 4;},
                onClick: function(){return 5;},
                imageData: ImageTester.createTestImage(),
            });

            expect(graphic.x).toEqual(1);
            expect(graphic.y).toEqual(2);
            expect(graphic.onRollOver()).toEqual(3);
            expect(graphic.onRollOut()).toEqual(4);
            expect(graphic.onClick()).toEqual(5);

            var imageData = graphic.getImageData();
            ImageTester.expectToHaveImageDataProperties(imageData);
            ImageTester.expectImageDataSizeToBe(imageData, 20, 20);
        });
    });



    describe("setImageData", function(){

        it("check that imageData32 view is in sync with imageData", function() {
            var graphic = new Graphic();
            graphic.setImageData(ImageTester.createTestImage());
            var hasPixel = graphic.hasGlobalPixelAt(0,0);
            expect(hasPixel).toEqual(true);
        });
    });



    describe("positions and rendering:", function() {

        it("is (0,0)", function() {
            var graphic = new Graphic({imageData:imageData});
            var canvas = document.createElement("canvas");
            var context = canvas.getContext("2d");
            graphic.setRenderContext(context);
            graphic.render();
            ImageTester.expectTestImagePositionToBeOnCanvas(canvas, 0, 0);
        });

        it("is (10,10)", function() {
            var graphic = new Graphic({imageData:imageData, x: 10, y: 10});
            var canvas = document.createElement("canvas");
            var context = canvas.getContext("2d");
            graphic.setRenderContext(context);
            graphic.render();
            ImageTester.expectTestImagePositionToBeOnCanvas(canvas, 10, 10);
        });

        it("is (10,10) after changing position and rerendering", function() {
            var graphic = new Graphic({imageData:imageData, x: 0, y: 0});
            var canvas = document.createElement("canvas");
            var context = canvas.getContext("2d");
            graphic.setRenderContext(context);
            graphic.x = 10;
            graphic.y = 10;
            graphic.render();
            ImageTester.expectTestImagePositionToBeOnCanvas(canvas, 10, 10);
        });
    });



    describe("rects:", function() {
        it("getRect should get dimensions and position when initialized", function() {
            var graphic = new Graphic({imageData:imageData, x: 2, y:3});
            var rect = graphic.getRect();

            expect(rect.left).toEqual(2);
            expect(rect.top).toEqual(3);
            expect(rect.width).toEqual(20);
            expect(rect.height).toEqual(20);
            expect(rect.right).toEqual(22);
            expect(rect.bottom).toEqual(23);
        });

        it("getRect should have updated position when x or y changes", function() {
            var graphic = new Graphic({imageData:imageData, x: 2, y:3});
            var rect = graphic.getRect();

            graphic.x = 5;
            rect = graphic.getRect();

            expect(rect.left).toEqual(5);
            expect(rect.top).toEqual(3);
            expect(rect.width).toEqual(20);
            expect(rect.height).toEqual(20);
            expect(rect.right).toEqual(25);
            expect(rect.bottom).toEqual(23);

            graphic.y = 8;
            rect = graphic.getRect();

            expect(rect.left).toEqual(5);
            expect(rect.top).toEqual(8);
            expect(rect.width).toEqual(20);
            expect(rect.height).toEqual(20);
            expect(rect.right).toEqual(25);
            expect(rect.bottom).toEqual(28);
        });
    });



    describe("intersepting:", function() {
        it("isIntersecting should return false when rectangle is not intersepting", function() {
            var graphic = new Graphic({imageData:imageData, x: 10, y:10});
            var rect = {left: 0, top: 0, right: 9, bottom:9};
            expect(graphic.isIntersecting(rect)).toEqual(false);
        });

        it("isIntersecting should return true when rectangle is intersepting", function() {
            var graphic = new Graphic({imageData:imageData, x: 10, y:10});
            var rect = {left: 0, top: 0, right: 10, bottom:10};
            expect(graphic.isIntersecting(rect)).toEqual(true);
        });
    });



    describe("Remove graphic:", function() {

        it("removed graphic should leave fully transparent pixels", function() {
            var graphic = new Graphic({imageData:imageData});
            var canvas = document.createElement("canvas");
            var context = canvas.getContext("2d");
            graphic.setRenderContext(context);
            graphic.render();
            graphic.clear();
            ImageTester.expectTestImageToBeRemovedFromCanvas(canvas, 0,0);
        });

        it("removed graphic from moved position should leave fully transparent pixels", function() {
            var graphic = new Graphic({imageData:imageData});
            var canvas = document.createElement("canvas");
            var context = canvas.getContext("2d");
            graphic.setRenderContext(context);
            graphic.render();
            graphic.clear();
            graphic.x = 200;
            graphic.y = 100;
            graphic.render();
            graphic.clear();
            ImageTester.expectTestImageToBeRemovedFromCanvas(canvas, 0,0);
            ImageTester.expectTestImageToBeRemovedFromCanvas(canvas, 200,100);
        });
    });



    describe("local and global coordinates", function() {

        it("globalToLocal", function() {
            var graphic = new Graphic({imageData:imageData, x: 100, y: 200});
            var localCoordinates = graphic.globalToLocal(0, 0);
            expect(localCoordinates.x).toEqual(-100);
            expect(localCoordinates.y).toEqual(-200);
            localCoordinates = graphic.globalToLocal(110, 210);
            expect(localCoordinates.x).toEqual(10);
            expect(localCoordinates.y).toEqual(10);
        });

        it("localToGlobal", function() {
            var graphic = new Graphic({imageData:imageData, x: 100, y: 200});
            var globalCoordinates = graphic.localToGlobal(0, 0);
            expect(globalCoordinates.x).toEqual(100);
            expect(globalCoordinates.y).toEqual(200);
            globalCoordinates = graphic.localToGlobal(110, 210);
            expect(globalCoordinates.x).toEqual(210);
            expect(globalCoordinates.y).toEqual(410);
        });
    });



    describe("hasGlobalPixelAt:", function() {

        describe("off bounding box. return false when", function() {

            it("x and y don't hit", function() {
                var graphic = new Graphic({imageData:imageData, x: 10, y: 10});
                var canvas = document.createElement("canvas");
                var context = canvas.getContext("2d");
                graphic.setRenderContext(context);
                var actual = graphic.hasGlobalPixelAt(5,5);
                expect(actual).toEqual(false);
            });

            it("y hits, x doesn't (left)", function() {
                var graphic = new Graphic({imageData:imageData, x: 10, y: 10});
                var canvas = document.createElement("canvas");
                var context = canvas.getContext("2d");
                graphic.setRenderContext(context);
                var actual = graphic.hasGlobalPixelAt(5,15);
                expect(actual).toEqual(false);
            });

            it("y hits, x doesn't (right)", function() {
                var graphic = new Graphic({imageData:imageData, x: 10, y: 10});
                var canvas = document.createElement("canvas");
                var context = canvas.getContext("2d");
                graphic.setRenderContext(context);
                var actual = graphic.hasGlobalPixelAt(35,10);
                expect(actual).toEqual(false);
            });

            it("x hits, y doesn't (top)", function() {
                var graphic = new Graphic({imageData:imageData, x: 10, y: 10});
                var canvas = document.createElement("canvas");
                var context = canvas.getContext("2d");
                graphic.setRenderContext(context);
                var actual = graphic.hasGlobalPixelAt(10, 5);
                expect(actual).toEqual(false);
            });

            it("x hits, y doesn't (bottom)", function() {
                var graphic = new Graphic({imageData:imageData, x: 10, y: 10});
                var canvas = document.createElement("canvas");
                var context = canvas.getContext("2d");
                graphic.setRenderContext(context);
                var actual = graphic.hasGlobalPixelAt(15, 35);
                expect(actual).toEqual(false);
            });
        });



        describe("corners, return graphic:", function() {

            it("left top", function() {
                var graphic = new Graphic({imageData:imageData, x: 10, y: 10});
                var canvas = document.createElement("canvas");
                var context = canvas.getContext("2d");
                graphic.setRenderContext(context);
                var actual = graphic.hasGlobalPixelAt(10,10);
                expect(actual).toEqual(true);
            });

            it("bottom right", function() {
                var graphic = new Graphic({imageData:imageData, x: 10, y: 10});
                var canvas = document.createElement("canvas");
                var context = canvas.getContext("2d");
                graphic.setRenderContext(context);
                var actual = graphic.hasGlobalPixelAt(29,29);
                expect(actual).toEqual(true);
            });
        });



        describe("transparency", function() {

            it("Return false when 100% transparent pixel", function() {
                var graphic = new Graphic({imageData:imageData});
                var canvas = document.createElement("canvas");
                var context = canvas.getContext("2d");
                graphic.setRenderContext(context);
                var actual = graphic.hasGlobalPixelAt(0,6);
                expect(actual).toEqual(false);
            });

            it("Return true when semi-transparent pixel", function() {
                var graphic = new Graphic({imageData:imageData});
                var canvas = document.createElement("canvas");
                var context = canvas.getContext("2d");
                graphic.setRenderContext(context);
                var actual = graphic.hasGlobalPixelAt(0,4);
                expect(actual).toEqual(true);
            });
        });

        describe("TEMP", function() {

            it("getDirtyRect intersepting rect on the right", function() {
                var graphic1 = new Graphic({imageData:imageData, x:10, y:10});
                var graphic2 = new Graphic({imageData:imageData, x:20, y:10});

                var rect = graphic1.getDirtyRect(graphic2.getRect());

                expect(rect.left).toEqual(10);
                expect(rect.top).toEqual(0);
                expect(rect.width).toEqual(10);
                expect(rect.height).toEqual(20);
            });

            it("getDirtyRect intersepting rect on the bottom", function() {
                var graphic1 = new Graphic({imageData:imageData, x:10, y:10});
                var graphic2 = new Graphic({imageData:imageData, x:10, y:20});

                var rect = graphic1.getDirtyRect(graphic2.getRect());

                expect(rect.left).toEqual(0);
                expect(rect.top).toEqual(10);
                expect(rect.width).toEqual(20);
                expect(rect.height).toEqual(10);
            });

            it("getDirtyRect intersepting rect on the left", function() {
                var graphic1 = new Graphic({imageData:imageData, x:10, y:10});
                var graphic2 = new Graphic({imageData:imageData, x:0, y:10});

                var rect = graphic1.getDirtyRect(graphic2.getRect());

                expect(rect.left).toEqual(0);
                expect(rect.top).toEqual(0);
                expect(rect.width).toEqual(10);
                expect(rect.height).toEqual(20);
            });

            it("getDirtyRect intersepting rect on the top", function() {
                var graphic1 = new Graphic({imageData:imageData, x:10, y:10});
                var graphic2 = new Graphic({imageData:imageData, x:10, y:0});

                var rect = graphic1.getDirtyRect(graphic2.getRect());

                expect(rect.left).toEqual(0);
                expect(rect.top).toEqual(0);
                expect(rect.width).toEqual(20);
                expect(rect.height).toEqual(10);
            });

            it("getDirtyRect intersepting rect on the right top", function() {
                var graphic1 = new Graphic({imageData:imageData, x:10, y:10});
                var graphic2 = new Graphic({imageData:imageData, x:20, y:0});

                var rect = graphic1.getDirtyRect(graphic2.getRect());

                expect(rect.left).toEqual(10);
                expect(rect.top).toEqual(0);
                expect(rect.width).toEqual(10);
                expect(rect.height).toEqual(10);
            });

            it("getDirtyRect intersepting rect on the left bottom", function() {
                var graphic1 = new Graphic({imageData:imageData, x:10, y:10});
                var graphic2 = new Graphic({imageData:imageData, x:0, y:20});

                var rect = graphic1.getDirtyRect(graphic2.getRect());

                expect(rect.left).toEqual(0);
                expect(rect.top).toEqual(10);
                expect(rect.width).toEqual(10);
                expect(rect.height).toEqual(10);
            });

            it("getDirtyRect intersepting rect on the left exceeding height", function() {
                var imageData2 = ImageTester.createTestImage(20, 40);
                var graphic1 = new Graphic({imageData:imageData, x:10, y:10});
                var graphic2 = new Graphic({imageData:imageData2, x:0, y:0});
                var rect = graphic1.getDirtyRect(graphic2.getRect());

                expect(rect.left).toEqual(0);
                expect(rect.top).toEqual(0);
                expect(rect.width).toEqual(10);
                expect(rect.height).toEqual(20);
            });

            it("getDirtyRect intersepting rect on the bottom exceeding width", function() {
                var imageData2 = ImageTester.createTestImage(40, 20);
                var graphic1 = new Graphic({imageData:imageData, x:10, y:10});
                var graphic2 = new Graphic({imageData:imageData2, x:0, y:20});
                var rect = graphic1.getDirtyRect(graphic2.getRect());

                expect(rect.left).toEqual(0);
                expect(rect.top).toEqual(10);
                expect(rect.width).toEqual(20);
                expect(rect.height).toEqual(10);
            });
        });
    });
});