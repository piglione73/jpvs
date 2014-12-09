window.jpvs = window.jpvs || {};


jpvs.addGestureListener = function (element, params, onGesture) {
    /// <summary>Adds a gesture event listener to a given element. The listener will receive high-level touch events (gestures), 
    /// not the standard low-level touch events (touchstart, touchmove, ...).
    /// After calling this method, the default behavior of touch events
    /// is suppressed. This means that a touch event on this element will no longer emulate a mouse event.</summary>
    /// <param name="element" type="Object">Element whose gestures are desired: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
    /// <param name="params" type="Object">
    /// Object with configuration parameters. It can be null. Each parameter has a default value. You can specify only the parameters
    /// that you need to change or you can specify them all. Available parameters are: 
    /// tapMaxDistance (if a finger is dragged longer than this, then it is no longer a tap; default: 15; unit: CSS pixels), 
    /// longTapThreshold (minimum duration of a long tap; default: 500; unit: milliseconds),
    /// doubleTapThreshold (if a short tap is closer than this to the previous tap, then it is considered a double tap; default: 250; unit: milliseconds),
    /// rotationThreshold (when rotating two fingers, angle over which the gesture is considered a rotation; default: 10*PI/180 (equivalent to 10 degrees); unit: radians)
    /// </param>
    /// <param name="onGesture" type="Function">
    /// The event listener function. Signature: function onGesture(e) {}.
    /// The "e" argument is the gesture event object and carries information about the touch gesture.
    ///
    /// Gesture: TAP; the event object is { isTap: true, isLongTap: true/false, isDoubleTap: true or missing, target: ... }
    ///
    /// Gesture: DRAG; the event object is { isDrag: true, dragX: ..., dragY: ..., totalDragX: ..., totalDragY: ..., target: ... }.
    /// Gesture END of DRAG; the event object is { isDrag: false, isEndDrag: true, totalDragX: ..., totalDragY: ..., target: ... }.
    ///
    /// Gesture: ROTATE; the event object is { isRotate: true, angle: ..., totalAngle: ..., target1: ..., target2: ... }.
    /// Gesture: END of ROTATE; the event object is { isRotate: false, isEndRotate: true, totalAngle: ..., target1: ..., target2: ... }.
    ///
    /// Gesture: ZOOM; the event object is { isZoom: true, zoomFactor: ..., totalZoomFactor: ..., target1: ..., target2: ... }.
    /// Gesture: END of ZOOM; the event object is { isZoom: false, isEndZoom: true, totalZoomFactor: ..., target1: ..., target2: ... }.
    ///
    /// Values dragX and dragY contain the amount of drag since the last onGesture call. Values totalDragX and totalDragY contain the total
    /// amount of drag since the start of the current drag gesture.
    ///
    /// Similar logic applies to angle/totalAngle and zoomFactor/totalZoomFactor.
    ///
    /// The target field contains the DOM element where the gesture occurred/started.
    /// In case the gesture involves two touches, target1/target2 contain the DOM element(s) where the gesture started.
    /// </param>
};