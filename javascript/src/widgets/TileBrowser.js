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
            W.element.on("mousemove", "div.Tile", onMouseMove(W));
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
                }
            }),

            desiredTileHeight: jpvs.property({
                get: function () {
                    var x = this.element.data("desiredTileHeight");
                    return x != null ? x : this.tileHeight();
                },
                set: function (value) {
                    this.element.data("desiredTileHeight", value);
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
                    return x != null ? x : this.tileSpacingHorz();
                },
                set: function (value) {
                    this.element.data("originX", value);
                }
            }),

            originY: jpvs.property({
                get: function () {
                    var x = this.element.data("originY");
                    return x != null ? x : this.tileSpacingVert();
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
                }
            }),

            desiredOriginY: jpvs.property({
                get: function () {
                    var x = this.element.data("desiredOriginY");
                    return x != null ? x : this.originY();
                },
                set: function (value) {
                    this.element.data("desiredOriginY", value);
                }
            })

        }
    });


    function render(W) {
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
        var x = x0;
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
        x = sx + x0;

        //Round x to the previous allowedX
        while (allowedXs[ix] < x && ix < allowedXs.length)
            ix++;
        ix--;
        ix = Math.max(ix, 0);
        ix = Math.min(ix, allowedXs.length - 1);

        //At every rendering we assign a generation number, useful for cleaning up at the end
        var currentGeneration = 1 + (W.lastRenderedGeneration || 0);
        W.lastRenderedGeneration = currentGeneration;

        //Forward
        var y = sy + y0;
        var tile0 = W.startingTile();
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
        y = sy + y0;
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
        //We just delete tile that do not belong to the current generation
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

    function onMouseMove(W) {
        return function (e) {
            var tileObject = $(e.target).data("tileObject");
            if (tileObject)
                W.hoveredTileObject = tileObject;
        };
    }

    function onWheel(W) {
        return function (e) {
            var deltaY = e && e.originalEvent && e.originalEvent.deltaY || e.originalEvent.deltaX || 0;
            var oldOriginY = W.desiredOriginY();

            if (e.shiftKey) {
                //Zoom
                var tw = W.desiredTileWidth();
                var th = W.desiredTileHeight();

                W.desiredTileWidth(tw * (deltaY < 0 ? 1.1 : (1 / 1.1)));
                W.desiredTileHeight(th * (deltaY < 0 ? 1.1 : (1 / 1.1)));

                //Also move the origin, so the hovered tile does not move when zooming in/out
                var tileObject = W.hoveredTileObject;
                if (tileObject) {
                    var info = tileObject.jpvsTileBrowserInfo;
                    if (info) {
                        //Tile center
                        var cx = info.x + info.tw / 2;
                        var cy = info.y + info.th / 2;

                        //We want the new tile center to be invariant, so here are the new tile coordinates
                        var nx = cx - W.desiredTileWidth() / 2;
                        var ny = cy - W.desiredTileHeight() / 2;

                        //Let's set this tile as the starting tile, so the origin is this tile and we can adjust its coordinates
                        W.startingTile(tileObject);
                        W.originX(nx);
                        W.originY(ny);
                    }
                }
            }
            else {
                //Move
                W.desiredOriginY(oldOriginY - deltaY);
            }

            //Ensure we animate values if desiredXXXX is different from XXXX
            ensureAnimation(W);

            //Stop event propagation
            return false;
        };
    }

    function ensureAnimation(W) {
        //If we are already animating, then we have no work to do
        if (W.animating)
            return;

        //See if we must animate
        var deltas = getPixelDeltas();
        if (mustAnimate()) {
            //Yes, we have a mismatch greater than 1 pixel in origin/tile size, so we must animate
            W.animating = true;
            jpvs.requestAnimationFrame(animate);
        }

        function mustAnimate() {
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

        var kOrigin = 0.2;
        var kSize = 0.2;

        function animate() {
            var deltas = getPixelDeltas();
            if (mustAnimate()) {
                //Yes, we have a mismatch greater than 1 pixel in origin/tile size, so we must animate
                //Let's reduce deltas
                var deltaX = deltas.originX * kOrigin;
                var deltaY = deltas.originY * kOrigin;
                var deltaTW = deltas.tileWidth * kSize;
                var deltaTH = deltas.tileHeight * kSize;

                W.originX(W.originX() + deltaX);
                W.originY(W.originY() + deltaY);

                W.tileWidth(W.tileWidth() + deltaTW);
                W.tileHeight(W.tileHeight() + deltaTH);

                //Render the frame
                render(W);

                //Schedule next animation frame
                jpvs.requestAnimationFrame(animate);
            }
            else {
                //No further animation is necessary
                W.animating = false;
            }
        }
    }

})();
