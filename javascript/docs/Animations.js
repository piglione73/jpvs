window.jpvs = window.jpvs || {};

/*
Can be called as: jpvs.animate(animationFunction) 
or as jpvs.animate(params, animationFunction)
*/
jpvs.animate = function (params, animationFunction) {
    /// <summary>Enqueues an animation.</summary>
    /// <param name="params" type="Object">Optional object with parameters: { t0: start time (default: 0), t1: end time (default: 1), step: time step for a discrete animation or zero for a continuous animation (default: 0), duration: duration in milliseconds of the animation (default: 1000), easingFunction: easing function (default: jpvs.animate.harmonicEasing) }.</param>
    /// <param name="animationFunction" type="Function">Animation function: function(t) {}. The "t" argument is the current time and is always between t0 and t1. This function defines the animation.</param>
};

jpvs.animate.harmonicEasing = function () { };
jpvs.animate.linearEasing = function () { };
