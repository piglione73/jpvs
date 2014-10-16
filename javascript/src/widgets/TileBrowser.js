/* JPVS
Module: widgets
Classes: TileBrowser
Depends: core
*/

(function () {

    jpvs.TileBrowser = function (selector) {
        this.attach(selector);
    };

    jpvs.makeWidget({
        widget: jpvs.TileBrowser,
        type: "TileBrowser",
        cssClass: "TileBrowser",

        create: function (container) {
            var obj = document.createElement("div");
            $(container).append(obj);
            return obj;
        },

        init: function (W) {
            //Clear the drawing area
            W.element.empty();

            W.element.css({
                overflow: "hidden"
            });

            W.element.on("wheel", onWheel(W));
            W.element.on("touchmove", "div.Tile", onTouchMove(W));
        },

        canAttachTo: function (obj) {
            return false;
        },

        prototype: {
            startingTile: jpvs.property({
                get: function () {
                    return this.element.data("startingTile");
                },
                set: function (value) {
                    this.element.data("startingTile", value);
                    render(this);
                }
            }),

            width: jpvs.property({
                get: function () {
                    return this.element.width();
                },
                set: function (value) {
                    this.element.width(value);
                }
            }),

            height: jpvs.property({
                get: function () {
                    return this.element.height();
                },
                set: function (value) {
                    this.element.height(value);
                }
            }),

            tileWidth: jpvs.property({
                get: function () {
                    var x = this.element.data("tileWidth");
                    return x != null ? x : this.width() / 8;
                },
                set: function (value) {
                    this.element.data("tileWidth", value);
                }
            }),

            tileHeight: jpvs.property({
                get: function () {
                    var x = this.element.data("tileHeight");
                    return x != null ? x : this.tileWidth();
                },
                set: function (value) {
                    this.element.data("tileHeight", value);
                }
            }),

            desiredTileWidth: jpvs.property({
                get: function () {
                    var x = this.element.data("desiredTileWidth");
                    return x != null ? x : this.tileWidth();
                },
                set: function (value) {
                    this.element.data("desiredTileWidth", value);

                    //Ensure we animate values if desiredXXXX is different from XXXX
                    ensureAnimation(this);
                }
            }),

            desiredTileHeight: jpvs.property({
                get: function () {
                    var x = this.element.data("desiredTileHeight");
                    return x != null ? x : this.tileHeight();
                },
                set: function (value) {
                    this.element.data("desiredTileHeight", value);

                    //Ensure we animate values if desiredXXXX is different from XXXX
                    ensureAnimation(this);
                }
            }),

            tileSpacingHorz: jpvs.property({
                get: function () {
                    var x = this.element.data("tileSpacingHorz");
                    return x != null ? x : this.tileWidth() / 5;
                },
                set: function (value) {
                    this.element.data("tileSpacingHorz", value);
                }
            }),

            tileSpacingVert: jpvs.property({
                get: function () {
                    var x = this.element.data("tileSpacingVert");
                    return x != null ? x : this.tileHeight() / 5;
                },
                set: function (value) {
                    this.element.data("tileSpacingVert", value);
                }
            }),

            originX: jpvs.property({
                get: function () {
                    var x = this.element.data("originX");
                    return x != null ? x : this.width() / 2;
                },
                set: function (value) {
                    this.element.data("originX", value);
                }
            }),

            originY: jpvs.property({
                get: function () {
                    var x = this.element.data("originY");
                    return x != null ? x : this.height() / 2;
                },
                set: function (value) {
                    this.element.data("originY", value);
                }
            }),

            desiredOriginX: jpvs.property({
                get: function () {
                    var x = this.element.data("desiredOriginX");
                    return x != null ? x : this.originX();
                },
                set: function (value) {
                    this.element.data("desiredOriginX", value);

                    //Ensure we animate values if desiredXXXX is different from XXXX
                    ensureAnimation(this);
                }
            }),

            desiredOriginY: jpvs.property({
                get: function () {
                    var x = this.element.data("desiredOriginY");
                    return x != null ? x : this.originY();
                },
                set: function (value) {
                    this.element.data("desiredOriginY", value);

                    //Ensure we animate values if desiredXXXX is different from XXXX
                    ensureAnimation(this);
                }
            })

        }
    });


    function render(W) {
        //Starting tile; if null, then the tile browser has no tiles and no rendering is needed
        var tile0 = W.startingTile();
        if (!tile0) {
            W.element.empty();
            return;
        }

        //Get shortcuts
        var w = W.width();
        var h = W.height();
        var tw = W.tileWidth();
        var th = W.tileHeight();
        var sx = W.tileSpacingHorz();
        var sy = W.tileSpacingVert();
        var dx = tw + sx;
        var dy = th + sy;

        var x0 = W.originX();
        var y0 = W.originY();

        //Let's determine the allowed x coordinates
        //We don't want tiles to be cut out by the right/left borders. We lay out tiles at fixed x coordinates
        //The tile browser is free to scroll vertically, however
        //Coordinates (x0, y0) are the coordinates of the tile center
        var x = x0 - tw / 2;
        while (x > 0)
            x -= dx;
        x += dx;

        var allowedXs = [];
        while (x + tw < w) {
            allowedXs.push(x);
            x += dx;
        }

        //Lay tiles over the surface
        var ix = 0;
        x = x0 - tw / 2;

        //Get the allowedX closest to x0
        var minDist = +Infinity;
        for (var j = 0; j < allowedXs.length && Math.abs(allowedXs[j] - x) < minDist; j++)
            minDist = Math.abs(allowedXs[j] - x);
        ix = j - 1;
        ix = Math.max(ix, 0);
        ix = Math.min(ix, allowedXs.length - 1);

        //At every rendering we assign a generation number, useful for cleaning up invisible tiles at the end
        var currentGeneration = 1 + (W.lastRenderedGeneration || 0);
        W.lastRenderedGeneration = currentGeneration;

        //Forward
        var y = y0 - th / 2;
        var tileIndex = 0;
        var ix2 = ix;
        var tileObject = tile0;
        while (tileObject) {
            //Ensure the tile is not clipped out by the right border
            if (ix2 >= allowedXs.length) {
                //Return to left
                ix2 = 0;
                y += dy;

                //We allow tiles to be clipped out by the bottom border, however
                //So, we stop when the tile is completely outside
                if (y >= h)
                    break;
            }

            //Draw the tile
            x = allowedXs[ix2];
            drawTile(W, x, y, tw, th, w, h, tileObject, tileIndex, currentGeneration);

            //Increment coordinates
            ix2++;
            tileIndex++;

            //Move to next tile object, if any
            tileObject = tileObject.getNextTile && tileObject.getNextTile();
        }

        //Backwards
        ix2 = ix - 1;
        y = y0 - th / 2;
        tileObject = tile0.getPreviousTile && tile0.getPreviousTile();
        tileIndex = -1;
        while (tileObject) {
            //Ensure the tile is not clipped out by the left border
            if (ix2 < 0) {
                //Return to right
                ix2 = allowedXs.length - 1;
                y -= dy;

                //We allow tiles to be clipped out by the top border, however
                //So, we stop when the tile is completely outside
                if (y + th <= 0)
                    break;
            }

            //Draw the tile
            x = allowedXs[ix2];
            drawTile(W, x, y, tw, th, w, h, tileObject, tileIndex, currentGeneration);

            //Decrement coordinates
            ix2--;
            tileIndex--;

            //Move to next tile object, if any
            tileObject = tileObject.getPreviousTile && tileObject.getPreviousTile();
        }

        //Now we must delete tiles that were visible during the last layout but that were not laid out during this one
        //We just delete tiles that do not belong to the current generation
        W.element.children(".Tile").each(function () {
            var $this = $(this);
            var tileObject = $this.data("tileObject");
            var jpvsTileBrowserInfo = tileObject && tileObject.jpvsTileBrowserInfo;
            if (!jpvsTileBrowserInfo || jpvsTileBrowserInfo.generation != currentGeneration) {
                $this.remove();
                tileObject.jpvsTileBrowserInfo = null;
            }
        });
    }

    function isTileVisible(x, y, tw, th, w, h) {
        var x2 = x + tw;
        var y2 = y + th;

        //If at least one of the four corners is visible, then the tile is visible
        function tlVisible() { return 0 <= x && x <= w && 0 <= y && y <= h; }
        function trVisible() { return 0 <= x2 && x2 <= w && 0 <= y && y <= h; }
        function blVisible() { return 0 <= x && x <= w && 0 <= y2 && y2 <= h; }
        function brVisible() { return 0 <= x2 && x2 <= w && 0 <= y2 && y2 <= h; }

        return tlVisible() || trVisible() || blVisible() || brVisible();
    }

    function drawTile(W, x, y, tw, th, w, h, tileObject, tileIndex, currentGeneration) {
        if (!tileObject)
            return;

        //If the tile already exists, then simply adjust its coordinates: it's way faster
        var info = tileObject.jpvsTileBrowserInfo;
        if (info) {
            if (isTileVisible(x, y, tw, th, w, h)) {
                var mustRedrawContent = false;

                //OK, let's show it
                if (info.x != x) {
                    info.x = x;
                    info.tile.css("left", x + "px");
                }

                if (info.y != y) {
                    info.y = y;
                    info.tile.css("top", y + "px");
                }

                if (info.tw != tw) {
                    info.tw = tw;
                    info.tile.css("width", tw + "px");

                    //It's not a simple translation, we must also redraw the content
                    mustRedrawContent = true;
                }

                if (info.th != th) {
                    info.th = th;
                    info.tile.css("height", th + "px");

                    //It's not a simple translation, we must also redraw the content
                    mustRedrawContent = true;
                }

                //Let's also redraw if the size has changed
                if (mustRedrawContent)
                    redrawTileContent(info.tile);

                //Also update the generation number
                info.generation = currentGeneration;
            }
            else {
                //The new position is not visible, let's remove the DOM object
                info.tile.remove();
                tileObject.jpvsTileBrowserInfo = null;
            }

            return;
        }

        //Otherwise, we must create the tile
        if (!isTileVisible(x, y, tw, th, w, h))
            return;

        var tile = jpvs.writeTag(W, "div");

        tile.data("tileObject", tileObject);
        tileObject.jpvsTileBrowserInfo = {
            tile: tile,
            x: x,
            y: y,
            tw: tw,
            th: th,
            tileIndex: tileIndex,
            generation: currentGeneration
        };

        tile.addClass("Tile").css({
            position: "absolute",
            left: x + "px",
            top: y + "px",
            width: tw + "px",
            height: th + "px",
            overflow: "hidden"
        });

        redrawTileContent(tile);
        return tile;

        function redrawTileContent(tile) {
            if (tileObject.template)
                jpvs.applyTemplate(tile.empty(), tileObject.template, { tileObject: tileObject, tileBrowser: W, tile: tile });
        }
    }

    function onWheel(W) {
        return function (e) {
            var deltaY = e && e.originalEvent && e.originalEvent.deltaY || e.originalEvent.deltaX || 0;
            var oldOriginY = W.desiredOriginY();

            if (e.shiftKey) {
                //Zoom
                var zoomFactor = deltaY < 0 ? 1.1 : (1 / 1.1);
                var tw = W.desiredTileWidth() * zoomFactor;
                var th = W.desiredTileHeight() * zoomFactor;

                W.desiredTileWidth(tw);
                W.desiredTileHeight(th);

                //Determine the closest-to-center tile
                var w = W.width();
                var h = W.height();
                var xc = w / 2;
                var yc = h / 2;
                var minDist = +Infinity;
                var closestTile;
                var closestTileX, closestTileY;

                W.element.children(".Tile").each(function () {
                    var $this = $(this);
                    var tileObject = $this.data("tileObject");
                    var jpvsTileBrowserInfo = tileObject && tileObject.jpvsTileBrowserInfo;
                    if (jpvsTileBrowserInfo) {
                        //Tile center
                        var tx = jpvsTileBrowserInfo.x + jpvsTileBrowserInfo.tw / 2;
                        var ty = jpvsTileBrowserInfo.y + jpvsTileBrowserInfo.th / 2;

                        var tileToCenter = (xc - tx) * (xc - tx) + (yc - ty) * (yc - ty);
                        if (tileToCenter < minDist) {
                            minDist = tileToCenter;
                            closestTile = tileObject;
                            closestTileX = tx;
                            closestTileY = ty;
                        }
                    }
                });

                //Change the starting tile to that tile and move originX and originY to the center of that tile, so that this zooming animation
                //is centered on that tile (when we zoom, we want the center tile to stand still)
                //We set both the origin and the desired origin, so that we stop any running scrolling animation 
                //(it could interfere with the zooming animation and the change in starting tile and origin)
                if (closestTile) {
                    W.originX(closestTileX);
                    W.desiredOriginX(closestTileX);
                    W.originY(closestTileY);
                    W.desiredOriginY(closestTileY);
                    W.startingTile(closestTile);
                }
            }
            else {
                //Move
                W.desiredOriginY(oldOriginY - deltaY);
            }

            //Stop event propagation
            return false;
        };
    }

    function onTouchMove(W) {
        return function (e) {
            var touch = e.originalEvent.changedTouches[0];
            if (touch) {
                //Move the touched tile to the touch coordinates
                var tile = $(touch.target);
                var tileObject = tile && tile.data("tileObject");
                var info = tileObject && tileObject.jpvsTileBrowserInfo;
                if (info) {
                    if (tileObject !== W.startingTile()) {
                        W.originX(info.x + info.tw / 2);
                        W.originY(info.y + info.th / 2);
                        W.startingTile(tileObject);
                    }

                    W.desiredOriginX(touch.pageX);
                    W.desiredOriginY(touch.pageY);
                }
            }

            e.preventDefault();
            return false;
        };
    }

    function ensureAnimation(W) {
        //See if we must animate
        var deltas = getPixelDeltas();
        if (mustAnimate(deltas)) {
            //Yes, we have a mismatch greater than 1 pixel in origin/tile size, so we must animate
            //Let's determine the final values for our animation
            //If ensureAnimation is called during a running animation, the animation end time is simply moved away. The animation will end a fixed time
            //away from now
            var animationDuration = 500;
            var tNow = new Date().getTime();
            var tEnd = tNow + animationDuration;
            W.animationInfo = {
                x: { tEnd: tEnd, finalValue: W.desiredOriginX(), k: calcAnimationK(tNow, tEnd, W.originX(), W.desiredOriginX()) },
                y: { tEnd: tEnd, finalValue: W.desiredOriginY(), k: calcAnimationK(tNow, tEnd, W.originY(), W.desiredOriginY()) },
                tw: { tEnd: tEnd, finalValue: W.desiredTileWidth(), k: calcAnimationK(tNow, tEnd, W.tileWidth(), W.desiredTileWidth()) },
                th: { tEnd: tEnd, finalValue: W.desiredTileHeight(), k: calcAnimationK(tNow, tEnd, W.tileHeight(), W.desiredTileHeight()) }
            };

            //Now, let's schedule the animation. If already running, then, there's no need to do that
            if (!W.animating)
                jpvs.requestAnimationFrame(animate);
        }

        function mustAnimate(deltas) {
            return (Math.abs(deltas.originX) >= 1 || Math.abs(deltas.originY) >= 1 || Math.abs(deltas.tileWidth) >= 1 || Math.abs(deltas.tileHeight) >= 1);
        }

        function getPixelDeltas() {
            return {
                originX: W.desiredOriginX() - W.originX(),
                originY: W.desiredOriginY() - W.originY(),
                tileWidth: W.desiredTileWidth() - W.tileWidth(),
                tileHeight: W.desiredTileHeight() - W.tileHeight()
            };
        }

        function calcAnimationK(tNow, tEnd, currentValue, finalValue) {
            //Parabolic animation
            var delta = currentValue - finalValue;
            var dt = tEnd - tNow;
            var k = delta / dt / dt;
            return k;
        }

        function calcNewAnimatedValue(tNow, tEnd, k, finalValue) {
            if (tNow >= tEnd) {
                //We are past the end of the animation
                return finalValue;
            }
            else {
                //We are still animating
                var dt = tEnd - tNow;
                var currentDelta = k * dt * dt;
                var currentValue = finalValue + currentDelta;
                return currentValue;
            }
        }

        function animate() {
            //If end of animation, then no more work to do
            if (!W.animationInfo) {
                W.animating = false;
                return;
            }

            W.animating = true;

            //Let's apply the new values
            var tNow = new Date().getTime();
            W.originX(calcNewAnimatedValue(tNow, W.animationInfo.x.tEnd, W.animationInfo.x.k, W.animationInfo.x.finalValue));
            W.originY(calcNewAnimatedValue(tNow, W.animationInfo.y.tEnd, W.animationInfo.y.k, W.animationInfo.y.finalValue));
            W.tileWidth(calcNewAnimatedValue(tNow, W.animationInfo.tw.tEnd, W.animationInfo.tw.k, W.animationInfo.tw.finalValue));
            W.tileHeight(calcNewAnimatedValue(tNow, W.animationInfo.th.tEnd, W.animationInfo.th.k, W.animationInfo.th.finalValue));

            //Render the frame
            render(W);

            //See if the animation is done
            if (tNow > W.animationInfo.x.tEnd && tNow > W.animationInfo.y.tEnd && tNow > W.animationInfo.tw.tEnd && tNow > W.animationInfo.th.tEnd)
                W.animationInfo = null;

            //Schedule next animation frame (if done, the animation will stop)
            jpvs.requestAnimationFrame(animate);
        }
    }

})();
