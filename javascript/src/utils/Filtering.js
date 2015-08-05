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
                var leftString = (rule.selector(item) || "").toString().toUpperCase();
                var rightString = (rule.value || "").toString().toUpperCase();
                var operand = rule.operand.toUpperCase();
                var ok = isRuleOk(leftString, operand, rightString);
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
        if (operand == "EQ") {
            //Equals
            return left == right;
        }
        else if (operand == "NEQ") {
            //Not equals
            return left != right;
        }
        else if (operand == "CONTAINS") {
            //Left contains right
            return left.indexOf(right) >= 0;
        }
        else if (operand == "NCONTAINS") {
            //Left does not contain right
            return left.indexOf(right) < 0;
        }
        else if (operand == "STARTS") {
            //Left starts with right
            return left.indexOf(right) == 0;
        }
        else if (operand == "NSTARTS") {
            //Left does not start with right
            return left.indexOf(right) != 0;
        }
        else if (operand == "LT") {
            //left < right
            return left < right;
        }
        else if (operand == "LTE") {
            //left <= right
            return left <= right;
        }
        else if (operand == "GT") {
            //left > right
            return left > right;
        }
        else if (operand == "GTE") {
            //left >= right
            return left >= right;
        }
        else {
            //Unknown rule: assume false
            return false;
        }
    }
})();
