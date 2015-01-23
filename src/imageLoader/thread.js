
function Thread(options)
{
    var me = this;
    var onThreadCompleteCallback;
    var onFileCompleteCallback;
    var onFileStartCallback;
    var queue;

    init();

    function init()
    {
        onThreadCompleteCallback = options.onThreadComplete;
        onFileCompleteCallback = options.onFileComplete;
        onFileStartCallback = options.onFileStart;
        queue = options.queue;

        processNextItem();
    }

    function processNextItem()
    {
        var imageLoaderItem = queue.getNextPendingItem();

        if (typeof imageLoaderItem === 'undefined')
        {
            onThreadCompleteCallback();
        }
        else
        {
            imageLoaderItem.load(onLoadHandler);
            onFileStartCallback(imageLoaderItem);
        }
    }

    function onLoadHandler(item)
    {
        onFileCompleteCallback(item);
        processNextItem();
    }

    return this;
}
