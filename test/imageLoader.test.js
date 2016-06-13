xdescribe("ImageLoader", function() {

    function getImages_stringArray() {
        return [
            "assets/sample1_tb.png",
            "assets/sample2_tb.png",
            "assets/sample3_tb.png"];
    }

    function getImages_stringArray_lastFails() {
        return [
            "assets/sample1_tb.png",
            "assets/sample2_tb.png",
            "assets/samplex_tb.png"];
    }

    function getImages_objectArray() {
        return [
            {src: "assets/sample1_tb.png", prop1:"value1", prop2:"value2"},
            {src: "assets/sample2_tb.png", prop3:3},
            {src: "assets/sample3_tb.png", prop4:4.4}
        ];
    }

    function getImages_objectArray_lastFails() {
        return [
            {src: "assets/sample1_tb.png", prop1:"value1", prop2:"value2"},
            {src: "assets/sample2_tb.png", prop3:3},
            {src: "assets/samplex_tb.png", prop4:4.4}
        ];
    }

    function getImages_objectArray_missingSrc() {
        return [
            {src: "assets/sample1_tb.png", prop1:"value1", prop2:"value2"},
            {prop3:3},
            {src: "assets/sample1_tb.png", prop4:4.4}
        ];
    }

    var TIMEOUT = 100;

    beforeEach(function(){
    });

    afterEach(function() {
    });

    describe("Options", function() {
        it("should be defined", function() {
            expect(function(){
                new ImageLoader();
            }).toThrow(new Error("Options should be an Object"));
        });

        it("should have images property", function() {
            expect(function(){
                new ImageLoader({});
            }).toThrow(new Error("Options object should have 'images' property (type of array) containing paths to the loaded images."));
        });

        it("images property should be an array", function() {
            expect(function(){
                new ImageLoader({images:{}});
            }).toThrow(new Error("Options object should have 'images' property (type of array) containing paths to the loaded images."));
        });

        it("onComplete should be a function", function() {
            expect(function(){
                new ImageLoader({images:[], onComplete:[]});
            }).toThrow(new Error("'onComplete' property should be a function"));
        });

        it("onFileComplete should be a function", function() {
            expect(function(){
                new ImageLoader({images:[], onFileComplete:[]});
            }).toThrow(new Error("'onFileComplete' property should be a function"));
        });

        it("onFileStart should be a function", function() {
            expect(function(){
                new ImageLoader({images:[], onFileStart:[]});
            }).toThrow(new Error("'onFileStart' property should be a function"));
        });

        it("image objects cannot be undefined or null", function() {
            expect(function(){
                new ImageLoader({images:[undefined]});
            }).toThrow(new Error("Objects in 'images' cannot be null or undefined"));
        });

        it("image objects should have src attributes", function() {
            expect(function(){
                new ImageLoader({images:[{src:""},{}]});
            }).toThrow(new Error("Objects in 'images' property should have src property"));
        });

        it("numberOfThreads should be positive integer", function () {
            expect(function(){
                new ImageLoader({images:[], numberOfThreads: -1});
            }).toThrow(new Error("'numberOfThreads' should be integer number grater than 0"));
        });

        it("numberOfThreads cannot be 0", function () {
            expect(function(){
                new ImageLoader({images:[], numberOfThreads: 0});
            }).toThrow(new Error("'numberOfThreads' should be integer number grater than 0"));
        });

        it("numberOfThreads should be a number", function () {
            expect(function(){
                new ImageLoader({images:[], numberOfThreads: "asd"});
            }).toThrow(new Error("'numberOfThreads' should be integer number grater than 0"));
        });

        it("simulationDelayMin should be positive integer", function () {
            expect(function(){
                new ImageLoader({images:[], simulationDelayMin: -1});
            }).toThrow(new Error("'simulationDelayMin' should be a non-negative integer number"));
        });

        it("simulationDelayMin should be a number", function () {
            expect(function(){
                new ImageLoader({images:[], simulationDelayMin: "asd"});
            }).toThrow(new Error("'simulationDelayMin' should be a non-negative integer number"));
        });

        it("simulationDelayMax should be positive integer", function () {
            expect(function(){
                new ImageLoader({images:[], simulationDelayMax: -1});
            }).toThrow(new Error("'simulationDelayMax' should be a non-negative integer number"));
        });

        it("simulationDelayMax should be a number", function () {
            expect(function(){
                new ImageLoader({images:[], simulationDelayMax: "asd"});
            }).toThrow(new Error("'simulationDelayMax' should be a non-negative integer number"));
        });
    });

    describe("Initialization", function() {

        it("Can be initialized without new keyword", function(done) {
            var images = getImages_stringArray();
            var loader = ImageLoader({images:images, onComplete: complete});

            function complete() {
                done();
            }
        });

        it("should have no items if images array is empty", function() {
            var loader = new ImageLoader({images:[], autoload:false});
            expect(loader.length()).toEqual(0);
        });
    });

    describe("options.autoload", function() {

        it("onComplete is not executed if autoload = false and loading is not started", function() {
            var onCompleteSpy = jasmine.createSpy('onComplete');
            var images = getImages_stringArray();
            var loader = new ImageLoader({images:images, onComplete:onCompleteSpy, autoload:false});

            expect(onCompleteSpy).not.toHaveBeenCalled();
        });

        it("load call starts the loading when autoload = false", function(done) {
            var images = getImages_stringArray();
            var loader = new ImageLoader({images:images, onComplete: complete, autoload:false});

            loader.load();

            function complete() {
                done();
            }
        });
    });

    describe("ImageLoader.isComplete", function() {

        it("returns false if nothing has been loaded", function() {
            var images = getImages_stringArray();
            var loader = new ImageLoader({images:images, autoload:false});
            expect(loader.isComplete()).toEqual(false);
        });

        it("returns true if everything has been loaded (options.images[n] is string)", function(done) {
            var images = getImages_stringArray();
            var loader = new ImageLoader({images:images, onComplete: complete});

            function complete() {
                expect(loader.isComplete()).toEqual(true);
                done();
            }
        });

        it("returns true if everything has been loaded (options.images[n] is object)", function(done) {
            var images = getImages_objectArray();
            var loader = new ImageLoader({images:images, onComplete: complete});

            function complete() {
                expect(loader.isComplete()).toEqual(true);
                done();
            }
        });
    });

    describe("options.onComplete", function() {

        it("is executed once", function(done) {
            var onCompleteSpy = jasmine.createSpy('onComplete');
            var images = getImages_stringArray();
            var loader = new ImageLoader({images:images, onComplete: onCompleteSpy});

            waitLoaderComplete(loader, function() {
                expect(onCompleteSpy.calls.count()).toEqual(1);
                done();
            });
        });

        it("all itmes should be complete", function(done) {
            var onCompleteSpy = jasmine.createSpy('onComplete');
            var images = getImages_stringArray();
            var loader = new ImageLoader({images:images, onComplete:onCompleteSpy});

            waitLoaderComplete(loader, function() {

                for (var i = 0; i < loader.length(); i++) {
                    expect(loader.getItemAt(i).isComplete()).toEqual(true);
                }

                done();
            });


        });

        it("is also executed for failing last file", function(done) {
            var onCompleteSpy = jasmine.createSpy('onComplete');
            var images = getImages_stringArray_lastFails();
            var loader = new ImageLoader({images:images, onComplete:onCompleteSpy});

            waitLoaderComplete(loader, function () {
                expect(onCompleteSpy.calls.count()).toEqual(1);
                done();
            });
        });
    });

    describe("options.onFileComplete", function() {

        it("has ImageLoader instance as an argument", function(done) {
            var onFileCompleteSpy = jasmine.createSpy('onFileComplete');
            var images = getImages_stringArray();
            var loader = new ImageLoader({images:images, onFileComplete:onFileCompleteSpy});

            waitLoaderComplete(loader, function() {
                var imageLoaderItem = onFileCompleteSpy.calls.mostRecent().args[0];
                assertIsImageLoaderItemObject(imageLoaderItem);

                done();
            });
        });

        it("is executed after each successfull or unsuccessfull load", function(done) {
            var images = getImages_stringArray();
            var loader = new ImageLoader({images:images, onFileComplete: fileComplete});

            waitLoaderComplete(loader, function() {
                done();
            });

            function fileComplete(item) {
                expect(item.isComplete()).toEqual(true);
            }
        });

        it("is executed correct number of times", function(done) {
            var onFileCompleteSpy = jasmine.createSpy('onFileComplete');
            var images = getImages_stringArray_lastFails();
            var loader = new ImageLoader({images:images, onFileComplete:onFileCompleteSpy});

            waitLoaderComplete(loader, function() {
                expect(onFileCompleteSpy.calls.count()).toEqual(3);
                done();
            });
        });
    });

    describe("options.onFileStart", function() {

        it("has ImageLoaderItem instance as an argument", function(done) {
            var onFileStartSpy = jasmine.createSpy('onFileStart');
            var images = getImages_stringArray();
            var loader = new ImageLoader({images:images, onFileStart:onFileStartSpy});

            waitLoaderComplete(loader, function() {
                var imageLoaderItem = onFileStartSpy.calls.mostRecent().args[0];
                assertIsImageLoaderItemObject(imageLoaderItem);
                done();
            });
        });

        it("is executed before each successfull or unsuccessfull load", function(done) {
            var images = getImages_stringArray_lastFails();
            var loader = new ImageLoader({images:images, onFileStart:fileStart});

            waitLoaderComplete(loader, function() {
                done();
            });

            function fileStart(item) {
                expect(item.isLoading()).toEqual(true);
            }
        });
    });

    describe("ImageLoader.getQueue", function() {

        it("should return correct number of items", function(done) {
            var images = getImages_objectArray_lastFails();
            var loader = new ImageLoader({images:images, onFileComplete: fileComplete, autoload:false});
            var result = [loader.length()];

            loader.load();

            waitLoaderComplete(loader, function() {
                expect(result [0]).toEqual(3);
                expect(result [1]).toEqual(3);
                expect(result [2]).toEqual(3);
                expect(result [3]).toEqual(3);
                done();
            });

            function fileComplete(item) {
                result.push(loader.length());
            }
        });
    });

    describe("Returned data", function() {

        it("Should have tag property holding the image tag, except the failing ones", function(done) {
            var images = getImages_stringArray_lastFails();
            var loader = new ImageLoader({images:images});

            waitLoaderComplete(loader, function() {

                expect(loader.getItemAt(0).tag.nodeName).toEqual("IMG");
                expect(loader.getItemAt(1).tag.nodeName).toEqual("IMG");
                expect(loader.getItemAt(2).tag).toEqual(undefined);

                done();
            });
        });

        it("Should have properties property holding the original information", function(done) {
            var images = getImages_objectArray_lastFails();
            var loader = new ImageLoader({images:images});

            waitLoaderComplete(loader, function() {

                for(var i = 0; i < images.length; i++) {

                    for(var property in images[i]) {

                        expect(loader.getItemAt(i).hasOwnProperty(property)).toEqual(true);
                        expect(loader.getItemAt(i)[property]).toEqual(images[i][property]);
                    }
                }

                done();
            });
        });

        it("Should have src property", function(done) {
            var images = getImages_objectArray_lastFails();
            var loader = new ImageLoader({images:images});

            waitLoaderComplete(loader, function() {

                expect(loader.getItemAt(0).src).toEqual(images[0].src);
                expect(loader.getItemAt(1).src).toEqual(images[1].src);
                expect(loader.getItemAt(2).src).toEqual(images[2].src);

                done();
            });
        });

        it("Should have status property", function(done) {
            var images = getImages_objectArray_lastFails();
            var loader = new ImageLoader({images:images});

            waitLoaderComplete(loader, function() {

                expect(loader.getItemAt(0).status).toEqual("complete");
                expect(loader.getItemAt(1).status).toEqual("complete");
                expect(loader.getItemAt(2).status).toEqual("failed");

                done();
            });
        });

        it("Status functions should return correct values", function(done) {
            var images = getImages_objectArray_lastFails();
            var loader = new ImageLoader({images:images});

            waitLoaderComplete(loader, function() {

                expect(loader.getItemAt(0).isPending()).toEqual(false);
                expect(loader.getItemAt(0).isComplete()).toEqual(true);
                expect(loader.getItemAt(0).isLoading()).toEqual(false);
                expect(loader.getItemAt(0).isFailed()).toEqual(false);
                expect(loader.getItemAt(2).isPending()).toEqual(false);
                expect(loader.getItemAt(2).isComplete()).toEqual(false);
                expect(loader.getItemAt(2).isLoading()).toEqual(false);
                expect(loader.getItemAt(2).isFailed()).toEqual(true);

                done();
            });
        });
    });

    describe("Loading statistics", function() {

        it("percent loaded", function(done) {
            var images = getImages_objectArray();
            var loader = new ImageLoader({images:images, onFileComplete: fileComplete, autoload:false});
            var result = [loader.getPercentLoaded()];

            loader.load();

            waitLoaderComplete(loader, function() {
                expect(result.length).toEqual(4);

                var result0Fixed = result[0].toFixed(3);
                var result1Fixed = result[1].toFixed(3);
                var result2Fixed = result[2].toFixed(3);
                var result3Fixed = result[3].toFixed(3);

                expect(result0Fixed).toEqual("0.000");
                expect(result1Fixed).toEqual("0.333");
                expect(result2Fixed).toEqual("0.667");
                expect(result3Fixed).toEqual("1.000");

                done();
            });

            function fileComplete(item) {
                result.push(loader.getPercentLoaded());
            }
        });
    });

    describe("numberOfThreads:", function() {

        it("loading should be done in sequence and loading order shold be preserved (1 thread)", function(done) {
            // add simulation delay to mix up the finishing times
            var images = getImages_stringArray().concat(getImages_stringArray());
            var loader = new ImageLoader({images:images, onFileComplete: fileComplete, numberOfThreads:1, simulationDelayMin:25, simulationDelayMax:100});
            var result = [];

            waitLoaderComplete(loader, function() {

                for(var i = 0; i < images.length; i++) {
                    expect(result[i]).toEqual(images[i]);
                }

                done();
            });

            function fileComplete(item) {
                result.push(item.src);
            }
        });

        it("final order should be preserved (3 thread)", function(done) {
            // add simulation delay to mix up the finishing times
            var images = getImages_stringArray().concat(getImages_stringArray());
            var loader = new ImageLoader({images:images, numberOfThreads:3, simulationDelayMin:25, simulationDelayMax:100});

            waitLoaderComplete(loader, function() {

                for(var i = 0; i < images.length; i++) {

                    expect(images[i]).toEqual(loader.getItemAt(i).src);
                }

                done();
            });
        });

        it("Number of threads is grater than number of images", function(done) {
            var onFileCompleteSpy = jasmine.createSpy('onFileComplete');
            var onCompleteSpy = jasmine.createSpy('onComplete');
            var onFileStartSpy = jasmine.createSpy('onFileStart');
            var images = getImages_stringArray();
            var loader = new ImageLoader({images:images, numberOfThreads:6,
                                       simulationDelayMin:25, simulationDelayMax:100,
                                       onComplete:onCompleteSpy, onFileComplete:onFileCompleteSpy,
                                       onFileStart:onFileStartSpy});

            waitLoaderComplete(loader, function() {
                expect(onCompleteSpy.calls.count()).toEqual(1);
                expect(onFileCompleteSpy.calls.count()).toEqual(3);
                expect(onFileStartSpy.calls.count()).toEqual(3);
                done();
            });
        });
    });

    describe("Simulation delays", function() {

        it("It's enough to specify only simulationDelayMin", function(done) {
            var onCompleteSpy = jasmine.createSpy('onComplete');
            var images = getImages_stringArray_lastFails();
            var loader = new ImageLoader({images:images,
                                       simulationDelayMin:25,
                                       onComplete:onCompleteSpy});

            waitLoaderComplete(loader, function() {
                expect(onCompleteSpy.calls.count()).toEqual(1);
                expect(loader.getItemAt(0).isComplete()).toEqual(true);
                expect(loader.getItemAt(1).isComplete()).toEqual(true);
                expect(loader.getItemAt(2).isFailed()).toEqual(true);
                done();
            });
        });

        it("It's enough to specify only simulationDelayMax", function(done) {
            var onCompleteSpy = jasmine.createSpy('onComplete');
            var images = getImages_stringArray_lastFails();
            var loader = new ImageLoader({images:images,
                                       simulationDelayMax:25,
                                       onComplete:onCompleteSpy});

            waitLoaderComplete(loader, function() {
                expect(onCompleteSpy.calls.count()).toEqual(1);
                expect(loader.getItemAt(0).isComplete()).toEqual(true);
                expect(loader.getItemAt(1).isComplete()).toEqual(true);
                expect(loader.getItemAt(2).isFailed()).toEqual(true);
                done();
            });
        })
    });

    describe("General functionality", function() {

        it("Modified arrays and objects should not affect the loader", function(done) {
            var images = getImages_stringArray_lastFails();
            var loader = new ImageLoader({images:images, autoload:false});

            // change the loaded files after it has been given for the imageLoader
            images.push("someFile");

            // then execute load. the changes should not be included in the ImageLoader
            loader.load();

            waitLoaderComplete(loader, function() {
                expect(loader.length()).toEqual(3);
                done();
            });
        });

        it("ImageLoader.load does nothing when called during loading", function(done) {
            var onFileCompleteSpy = jasmine.createSpy('onFileComplete');
            var onCompleteSpy = jasmine.createSpy('onComplete');
            var images = getImages_stringArray_lastFails();
            var loader = new ImageLoader({images:images, onFileComplete:onFileCompleteSpy, onComplete:onCompleteSpy});

            loader.load();

            waitLoaderComplete(loader, function() {
                expect(onCompleteSpy.calls.count()).toEqual(1);
                expect(onFileCompleteSpy.calls.count()).toEqual(3);
                done();
            });
        });

        it("ImageLoader.load does nothing when called after loading", function(done) {
            var onFileCompleteSpy = jasmine.createSpy('onFileComplete');
            var onCompleteSpy = jasmine.createSpy('onComplete');
            var images = getImages_stringArray_lastFails();
            var loader = new ImageLoader({images:images, onFileComplete:onFileCompleteSpy, onComplete:onCompleteSpy});

            waitLoaderComplete(loader, function() {
                loader.load();

                waitLoaderComplete(loader, function() {
                    expect(onCompleteSpy.calls.count()).toEqual(1);
                    expect(onFileCompleteSpy.calls.count()).toEqual(3);
                    done();
                });
            });
        });
    });

    function assertIsImageLoaderItemObject(item)
    {
        var hasTag = item.hasOwnProperty('tag');
        var hasSrc = item.hasOwnProperty('src');
        var hasStatus = item.hasOwnProperty('status');

        expect(hasTag).toEqual(true);
        expect(hasSrc).toEqual(true);
        expect(hasStatus).toEqual(true)
    }

    function waitLoaderComplete(loader, callback, timeout)
    {
        waitForTruthyValue(loader, 'isComplete', callback, timeout);
    }

    function waitForTruthyValue(obj, method, callback, timeout)
    {
        var interval = 20;
        var timeout = timeout || 5000;
        var startTime = new Date().getTime();
        var intervalId = setInterval(test, interval);
        var i = 0;

        function test()
        {
            i++;

            if(obj[method]())
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