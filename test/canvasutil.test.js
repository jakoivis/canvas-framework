describe("CanvasUtil:", function() {

    beforeEach(function() {
    });

    afterEach(function() {
    });

    describe("getImageDataFromTag returned object", function() {

        it("has properties", function(done) {

            ImageLoadHelper.getImageTag(function(imageTag) {

                var imageData = CanvasUtil.getImageDataFromTag(imageTag);

                ImageTester.expectToHaveImageDataProperties(imageData);
                ImageTester.expectImageDataSizeToBe(imageData, 20, 20);

                done();
            });
        });
    });


});