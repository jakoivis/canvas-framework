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

    xdescribe("", function() {

        it("defaults", function() {
            transition = new Transition({target: target});
            expect(transition.fromValue).toEqual(0);
            expect(transition.toValue).toEqual(1);
            expect(transition.property).toEqual("x");
        });
    });

    xdescribe("update call count", function() {

        it("50 fps = 50 updates with default 1000ms duration", function() {
            transition = new Transition({target: target});
            spyOn(transition, "update").andCallThrough();
            playAndWaitToComplete();

            runs(function () {
                expect(transition.update.callCount).toEqual(50);
            });
        });

        it("50 fps = 5 updates with 100ms duration", function() {
            transition = new Transition({target: target, duration:100});
            spyOn(transition, "update").andCallThrough();
            playAndWaitToComplete();

            runs(function () {
                expect(transition.update.callCount).toEqual(5);
            });
        });

        it("100 fps = 10 updates with 100ms duration", function() {
            timer.setFramerate(100);
            transition = new Transition({target: target, duration:100});
            spyOn(transition, "update").andCallThrough();
            playAndWaitToComplete();

            runs(function () {
                // Error sometimes: Expected 11 to equal 10.
                expect(transition.update.callCount).toEqual(10);
            });
        });
    });

    xdescribe("transition values with", function() {

        it("50fps 100ms", function() {
            transition = new Transition({target: target, duration:100});
            playAndWaitToComplete();

            runs(function () {
                expect(collectedValues.length).toEqual(5);
                expect(collectedValues[0].toFixed(3)).toEqual("0.000");
                expect(collectedValues[1].toFixed(3)).toEqual("0.250");
                expect(collectedValues[2].toFixed(3)).toEqual("0.500");
                expect(collectedValues[3].toFixed(3)).toEqual("0.750");
                expect(collectedValues[4].toFixed(3)).toEqual("1.000");
            });
        });

        it("50fps 200ms", function() {
            transition = new Transition({target: target, duration:200});
            playAndWaitToComplete();

            runs(function () {
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
            });
        });

        it("50fps 100ms from 2 to 4", function() {
            transition = new Transition({target: target, duration:100, from:2, to:4});
            playAndWaitToComplete();

            runs(function () {
                expect(collectedValues.length).toEqual(5);
                expect(collectedValues[0].toFixed(3)).toEqual("2.000");
                expect(collectedValues[1].toFixed(3)).toEqual("2.500");
                expect(collectedValues[2].toFixed(3)).toEqual("3.000");
                expect(collectedValues[3].toFixed(3)).toEqual("3.500");
                expect(collectedValues[4].toFixed(3)).toEqual("4.000");
            });
        });

        it("50fps 100ms from 4 to 2", function() {
            transition = new Transition({target: target, duration:100, from:4, to:2});
            playAndWaitToComplete();

            runs(function () {
                expect(collectedValues.length).toEqual(5);
                expect(collectedValues[0].toFixed(3)).toEqual("4.000");
                expect(collectedValues[1].toFixed(3)).toEqual("3.500");
                expect(collectedValues[2].toFixed(3)).toEqual("3.000");
                expect(collectedValues[3].toFixed(3)).toEqual("2.500");
                expect(collectedValues[4].toFixed(3)).toEqual("2.000");
            });
        });

        it("50fps 100ms from 2 to -2", function() {
            transition = new Transition({target: target, duration:100, from:2, to:-2});
            playAndWaitToComplete();

            runs(function () {
                expect(collectedValues.length).toEqual(5);
                expect(collectedValues[0].toFixed(3)).toEqual("2.000");
                expect(collectedValues[1].toFixed(3)).toEqual("1.000");
                expect(collectedValues[2].toFixed(3)).toEqual("0.000");
                expect(collectedValues[3].toFixed(3)).toEqual("-1.000");
                expect(collectedValues[4].toFixed(3)).toEqual("-2.000");
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

    function playAndWaitToComplete(timeout)
    {
        transition.play();

        waitsFor(function() {
            return !transition.isPlaying();
        }, "transition to finish", timeout || 1200);
    }
});