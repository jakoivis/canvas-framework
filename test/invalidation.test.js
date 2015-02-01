describe("Transform:", function() {

    var graphic1;
    var graphic2;
    var graphic3;
    var layer;

    beforeEach(function() {
        createLayerAndGraphics();
    });

    afterEach(function() {
    });

    describe("", function() {

        it("graphic has invalid flag by default", function() {
            expect(graphic1.isInvalid).toEqual(true);
        });

        it("graphic doesn't have any invalidation rects by default", function() {
            expect(graphic1.invalidationRects.length).toEqual(0);
        });

        it("Added image is invalidated fully only once when rendered", function() {

            layer.addGraphic(graphic1);

            spyOn(graphic1, 'invalidate').and.callThrough();

            layer.render();

            expect(graphic1.invalidate.calls.count()).toEqual(1);

            var rectArg = graphic1.invalidate.calls.argsFor(0)[0];

            expect(rectArg.left).toEqual(0);
            expect(rectArg.top).toEqual(0);
            expect(rectArg.bottom).toEqual(20);
            expect(rectArg.right).toEqual(20);
            expect(rectArg.width).toEqual(20);
            expect(rectArg.height).toEqual(20);
        });

        it("Moved image is invalidated by flagging it invalid", function() {

            layer.addGraphic(graphic1);
            layer.render();

            spyOn(graphic1, 'invalidate').and.callThrough();

            graphic1.x = 10;
            graphic1.y = 10;

            expect(graphic1.invalidate.calls.count()).toEqual(2);

            var rectArg1 = graphic1.invalidate.calls.argsFor(0)[0];
            var rectArg2 = graphic1.invalidate.calls.argsFor(1)[0];

            // has been flegged as invalid
            expect(rectArg1).toEqual(undefined);
            expect(rectArg2).toEqual(undefined);

            // has not been decided what area is invalid
            expect(graphic1.invalidationRects.length).toEqual(0);
        });

        it("Layer.render decides the area which is invalidated", function() {

            layer.addGraphic(graphic1);
            layer.render();

            graphic1.x = 10;
            graphic1.y = 10;

            spyOn(graphic1, 'invalidate').and.callThrough();

            layer.render();

            expect(graphic1.invalidate.calls.count()).toEqual(1);

            var rectArg = graphic1.invalidate.calls.argsFor(0)[0];

            expect(rectArg.left).toEqual(10);
            expect(rectArg.top).toEqual(10);
            expect(rectArg.bottom).toEqual(30);
            expect(rectArg.right).toEqual(30);
            expect(rectArg.width).toEqual(20);
            expect(rectArg.height).toEqual(20);

            // has been decided what area is invalidated
            expect(graphic1.invalidationRects.length).toEqual(1);
        });

    });

    function createLayerAndGraphics()
    {
        layer = new Layer();
        graphic1 = new Graphic({
            imageData:ImageTester.createRedImage()
        });
        graphic2 = new Graphic({
            imageData:ImageTester.createGreenImage()
        });
        graphic3 = new Graphic({
            imageData:ImageTester.createBlueImage()
        });
    }


});