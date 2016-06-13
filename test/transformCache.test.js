var chai = require('chai');

chai.should();

describe("TransformCache:", function() {

    beforeEach(function() {
    });

    afterEach(function() {
    });

    describe("", function() {

        it("Should", function() {
        });
    });

    describe("createCache", function() {

        it("asd", function() {
            var mockImageData = {
                width: 7,
                height: 7
            };

            var t = new TransformCache(mockImageData, 4);
            t.createCache();

            // console.log(t.cache);
        });
    });

    describe("isApproximated", function() {
        var mockImageData = {
            width: 0,
            height: 0
        };

        it("should return false for first 5x5", function() {
            var t = new TransformCache(mockImageData);

            // approximate 1, calculate 0
            var expected = [
                [0, 1, 0, 1, 0],
                [1, 1, 1, 1, 0],
                [0, 1, 0, 1, 0],
                [1, 1, 1, 1, 0],
                [0, 0, 0, 0, 0]
            ];

            var w = expected[0].length;
            var h = expected.length;
            var value;

            for(var y = 0; y < expected.length; y++)
            {
                for(var x = 0; x < expected[y].length; x++)
                {
                    value = Boolean(expected[y][x]);
                    t.isApproximated(w, h, x, y).should.equal(value);
                }
            }
        });

        it("should return false for first 6x6", function() {
            var t = new TransformCache(mockImageData);

            // approximate 1, calculate 0
            var expected = [
                [0, 1, 0, 1, 0, 0],
                [1, 1, 1, 1, 1, 0],
                [0, 1, 0, 1, 0, 0],
                [1, 1, 1, 1, 1, 0],
                [0, 1, 0, 1, 0, 0],
                [0, 0, 0, 0, 0, 0]
            ];

            var w = expected[0].length;
            var h = expected.length;
            var value;

            for(var y = 0; y < expected.length; y++)
            {
                for(var x = 0; x < expected[y].length; x++)
                {
                    value = Boolean(expected[y][x]);
                    t.isApproximated(w, h, x, y).should.equal(value);
                }
            }
        });

    });
});
