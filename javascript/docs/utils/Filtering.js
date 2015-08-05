window.jpvs = window.jpvs || {};

jpvs.filter = function (array, filteringRules) {
    /// <summary>Returns a filtered copy of the array. The original array is left untouched.</summary>
    /// <param name="array" type="Array">The array to be filtered. This array will not be touched.</param>
    /// <param name="filteringRules" type="Array">Array of filtering rules. Each filtering rule has the form:
    /// { 
    ///     selector: function(item) {}, 
    ///     operand: <"EQ" | "NEQ" | "CONTAINS" | "NCONTAINS" | "STARTS" | "NSTARTS" | "LT" | "LTE" | "GT" | "GTE">, 
    ///     value: <string> 
    /// }.
    /// The "selector" is a function that is used to extract (from each item) the string value to compare with the provided "value".
    /// Comparisons are all case-insensitive.
    /// </param>
    /// <returns type="Array">A filtered copy of the array. Every item satisfies ALL the filtering rules.</returns>
};

