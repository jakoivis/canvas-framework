var ImageDataUtil = require("./utils/ImageDataUtil.js");

describe("CanvasUtil", function() {

    describe("getImageData", function() {

        it("should return imageData", function(done) {

            ImageDataUtil.getImageTag()
                .then(function(imageTag) {

                    var imageData = CanvasUtil.getImageData(imageTag);

                    imageData.width.should.equal(10);
                    imageData.height.should.equal(10);
                    imageData.data.length.should.equal(10 * 10 * 4);

                    done();
                });
        });
    });

    describe("createImageData", function() {

        it("should return imageData", function() {

            ImageDataUtil.getImageTag()
                .then(function(imageTag) {

                    var imageData1 = CanvasUtil.getImageData(imageTag);
                    var imageData2 = CanvasUtil.createImageData(imageData1);

                    imageData2.width.should.equal(10);
                    imageData2.height.should.equal(10);
                    imageData2.data.length.should.equal(10 * 10 * 4);

                    done();
                });

        });
    });


});