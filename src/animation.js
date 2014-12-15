;(function() {
    'use strict';

    window.Animation = Animation;

    // TODO: test interrupting a transition
    // TODO: easing

    function Animation(options)
    {
        if (!(this instanceof Animation))
        {
            return new Animation(options);
        }

        var me = this;
        var timer = new Timer();

        me.duration;
        me.property;
        me.fromValue;
        me.toValue;
        me.steps;
        me.target;

        var position;
        var isPlaying;

        function init()
        {
            if (options)
            {
                me.duration = options.duration || 1000;
                me.property = options.property || "x";
                me.fromValue = options.from || 0;
                me.toValue = options.to || 1;
                me.target = options.target;
            }

            me.steps = getPrecalculateSteps();
            me.reset();
        }

        me.play = function()
        {
            var wasInterrupted = interruptOverlappingTransitions();

            if (wasInterrupted)
            {
                position = findNearestStartingPosition();
            }

            isPlaying = true;
        }

        me.reset = function()
        {
            isPlaying = false;
            position = 0;
        }

        me.pause = function()
        {
            isPlaying = false;
        }

        me.isPlaying = function()
        {
            return isPlaying;
        }

        me.update = function()
        {
            if (isPlaying)
            {
                me.target[me.property] = me.steps[position];

                if (position < me.steps.length-1)
                {
                    position++;
                }
                else
                {
                    me.reset();
                }
            }
        }

        function getPrecalculateSteps()
        {
            var result = [];
            var frameCount = (me.duration / 1000) * timer.getFramerate();
            var distance = me.toValue - me.fromValue;
            var stepSize = distance / (frameCount-1);

            result.push(me.fromValue);

            for(var i = 1; i < frameCount-1; i++)
            {
                result.push(stepSize * i + me.fromValue);
            }

            result.push(me.toValue);

            return result;
        }

        function interruptOverlappingTransitions()
        {
            var transitions = Transition.prototype.transitions;
            var wasInterrupting = false;

            for(var i = 0; i < transitions.length; i++)
            {
                if (isOverlappingTransition(transitions[i]))
                {
                    wasInterrupting = true;
                    transitions[i].reset();
                }
            }

            return wasInterrupting;
        }

        function isOverlappingTransition(transition)
        {
            return transition.property === me.property
                    && transition.target === me.target
                    && transition.isPlaying()
                    && transition !== me;
        }

        function findNearestStartingPosition()
        {
            var currentValue = me.target[me.property];
            var nearestValue = me.steps[0];
            var nearestValuePosition = 0;
            var nearestDistance = Math.abs(nearestValue - currentValue);

            for(var i = 0; i < me.steps.length; i++)
            {
                if (Math.abs(me.steps[i] - currentValue) < nearestDistance)
                {
                    nearestDistance = Math.abs(nearestValue - currentValue);
                    nearestValue = me.steps[i];
                    nearestValuePosition = i;
                }
            }

            return nearestValuePosition;
        }

        init();

        return this;
    }
})();