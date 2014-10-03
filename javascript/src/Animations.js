/* JPVS
Module: animations
Classes: 
Depends: core
*/

(function () {

    // shim layer with setTimeout fallback
    var requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback, element) {
        window.setTimeout(callback, 1000 / 60);
    };

    jpvs.requestAnimationFrame = function () {
        //Ensure we call with this = window
        requestAnimFrame.apply(window, arguments);
    }

    //Animation queue
    var queue = [];
    var running = false;
    var currentAnim = null;

    /*
    Can be called as: jpvs.animate(animationFunction) 
    or as jpvs.animate(params, animationFunction)
    */
    jpvs.animate = function (params, animationFunction) {
        //Parameter extraction
        var t0 = (params && params.t0 != null) ? params.t0 : 0;
        var t1 = (params && params.t1 != null) ? params.t1 : 1;
        var step = Math.abs((params && params.step) || 0);
        var duration = Math.abs((params && params.duration) || 1000);
        var easingFunc = (params && params.easingFunction) || harmonicEasing;
        var animFunc = animationFunction || params;

        //Enqueue the animation
        queue.push({
            t0: t0, t1: t1, step: step, duration: duration,
            animFunc: animFunc,
            easingFunc: easingFunc,
            startTime: null,
            endTime: null
        });

        //Ensure it will be executed
        ensureStarted();
    };

    function ensureStarted() {
        if (!running) {
            requestAnimFrame(animFrame);
            running = true;
        }
    }

    function animFrame() {
        //Get the current animation
        if (currentAnim == null) {
            if (queue.length > 0) {
                //Pop the first element (FIFO queue)
                currentAnim = queue.shift();
            }
            else {
                //No more items in the queue
                running = false;
                return;
            }
        }

        //Materialize the current frame of the current animation
        try {
            //Current frame time
            var curTime = new Date().getTime();

            //We need to know the animation start time
            if (currentAnim.startTime == null) {
                currentAnim.startTime = curTime;
                currentAnim.endTime = currentAnim.startTime + currentAnim.duration;
            }

            if (currentAnim.step) {
                //Discrete animation: go from t0 to t1 with this "step"
                var t = getAnimationTimeDiscrete(curTime);
                currentAnim.animFunc(t);
            }
            else {
                //Continuous animation: simply go from t0 to t1 as smoothly as possible
                var t = getAnimationTimeContinuous(curTime);
                currentAnim.animFunc(t);
            }

            //If current animation finished, set it to null
            if (curTime >= currentAnim.endTime)
                currentAnim = null;
        }
        finally {
            //Schedule next frame
            requestAnimFrame(animFrame);
        }
    }

    /*
    Calculate the current animation time for continuous animations by applying the easing function
    */
    function getAnimationTimeContinuous(curTime) {
        if (curTime <= currentAnim.startTime)
            return currentAnim.t0;
        else if (curTime >= currentAnim.endTime)
            return currentAnim.t1;
        else
            return currentAnim.easingFunc(currentAnim.startTime, currentAnim.endTime, currentAnim.t0, currentAnim.t1, curTime);
    }

    /*
    Calculate the current animation time for discrete animations by applying the step
    */
    function getAnimationTimeDiscrete(curTime) {
        var t0 = currentAnim.t0;
        var t1 = currentAnim.t1;
        var step = currentAnim.step;
        var s = currentAnim.startTime;
        var e = currentAnim.endTime;

        //How many steps between t0 and t1?
        var nSteps = Math.ceil(Math.abs((t1 - t0) / step));
        var sign = t1 > t0 ? 1 : -1;

        //Divide the total duration in nSteps parts
        var timeStep = (e - s) / nSteps;

        //Determine the step index
        var stepIndex = Math.floor((curTime - s) / timeStep);

        if (curTime <= s)
            return t0;
        else if (curTime >= e)
            return t1;
        else
            return t0 + sign * stepIndex * step;
    }

    /*
    Easing functions for continuous animations
    */
    function harmonicEasing(startTime, endTime, t0, t1, curTime) {
        var normTime = (curTime - startTime) / (endTime - startTime);
        var normT = 0.5 - Math.cos(normTime * Math.PI) / 2;
        var t = t0 + normT * (t1 - t0);
        return t;
    }

    function linearEasing(startTime, endTime, t0, t1, curTime) {
        var normTime = (curTime - startTime) / (endTime - startTime);
        var normT = normTime;
        var t = t0 + normT * (t1 - t0);
        return t;
    }

    //Publish some preset easing functions
    jpvs.animate.harmonicEasing = harmonicEasing;
    jpvs.animate.linearEasing = linearEasing;


    /*
    Simple function for flashing a CSS class on a DOM element
    */
    jpvs.flashClass = function (element, cssClass, duration, count, leaveOnTime) {
        var $elem = $(element);
        var N = count || 15;
        var T1 = 2 * N;

        //Flash and leave the CSS class on
        jpvs.animate({
            t0: 0,
            t1: T1,
            step: 1,
            duration: duration || 2000
        }, function (t) {
            if (t % 2 == 0)
                $elem.addClass(cssClass);
            else
                $elem.removeClass(cssClass);
        });

        //Then, at the end, wait for "leaveOnTime" and switch the CSS class off
        jpvs.animate({
            t0: 0,
            t1: 1,
            step: 1,
            duration: leaveOnTime || 4000
        }, function (t) {
            if (t == 1)
                $elem.removeClass(cssClass);
        });

    };

})();
