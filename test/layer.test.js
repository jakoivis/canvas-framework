describe("Layer:", function() {

    ClassTester.classTest(Layer);

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
            expect(canvas.width).toEqual(300);
            expect(canvas.height).toEqual(150);
        });

        it("fullScreen on", function() {
            var layer = new Layer({fullScreen:true});
            var canvas = layer.getCanvas();
            expect(canvas.width).toEqual(1000);
            expect(canvas.height).toEqual(1200);
        });

        it("size change", function() {
            var layer = new Layer({fullScreen:true});
            var canvas = layer.getCanvas();
            expect(canvas.width).toEqual(1000);
            expect(canvas.height).toEqual(1200);
            window.innerWidth = 100;
            window.innerHeight = 120;
            window.dispatchEvent(new Event('resize'));
            expect(canvas.width).toEqual(100);
            expect(canvas.height).toEqual(120);
        });

        it("enableFullScreen sets the fullscreen state", function() {
            var layer = new Layer();
            var canvas = layer.getCanvas();
            canvas.width = 500;
            canvas.height = 300;
            layer.enableFullScreen();
            expect(canvas.width).toEqual(1000);
            expect(canvas.height).toEqual(1200);
        });

        it("disableFullScreen function disables the fullscreen state", function() {
            var layer = new Layer();
            var canvas = layer.getCanvas();
            canvas.width = 500;
            canvas.height = 300;
            layer.enableFullScreen();
            expect(canvas.width).toEqual(1000);
            expect(canvas.height).toEqual(1200);
            layer.disableFullScreen();
            expect(canvas.width).toEqual(500);
            expect(canvas.height).toEqual(300);
        });
    });



    describe("options.appendToBody", function() {

        it("not added to document by default", function() {
            var layer = new Layer();
            var canvas = layer.getCanvas();
            expect(document.body.getElementsByTagName("canvas").length).toEqual(0);
        });

        it("can be added to document body by setting a flag", function() {
            var layer = new Layer({appendToBody:true});
            var canvas = layer.getCanvas();
            expect(document.body.getElementsByTagName("canvas").length).toEqual(1);
            var bodyCanvas = document.body.getElementsByTagName("canvas")[0];
            var areSame = canvas === bodyCanvas;
            expect(areSame).toEqual(true);
        });
    });



    describe("other:", function() {

        it("getCanvas returns object of correct type", function() {
            var layer = new Layer();
            var isCanvas = layer.getCanvas() instanceof HTMLCanvasElement;
            expect(isCanvas).toEqual(true);
        });

        it("length returns the number of graphic objects in the layer", function() {
            var layer = new Layer();
            expect(layer.length()).toEqual(0);
            layer.addGraphic(graphic1);
            expect(layer.length()).toEqual(1);
            layer.addGraphic(graphic2);
            expect(layer.length()).toEqual(2);
            layer.removeGraphic(graphic1);
            expect(layer.length()).toEqual(1);
        });
    });



    describe("getGraphicAtPoint", function() {

        beforeEach(function() {
        });

        it("Calls hasGlobalPixelAt on every graphic", function() {
            spyHasGlobalPixelAtAndReturnFalse();

            var layer = new Layer();
            layer.addGraphic(graphic1);
            layer.addGraphic(graphic2);
            layer.addGraphic(graphic3);
            layer.getGraphicAtPoint(0,0);
            expect(graphic1.hasGlobalPixelAt.calls.count()).toEqual(1);
            expect(graphic2.hasGlobalPixelAt.calls.count()).toEqual(1);
            expect(graphic3.hasGlobalPixelAt.calls.count()).toEqual(1);
        });

        it("Returns null if all hasGlobalPixelAt return null", function() {
            spyHasGlobalPixelAtAndReturnFalse();

            var layer = new Layer();
            layer.addGraphic(graphic1);
            layer.addGraphic(graphic2);
            layer.addGraphic(graphic3);
            var actual = layer.getGraphicAtPoint(0,0);
            var isNull = actual === null;
            expect(isNull).toEqual(true);
        });

        it("Returns the graphic object which returns true", function() {
            spyHasGlobalPixelAtAndOneReturnsTrue();

            var layer = new Layer();
            layer.addGraphic(graphic1);
            layer.addGraphic(graphic2);
            layer.addGraphic(graphic3);
            var actual = layer.getGraphicAtPoint(0,0);
            var isGraphic2 = actual === graphic2;
            expect(isGraphic2).toEqual(true);
        });
    });



    xdescribe("render, clear and update", function() {

        it("graphics render and clear are called", function(){
            var layer = new Layer();
            layer.addGraphic(graphic1);
            layer.addGraphic(graphic2);
            layer.addGraphic(graphic3);
            layer.render();
            expect(graphic1.render.callCount).toEqual(1);
            expect(graphic2.render.callCount).toEqual(1);
            expect(graphic3.render.callCount).toEqual(1);
            expect(graphic1.clear.callCount).toEqual(1);
            expect(graphic2.clear.callCount).toEqual(1);
            expect(graphic3.clear.callCount).toEqual(1);
        });

        it("graphics update is called", function(){
            var layer = new Layer();
            layer.addGraphic(graphic1);
            layer.addGraphic(graphic2);
            layer.addGraphic(graphic3);
            layer.update();
            expect(graphic1.update.callCount).toEqual(1);
            expect(graphic2.update.callCount).toEqual(1);
            expect(graphic3.update.callCount).toEqual(1);
        });
    });



    xdescribe("adding and removing graphics", function() {

        it("adding", function(){
            var layer = new Layer();
            layer.addGraphic(graphic1);
            layer.update();
            expect(graphic1.update.callCount).toEqual(1);
            expect(graphic2.update.callCount).toEqual(0);
            expect(graphic3.update.callCount).toEqual(0);
        });

        it("removing", function(){
            var layer = new Layer();
            layer.addGraphic(graphic1);
            layer.addGraphic(graphic2);
            layer.addGraphic(graphic3);
            layer.update();
            layer.removeGraphic(graphic2);
            layer.update();
            expect(graphic1.update.callCount).toEqual(2);
            expect(graphic2.update.callCount).toEqual(1);
            expect(graphic3.update.callCount).toEqual(2);
            layer.removeGraphic(graphic1);
            layer.update();
            expect(graphic1.update.callCount).toEqual(2);
            expect(graphic2.update.callCount).toEqual(1);
            expect(graphic3.update.callCount).toEqual(3);
            layer.removeGraphic(graphic3);
            layer.update();
            expect(graphic1.update.callCount).toEqual(2);
            expect(graphic2.update.callCount).toEqual(1);
            expect(graphic3.update.callCount).toEqual(3);
        });
    });



    function createAndSpyGraphics()
    {
        graphic1 = new Graphic();
        graphic2 = new Graphic();
        graphic3 = new Graphic();
        spyOn(graphic1, 'render');
        spyOn(graphic2, 'render');
        spyOn(graphic3, 'render');
        spyOn(graphic1, 'clear');
        spyOn(graphic2, 'clear');
        spyOn(graphic3, 'clear');
        spyOn(graphic1, 'update');
        spyOn(graphic2, 'update');
        spyOn(graphic3, 'update');
        spyOn(graphic1, 'setRenderContext');
        spyOn(graphic2, 'setRenderContext');
        spyOn(graphic3, 'setRenderContext');
    }

    function spyHasGlobalPixelAtAndReturnFalse()
    {
        spyOn(graphic1, 'hasGlobalPixelAt').and.returnValue(false);
        spyOn(graphic2, 'hasGlobalPixelAt').and.returnValue(false);
        spyOn(graphic3, 'hasGlobalPixelAt').and.returnValue(false);
    }

    function spyHasGlobalPixelAtAndOneReturnsTrue()
    {
        spyOn(graphic1, 'hasGlobalPixelAt').and.returnValue(false);
        spyOn(graphic2, 'hasGlobalPixelAt').and.returnValue(true);
        spyOn(graphic3, 'hasGlobalPixelAt').and.returnValue(false);
    }
});