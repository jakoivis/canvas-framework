describe("Transition:", function() {

    ClassTester.classTest(Transition);

    var timer;
    var transition;
    var target;
    var collectedValues;
    var transitionProperty;

    beforeEach(function() {
        target = {x:0, y:0};
        collectedValues = [];
        transitionProperty = "x";

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
            transition = new Transition({target: target});
            expect(transition.fromValue).toEqual(0);
            expect(transition.toValue).toEqual(1);
            expect(transition.property).toEqual("x");
        });
    });

    xdescribe("update call count", function() {

        it("50 fps = 50 updates with default 1000ms duration", function(done) {
            transition = new Transition({target: target});
            spyOn(transition, "update").and.callThrough();

            playAndWaitForTransition(transition, function() {
                // Error somethimes: Expected 51 to equal 50.
                expect(transition.update.calls.count()).toEqual(50);
                done();
            });
        });

        it("50 fps = 5 updates with 100ms duration", function(done) {
            transition = new Transition({target: target, duration:100});
            spyOn(transition, "update").and.callThrough();

            playAndWaitForTransition(transition, function() {
                // Error sometimes: Expected 6 to equal 5.
                expect(transition.update.calls.count()).toEqual(5);
                done();
            });
        });

        it("100 fps = 10 updates with 100ms duration", function(done) {
            timer.setFramerate(100);
            transition = new Transition({target: target, duration:100});
            spyOn(transition, "update").and.callThrough();

            playAndWaitForTransition(transition, function() {
                // Error sometimes: Expected 11 to equal 10.
                expect(transition.update.calls.count()).toEqual(10);
                done();
            });
        });
    });

    xdescribe("transition values with", function() {

        it("50fps 100ms", function(done) {
            transition = new Transition({target: target, duration:100});

            playAndWaitForTransition(transition, function() {

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
            transition = new Transition({target: target, duration:200});

            playAndWaitForTransition(transition, function() {
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
            transition = new Transition({target: target, duration:100, from:2, to:4});

            playAndWaitForTransition(transition, function() {
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
            transition = new Transition({target: target, duration:100, from:4, to:2});

            playAndWaitForTransition(transition, function() {
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
            transition = new Transition({target: target, duration:100, from:2, to:-2});

            playAndWaitForTransition(transition, function() {
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
        if (transition)
        {
            transition.update();
            collectedValues.push(target[transitionProperty]);
        }
    }

    function playAndWaitForTransition(transition, callback)
    {
        transition.play();
        waitForFalseyValue(transition, 'isPlaying', callback);
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