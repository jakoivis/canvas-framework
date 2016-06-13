/* Usage:
it("...", function(done) {
    ImageLoadHelper.getImageTag(function(imageTag) {
        //...
        done();
    });
});
*/

var ImageLoadHelper = {

    loader: null,

    getImageTag: function (onComplete)
    {
        ImageLoadHelper.loader = new ImageLoader({

            images:['assets/test.png'],

            onComplete: function() {

                onComplete(ImageLoadHelper.loader.getItemAt(0).tag);
            }
        });
    },

    getImageData: function (onComplete)
    {
        ImageLoadHelper.getImageTag(function(imageTag) {

            onComplete(new CanvasUtil().getImageDataFromTag(imageTag));
        });
    }
};

module.exports = ImageLoadHelper;