(function($) {

    /**
     * @param      {object}           options
     * @param      {string}           options.imagePath
     * @param      {number}           options.canvasWidth
     * @param      {number}           options.canvasHeight
     * @return     {TransformTester}
     */
    $.fn.transformTester = function(options)
    {
        var tester = new TransformTester(this, options);

        return this;
    };

    function TransformTester(element, options)
    {
        var layer;
        var loader;
        var transform;

        init();

        function init()
        {
            layer = new Layer({
                appendToBody: true,
                width: options.canvasWidth,
                height: options.canvasHeight
            });

            drawBackground();
            generateForm();

            loader = new ImageLoader({
                images:[options.imagePath],
                onComplete: onImageLoadComplete
            });
        }

        function onImageLoadComplete()
        {
            var loaderItem = loader.getItemAt(0);
            var imageData = CanvasUtil.getImageDataFromTag(loaderItem.tag);

            var graphic = new Graphic({
                imageData: imageData,
                x: 12,
                y: 12
            });

            var graphic2 = new Graphic({
                imageData: imageData,
                x: 280,
                y: 12
            });

            layer.addGraphic(graphic);
            layer.addGraphic(graphic2);
            layer.render();

            transform = new Transform(imageData, layer.getCanvas().getContext("2d"));
        }

        function drawBackground()
        {
            var canvas = layer.getCanvas();
            var context = canvas.getContext("2d");
            context.fillStyle = "#EEEEEE";
            context.fillRect(0, 0, canvas.width, canvas.height);
        }

        function generateForm()
        {
            var $form = $("<form>");
            $(element).append($form);

            new TransformTesterForm($form, updateTransforms);
        }

        function updateTransforms(settings)
        {
            transform.reset();

            for(var transformName in settings)
            {
                transform.do(Transform[transformName], settings[transformName]);
            }

            var graphic = layer.getGraphicAt(0);
            graphic.setImageData(transform.getImageData());
            graphic.clear();
            graphic.render();
        }
    }

    /**
     * Creates and handles the Form
     *
     * @class      TransformTesterForm (name)
     * @param      {object}    element           The element in which the form is renderd
     * @param      {Function}  onSettingsChange  Called when any of the settings changed.
     *                                           Transform settigs are passed as argument.
     */
    function TransformTesterForm(element, onSettingsChange)
    {
        init();

        function init()
        {
            element.append(generateTransformCheckboxes());
            element.append(generateTransformAttributes())
        }

        function generateTransformCheckboxes()
        {
            var fieldsetStr = "<fieldset><legend>Transforms</legend>";

            for(var transformName in Transform.descriptions)
            {
                fieldsetStr += "<p><input class='filter' type='checkbox' value='"+transformName+"'/><label>"+transformName+"</label><p>"
            }

            fieldsetStr += "</fieldset>";

            $fieldset = $(fieldsetStr);

            $fieldset.find('input').change(onFilterChange);

            return $fieldset;
        }

        function onFilterChange()
        {
            var transformName = event.target.value;
            var visible = event.target.checked;

            $("fieldset."+transformName).css('display', visible ? 'block' : 'none');

            notifyChange();
        }

        function generateTransformAttributes()
        {
            var fieldsetStr = "";
            var args;

            for(var transformName in Transform.descriptions)
            {
                fieldsetStr += "<fieldset class='"+transformName+" arguments'><legend>"+transformName+" arguments</legend>";

                args = Transform.descriptions[transformName].arguments;

                for(var i = 0; i < args.length; i++)
                {
                    fieldsetStr += "<p><input type='text' value="+args[i].default+" class='"+args[i].name+"' /><label>"+args[i].name+"</label></p>";
                }

                fieldsetStr += "</fieldset>";
            }

            $fieldset = $(fieldsetStr);

            $fieldset.find('input').change(notifyChange);

            return $fieldset;
        }

        function notifyChange()
        {
            onSettingsChange(collectTransformSettings());
        }

        function collectTransformSettings()
        {
            var transformName;
            var propName;
            var options;
            var args;

            var result = {};

            var $filterCheckboxes = $(".filter");

            for(var i = 0; i < $filterCheckboxes.length; i++)
            {
                if($filterCheckboxes.eq(i).is(':checked'))
                {
                    transformName = $filterCheckboxes.eq(i).val();
                    args = Transform.descriptions[transformName].arguments;
                    options = {};

                    for(var j = 0; j < args.length; j++)
                    {
                        propName = args[j].name;
                        options[propName] = getPropertyValue(transformName, propName);
                    }

                    result[transformName] = options;
                }
            }

            return result;
        }

        function getPropertyValue(transformName, propertyName)
        {
            return parseFloat($('fieldset.' + transformName + ' input.' + propertyName).val());
        }
    }

}(jQuery));
