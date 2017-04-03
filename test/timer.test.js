var chai = require("chai");
var sinon = require("sinon");

chai.should();
var expect = chai.expect;

describe("Timer", function() {

    var defaultFrameRate = 30;

    var renderHandler;
    var updateHandler;
    var measureHandler;

    beforeEach(function() {
        Timer.prototype.singletonInstance = undefined;

        renderHandler = sinon.spy();
        updateHandler = sinon.spy();
        measureHandler = sinon.spy();
    });

    it("should call callbacks", function(done) {
        var timer = getTimer();
        timer.start();
        setTimeout(function () {
            timer.stop();
            (renderHandler.callCount > 0).should.be.true;
            (updateHandler.callCount > 0).should.be.true;
            (measureHandler.callCount > 0).should.be.true;

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