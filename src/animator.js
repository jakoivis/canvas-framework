;(function() {
    'use strict';

    window.Animator = new Animator();

    function Animator()
    {
        var me = this;
        var timer = new Timer();
        var animations = [];

        me.play = function(target, options)
        {
            var animation = new Animation(options);

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

        return this;
    }

    Animator.
})();