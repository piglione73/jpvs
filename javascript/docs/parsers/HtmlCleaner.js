window.jpvs = window.jpvs || {};

jpvs.cleanHtml = function (html, options) {
    /// <summary>Cleans an html string using the jquery-clean plugin. This function is merely a wrapper to that plugin.</summary>
    /// <param name="html" type="String">The html string to clean.</param>
    /// <param name="options" type="Object">Optional object with cleaning options. If not specified, the html is cleaned with default options (common tags and attributes found in javascript HTML editors are preserved (using a white-list approach)). If specified, it must be in the format specified by the jquery-clean plugin documentation. Please see it for detailed information.</param>
    /// <returns type="String">The cleaned html string. It is in xhtml format.</returns>
};

jpvs.stripHtml = function (html) {
    /// <summary>Strips all html tags from an html string using the jquery-clean plugin. This function is merely a wrapper to that plugin.</summary>
    /// <param name="html" type="String">The html string to clean.</param>
    /// <returns type="String">The text extracted from the html string.</returns>
};

