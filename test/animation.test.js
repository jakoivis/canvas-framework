describe("Animation:", function() {

    ClassTester.classTest(Animation);

    var timer;
    var animation;
    var target;
    var collectedValues;
    var animationProperty;

    beforeEach(function() {
        target = {x:0, y:0};
        collectedValues = [];
        animationProperty = "x";

        timer = new Timer();
        timer.setFramerate(50);
        timer.updateCallback = timerUpdateHandler;
        timer.start();
    });

    afterEach(function() {
        timer.stop();
    });

    describe("", function() {

        it("defaults", function() {
            animation = new Animation({target: target});
            expect(animation.fromValue).toEqual(0);
            expect(animation.toValue).toEqual(1);
            expect(animation.property).toEqual("x");
        });
    });

    xdescribe("update call count", function() {

        it("50 fps = 50 updates with default 1000ms duration", function(done) {
            animation = new Animation({target: target});
            spyOn(animation, "update").and.callThrough();

            playAndWaitForAnimation(animation, function() {
                // Error somethimes: Expected 51 to equal 50.
                expect(animation.update.calls.count()).toEqual(50);
                done();
            });
        });

        it("50 fps = 5 updates with 100ms duration", function(done) {
            animation = new Animation({target: target, duration:100});
            spyOn(animation, "update").and.callThrough();

            playAndWaitForAnimation(animation, function() {
                // Error sometimes: Expected 6 to equal 5.
                expect(animation.update.calls.count()).toEqual(5);
                done();
            });
        });

        it("100 fps = 10 updates with 100ms duration", function(done) {
            timer.setFramerate(100);
            animation = new Animation({target: target, duration:100});
            spyOn(animation, "update").and.callThrough();

            playAndWaitForAnimation(animation, function() {
                // Error sometimes: Expected 11 to equal 10.
                expect(animation.update.calls.count()).toEqual(10);
                done();
            });
        });
    });

    xdescribe("animation values with", function() {

        it("50fps 100ms", function(done) {
            animation = new Animation({target: target, duration:100});

            playAndWaitForAnimation(animation, function() {

                expect(collectedValues.length).toEqual(5);
                expect(collectedValues[0].toFixed(3)).toEqual("0.000");
                expect(collectedValues[1].toFixed(3)).toEqual("0.250");
                expect(collectedValues[2].toFixed(3)).toEqual("0.500");
                expect(collectedValues[3].toFixed(3)).toEqual("0.750");
                expect(collectedValues[4].toFixed(3)).toEqual("1.000");

                done();
            });
        });

        it("50fps 200ms", function(done) {
            animation = new Animation({target: target, duration:200});

            playAndWaitForAnimation(animation, function() {
                expect(collectedValues.length).toEqual(10);
                expect(collectedValues[0].toFixed(3)).toEqual("0.000");
                expect(collectedValues[1].toFixed(3)).toEqual("0.111");
                expect(collectedValues[2].toFixed(3)).toEqual("0.222");
                expect(collectedValues[3].toFixed(3)).toEqual("0.333");
                expect(collectedValues[4].toFixed(3)).toEqual("0.444");

                expect(collectedValues[5].toFixed(3)).toEqual("0.556");
                expect(collectedValues[6].toFixed(3)).toEqual("0.667");
                expect(collectedValues[7].toFixed(3)).toEqual("0.778");
                expect(collectedValues[8].toFixed(3)).toEqual("0.889");
                expect(collectedValues[9].toFixed(3)).toEqual("1.000");

                done();
            });
        });

        it("50fps 100ms from 2 to 4", function(done) {
            animation = new Animation({target: target, duration:100, from:2, to:4});

            playAndWaitForAnimation(animation, function() {
                expect(collectedValues.length).toEqual(5);
                expect(collectedValues[0].toFixed(3)).toEqual("2.000");
                expect(collectedValues[1].toFixed(3)).toEqual("2.500");
                expect(collectedValues[2].toFixed(3)).toEqual("3.000");
                expect(collectedValues[3].toFixed(3)).toEqual("3.500");
                expect(collectedValues[4].toFixed(3)).toEqual("4.000");

                done();
            });
        });

        it("50fps 100ms from 4 to 2", function(done) {
            animation = new Animation({target: target, duration:100, from:4, to:2});

            playAndWaitForAnimation(animation, function() {
                expect(collectedValues.length).toEqual(5);
                expect(collectedValues[0].toFixed(3)).toEqual("4.000");
                expect(collectedValues[1].toFixed(3)).toEqual("3.500");
                expect(collectedValues[2].toFixed(3)).toEqual("3.000");
                expect(collectedValues[3].toFixed(3)).toEqual("2.500");
                expect(collectedValues[4].toFixed(3)).toEqual("2.000");

                done();
            });
        });

        it("50fps 100ms from 2 to -2", function(done) {
            animation = new Animation({target: target, duration:100, from:2, to:-2});

            playAndWaitForAnimation(animation, function() {
                expect(collectedValues.length).toEqual(5);
                expect(collectedValues[0].toFixed(3)).toEqual("2.000");
                expect(collectedValues[1].toFixed(3)).toEqual("1.000");
                expect(collectedValues[2].toFixed(3)).toEqual("0.000");
                expect(collectedValues[3].toFixed(3)).toEqual("-1.000");
                expect(collectedValues[4].toFixed(3)).toEqual("-2.000");

                done();
            });
        });
    });

    function timerUpdateHandler()
    {
        if (animation)
        {
            animation.update();
            collectedValues.push(target[animationProperty]);
        }
    }

    function playAndWaitForAnimation(animation, callback)
    {
        animation.play();
        waitForFalseyValue(animation, 'isPlaying', callback);
    }

    function waitForFalseyValue(obj, method, callback, timeout)
    {
        var interval = 20;
        var timeout = timeout || 5000;
        var startTime = new Date().getTime();
        var intervalId = setInterval(test, interval);
        var i = 0;

        function test()
        {
            i++;

            if(!obj[method]())
            {
                clearInterval(intervalId);
                callback();
            }

            if(hasElapsed())
            {
                clearInterval(intervalId);
            }
        }

        function hasElapsed()
        {
            var currentTime = new Date().getTime();
            var elapsed = currentTime - startTime;

            if(elapsed >= timeout)
            {
                return true;
            }

            return false;
        }
    }
});
