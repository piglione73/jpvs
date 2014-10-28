window.jpvs = window.jpvs || {};

jpvs.TileBrowser = function (selector) {
    /// <summary>Attaches the widget to an existing element.</summary>
    /// <param name="selector" type="Object">Where to attach the widget: jpvs widget or jQuery selector or jQuery object or DOM element.</param>
};

jpvs.makeWidget({
    widget: jpvs.TileBrowser,
    type: "TileBrowser",

    prototype: {
        refresh: function (flagAnimate) {
            ///<summary>Force a refresh of the tile browser. Useful after setting some properties and a redraw is needed.
            ///Note that after setting a property such as originX or tileHeight, the tile browser is not automatically refreshed. This allows
            ///unnecessary redraws to be avoided when, for example, multiple properties are to be set in sequence.</summary>
            /// <param name="flagAnimate" type="Boolean">If true, an animation is started, otherwise a simple redraw is done.</param>
        },

        startingTile: function (value) {
            ///<summary>Property: starting tile object, from which tile layout and rendering will begin. Tile objects will be rendered into
            ///fixed sized tiles. A tile object must define at least three members: "template", "getNextTile", "getPreviousTile".
            ///The "template" member will be used for rendering the tile object into the tile area by calling jpvs.applyTemplate(template, { tileObject: XXX, tileBrowser: YYY }).
            ///The other two functions should return the next tile object and the previous tile object, if any, otherwise they must return nothing
            ///(null or undefined). If null is passed as the starting tile, then the tile browser will have no tiles.
            ///</summary>
        },

        width: function (value) {
            ///<summary>Property: gets the width in pixels, sets the width as CSS units (e.g.: 100px, 150pt, 6cm, 80%, ...).</summary>
        },

        height: function (value) {
            ///<summary>Property: gets the height in pixels, sets the height as CSS units (e.g.: 100px, 150pt, 6cm, 80%, ...).</summary>
        },

        tileWidth: function (value) {
            ///<summary>Property: gets/sets the tile width in pixels. If not specified or null, defaults to 1/8 of the TileBrowser width.</summary>
        },

        tileHeight: function (value) {
            ///<summary>Property: gets/sets the tile height in pixels. If not specified or null, defaults to the value of the tileWidth property.</summary>
        },

        desiredTileWidth: function (value) {
            ///<summary>Property: gets/sets the desired tile width in pixels. If different from the tileWidth, then the tileWidth will be animated to match.</summary>
        },

        desiredTileHeight: function (value) {
            ///<summary>Property: gets/sets the desired tile height in pixels. If different from the tileHeight, then the tileHeight will be animated to match.</summary>
        },

        tileSpacingHorz: function (value) {
            ///<summary>Property: gets/sets the horizontal spacing between tiles in pixels. If not specified or null, defaults to 1/5 of the tileWidth property.</summary>
        },

        tileSpacingVert: function (value) {
            ///<summary>Property: gets/sets the vertical spacing between tiles in pixels. If not specified or null, defaults to 1/5 of the tileHeight property.</summary>
        },

        originX: function (value) {
            ///<summary>Property: gets/sets the X coordinate of the origin. The origin is where the center of the starting tile is positioned.</summary>
        },

        originY: function (value) {
            ///<summary>Property: gets/sets the Y coordinate of the origin. The origin is where the center of the starting tile is positioned.</summary>
        },

        desiredOriginX: function (value) {
            ///<summary>Property: gets/sets the desired X coordinate of the origin. If different from originX, then originX will be animated to match.</summary>
        },

        desiredOriginY: function (value) {
            ///<summary>Property: gets/sets the desired Y coordinate of the origin. If different from originY, then originY will be animated to match.</summary>
        }
    }
});

