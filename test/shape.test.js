
'use strict';

describe('Shape:', function() {

    ClassTester.classTest(Shape);

    beforeEach(function() {
    });

    afterEach(function() {
    });

    describe('options', function() {

        it('default values without options', function() {
            var shape = new Shape();
            expect(shape.x).toEqual(0);
            expect(shape.y).toEqual(0);
        });

        it('define values in options', function() {
            var shape = new Shape({
                x: 1,
                y: 2
            });

            expect(shape.x).toEqual(1);
            expect(shape.y).toEqual(2);
        });
    });
});