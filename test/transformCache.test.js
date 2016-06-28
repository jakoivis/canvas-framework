describe("TransformCache:", function() {

    beforeEach(function() {
    });

    afterEach(function() {
    });

    describe("", function() {

        xit("Should", function() {
        });
    });

    describe("approximated pixels", function() {

         it("should have correct values (5x5; level=1)", function() {
            var t = new TransformCache({width: 5, height: 5}, 1);

            // approximate 1, calculate 0
            var expected = [
                0, 0, 0, 0, 0,
                0, 0, 0, 0, 0,
                0, 0, 0, 0, 0,
                0, 0, 0, 0, 0,
                0, 0, 0, 0, 0
            ];

            t.logProperty("approximate");

            assertApproximation(t, expected);
        });

        it("should have correct values (5x5; level=2)", function() {
            var t = new TransformCache({width: 5, height: 5}, 2);

            // approximate 1, calculate 0
            var expected = [
                0, 1, 0, 1, 0,
                1, 1, 1, 1, 1,
                0, 1, 0, 1, 0,
                1, 1, 1, 1, 1,
                0, 1, 0, 1, 0
            ];

            // t.logProperty("approximate");

            assertApproximation(t, expected);
        });

        it("should have correct values (6x6; level=2)", function() {
            var t = new TransformCache({width: 6, height: 6}, 2);

            // approximate 1, calculate 0
            var expected = [
                0, 1, 0, 1, 0, 0,
                1, 1, 1, 1, 1, 1,
                0, 1, 0, 1, 0, 0,
                1, 1, 1, 1, 1, 1,
                0, 1, 0, 1, 0, 0,
                0, 1, 0, 1, 0, 0
            ];

            // t.logProperty("approximate");

            assertApproximation(t, expected);
        });

        it("should have correct values (5x5; level=3)", function() {
            var t = new TransformCache({width: 5, height: 5}, 3);

            // approximate 1, calculate 0
            var expected = [
                0, 1, 1, 0, 0,
                1, 1, 1, 1, 1,
                1, 1, 1, 1, 1,
                0, 1, 1, 0, 0,
                0, 1, 1, 0, 0
            ];

            // t.logProperty("approximate");

            assertApproximation(t, expected);
        });

        it("should have correct values (6x6; level=3)", function() {
            var t = new TransformCache({width: 6, height: 6}, 3);

            // approximate 1, calculate 0
            var expected = [
                0, 1, 1, 0, 1, 0,
                1, 1, 1, 1, 1, 1,
                1, 1, 1, 1, 1, 1,
                0, 1, 1, 0, 1, 0,
                1, 1, 1, 1, 1, 1,
                0, 1, 1, 0, 1, 0
            ];

            // t.logProperty("approximate");

            assertApproximation(t, expected);
        });

        function assertApproximation(transformCache, expected)
        {
            var data = transformCache.data;
            var length = data.length;
            var value;

            for(var i = 0; i < length; i++)
            {
                value = Boolean(expected[i]);
                data[i].approximate.should.equal(value);
            }
        }
    });

    describe("approximation pixel indices", function() {

        it("should have correct values (5x5; level=1)", function() {
            var t = new TransformCache({width: 5, height: 5}, 1);

            var expected = [
                -1, -1, -1, -1, -1,
                -1, -1, -1, -1, -1,
                -1, -1, -1, -1, -1,
                -1, -1, -1, -1, -1,
                -1, -1, -1, -1, -1
            ];

            // t.logProperty("i1");
            // t.logProperty("i2");

            assertApproximationIndex(t, expected, "i1");
            assertApproximationIndex(t, expected, "i2");
        })

        it("should have correct values (5X5; level=2)", function() {
            var t = new TransformCache({width: 5, height: 5}, 2);

            var expected1 = [
                -1,  0, -1,  2, -1,
                 0,  5,  2,  7,  4,
                -1, 10, -1, 12, -1,
                10, 15, 12, 17, 14,
                -1, 20, -1, 22, -1
            ];

            var expected2 = [
                -1,  2, -1,  4, -1,
                10,  1, 12,  3, 14,
                -1, 12, -1, 14, -1,
                20, 11, 22, 13, 24,
                -1, 22, -1, 24, -1
            ];

            // t.logProperty("i1");
            // t.logProperty("i2");

            assertApproximationIndex(t, expected1, "i1");
            assertApproximationIndex(t, expected2, "i2");
        });

         it("should have correct values (6x6; level=2)", function() {
            var t = new TransformCache({width: 6, height: 6}, 2);

            var expected1 = [
                -1,  0, -1,  2, -1, -1,
                0,   6,  2,  8,  4,  5,
                -1, 12, -1, 14, -1, -1,
                12, 18, 14, 20, 16, 17,
                -1, 24, -1, 26, -1, -1,
                -1, 30, -1, 32, -1, -1
            ];

            var expected2 = [
                -1,  2, -1,  4, -1, -1,
                12,  1, 14,  3, 16, 17,
                -1, 14, -1, 16, -1, -1,
                24, 13, 26, 15, 28, 29,
                -1, 26, -1, 28, -1, -1,
                -1, 32, -1, 34, -1, -1
            ];

            // t.logProperty("i1");
            // t.logProperty("i2");

            assertApproximationIndex(t, expected1, "i1");
            assertApproximationIndex(t, expected2, "i2");
        });

        it("should have correct values (5X5; level=3)", function() {
            var t = new TransformCache({width: 5, height: 5}, 3);

            var expected1 = [
                -1,  0,  0, -1, -1,
                 0,  5,  6,  3,  4,
                 0, 10, 11,  3,  4,
                -1, 15, 15, -1, -1,
                -1, 20, 20, -1, -1
            ];

            var expected2 = [
                -1,  3, 3, -1, -1,
                15,  1, 2, 18, 19,
                15,  6, 7, 18, 19,
                -1, 18, 18, -1, -1,
                -1, 23, 23, -1, -1
            ];

            // t.logProperty("i1");
            // t.logProperty("i2");

            assertApproximationIndex(t, expected1, "i1");
            assertApproximationIndex(t, expected2, "i2");
        });

        it("should have correct values (6X6; level=3)", function() {
            var t = new TransformCache({width: 6, height: 6}, 3);

            var expected1 = [
                -1,  0,  0, -1,  3, -1,
                 0,  6,  7,  3,  9,  5,
                 0, 12, 13,  3, 15,  5,
                -1, 18, 18, -1, 21, -1,
                18, 24, 25, 21, 27, 23,
                -1, 30, 30, -1, 33, -1
            ];

            var expected2 = [
                -1,  3,  3, -1,  5, -1,
                18,  1,  2, 21,  4, 23,
                18,  7,  8, 21, 10, 23,
                -1, 21, 21, -1, 23, -1,
                30, 19, 20, 33, 22, 35,
                -1, 33, 33, -1, 35, -1
            ];

            // t.logProperty("i1");
            // t.logProperty("i2");

            assertApproximationIndex(t, expected1, "i1");
            assertApproximationIndex(t, expected2, "i2");
        });



        function assertApproximationIndex(transformCache, expected, property)
        {
            var data = transformCache.data;
            var length = data.length;
            var value;

            for(var i = 0; i < length; i++)
            {
                value = expected[i];
                data[i][property].should.equal(value);
            }
        }
    });

});
