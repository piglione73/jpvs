window.jpvs = window.jpvs || {};

jpvs.Function = {
    serializeCall: function (argsArray, func) {
        /// <summary>Obtains a string serialization of a function call with its arguments, 
        /// for later execution by calling jpvs.Function.deserializeCall.</summary>
        /// <param name="argsArray" type="Array">The array of arguments to be passed to the function.</param>
        /// <param name="func" type="Function">The function to be called. This function must not refer to captured variables of the
        /// enclosing scope or a reference error will occur during deserialization (because during deserialization the function
        /// will be executed in a different scope). The function may only use its arguments. If it
        /// is necessary to refer to captured variables or to "this", then they must be directly passed as arguments in "argsArray".</param>
        return "";
    },

    deserializeCall: function (serializedCall) {
        /// <summary>Deserialized a string returned by jpvs.Function.serializeCall. This actually results in calling the serialized
        /// function with its arguments and with this = null. The function is called like this: func.apply(null, argsArray). If the
        /// function call returns a value, then this value is passed as a return value.</summary>
        /// <param name="serializedCall" type="String">The string returned by jpvs.Function.serializeCall.</param>
    }
};

