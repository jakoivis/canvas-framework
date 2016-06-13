var chai = require('chai');
var sinon = require("sinon");

chai.should();
var expect = chai.expect;

var ClassTester = require("./helpers/classTester.js");

xdescribe("Timer:", function() {

    // ClassTester.singletonClassTest(Timer);

    var defaultFrameRate = 30;

    describe("", function() {
        var renderHandler;
        var updateHandler;
        var measureHandler;

        beforeEach(function() {
            Timer.prototype.singletonInstance = undefined;

            renderHandler = sinon.spy();
            updateHandler = sinon.spy();
            measureHandler = sinon.spy();
        });

        afterEach(function() {
        });

        it("Callbacks are called", function(done) {
            var timer = getTimer();
            timer.start();
            setTimeout(function () {
                timer.stop();
                expect(renderHandler.callCount).toBeGreaterThan(0);
                expect(updateHandler.callCount).toBeGreaterThan(0);
                expect(measureHandler.callCount).toBeGreaterThan(0);
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