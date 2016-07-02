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

        it("default size", function() {
            var layer = new Layer();
            var canvas = layer.getCanvas();
            canvas.width.should.equal(300);
            canvas.height.should.equal(150);
        });

        it("fullScreen on", function() {
            var layer = new Layer({fullScreen:true});
            var canvas = layer.getCanvas();
            canvas.width.should.equal(1000);
            canvas.height.should.equal(1200);
        });

        it("size change", function() {
            var layer = new Layer({fullScreen:true});
            var canvas = layer.getCanvas();
            window.innerWidth = 100;
            window.innerHeight = 120;
            window.dispatchEvent(new Event("resize"));
            canvas.width.should.equal(100);
            canvas.height.should.equal(120);
        });

        // it("enableFullScreen sets the fullscreen state", function() {
        //     var layer = new Layer();
        //     var canvas = layer.getCanvas();
        //     canvas.width = 500;
        //     canvas.height = 300;
        //     layer.enableFullScreen();
        //     expect(canvas.width).toEqual(1000);
        //     expect(canvas.height).toEqual(1200);
        // });

        // it("disableFullScreen function disables the fullscreen state", function() {
        //     var layer = new Layer();
        //     var canvas = layer.getCanvas();
        //     canvas.width = 500;
        //     canvas.height = 300;
        //     layer.enableFullScreen();
        //     expect(canvas.width).toEqual(1000);
        //     expect(canvas.height).toEqual(1200);
        //     layer.disableFullScreen();
        //     expect(canvas.width).toEqual(500);
        //     expect(canvas.height).toEqual(300);
        // });
    });



    // describe("options.appendToBody", function() {

    //     it("not added to document by default", function() {
    //         var layer = new Layer();
    //         var canvas = layer.getCanvas();
    //         expect(document.body.getElementsByTagName("canvas").length).toEqual(0);
    //     });

    //     it("can be added to document body by setting a flag", function() {
    //         var layer = new Layer({appendToBody:true});
    //         var canvas = layer.getCanvas();
    //         expect(document.body.getElementsByTagName("canvas").length).toEqual(1);
    //         var bodyCanvas = document.body.getElementsByTagName("canvas")[0];
    //         var areSame = canvas === bodyCanvas;
    //         expect(areSame).toEqual(true);
    //     });
    // });



    // describe("options width and height", function() {

    //     it("", function() {
    //         var layer = new Layer({width: 500, height: 600});
    //         var canvas = layer.getCanvas();

    //         expect(canvas.width).toEqual(500);
    //         expect(canvas.height).toEqual(600);
    //     });
    // });



    // describe("options target", function() {

    //     it("existing canvas is used", function() {
    //         var testCanvas = document.createElement("canvas");
    //         testCanvas.id = "test";
    //         document.body.appendChild(testCanvas);

    //         var layer = new Layer({target:"test"});

    //         var isSame = testCanvas === layer.getCanvas();
    //         expect(isSame).toEqual(true);
    //     });
    // });



    // describe("other:", function() {

    //     it("getCanvas returns object of correct type", function() {
    //         var layer = new Layer();
    //         var isCanvas = layer.getCanvas() instanceof HTMLCanvasElement;
    //         expect(isCanvas).toEqual(true);
    //     });

    //     it("length returns the number of graphic objects in the layer", function() {
    //         var layer = new Layer();
    //         expect(layer.length()).toEqual(0);
    //         layer.addGraphic(graphic1);
    //         expect(layer.length()).toEqual(1);
    //         layer.addGraphic(graphic2);
    //         expect(layer.length()).toEqual(2);
    //         layer.removeGraphic(graphic1);
    //         expect(layer.length()).toEqual(1);
    //     });
    // });



    // describe("getGraphicAtPoint", function() {

    //     beforeEach(function() {
    //     });

    //     it("Calls hasGlobalPixelAt on every graphic", function() {
    //         spyHasGlobalPixelAtAndReturnFalse();

    //         var layer = new Layer();
    //         layer.addGraphic(graphic1);
    //         layer.addGraphic(graphic2);
    //         layer.addGraphic(graphic3);
    //         layer.getGraphicAtPoint(0,0);
    //         expect(graphic1.hasGlobalPixelAt.calls.count()).toEqual(1);
    //         expect(graphic2.hasGlobalPixelAt.calls.count()).toEqual(1);
    //         expect(graphic3.hasGlobalPixelAt.calls.count()).toEqual(1);
    //     });

    //     it("Returns null if all hasGlobalPixelAt return null", function() {
    //         spyHasGlobalPixelAtAndReturnFalse();

    //         var layer = new Layer();
    //         layer.addGraphic(graphic1);
    //         layer.addGraphic(graphic2);
    //         layer.addGraphic(graphic3);
    //         var actual = layer.getGraphicAtPoint(0,0);
    //         var isNull = actual === null;
    //         expect(isNull).toEqual(true);
    //     });

    //     it("Returns the graphic object which returns true", function() {
    //         spyHasGlobalPixelAtAndOneReturnsTrue();

    //         var layer = new Layer();
    //         layer.addGraphic(graphic1);
    //         layer.addGraphic(graphic2);
    //         layer.addGraphic(graphic3);
    //         var actual = layer.getGraphicAtPoint(0,0);
    //         var isGraphic2 = actual === graphic2;
    //         expect(isGraphic2).toEqual(true);
    //     });
    // });



    // describe("render, clear and update", function() {

    //     it("graphics render and clear are called", function(){
    //         var layer = new Layer();
    //         layer.addGraphic(graphic1);
    //         layer.addGraphic(graphic2);
    //         layer.addGraphic(graphic3);
    //         layer.render();
    //         expect(graphic1.render.calls.count()).toEqual(1);
    //         expect(graphic2.render.calls.count()).toEqual(1);
    //         expect(graphic3.render.calls.count()).toEqual(1);
    //         expect(graphic1.clear.calls.count()).toEqual(1);
    //         expect(graphic2.clear.calls.count()).toEqual(1);
    //         expect(graphic3.clear.calls.count()).toEqual(1);
    //     });

    //     it("graphics update is called", function(){
    //         var layer = new Layer();
    //         layer.addGraphic(graphic1);
    //         layer.addGraphic(graphic2);
    //         layer.addGraphic(graphic3);
    //         layer.update();
    //         expect(graphic1.update.calls.count()).toEqual(1);
    //         expect(graphic2.update.calls.count()).toEqual(1);
    //         expect(graphic3.update.calls.count()).toEqual(1);
    //     });
    // });



    // describe("adding and removing and getting graphics", function() {

    //     it("addGraphic", function(){
    //         var layer = new Layer();
    //         layer.addGraphic(graphic1);
    //         layer.update();
    //         expect(graphic1.update.calls.count()).toEqual(1);
    //         expect(graphic2.update.calls.count()).toEqual(0);
    //         expect(graphic3.update.calls.count()).toEqual(0);
    //     });

    //     it("removeGraphic", function(){
    //         var layer = new Layer();
    //         layer.addGraphic(graphic1);
    //         layer.addGraphic(graphic2);
    //         layer.addGraphic(graphic3);
    //         layer.update();
    //         layer.removeGraphic(graphic2);
    //         layer.update();
    //         expect(graphic1.update.calls.count()).toEqual(2);
    //         expect(graphic2.update.calls.count()).toEqual(1);
    //         expect(graphic3.update.calls.count()).toEqual(2);
    //         layer.removeGraphic(graphic1);
    //         layer.update();
    //         expect(graphic1.update.calls.count()).toEqual(2);
    //         expect(graphic2.update.calls.count()).toEqual(1);
    //         expect(graphic3.update.calls.count()).toEqual(3);
    //         layer.removeGraphic(graphic3);
    //         layer.update();
    //         expect(graphic1.update.calls.count()).toEqual(2);
    //         expect(graphic2.update.calls.count()).toEqual(1);
    //         expect(graphic3.update.calls.count()).toEqual(3);
    //     });

    //     it("getGraphicAt returns correct graphic", function() {
    //         var layer = new Layer();
    //         layer.addGraphic(graphic1);
    //         layer.addGraphic(graphic2);
    //         layer.addGraphic(graphic3);

    //         var isSame = layer.getGraphicAt(1) === graphic2;
    //         expect(isSame).toEqual(true);
    //     });

    //     it("getGraphicAt returns undefined if out of bounds", function() {
    //         var layer = new Layer();
    //         layer.addGraphic(graphic1);
    //         layer.addGraphic(graphic2);
    //         layer.addGraphic(graphic3);

    //         expect(layer.getGraphicAt(-1)).toEqual(undefined);
    //     });

    //     it("removeAllGraphics", function() {
    //         var layer = new Layer();
    //         layer.addGraphic(graphic1);
    //         layer.addGraphic(graphic2);
    //         layer.addGraphic(graphic3);
    //         layer.removeAllGraphics();
    //         layer.update();
    //         expect(graphic1.update.calls.count()).toEqual(0);
    //         expect(graphic2.update.calls.count()).toEqual(0);
    //         expect(graphic3.update.calls.count()).toEqual(0);
    //     });
    // });



    function createAndSpyGraphics()
    {
        graphic1 = new Graphic();
        graphic2 = new Graphic();
        graphic3 = new Graphic();
        sinon.spy(graphic1, "render");
        sinon.spy(graphic2, "render");
        sinon.spy(graphic3, "render");
        sinon.spy(graphic1, "clear");
        sinon.spy(graphic2, "clear");
        sinon.spy(graphic3, "clear");
        sinon.spy(graphic1, "update");
        sinon.spy(graphic2, "update");
        sinon.spy(graphic3, "update");
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