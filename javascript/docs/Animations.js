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


jpvs.flashClass = function (element, cssClass, duration, count, leaveOnTime) {
    /// <summary>Flashes a CSS class on a DOM element. It can be used for attracting the user's attention after changing some content.</summary>
    /// <param name="element" type="Object">The DOM element or jQuery object to which the CSS class must be applied.</param>
    /// <param name="cssClass" type="String">CSS class name to apply/remove in a flashing manner (on and off several times).</param>
    /// <param name="duration" type="Number">Optional: duration of the flashing animation in milliseconds.</param>
    /// <param name="count" type="Number">Optional: number of flashes desired.</param>
    /// <param name="leaveOnTime" type="Number">Optional: Time (in ms). After the end of the animation, after this time, the CSS class is removed.</param>
};

jpvs.requestAnimationFrame = function (callback, element) {
    /// <summary>Shim layer for the requestAnimationFrame function.</summary>
};
