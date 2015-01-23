
function Queue(images)
{
    var items;
    var me = this;

    me.length = 0;

    init();

    me.getItemAt = function(index)
    {
        return items[index];
    };

    me.isComplete = function()
    {
        var result = true;
        var item;

        for(var i = 0; i < items.length; i++)
        {
            item = items[i];

            if (item.isPending() || item.isLoading())
            {
                result = false;
                break;
            }
        }

        return result;
    };

    me.getNextPendingItem = function()
    {
        var result;

        for(var i = 0; i < items.length; i++)
        {
            if (items[i].isPending())
            {
                result = items[i];
                break;
            }
        }

        return result;
    };

    me.getPercentLoaded = function()
    {
        var item;
        var i = 0;
        var len = items.length;

        for(i; i < len; i++)
        {
            item = items[i];

            if (item.isPending() || item.isLoading())
            {
                break;
            }
        }

        return i / len;
    };

    function init()
    {
        items = createItems(images);
        me.length = items.length;
    }

    function createItems(images)
    {
        var result = [];

        for(var i = 0; i < images.length; i++)
        {
            if (typeof images[i] === "string")
            {
                result.push(new ImageLoaderItem({
                    src: images[i]
                }));
            }
            else
            {
                result.push(new ImageLoaderItem(images[i]));
            }
        }

        return result;
    }

    return this;
}
