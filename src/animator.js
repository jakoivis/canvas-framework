
'use strict';

module.exports = new Animator();

function Animator()
{
    var me = this;

    var animations = [];

    // TODO: remove animatio when complete

    me.play = function(target, options)
    {
        var animation = new Animation(options);

        // var wasInterrupted = interruptOverlappingAnimations();

        // if (wasInterrupted)
        // {
            // position = findNearestStartingPosition();
        // }

        storeAnimation(animation);

        animation.play();
    }

    me.update = function()
    {
        for(var i = 0; i < animations.length; i++)
        {
            animations[i].update();
        }
    }

    function storeAnimation(animation)
    {
        animations.push(animation);
    }

    function interruptOverlappingAnimations()
    {
        var wasInterrupting = false;

        for(var i = 0; i < animations.length; i++)
        {
            if (isOverlappingAnimation(animations[i]))
            {
                wasInterrupting = true;
                animations[i].reset();
            }
        }

        return wasInterrupting;
    }

    function isOverlappingAnimation(animation)
    {
        return animation.property === me.property
                && animation.target === me.target
                && animation.isPlaying()
                && animation !== me;
    }

    return this;
}
