var sinon = require("sinon");

describe("Layer:", function() {

    var graphic1;
    var graphic2;
    var graphic3;

    beforeEach(function() {
        createAndSpyGraphics();
    });

    afterEach(function() {
    });

    describe("fullScreen", function() {

        beforeEach(function() {
            window.innerWidth = 1000;
            window.innerHeight = 1200;
        });

        it("should not have fullscreen by default", function() {
            var layer = new Layer();
            var canvas = layer.getCanvas();
            canvas.width.should.equal(300);
            canvas.height.should.equal(150);
        });

        it("should set fullscreen", function() {
            var layer = new Layer({fullScreen:true});
            var canvas = layer.getCanvas();
            canvas.width.should.equal(1000);
            canvas.height.should.equal(1200);
        });

        it("should update fullscreen size", function() {
            var layer = new Layer({fullScreen:true});
            var canvas = layer.getCanvas();
            window.innerWidth = 100;
            window.innerHeight = 120;
            window.dispatchEvent(new Event("resize"));
            canvas.width.should.equal(100);
            canvas.height.should.equal(120);
        });

        it("should enable/disable fullscreen", function() {
            var layer = new Layer();
            var canvas = layer.getCanvas();
            canvas.width = 500;
            canvas.height = 300;
            layer.enableFullScreen();
            canvas.width.should.equal(1000);
            canvas.height.should.equal(1200);
            layer.disableFullScreen();
            canvas.width.should.equal(500);
            canvas.height.should.equal(300);
        });
    });

    describe("options.appendToBody", function() {

        it("should not add to document by default", function() {
            var layer = new Layer();
            var canvas = layer.getCanvas();
            document.body.getElementsByTagName("canvas").length.should.equal(0);
        });

        it("should add to document", function() {
            var layer = new Layer({appendToBody:true});
            var canvas = layer.getCanvas();
            document.body.getElementsByTagName("canvas").length.should.equal(1);
            var bodyCanvas = document.body.getElementsByTagName("canvas")[0];
            (canvas === bodyCanvas).should.equal(true);
        });
    });

    describe("options width and height", function() {

        it("should set size", function() {
            var layer = new Layer({width: 500, height: 600});
            var canvas = layer.getCanvas();

            canvas.width.should.equal(500);
            canvas.height.should.equal(600);
        });
    });

    describe("options target", function() {

        it("should use existing canvas", function() {
            var testCanvas = document.createElement("canvas");
            testCanvas.id = "test";
            document.body.appendChild(testCanvas);

            var layer = new Layer({target:"test"});

            (testCanvas === layer.getCanvas()).should.equal(true);
        });
    });

    describe("other", function() {

        it("should return number of graphic objects", function() {
            var layer = new Layer();
            layer.length().should.equal(0);
            layer.addGraphic(graphic1);
            layer.length().should.equal(1);
            layer.addGraphic(graphic2);
            layer.length().should.equal(2);
        });
    });

    describe("getGraphicAtPoint", function() {

        it("Should return null if all hasGlobalPixelAt return null", function() {
            spyHasGlobalPixelAtAndReturnFalse();

            var layer = new Layer();
            layer.addGraphic(graphic1);
            layer.addGraphic(graphic2);
            layer.addGraphic(graphic3);

            expect(layer.getGraphicAtPoint(0,0)).to.be.null;
        });

        it("should return a graphic", function() {
            spyHasGlobalPixelAtAndOneReturnsTrue();

            var layer = new Layer();
            layer.addGraphic(graphic1);
            layer.addGraphic(graphic2);
            layer.addGraphic(graphic3);
            layer.getGraphicAtPoint(0,0).should.equal(graphic2);
        });
    });

    describe("render, clear and update", function() {

        it("should call render and clear on graphics", function() {
            var layer = new Layer();
            layer.addGraphic(graphic1);
            layer.addGraphic(graphic2);
            layer.addGraphic(graphic3);
            layer.render();
            graphic1.render.calledOnce.should.be.true;
            graphic2.render.calledOnce.should.be.true;
            graphic3.render.calledOnce.should.be.true;
            graphic1.clear.calledOnce.should.be.true;
            graphic2.clear.calledOnce.should.be.true;
            graphic3.clear.calledOnce.should.be.true;
        });

        it("should call update on graphics", function() {
            var layer = new Layer();
            layer.addGraphic(graphic1);
            layer.addGraphic(graphic2);
            layer.addGraphic(graphic3);
            layer.update();
            graphic1.update.calledOnce.should.be.true;
            graphic2.update.calledOnce.should.be.true;
            graphic3.update.calledOnce.should.be.true;
        });
    });

    describe("adding and removing and getting graphics", function() {

        it("removeGraphic", function(){
            var layer = new Layer();
            layer.addGraphic(graphic1);
            layer.addGraphic(graphic2);
            layer.addGraphic(graphic3);
            layer.update();
            layer.removeGraphic(graphic2);
            layer.update();
            graphic1.update.callCount.should.equal(2);
            graphic2.update.callCount.should.equal(1);
            graphic3.update.callCount.should.equal(2);
            layer.removeGraphic(graphic1);
            layer.update();
            graphic1.update.callCount.should.equal(2);
            graphic2.update.callCount.should.equal(1);
            graphic3.update.callCount.should.equal(3);
        });

        it("should return correct graphic", function() {
            var layer = new Layer();
            layer.addGraphic(graphic1);
            layer.addGraphic(graphic2);
            layer.addGraphic(graphic3);

            (layer.getGraphicAt(1) === graphic2).should.be.true;
        });

        it("should return undefined if out of bounds", function() {
            var layer = new Layer();
            layer.addGraphic(graphic1);
            layer.addGraphic(graphic2);
            layer.addGraphic(graphic3);

            expect(layer.getGraphicAt(-1)).to.be.undefined;
        });

        it("removeAllGraphics", function() {
            var layer = new Layer();
            layer.addGraphic(graphic1);
            layer.addGraphic(graphic2);
            layer.addGraphic(graphic3);
            layer.removeAllGraphics();
            layer.update();
            graphic1.update.callCount.should.equal(0);
            graphic2.update.callCount.should.equal(0);
            graphic3.update.callCount.should.equal(0);
        });
    });



    function createAndSpyGraphics()
    {
        graphic1 = new Graphic();
        graphic2 = new Graphic();
        graphic3 = new Graphic();
        sinon.stub(graphic1, "render");
        sinon.stub(graphic2, "render");
        sinon.stub(graphic3, "render");
        sinon.stub(graphic1, "clear");
        sinon.stub(graphic2, "clear");
        sinon.stub(graphic3, "clear");
        sinon.stub(graphic1, "update");
        sinon.stub(graphic2, "update");
        sinon.stub(graphic3, "update");
        // sinon.spy(graphic1, "renderContext");
        // sinon.spy(graphic2, "renderContext");
        // sinon.spy(graphic3, "renderContext");
    }

    function spyHasGlobalPixelAtAndReturnFalse()
    {
        sinon.stub(graphic1, "hasGlobalPixelAt").returns(false);
        sinon.stub(graphic2, "hasGlobalPixelAt").returns(false);
        sinon.stub(graphic3, "hasGlobalPixelAt").returns(false);
    }

    function spyHasGlobalPixelAtAndOneReturnsTrue()
    {
        sinon.stub(graphic1, "hasGlobalPixelAt").returns(false);
        sinon.stub(graphic2, "hasGlobalPixelAt").returns(true);
        sinon.stub(graphic3, "hasGlobalPixelAt").returns(false);
    }
});