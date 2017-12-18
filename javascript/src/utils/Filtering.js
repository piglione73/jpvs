(function () {

    jpvs.filter = function (array, filteringRules) {
        //Create a copy of the array and filter
        var ret = [];
        for (var i = 0; i < array.length; i++) {
            var item = array[i];

            //Check all rules; they must be all satisfied
            var failure = false;
            for (var ruleIndex = 0; ruleIndex < filteringRules.length; ruleIndex++) {
                var rule = filteringRules[ruleIndex];
                var leftValue = rule.selector(item);
                var rightValue = rule.value;
                var operand = rule.operand.toUpperCase();
                var ok = isRuleOk(leftValue, operand, rightValue);
                if (!ok) {
                    failure = true;
                    break;
                }
            }

            //If no rule failed, then we keep the item
            if (!failure)
                ret.push(item);
        }

        return ret;
    };

    function isRuleOk(left, operand, right) {
        //A missing value never satisfies
        if (left === undefined || left === null)
            return false;

        var leftNumber = (typeof (left) == "number");
        var rightNumber = (right !== undefined && right !== null && (typeof (right) == "number" || isFinite(parseFloat(right))));
        var useNumbers = (leftNumber && rightNumber);

        var leftString = (left || "").toString().toUpperCase();
        var rightString = (right || "").toString().toUpperCase();

        if (operand == "EQ") {
            //Equals
            return leftString == rightString;
        }
        else if (operand == "NEQ") {
            //Not equals
            return leftString != rightString;
        }
        else if (operand == "CONTAINS") {
            //Left contains right
            return leftString.indexOf(rightString) >= 0;
        }
        else if (operand == "NCONTAINS") {
            //Left does not contain right
            return leftString.indexOf(rightString) < 0;
        }
        else if (operand == "STARTS") {
            //Left starts with right
            return leftString.indexOf(rightString) == 0;
        }
        else if (operand == "NSTARTS") {
            //Left does not start with right
            return leftString.indexOf(rightString) != 0;
        }
        else if (operand == "LT") {
            //left < right, numerically if possible
            if (useNumbers)
                return left < parseFloat(right);
            else
                return leftString < rightString;
        }
        else if (operand == "LTE") {
            //left <= right, numerically if possible
            if (useNumbers)
                return left <= parseFloat(right);
            else
                return leftString <= rightString;
        }
        else if (operand == "GT") {
            //left > right, numerically if possible
            if (useNumbers)
                return left > parseFloat(right);
            else
                return leftString > rightString;
        }
        else if (operand == "GTE") {
            //left >= right, numerically if possible
            if (useNumbers)
                return left >= parseFloat(right);
            else
                return leftString >= rightString;
        }
        else {
            //Unknown rule: assume false
            return false;
        }
    }
})();
