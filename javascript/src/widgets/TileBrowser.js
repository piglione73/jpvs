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
            W.element.css({
                overflow: "hidden"
            });
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

        //Clear the drawing area
        W.element.empty();

        var x0 = w / 2;
        var y0 = h / 2;

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
            drawTile(W, x, y, tw, th, tileObject);

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
            drawTile(W, x, y, tw, th, tileObject);

            //Decrement coordinates
            ix2--;

            //Move to next tile object, if any
            tileObject = tileObject.getPreviousTile && tileObject.getPreviousTile();
        }
    }

    function drawTile(W, x, y, w, h, tileObject) {
        var tile = jpvs.writeTag(W, "div");
        tile.data("tileObject", tileObject);

        tile.addClass("Tile").css({
            position: "absolute",
            left: x + "px",
            top: y + "px",
            width: w + "px",
            height: h + "px",
            overflow: "hidden"
        });

        if (tileObject.template)
            jpvs.applyTemplate(tile, tileObject.template, { tileObject: tileObject, tileBrowser: W, tile: tile });

        return tile;
    }

})();
