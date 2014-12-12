;(function() {
    'use strict';
    
    window.Timer = Timer;
    
    //Timer class implements the main loop of the application and the callbacs that handle 
    //game processing in main loop.
    function Timer(options)
    {
        if(Timer.prototype.singletonInstance)
        {
            return Timer.prototype.singletonInstance;
        }
        
        if (!(this instanceof Timer))
        {
            return new Timer(options);
        }
        
        Timer.prototype.singletonInstance = this;
        
        var me = this;
        
        me.renderCallback;
        me.updateCallback;
        me.measureCallback;
        
        // Frame rate
        var frameRate = 30;
        me.getFramerate = function() { return frameRate; }
        me.setFramerate = function(value) 
        { 
            frameRate = value;
            
            // one second / frame rate = time of a period
            period = Math.round(1000 / frameRate);
        }
            
        // Time in milliseconds we have time to perform all operations
        var period;
        me.getPeriod = function() { return period; }
        
        // Time before the operations
        var beforeTime;
        me.getBeforeTime = function() { return beforeTime; }
            
        // Time after the operations
        var afterTime;
        me.getAfterTime = function() { return afterTime; }
            
        // Time that elapsed during the processing of operations
        var timeDiff;
        me.getTimeDiff = function() { return timeDiff; }
            
        // Sleep time is the time left after the operations 
        var sleepTime;
        me.getSleepTime = function() { return sleepTime; }
            
        // Over sleep time is the time between the timer events without the delay itself.
        // This is only plus minus few milliseconds. 
        var overSleepTime;
        me.getOverSleepTime = function() { return overSleepTime; }
            
        // Time in milliseconds the loop is delayed due to the heavy processing. 
        // Drawing of frames are skipped if this is greater than the time of a period.
        var excess;
        me.getExcess = function() { return excess; }
        
        var gameTimerId;
        
        var dummyFunction = function() {};
        
        function init()
        {
            if (options)
            {
                me.renderCallback = options.renderCallback || dummyFunction;
                me.updateCallback = options.updateCallback || dummyFunction;
                me.measureCallback = options.measureCallback || dummyFunction;
                
                me.setFramerate(options.frameRate || 30);
            }
            else
            {
                me.renderCallback = dummyFunction;
                me.updateCallback = dummyFunction;
                me.measureCallback = dummyFunction;
                
                me.setFramerate(30);
            }
            
            beforeTime = 0;
            afterTime = 0;
            timeDiff = 0;
            sleepTime = 0;
            overSleepTime = 0;
            excess = 0;
        }
        
        me.start = function()
        {
            beforeTime = new Date().getTime();
            afterTime = new Date().getTime();
            gameTimerId = setTimeout(run, period);
        }
        
        me.stop = function() 
        {
            clearTimeout(gameTimerId);
        }
       
        
        // Main loop of the game.
        // Game loop starts with the startTimer call. It is called once
        // and afterwards the timer is called inside the game loop.
        function run(event)
        {
            // get start time
            beforeTime = new Date().getTime();
            
            // get the time that elapsed from the previous run function call, 
            // not including the delay itself.
            overSleepTime = (beforeTime - afterTime) - sleepTime;
 
            me.updateCallback();
            me.renderCallback();
            
            // get end time
            afterTime = new Date().getTime();
            
            // get time difference i.e. elapsed time.
            timeDiff = afterTime - beforeTime;
            
            // calculate new delay
            // overSleepTime is reduced to balance the timer error from previus round.
            sleepTime = (period - timeDiff) - overSleepTime;        
            
            if(sleepTime <= 0) 
            {
                // processing a frame takes more time than the time of a period
                
                // store the negative sleep time
                excess -= sleepTime;
                
                // set a minimum sleep time
                sleepTime = 2;
            }        
            
            // set the newly calculated delay
            gameTimerId = setTimeout(run, sleepTime);
                
            // compensate the processings of all delayed run calls
            // by updating everything else but drawing.
            while (excess > period) 
            {
                me.updateCallback();
                excess -= period;
            }
            
            me.measureCallback();
        }
       
        init();
        
        return this;
    }
})();