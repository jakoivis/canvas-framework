describe("Timer:", function() {

    ClassTester.singletonClassTest(Timer);

    var defaultFrameRate = 30;

    describe("", function() {
        var renderHandler;
        var updateHandler;

        beforeEach(function() {
            Timer.prototype.singletonInstance = undefined;

            renderHandler = jasmine.createSpy('renderHandler');
            updateHandler = jasmine.createSpy('updateHandler');
            measureHandler = jasmine.createSpy('measureHandler');
        });

        afterEach(function() {
        });

        it("Callbacks are called", function(done) {
            var timer = getTimer();
            timer.start();
            setTimeout(function () {
                timer.stop();
                expect(renderHandler.calls.count()).toBeGreaterThan(0);
                expect(updateHandler.calls.count()).toBeGreaterThan(0);
                expect(measureHandler.calls.count()).toBeGreaterThan(0);
                done();
            }, 100);
        });

        function getTimer(frameRate) {
            return new Timer({
                renderCallback: renderHandler,
                updateCallback: updateHandler,
                measureCallback: measureHandler,
                frameRate: frameRate || defaultFrameRate
            });
        }
    });
});