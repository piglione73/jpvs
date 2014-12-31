(function () {

    jpvs.addGestureListener = function (element, params, onGesture) {
        //Some sane defaults
        params = params || {};
        params.tapMaxDistance = params.tapMaxDistance || 15;
        params.longTapThreshold = params.longTapThreshold || 500;
        params.doubleTapThreshold = params.doubleTapThreshold || 250;
        params.rotationThreshold = params.rotationThreshold || (10 * Math.PI / 180);     //10deg

        params.allowedEventTargets = params.allowedEventTargets || function (target) {
            var tagName = target.nodeName.toLowerCase();
            return tagName != "a" && tagName != "select" && tagName != "input" && tagName != "button";
        };

        //This line allows us to accept DOM elements, jQuery objects AND jpvs widgets
        element = jpvs.getElementIfWidget(element);

        //Let's subscribe to touch events for the element
        element.on("touchstart", onTouch);
        element.on("touchmove", onTouch);
        element.on("touchend", onTouch);
        element.on("touchcancel", onTouch);

        //We want to track fingers
        var fingers = {};

        //We track shortTaps so we can decide if a shortTap is a doubleTap
        var lastShortTap = null;


        function onTouch(e) {
            //Get the touch event from the jQuery event
            var te = e.originalEvent;

            //We want to work on allowed target only. On not allowed targets we simply ignore the event, as if we didn't even attach an event handler
            if (!params.allowedEventTargets(te.target))
                return;

            //Event timestamp
            var now = new Date().getTime();

            //Let's track fingers
            trackFingers();

            //Now that we have the up-to-date finger situation, let's try to identify gestures
            identifyGestures();

            //Block propagation/default behavior
            e.stopPropagation();
            e.preventDefault();
            return false;

            //Utilities
            function callOnGesture(evt) {
                if (onGesture)
                    onGesture(evt);
            }

            function identifyGestures() {
                //Convert fingers to array
                var f = [];
                for (var i in fingers) {
                    var finger = fingers[i];
                    f.push(finger);
                }

                //Now look at fingers
                if (f.length == 1) {
                    //Single-finger gesture. See if it's dragging
                    var totalDx = f[0].current.clientX - f[0].start.clientX;
                    var totalDy = f[0].current.clientY - f[0].start.clientY;
                    var totalDistance = Math.sqrt(totalDx * totalDx + totalDy * totalDy);
                    if (totalDistance > params.tapMaxDistance) {
                        //This finger is dragging (and will be until removed)
                        f[0].dragging = true;
                    }

                    //If dragging, then fire event
                    if (f[0].dragging) {
                        var evt = {
                            target: f[0].start.target,
                            isDrag: true,
                            dragX: f[0].current.clientX - f[0].previous.clientX,
                            dragY: f[0].current.clientY - f[0].previous.clientY,
                            totalDragX: f[0].current.clientX - f[0].start.clientX,
                            totalDragY: f[0].current.clientY - f[0].start.clientY,

                            current: {
                                clientX: f[0].current.clientX,
                                clientY: f[0].current.clientY,
                                pageX: f[0].current.pageX,
                                pageY: f[0].current.pageY
                            },

                            start: {
                                clientX: f[0].start.clientX,
                                clientY: f[0].start.clientY,
                                pageX: f[0].start.pageX,
                                pageY: f[0].start.pageY
                            }
                        };

                        evt.toString = function () {
                            return "Drag: " + this.dragX + "; " + this.dragY + " - Total drag: " + this.totalDragX + "; " + this.totalDragY;
                        };

                        callOnGesture(evt);
                    }
                }
                else if (f.length == 2) {
                    //Double-finger gesture. See if it's zooming/rotating
                    //Let's measure the distance between the two fingers and the segment angle
                    var initialSegmentDx = f[0].start.clientX - f[1].start.clientX;
                    var initialSegmentDy = f[0].start.clientY - f[1].start.clientY;
                    var initialSegmentLength = Math.sqrt(initialSegmentDx * initialSegmentDx + initialSegmentDy * initialSegmentDy);
                    var initialSegmentAngle = Math.atan2(initialSegmentDy, initialSegmentDx);

                    var segmentDx = f[0].current.clientX - f[1].current.clientX;
                    var segmentDy = f[0].current.clientY - f[1].current.clientY;
                    var segmentLength = Math.sqrt(segmentDx * segmentDx + segmentDy * segmentDy);
                    var segmentAngle = Math.atan2(segmentDy, segmentDx);

                    var previousSegmentDx = f[0].previous.clientX - f[1].previous.clientX;
                    var previousSegmentDy = f[0].previous.clientY - f[1].previous.clientY;
                    var previousSegmentLength = Math.sqrt(previousSegmentDx * previousSegmentDx + previousSegmentDy * previousSegmentDy);
                    var previousSegmentAngle = Math.atan2(previousSegmentDy, previousSegmentDx);

                    //See if we must activate rotation/zooming
                    var deltaLength = segmentLength - initialSegmentLength;
                    var deltaAngle = segmentAngle - initialSegmentAngle;

                    if (Math.abs(deltaAngle) > params.rotationThreshold) {
                        //The two fingers are rotating (and will be until removed)
                        f[0].rotating = true;
                        f[1].rotating = true;

                        //Attach the same rotate tracker object
                        var rotateTracker = f[0].rotateTracker || f[1].rotateTracker || {};
                        f[0].rotateTracker = rotateTracker;
                        f[1].rotateTracker = rotateTracker;
                    }

                    if (Math.abs(deltaLength) > params.tapMaxDistance) {
                        //The two fingers are zooming (and will be until removed)
                        f[0].zooming = true;
                        f[1].zooming = true;

                        //Attach the same zoom tracker object
                        var zoomTracker = f[0].zoomTracker || f[1].zoomTracker || {};
                        f[0].zoomTracker = zoomTracker;
                        f[1].zoomTracker = zoomTracker;
                    }

                    //If rotating, then fire event
                    if (f[0].rotating && f[1].rotating) {
                        var evt = {
                            target1: f[0].start.target,
                            target2: f[1].start.target,
                            isRotate: true,
                            angle: segmentAngle - previousSegmentAngle,
                            totalAngle: segmentAngle - initialSegmentAngle,

                            current1: {
                                clientX: f[0].current.clientX,
                                clientY: f[0].current.clientY,
                                pageX: f[0].current.pageX,
                                pageY: f[0].current.pageY
                            },

                            start1: {
                                clientX: f[0].start.clientX,
                                clientY: f[0].start.clientY,
                                pageX: f[0].start.pageX,
                                pageY: f[0].start.pageY
                            },

                            current2: {
                                clientX: f[1].current.clientX,
                                clientY: f[1].current.clientY,
                                pageX: f[1].current.pageX,
                                pageY: f[1].current.pageY
                            },

                            start2: {
                                clientX: f[1].start.clientX,
                                clientY: f[1].start.clientY,
                                pageX: f[1].start.pageX,
                                pageY: f[1].start.pageY
                            }
                        };

                        evt.toString = function () {
                            return "Rotate: " + this.angle + " - Total angle: " + this.totalAngle;
                        };

                        //Track the total angle also on the finger object, so on end rotate we can signal the total angle applied
                        f[0].rotateTracker.totalAngle = evt.totalAngle;
                        f[0].rotateTracker.target1 = evt.target1;
                        f[0].rotateTracker.target2 = evt.target2;
                        f[0].rotateTracker.start1 = evt.start1;
                        f[0].rotateTracker.start2 = evt.start2;
                        f[0].rotateTracker.current1 = evt.current1;
                        f[0].rotateTracker.current2 = evt.current2;

                        callOnGesture(evt);
                    }

                    //If zooming, then fire event
                    if (f[0].zooming && f[1].zooming) {
                        var evt = {
                            target1: f[0].start.target,
                            target2: f[1].start.target,
                            isZoom: true,
                            zoomFactor: segmentLength / previousSegmentLength,
                            totalZoomFactor: segmentLength / initialSegmentLength,

                            current1: {
                                clientX: f[0].current.clientX,
                                clientY: f[0].current.clientY,
                                pageX: f[0].current.pageX,
                                pageY: f[0].current.pageY
                            },

                            start1: {
                                clientX: f[0].start.clientX,
                                clientY: f[0].start.clientY,
                                pageX: f[0].start.pageX,
                                pageY: f[0].start.pageY
                            },

                            current2: {
                                clientX: f[1].current.clientX,
                                clientY: f[1].current.clientY,
                                pageX: f[1].current.pageX,
                                pageY: f[1].current.pageY
                            },

                            start2: {
                                clientX: f[1].start.clientX,
                                clientY: f[1].start.clientY,
                                pageX: f[1].start.pageX,
                                pageY: f[1].start.pageY
                            }
                        };

                        evt.toString = function () {
                            return "Zoom: " + this.zoomFactor + " - Total zoom: " + this.totalZoomFactor;
                        };

                        //Track the total zoom also on the finger object, so on end zoom we can signal the total zoom factor applied
                        f[0].zoomTracker.totalZoomFactor = evt.totalZoomFactor;
                        f[0].zoomTracker.target1 = evt.target1;
                        f[0].zoomTracker.target2 = evt.target2;
                        f[0].zoomTracker.start1 = evt.start1;
                        f[0].zoomTracker.start2 = evt.start2;
                        f[0].zoomTracker.current1 = evt.current1;
                        f[0].zoomTracker.current2 = evt.current2;

                        callOnGesture(evt);
                    }
                }
            }

            function trackFingers() {
                var identifiers = {};
                for (var i = 0; i < te.touches.length; i++) {
                    var touch = te.touches[i];
                    var finger = fingers[touch.identifier];
                    identifiers[touch.identifier] = true;

                    //If it's a new touch, let's create the finger
                    if (!finger) {
                        finger = {
                            start: {
                                target: touch.target,
                                time: now,
                                clientX: touch.clientX,
                                clientY: touch.clientY,
                                pageX: touch.pageX,
                                pageY: touch.pageY
                            },
                            current: {
                                target: touch.target,
                                time: now,
                                clientX: touch.clientX,
                                clientY: touch.clientY,
                                pageX: touch.pageX,
                                pageY: touch.pageY
                            }
                        };

                        fingers[touch.identifier] = finger;
                    }

                    //Save previous values
                    finger.previous = finger.current;

                    //Let's now set the current values
                    finger.current = {
                        target: touch.target,
                        time: now,
                        clientX: touch.clientX,
                        clientY: touch.clientY,
                        pageX: touch.pageX,
                        pageY: touch.pageY
                    };
                }

                //Remove fingers that are no longer active
                for (var identifier in fingers) {
                    if (!identifiers[identifier]) {
                        //This finger is no longer on screen
                        var finger = fingers[identifier];
                        delete fingers[identifier];

                        if (finger.rotating) {
                            //End of rotate
                            var evt = {
                                target1: finger.rotateTracker.target1,
                                target2: finger.rotateTracker.target2,
                                isRotate: false,
                                isEndRotate: true,
                                totalAngle: finger.rotateTracker.totalAngle,

                                start1: finger.rotateTracker.start1,
                                start2: finger.rotateTracker.start2,
                                current1: finger.rotateTracker.current1,
                                current2: finger.rotateTracker.current2
                            };

                            evt.toString = function () {
                                return "End of rotation: total angle " + this.totalAngle;
                            };

                            callOnGesture(evt);
                        }

                        if (finger.zooming) {
                            //End of zoom
                            var evt = {
                                target1: finger.zoomTracker.target1,
                                target2: finger.zoomTracker.target2,
                                isZoom: false,
                                isEndZoom: true,
                                totalZoomFactor: finger.zoomTracker.totalZoomFactor,

                                start1: finger.zoomTracker.start1,
                                start2: finger.zoomTracker.start2,
                                current1: finger.zoomTracker.current1,
                                current2: finger.zoomTracker.current2
                            };

                            evt.toString = function () {
                                return "End of zoom: total factor " + this.totalZoomFactor;
                            };

                            callOnGesture(evt);
                        }

                        if (finger.dragging) {
                            //End of drag
                            var evt = {
                                target: finger.start.target,
                                isDrag: false,
                                isEndDrag: true,
                                totalDragX: finger.current.clientX - finger.start.clientX,
                                totalDragY: finger.current.clientY - finger.start.clientY,

                                current: {
                                    clientX: finger.current.clientX,
                                    clientY: finger.current.clientY,
                                    pageX: finger.current.pageX,
                                    pageY: finger.current.pageY
                                },

                                start: {
                                    clientX: finger.start.clientX,
                                    clientY: finger.start.clientY,
                                    pageX: finger.start.pageX,
                                    pageY: finger.start.pageY
                                }
                            };

                            evt.toString = function () {
                                return "End of drag";
                            };

                            callOnGesture(evt);
                        }

                        if (!finger.rotating && !finger.zooming && !finger.dragging) {
                            //Let's see if it was a tap (short/long)
                            if (te.touches.length == 0) {
                                var dx = finger.current.clientX - finger.start.clientX;
                                var dy = finger.current.clientY - finger.start.clientY;
                                var distance = Math.sqrt(dx * dx + dy * dy);
                                if (distance < params.tapMaxDistance) {
                                    //It's a tap because the finger didn't move away too much
                                    //Let's see if it was a short tap or a long tap
                                    var dt = now - finger.start.time;
                                    var evt = {
                                        target: finger.start.target,
                                        isTap: true,
                                        isLongTap: dt >= params.longTapThreshold,

                                        clientX: finger.start.clientX,
                                        clientY: finger.start.clientY,
                                        pageX: finger.start.pageX,
                                        pageY: finger.start.pageY
                                    };

                                    //Let's see if it's a double-tap
                                    if (!evt.isLongTap) {
                                        //Short tap
                                        if (lastShortTap) {
                                            dt = finger.start.time - lastShortTap.time;
                                            if (dt < params.doubleTapThreshold) {
                                                //It's close in time. For this short tap to be a double tap, it must also be close in space.
                                                dx = finger.start.clientX - lastShortTap.clientX;
                                                dy = finger.start.clientY - lastShortTap.clientY;
                                                var distance = Math.sqrt(dx * dx + dy * dy);
                                                if (distance < params.tapMaxDistance) {
                                                    //OK, this is a double tap
                                                    evt.isDoubleTap = true;
                                                    lastShortTap = null;
                                                }
                                            }
                                        }

                                        //If it is not a double tap, it is a simple short tap
                                        if (!evt.isDoubleTap) {
                                            //In this case, we keep track of it
                                            lastShortTap = {
                                                time: now,
                                                clientX: finger.start.clientX,
                                                clientY: finger.start.clientY
                                            };
                                        }
                                    }
                                    else {
                                        //Long tap, so let's forget the lastShortTap
                                        lastShortTap = null;
                                    }

                                    evt.toString = function () {
                                        return "Tap: " + (this.isLongTap ? "long" : "short") + " - " + (this.isDoubleTap ? "double" : "simple");
                                    };

                                    callOnGesture(evt);
                                }
                            }
                        }
                    }
                }
            }
        }
    };

})();
