(function () {

    jpvs.sort = function (array, sortingRules) {
        //Create a copy of the array
        var ret = [];
        for (var i = 0; i < array.length; i++)
            ret.push(array[i]);

        //Then sort in place (if no sorting rules, leave all unchanged)
        if (sortingRules.length)
            ret.sort(comparatorFunction(sortingRules));

        return ret;
    };

    function comparatorFunction(sortingRules) {
        return function (a, b) {
            //Process the sorting rules in order. Compare numbers numerically and strings alphabetically.
            for (var i = 0; i < sortingRules.length; i++) {
                var rule = sortingRules[i];
                var keyA = rule.selector(a);
                var keyB = rule.selector(b);
                var comparison = jpvs.compare(keyA, keyB);

                //If different, then end. Otherwise, continue to next sorting rule
                if (comparison != 0)
                    return rule.descending ? -comparison : comparison;
            }

            //If we get here, a and b are equal with respect to all sorting rules
            return 0;
        };
    }

    jpvs.compare = function (a, b) {
        //Undefined comes before null, which in turn comes before all numbers, which in turn all come before anything else
        if (a === undefined) {
            if (b === undefined)
                return 0;
            else
                return -1;
        }
        else if (a === null) {
            if (b === undefined)
                return +1;
            else if (b === null)
                return 0;
            else
                return -1;
        }
        else {
            if (b === undefined)
                return +1;
            else if (b === null)
                return +1;
            else {
                //a and b are both non-null and non-undefined
                var aNumber = (typeof (a) == "number");
                var bNumber = (typeof (b) == "number");

                if (aNumber && bNumber) {
                    //Both numbers: compare numerically
                    return a - b;
                }
                else if (aNumber && !bNumber) {
                    //All numbers come before all strings
                    return -1;
                }
                else if (!aNumber && bNumber) {
                    //All numbers come before all strings
                    return +1;
                }
                else {
                    //Both strings or convertable-to-strings: compare alphabetically
                    var a2 = a.toString().toUpperCase();
                    var b2 = b.toString().toUpperCase();

                    if (a2 > b2)
                        return +1;
                    else if (a2 < b2)
                        return -1;
                    else
                        return 0;
                }
            }
        }
    };
})();
