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

        //Lay tiles over the surface
        var x = sx + x0;
        var y = sy + y0;
        var tile0 = W.startingTile();

        //Forward
        var tileObject = tile0;
        while (tileObject) {
            drawTile(W, x, y, tw, th, tileObject);

            //Increment coordinates
            x += dx;
            if (x >= w) {
                x = sx;
                y += dy;
                if (y >= h)
                    break;
            }

            //Move to next tile object, if any
            tileObject = tileObject.getNextTile && tileObject.getNextTile();
        }

        //Backwards
        x = sx + x0;
        y = sy + y0;
        tileObject = tile0;
        while (true) {
            //Move to previous tile object, if any
            tileObject = tileObject.getPreviousTile && tileObject.getPreviousTile();
            if (!tileObject)
                break;

            //Decrement coordinates
            x -= dx;
            if (x + tw < 0) {
                x = w;
                y -= dy;
                if (y + th < 0)
                    break;
            }

            drawTile(W, x, y, tw, th, tileObject);
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
