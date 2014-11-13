/* JPVS
Module: utils
Classes: 
Depends: core
*/

(function () {

    jpvs.addGestureListener = function (element, params, onGesture) {
        //Some sane defaults
        params = params || {};
        params.tapMaxDistance = params.tapMaxDistance || 15;
        params.longTapThreshold = params.longTapThreshold || 500;
        params.doubleTapThreshold = params.doubleTapThreshold || 250;
        params.rotationThreshold = params.rotationThreshold || (10 * Math.PI / 180);     //10deg

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
            var now = new Date().getTime();

            //Get the touch event from the jQuery event
            var te = e.originalEvent;

            //Let's track fingers
            trackFingers();

            //Now that we have the up-to-date finger situation, let's try to identify gestures
            identifyGestures();

            //We are handling touch, so we don't want the default behavior
            e.stopPropagation();
            e.preventDefault();
            return false;

            //Utilities
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
                            totalDragY: f[0].current.clientY - f[0].start.clientY
                        };

                        evt.toString = function () {
                            return "Drag: " + this.dragX + "; " + this.dragY + " - Total drag: " + this.totalDragX + "; " + this.totalDragY;
                        };

                        onGesture(evt);
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
                    else if (Math.abs(deltaLength) > params.tapMaxDistance) {
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
                            totalAngle: segmentAngle - initialSegmentAngle
                        };

                        evt.toString = function () {
                            return "Rotate: " + this.angle + " - Total angle: " + this.totalAngle;
                        };

                        //Track the total angle also on the finger object, so on end rotate we can signal the total angle applied
                        f[0].rotateTracker.totalAngle = evt.totalAngle;
                        f[0].rotateTracker.target1 = evt.target1;
                        f[0].rotateTracker.target2 = evt.target2;

                        onGesture(evt);
                    }

                    //If zooming, then fire event
                    if (f[0].zooming && f[1].zooming) {
                        var evt = {
                            target1: f[0].start.target,
                            target2: f[1].start.target,
                            isZoom: true,
                            zoomFactor: segmentLength / previousSegmentLength,
                            totalZoomFactor: segmentLength / initialSegmentLength
                        };

                        evt.toString = function () {
                            return "Zoom: " + this.zoomFactor + " - Total zoom: " + this.totalZoomFactor;
                        };

                        //Track the total zoom also on the finger object, so on end zoom we can signal the total zoom factor applied
                        f[0].zoomTracker.totalZoomFactor = evt.totalZoomFactor;
                        f[0].zoomTracker.target1 = evt.target1;
                        f[0].zoomTracker.target2 = evt.target2;

                        onGesture(evt);
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
                                clientY: touch.clientY
                            },
                            current: {
                                target: touch.target,
                                time: now,
                                clientX: touch.clientX,
                                clientY: touch.clientY
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
                        clientY: touch.clientY
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
                                totalAngle: finger.rotateTracker.totalAngle
                            };

                            evt.toString = function () {
                                return "End of rotation: total angle " + this.totalAngle;
                            };

                            onGesture(evt);
                        }
                        else if (finger.zooming) {
                            //End of zoom
                            var evt = {
                                target1: finger.zoomTracker.target1,
                                target2: finger.zoomTracker.target2,
                                isZoom: false,
                                isEndZoom: true,
                                totalZoomFactor: finger.zoomTracker.totalZoomFactor
                            };

                            evt.toString = function () {
                                return "End of zoom: total factor " + this.totalZoomFactor;
                            };

                            onGesture(evt);
                        }
                        else if (finger.dragging) {
                            //End of drag
                            var evt = {
                                target: finger.start.target,
                                isDrag: false,
                                isEndDrag: true,
                                totalDragX: finger.current.clientX - finger.start.clientX,
                                totalDragY: finger.current.clientY - finger.start.clientY
                            };

                            evt.toString = function () {
                                return "End of drag";
                            };

                            onGesture(evt);
                        }
                        else {
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
                                        isLongTap: dt >= params.longTapThreshold
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

                                    onGesture(evt);
                                }
                            }
                        }
                    }
                }
            }
        }
    };

})();
