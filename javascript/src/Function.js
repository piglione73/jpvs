(function () {

    function getBody(sourceCode) {
        var i = sourceCode.indexOf("{");
        var j = sourceCode.lastIndexOf("}");
        return sourceCode.substring(i + 1, j);
    }

    function getArgs(sourceCode) {
        var i = sourceCode.indexOf("(");
        var j = sourceCode.indexOf(")");

        //Split on commas and trim
        var argNames = sourceCode.substring(i + 1, j).split(",");
        for (var k = 0; k < argNames.length; k++)
            argNames[k] = $.trim(argNames[k]);

        if (argNames.length == 1 && argNames[0] == "")
            return [];
        else
            return argNames;
    }

    function serializeCall(argsArray, func) {
        var functionSourceCode = func.toString();
        var functionBody = getBody(functionSourceCode);
        var functionArgs = getArgs(functionSourceCode);

        var call = {
            args: argsArray,
            argNames: functionArgs,
            body: functionBody
        };

        var serializedCall = jpvs.toJSON(call);
        return serializedCall;
    }

    function deserializeCall(serializedCall) {
        var call = jpvs.parseJSON(serializedCall);

        //Recreate the function using the Function constructor
        var args = call.argNames;
        args.push(call.body);
        var func = Function.constructor.apply(null, args);

        //Now call the function and return its return value
        return func.apply(null, call.args);
    }

    jpvs.Function = {
        serializeCall: serializeCall,
        deserializeCall: deserializeCall
    };

})();
