var ImageDataUtil = require("./utils/ImageDataUtil.js");

describe("Graphic", function() {

    var imageData = ImageDataUtil.createTestImage();
    var COLORS = ImageDataUtil.RGBA32;

    describe("options", function() {

        it("should have default values without options", function() {
            var graphic = new Graphic();
            graphic.x.should.equal(0);
            graphic.y.should.equal(0);
            expect(graphic.onRollOver).to.be.null;
            expect(graphic.onRollOut).to.be.null;
            expect(graphic.onClick).to.be.null;
            expect(graphic.imageData).to.be.null;
        });

        it("should define options values", function() {
            var graphic = new Graphic({
                x: 1,
                y: 2,
                onRollOver: function() {return 3;},
                onRollOut: function() {return 4;},
                onClick: function(){return 5;},
                imageData: imageData,
            });

            graphic.x.should.equal(1);
            graphic.y.should.equal(2);
            graphic.onRollOver().should.equal(3);
            graphic.onRollOut().should.equal(4);
            graphic.onClick().should.equal(5);

            graphic.imageData.width.should.equal(10);
            graphic.imageData.height.should.equal(10);
            graphic.imageData.data.length.should.equal(10 * 10 * 4);
        });
    });

    describe("hasGlobalPixelAt", function() {

        it("should find pixel (graphic position 0,0)", function() {
            var graphic = new Graphic();
            graphic.imageData = imageData;

            graphic.hasGlobalPixelAt(0,0).should.be.true;
            graphic.hasGlobalPixelAt(9,0).should.be.true;
            graphic.hasGlobalPixelAt(0,9).should.be.true;
            graphic.hasGlobalPixelAt(9,9).should.be.true;

            graphic.hasGlobalPixelAt(-1,0).should.be.false;
            graphic.hasGlobalPixelAt(10,0).should.be.false;
            graphic.hasGlobalPixelAt(0,-1).should.be.false;
            graphic.hasGlobalPixelAt(0,10).should.be.false;
        });

        it("should find pixel (graphic position 100,200)", function() {
            var graphic = new Graphic();
            graphic.imageData = imageData;
            graphic.x = 100;
            graphic.y = 200;

            graphic.hasGlobalPixelAt(100,200).should.be.true;
            graphic.hasGlobalPixelAt(109,200).should.be.true;
            graphic.hasGlobalPixelAt(100,209).should.be.true;
            graphic.hasGlobalPixelAt(109,209).should.be.true;

            graphic.hasGlobalPixelAt(99,200).should.be.false;
            graphic.hasGlobalPixelAt(110,200).should.be.false;
            graphic.hasGlobalPixelAt(100,210).should.be.false;
            graphic.hasGlobalPixelAt(100,199).should.be.false;
        });

        it("should return false for fully transparent pixels", function() {
            var graphic = new Graphic();
            graphic.imageData = imageData;

            // this specific pixel is fully transparent
            graphic.hasGlobalPixelAt(1,0).should.be.false;
        });

        it("should return true for half transparent pixels", function() {
            var graphic = new Graphic();
            graphic.imageData = imageData;

            // this specific pixel is half transparent
            graphic.hasGlobalPixelAt(2,0).should.be.true;
        });
    });

    describe("getGlobalPixel32At", function() {

        it("should find corners (graphic position 0,0)", function() {
            var graphic = new Graphic();
            graphic.imageData = imageData;

            graphic.getGlobalPixel32At(0,0).should.equal(COLORS.R);
            graphic.getGlobalPixel32At(9,0).should.equal(COLORS.R);
            graphic.getGlobalPixel32At(0,9).should.equal(COLORS.R);
            graphic.getGlobalPixel32At(9,9).should.equal(COLORS.R);

            graphic.getGlobalPixel32At(-1,0).should.equal(0);
            graphic.getGlobalPixel32At(10,0).should.equal(0);
            graphic.getGlobalPixel32At(0,-1).should.equal(0);
            graphic.getGlobalPixel32At(0,10).should.equal(0);
        });

        it("should find corners (graphic position 100,200)", function() {
            var graphic = new Graphic();
            graphic.imageData = imageData;
            graphic.x = 100;
            graphic.y = 200;

            graphic.getGlobalPixel32At(100,200).should.equal(COLORS.R);
            graphic.getGlobalPixel32At(109,200).should.equal(COLORS.R);
            graphic.getGlobalPixel32At(100,209).should.equal(COLORS.R);
            graphic.getGlobalPixel32At(109,209).should.equal(COLORS.R);

            graphic.getGlobalPixel32At(99,200).should.equal(0);
            graphic.getGlobalPixel32At(110,200).should.equal(0);
            graphic.getGlobalPixel32At(100,210).should.equal(0);
            graphic.getGlobalPixel32At(100,199).should.equal(0);
        });
    });

    describe("positions and rendering", function() {

        it("should render graphic at correct position (0,0)", function() {
            var graphic = new Graphic({imageData:imageData});
            var canvas = document.createElement("canvas");
            graphic.renderContext = canvas.getContext("2d");
            graphic.render();

            ImageDataUtil.shouldHaveImageAt(canvas, 0, 0);
        });

        it("should render graphic at correct position (200,100)", function() {
            var graphic = new Graphic({imageData:imageData, x:200, y:100});
            var canvas = document.createElement("canvas");
            graphic.renderContext = canvas.getContext("2d");
            graphic.render();

            ImageDataUtil.shouldHaveImageAt(canvas, 200, 100);
        });

        it("should remove graphic", function() {
            var graphic = new Graphic({imageData:imageData});
            var canvas = document.createElement("canvas");
            graphic.renderContext = canvas.getContext("2d");
            graphic.render();
            graphic.clear();

            ImageDataUtil.shouldNotHaveImageAt(canvas, 0, 0);
        });

        it("should removed graphic from moved position", function() {
            var graphic = new Graphic({imageData:imageData, x:200, y:100});
            var canvas = document.createElement("canvas");
            graphic.renderContext = canvas.getContext("2d");
            graphic.render();
            graphic.x = 0;
            graphic.y = 0;
            graphic.clear();

            ImageDataUtil.shouldNotHaveImageAt(canvas, 200,100);
        });
    });

    describe("pos and global coordinates", function() {

        it("globalTopos", function() {
            var graphic = new Graphic({imageData:imageData, x: 100, y: 200});
            var pos = graphic.globalToLocal(0, 0);
            pos.x.should.equal(-100);
            pos.y.should.equal(-200);
            pos = graphic.globalToLocal(110, 210);
            pos.x.should.equal(10);
            pos.y.should.equal(10);
        });

        it("posToGlobal", function() {
            var graphic = new Graphic({imageData:imageData, x: 100, y: 200});
            var pos = graphic.localToGlobal(0, 0);
            pos.x.should.equal(100);
            pos.y.should.equal(200);
            pos = graphic.localToGlobal(110, 210);
            pos.x.should.equal(210);
            pos.y.should.equal(410);
        });
    });
});