window.jpvs = window.jpvs || {};

jpvs.History = {
    setStartingHistoryPoint: function (argsArray, action) {
        /// <summary>Executes a given function and also adds the function call as the starting history point for the current page.
        /// When the user, by clicking the "Back" browser button, navigates back to when the page was first loaded, the function call is executed
        /// again with the same arguments.</summary>
        /// <param name="argsArray" type="Array">The array of arguments to be passed to the function.</param>
        /// <param name="action" type="Function">The function to be called. This function must not refer to captured variables of the
        /// enclosing scope or a reference error will occur during deserialization (because during deserialization the function
        /// will be executed in a different scope). The function may only use its arguments. If it
        /// is necessary to refer to captured variables or to "this", then they must be directly passed as arguments in "argsArray".</param>
    },

    addHistoryPoint: function (argsArray, action, suppressImmediateExecution) {
        /// <summary>Adds the function call as a history point into the browser history. Additionally, the function is immediately called.
        /// However, this immediate function execution can be suppressed.
        /// When the user, by clicking the "Back" browser button, navigates back to a saved history point, the function call is always executed
        /// with the same arguments, regardless of the "suppressImmediateExecution" argument.</summary>
        /// <param name="argsArray" type="Array">The array of arguments to be passed to the function.</param>
        /// <param name="action" type="Function">The function to be called. This function must not refer to captured variables of the
        /// enclosing scope or a reference error will occur during deserialization (because during deserialization the function
        /// will be executed in a different scope). The function may only use its arguments. If it
        /// is necessary to refer to captured variables or to "this", then they must be directly passed as arguments in "argsArray".</param>
        /// <param name="suppressImmediateExecution">If true, then the function is not executed immediately, although the history point
        /// is regularly added into the browser history.</param>
    },

    reloadCurrentHistoryPoint: function () {
        /// <summary>If the url contains a reference to a history point,
        /// reloads that history point by executing the associated action. This function should be called on page load, just after
        /// setStartingHistoryPoint.</summary>
    }
};

