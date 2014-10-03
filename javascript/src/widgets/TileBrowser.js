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
        var x = sx;
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

        var y = sy + y0;
        var tile0 = W.startingTile();

        //Forward
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
            drawTile(W, x, y, tw, th, w, h, tileObject);

            //Increment coordinates
            ix2++;

            //Move to next tile object, if any
            tileObject = tileObject.getNextTile && tileObject.getNextTile();
        }

        //Backwards
        ix2 = ix - 1;
        y = sy + y0;
        tileObject = tile0.getPreviousTile && tile0.getPreviousTile();
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
            drawTile(W, x, y, tw, th, w, h, tileObject);

            //Decrement coordinates
            ix2--;

            //Move to next tile object, if any
            tileObject = tileObject.getPreviousTile && tileObject.getPreviousTile();
        }
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

    function drawTile(W, x, y, tw, th, w, h, tileObject) {
        if (!tileObject)
            return;

        //If the tile already exists, then simply adjust its coordinates: it's way faster
        var info = tileObject.jpvsTileBrowserInfo;
        if (info) {
            if (isTileVisible(x, y, tw, th, w, h)) {
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
                }

                if (info.th != th) {
                    info.th = th;
                    info.tile.css("height", th + "px");
                }
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
            th: th
        };

        tile.addClass("Tile").css({
            position: "absolute",
            left: x + "px",
            top: y + "px",
            width: tw + "px",
            height: th + "px",
            overflow: "hidden"
        });

        if (tileObject.template)
            jpvs.applyTemplate(tile, tileObject.template, { tileObject: tileObject, tileBrowser: W, tile: tile });

        return tile;
    }

    function onWheel(W) {
        return function (e) {
            var deltaY = e && e.originalEvent && e.originalEvent.deltaY || e.originalEvent.deltaX || 0;
            var oldOriginY = W.originY();

            if (e.shiftKey) {
                var tw = W.tileWidth();
                var th = W.tileHeight();

                W.tileWidth(tw * (deltaY < 0 ? 1.1 : (1 / 1.1)));
                W.tileHeight(th * (deltaY < 0 ? 1.1 : (1 / 1.1)));
                jpvs.requestAnimationFrame(function () { render(W); });
            }
            else {
                jpvs.animate({ duration: 1000 }, function (t) {
                    W.originY(oldOriginY - t * deltaY);
                    render(W);
                });
            }
        };
    }

})();
