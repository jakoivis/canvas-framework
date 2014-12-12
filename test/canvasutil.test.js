describe("CanvasUtil:", function() {
    
    ClassTester.singletonClassTest(CanvasUtil);
    
    var canvasUtil = new CanvasUtil();
    
    beforeEach(function() {
    });
 
    afterEach(function() {
    });
    
    describe("getImageDataFromTag returned object", function() {
        
        it("has properties", function() {
            
            ImageLoadHelper.getImageTag(function(imageTag) {
                
                var imageData = canvasUtil.getImageDataFromTag(imageTag);
                
                ImageTester.expectToHaveImageDataProperties(imageData);
                ImageTester.expectImageDataSizeToBe(imageData, 20, 20);
            });
        });
    });
    
    
});