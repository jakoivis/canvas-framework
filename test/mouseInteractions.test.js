xdescribe("Mouse interactions", function() {

    var graphic1;
    var graphic2;

    beforeEach(function() {
        graphic1 = new Graphic({imageData: ImageDataUtil.createTestImage()});
        graphic2 = new Graphic({imageData: ImageDataUtil.createTestImage()});
        graphic1.onClick = jasmine.createSpy('clickHandler1');
        graphic1.onRollOver = jasmine.createSpy('rollOverHandler1');
        graphic1.onRollOut = jasmine.createSpy('rollOutHandler1');
        graphic2.onClick = jasmine.createSpy('clickHandler2');
        graphic2.onRollOver = jasmine.createSpy('rollOverHandler2');
        graphic2.onRollOut = jasmine.createSpy('rollOutHandler2');
    });

    afterEach(function() {
    });

    describe("Graphic click", function() {

        it("click handler is not triggered if click events are not enabled on layer", function() {
            var layer = new Layer();
            layer.addGraphic(graphic1);
            simulateClick(layer.getCanvas(), 0, 0);
            expect(graphic1.onClick).not.toHaveBeenCalled();
        });

        it("clicks are triggered when enabled from layer's options object", function() {
            var layer = new Layer({enableOnClickEvents:true});
            layer.addGraphic(graphic1);
            simulateClick(layer.getCanvas(), 0, 0);
            expect(graphic1.onClick).toHaveBeenCalled();
        });

        it("clicks are triggered when enabled by enableOnClickEvents function call", function() {
            var layer = new Layer();
            layer.enableOnClickEvents();
            layer.addGraphic(graphic1);
            simulateClick(layer.getCanvas(), 0, 0);
            expect(graphic1.onClick).toHaveBeenCalled();
        });

        it("clicks are not triggered when disabled by disableOnClickEvents function call", function() {
            var layer = new Layer();
            layer.enableOnClickEvents();
            layer.disableOnClickEvents();
            layer.addGraphic(graphic1);
            simulateClick(layer.getCanvas(), 0, 0);
            expect(graphic1.onClick).not.toHaveBeenCalled();
        });

        it("click is not triggered if mouse position doesn't hit the graphic", function() {
            var layer = new Layer({enableOnClickEvents:true});
            layer.addGraphic(graphic1);
            simulateClick(layer.getCanvas(), 100, 0);
            expect(graphic1.onClick).not.toHaveBeenCalled();
        });

        it("graphics are identified", function() {
            var layer = new Layer({enableOnClickEvents:true});
            graphic2.x = 40;
            layer.addGraphic(graphic1);
            layer.addGraphic(graphic2);
            simulateClick(layer.getCanvas(), 40, 0);
            expect(graphic1.onClick).not.toHaveBeenCalled();
            expect(graphic2.onClick).toHaveBeenCalled();
        });

        it("graphics are identified when overlapping", function() {
            var layer = new Layer({enableOnClickEvents:true});
            graphic2.x = 10;
            layer.addGraphic(graphic1);
            layer.addGraphic(graphic2);
            simulateClick(layer.getCanvas(), 10, 0);
            expect(graphic1.onClick.calls.count()).toEqual(0);
            expect(graphic2.onClick.calls.count()).toEqual(1);
            simulateClick(layer.getCanvas(), 9, 0);
            expect(graphic1.onClick.calls.count()).toEqual(1);
            expect(graphic2.onClick.calls.count()).toEqual(1);
        });
    });

    describe("Graphic mouse move", function() {

        it("roll handlers handlers are not triggered if roll events are not enabled on layer", function() {
            var layer = new Layer();
            layer.addGraphic(graphic1);
            simulateMouseMove(layer.getCanvas(), 0, 0);
            expect(graphic1.onRollOver).not.toHaveBeenCalled();
            expect(graphic1.onRollOut).not.toHaveBeenCalled();
        });

        it("roll handlers are triggered when enabled from layer's options object", function() {
            var layer = new Layer({enableOnRollEvents:true});
            layer.addGraphic(graphic1);
            simulateMouseMove(layer.getCanvas(), 0, 0);
            expect(graphic1.onRollOver.calls.count()).toEqual(1);
            expect(graphic1.onRollOut.calls.count()).toEqual(0);
            simulateMouseMove(layer.getCanvas(), 30, 0);
            expect(graphic1.onRollOver.calls.count()).toEqual(1);
            expect(graphic1.onRollOut.calls.count()).toEqual(1);
        });

        it("roll handlers are triggered when enabled by enableOnRollEvents function call", function() {
            var layer = new Layer();
            layer.enableOnRollEvents();
            layer.addGraphic(graphic1);
            simulateMouseMove(layer.getCanvas(), 0, 0);
            expect(graphic1.onRollOver.calls.count()).toEqual(1);
            expect(graphic1.onRollOut.calls.count()).toEqual(0);
            simulateMouseMove(layer.getCanvas(), 30, 0);
            expect(graphic1.onRollOver.calls.count()).toEqual(1);
            expect(graphic1.onRollOut.calls.count()).toEqual(1);
        });

        it("roll handler are not triggered when disabled by disableOnRollEvents function call", function() {
            var layer = new Layer();
            layer.enableOnRollEvents();
            layer.disableOnRollEvents();
            layer.addGraphic(graphic1);
            simulateMouseMove(layer.getCanvas(), 0, 0);
            expect(graphic1.onRollOver.calls.count()).toEqual(0);
            expect(graphic1.onRollOut.calls.count()).toEqual(0);
            simulateMouseMove(layer.getCanvas(), 30, 0);
            expect(graphic1.onRollOver.calls.count()).toEqual(0);
            expect(graphic1.onRollOut.calls.count()).toEqual(0);
        });

        it("roll handlers are not triggered if mouse position doesn't hit the graphic", function() {
            var layer = new Layer({enableOnRollEvents:true});
            layer.addGraphic(graphic1);
            simulateMouseMove(layer.getCanvas(), 30, 0);
            simulateMouseMove(layer.getCanvas(), 30, 30);
            simulateMouseMove(layer.getCanvas(), 0, 30);
            expect(graphic1.onRollOver).not.toHaveBeenCalled();
            expect(graphic1.onRollOut).not.toHaveBeenCalled();
        });

        it("graphics are identified", function() {
            var layer = new Layer({enableOnRollEvents:true});
            graphic2.x = 40;
            layer.addGraphic(graphic1);
            layer.addGraphic(graphic2);
            simulateMouseMove(layer.getCanvas(), 40, 0);
            expect(graphic1.onRollOver.calls.count()).toEqual(0);
            expect(graphic1.onRollOut.calls.count()).toEqual(0);
            expect(graphic2.onRollOver.calls.count()).toEqual(1);
            expect(graphic2.onRollOut.calls.count()).toEqual(0);
            simulateMouseMove(layer.getCanvas(), 25, 0);
            expect(graphic1.onRollOver.calls.count()).toEqual(0);
            expect(graphic1.onRollOut.calls.count()).toEqual(0);
            expect(graphic2.onRollOver.calls.count()).toEqual(1);
            expect(graphic2.onRollOut.calls.count()).toEqual(1);
            simulateMouseMove(layer.getCanvas(), 10, 0);
            expect(graphic1.onRollOver.calls.count()).toEqual(1);
            expect(graphic1.onRollOut.calls.count()).toEqual(0);
            expect(graphic2.onRollOver.calls.count()).toEqual(1);
            expect(graphic2.onRollOut.calls.count()).toEqual(1);
            simulateMouseMove(layer.getCanvas(), 25, 0);
            expect(graphic1.onRollOver.calls.count()).toEqual(1);
            expect(graphic1.onRollOut.calls.count()).toEqual(1);
            expect(graphic2.onRollOver.calls.count()).toEqual(1);
            expect(graphic2.onRollOut.calls.count()).toEqual(1);
        });

        it("graphics are identified when overlapping", function() {
            var layer = new Layer({enableOnRollEvents:true});
            graphic2.x = 10;
            layer.addGraphic(graphic1);
            layer.addGraphic(graphic2);
            simulateMouseMove(layer.getCanvas(), 10, 0);
            expect(graphic1.onRollOver.calls.count()).toEqual(0);
            expect(graphic1.onRollOut.calls.count()).toEqual(0);
            expect(graphic2.onRollOver.calls.count()).toEqual(1);
            expect(graphic2.onRollOut.calls.count()).toEqual(0);
            simulateMouseMove(layer.getCanvas(), 9, 0);
            expect(graphic1.onRollOver.calls.count()).toEqual(1);
            expect(graphic1.onRollOut.calls.count()).toEqual(0);
            expect(graphic2.onRollOver.calls.count()).toEqual(1);
            expect(graphic2.onRollOut.calls.count()).toEqual(1);
        });
    });


    function simulateClick(target, x, y)
    {
        var event = document.createEvent("MouseEvents");
        event.initMouseEvent("click", true, true, window, 0, 0, 0, x, y, false, false, false, false, 0, null);
        target.dispatchEvent(event);
    }

    function simulateMouseMove(target, x, y)
    {
        var event = document.createEvent("MouseEvents");
        event.initMouseEvent("mousemove", true, true, window, 0, 0, 0, x, y, false, false, false, false, 0, null);
        target.dispatchEvent(event);
    }
});