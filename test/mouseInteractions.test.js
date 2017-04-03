var sinon = require("sinon");
var ImageDataUtil = require("./utils/ImageDataUtil.js");

describe("Mouse interactions", function() {

    var graphic1;
    var graphic2;

    beforeEach(function() {
        graphic1 = new Graphic({imageData: ImageDataUtil.createTestImage()});
        graphic2 = new Graphic({imageData: ImageDataUtil.createTestImage()});
        graphic1.onClick = sinon.spy();
        graphic1.onRollOver = sinon.spy();
        graphic1.onRollOut = sinon.spy();
        graphic2.onClick = sinon.spy();
        graphic2.onRollOver = sinon.spy();
        graphic2.onRollOut = sinon.spy();
    });

    afterEach(function() {
    });

    describe("Graphic click", function() {

        it("should not trigger click handler if click events are not enabled on layer", function() {
            var layer = new Layer();
            layer.addGraphic(graphic1);
            simulateClick(layer.getCanvas(), 0, 0);
            graphic1.onClick.callCount.should.equal(0);
        });

        it("should triggered clicks when enabled", function() {
            var layer = new Layer({enableOnClickEvents:true});
            layer.addGraphic(graphic1);
            simulateClick(layer.getCanvas(), 0, 0);
            graphic1.onClick.callCount.should.equal(1);
        });

        it("should trigger clicks when enabled by enableOnClickEvents call", function() {
            var layer = new Layer();
            layer.enableOnClickEvents();
            layer.addGraphic(graphic1);
            simulateClick(layer.getCanvas(), 0, 0);
            graphic1.onClick.callCount.should.equal(1);
        });

        it("should not trigger clicks when disabled by disableOnClickEvents call", function() {
            var layer = new Layer();
            layer.enableOnClickEvents();
            layer.disableOnClickEvents();
            layer.addGraphic(graphic1);
            simulateClick(layer.getCanvas(), 0, 0);
            graphic1.onClick.callCount.should.equal(0);
        });

        it("should not trigger click if mouse doesn't hit the graphic", function() {
            var layer = new Layer({enableOnClickEvents:true});
            layer.addGraphic(graphic1);
            simulateClick(layer.getCanvas(), 100, 0);
            graphic1.onClick.callCount.should.equal(0);
        });

        it("should identify graphics", function() {
            var layer = new Layer({enableOnClickEvents:true});
            graphic2.x = 40;
            layer.addGraphic(graphic1);
            layer.addGraphic(graphic2);
            simulateClick(layer.getCanvas(), 40, 0);
            graphic1.onClick.callCount.should.equal(0);
            graphic2.onClick.callCount.should.equal(1);
        });

        it("should identify graphics when overlapping", function() {
            var layer = new Layer({enableOnClickEvents:true});
            graphic2.x = 5;
            layer.addGraphic(graphic1);
            layer.addGraphic(graphic2);
            simulateClick(layer.getCanvas(), 5, 0);
            graphic1.onClick.callCount.should.equal(0);
            graphic2.onClick.callCount.should.equal(1);
            simulateClick(layer.getCanvas(), 4, 0);
            graphic1.onClick.callCount.should.equal(1);
            graphic2.onClick.callCount.should.equal(1);
        });
    });

    describe("Graphic mouse move", function() {

        it("should not trigger roll handlers if roll events are not enabled on layer", function() {
            var layer = new Layer();
            layer.addGraphic(graphic1);
            simulateMouseMove(layer.getCanvas(), 0, 0);
            graphic1.onRollOver.callCount.should.equal(0);
            graphic1.onRollOut.callCount.should.equal(0);
        });

        it("should trigger roll handlers when enabled from layer's options object", function() {
            var layer = new Layer({enableOnRollEvents:true});
            layer.addGraphic(graphic1);
            simulateMouseMove(layer.getCanvas(), 0, 0);
            graphic1.onRollOver.callCount.should.equal(1);
            graphic1.onRollOut.callCount.should.equal(0);
            simulateMouseMove(layer.getCanvas(), 30, 0);
            graphic1.onRollOver.callCount.should.equal(1);
            graphic1.onRollOut.callCount.should.equal(1);
        });

        it("should trigger roll handlers when enabled by enableOnRollEvents call", function() {
            var layer = new Layer();
            layer.enableOnRollEvents();
            layer.addGraphic(graphic1);
            simulateMouseMove(layer.getCanvas(), 0, 0);
            graphic1.onRollOver.callCount.should.equal(1);
            graphic1.onRollOut.callCount.should.equal(0);
            simulateMouseMove(layer.getCanvas(), 30, 0);
            graphic1.onRollOver.callCount.should.equal(1);
            graphic1.onRollOut.callCount.should.equal(1);
        });

        it("should not trigger roll handler when disabled by disableOnRollEvents call", function() {
            var layer = new Layer();
            layer.enableOnRollEvents();
            layer.disableOnRollEvents();
            layer.addGraphic(graphic1);
            simulateMouseMove(layer.getCanvas(), 0, 0);
            graphic1.onRollOver.callCount.should.equal(0);
            graphic1.onRollOut.callCount.should.equal(0);
            simulateMouseMove(layer.getCanvas(), 30, 0);
            graphic1.onRollOver.callCount.should.equal(0);
            graphic1.onRollOut.callCount.should.equal(0);
        });

        it("should not trigger roll handlers if mouse position doesn't hit the graphic", function() {
            var layer = new Layer({enableOnRollEvents:true});
            layer.addGraphic(graphic1);
            simulateMouseMove(layer.getCanvas(), 10, 0);
            simulateMouseMove(layer.getCanvas(), 10, 10);
            simulateMouseMove(layer.getCanvas(), 0, 10);
            graphic1.onRollOver.callCount.should.equal(0);
            graphic1.onRollOut.callCount.should.equal(0);
        });

        it("should identify graphics", function() {
            var layer = new Layer({enableOnRollEvents:true});
            graphic2.x = 20;
            layer.addGraphic(graphic1);
            layer.addGraphic(graphic2);
            simulateMouseMove(layer.getCanvas(), 20, 0);
            graphic1.onRollOver.callCount.should.equal(0);
            graphic1.onRollOut.callCount.should.equal(0);
            graphic2.onRollOver.callCount.should.equal(1);
            graphic2.onRollOut.callCount.should.equal(0);

            simulateMouseMove(layer.getCanvas(), 19, 0);
            graphic1.onRollOver.callCount.should.equal(0);
            graphic1.onRollOut.callCount.should.equal(0);
            graphic2.onRollOver.callCount.should.equal(1);
            graphic2.onRollOut.callCount.should.equal(1);

            simulateMouseMove(layer.getCanvas(), 9, 0);
            graphic1.onRollOver.callCount.should.equal(1);
            graphic1.onRollOut.callCount.should.equal(0);
            graphic2.onRollOver.callCount.should.equal(1);
            graphic2.onRollOut.callCount.should.equal(1);

            simulateMouseMove(layer.getCanvas(), 10, 0);
            graphic1.onRollOver.callCount.should.equal(1);
            graphic1.onRollOut.callCount.should.equal(1);
            graphic2.onRollOver.callCount.should.equal(1);
            graphic2.onRollOut.callCount.should.equal(1);
        });

        it("should identify graphics when overlapping", function() {
            var layer = new Layer({enableOnRollEvents:true});
            graphic2.x = 5;
            layer.addGraphic(graphic1);
            layer.addGraphic(graphic2);
            simulateMouseMove(layer.getCanvas(), 5, 0);
            graphic1.onRollOver.callCount.should.equal(0);
            graphic1.onRollOut.callCount.should.equal(0);
            graphic2.onRollOver.callCount.should.equal(1);
            graphic2.onRollOut.callCount.should.equal(0);

            simulateMouseMove(layer.getCanvas(), 4, 0);
            graphic1.onRollOver.callCount.should.equal(1);
            graphic1.onRollOut.callCount.should.equal(0);
            graphic2.onRollOver.callCount.should.equal(1);
            graphic2.onRollOut.callCount.should.equal(1);
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