/* JPVS
Module: utils
Classes: 
Depends: core
*/

(function () {

    jpvs.equals = function (x, y) {
        //If the objects are strictly equal, no other work is required
        if (x === y)
            return true;

        //Nulls
        if (x === null && y === null)
            return true;
        else if (x === null && y !== null)
            return false;
        else if (x !== null && y === null)
            return false;

        //Undefineds
        if (x === undefined && y === undefined)
            return true;
        else if (x === undefined && y !== undefined)
            return false;
        else if (x !== undefined && y === undefined)
            return false;

        //Booleans
        if (x === true && y === true)
            return true;
        else if (x === true && y !== true)
            return false;
        else if (x !== true && y === true)
            return false;

        if (x === false && y === false)
            return true;
        else if (x === false && y !== false)
            return false;
        else if (x !== false && y === false)
            return false;

        //Object typeof: if different, the object can't be equal
        if (typeof (x) != typeof (y))
            return false;

        //Objects have the same typeof
        //Numbers
        if (typeof (x) == "number") {
            //NaNs
            if (isNaN(x) && isNaN(y))
                return true;
            else if (isNaN(x) && !isNaN(y))
                return false;
            else if (!isNaN(x) && isNaN(y))
                return false;

            return x == y;
        }

        //Strings
        if (typeof (x) == "string")
            return x == y;

        //Objects and arrays
        if (x.length !== undefined && y.length !== undefined) {
            //Arrays
            return arraysEqual(x, y);
        }
        else if (x.length !== undefined && y.length === undefined) {
            //Array and object
            return false;
        }
        else if (x.length === undefined && y.length !== undefined) {
            //Object and array
            return false;
        }
        else {
            //Objects
            return objectsEqual(x, y);
        }

    };

    function arraysEqual(x, y) {
        if (x.length != y.length)
            return false;

        //Same length, then all elements must be equal
        for (var i = 0; i < x.length; i++) {
            var xVal = x[i];
            var yVal = y[i];
            if (!jpvs.equals(xVal, yVal))
                return false;
        }

        //No reason to say x and y are different
        return true;
    }

    function objectsEqual(x, y) {
        //All members of x must exist in y and be equal
        var alreadyChecked = {};
        for (var key in x) {
            var xVal = x[key];
            var yVal = y[key];
            if (!jpvs.equals(xVal, yVal))
                return false;

            alreadyChecked[key] = true;
        }

        //Other way round; for speed, exclude those already checked
        for (var key in y) {
            if (alreadyChecked[key])
                continue;

            var xVal = x[key];
            var yVal = y[key];
            if (!jpvs.equals(xVal, yVal))
                return false;
        }

        //No reason to say x and y are different
        return true;
    }

})();
