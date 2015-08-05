window.jpvs = window.jpvs || {};

jpvs.compare = function (a, b) {
    /// <summary>Compares strings/numbers. If both a and b are numbers, they are compared numerically. Otherwise, a and b are converted
    /// to strings (through the toString method) and compared as strings in a case-insensitive way).
    /// Rule applied: undefined < null < numbers (compared numerically) < strings (compared alphabetically).</summary>
    /// <param name="x" type="Object">The first number/string.</param>
    /// <param name="y" type="Object">The second number/string.</param>
    /// <returns type="Number">The result of the comparison: +1 if a > b; 0 if a equals b; -1 if a < b.</returns>
};

jpvs.sort = function (array, sortingRules) {
    /// <summary>Sorts an array and returns a sorted copy of the array. The original array is left untouched.</summary>
    /// <param name="array" type="Array">The array to be sorted. This array will not be touched.</param>
    /// <param name="sortingRules" type="Array">Array of sorting rules, applied in order. Each sorting rule has the form:
    /// { selector: function(item) {}, descending: true/false }.
    /// The "selector" is a function that is used to extract the sort key from each item.
    /// For example: jpvs.sort(array, [ { selector: function(x) { return x.firstName; }, descending: false }, 
    /// { selector: function(x) { return x.lastName; }, descending: true } } will return a copy of "array" sorted by firstName (ascending) and 
    /// then by lastName (descending).</param>
    /// <returns type="Array">A sorted copy of the array.</returns>
};

