window.jpvs = window.jpvs || {};

jpvs.History = {
    setStartingPoint: function (argsArray, action) {
        /// <summary>Executes a given function and also adds the function call as the starting history point for the current page.
        /// When the user, by clicking the "Back" browser button, navigates back to when the page was first loaded, the function call is executed
        /// again with the same arguments.</summary>
        /// <param name="argsArray" type="Array">The array of arguments to be passed to the function.</param>
        /// <param name="action" type="Function">The function to be called. This function must not refer to captured variables of the
        /// enclosing scope or a reference error will occur during deserialization (because during deserialization the function
        /// will be executed in a different scope). The function may only use its arguments. If it
        /// is necessary to refer to captured variables or to "this", then they must be directly passed as arguments in "argsArray".</param>
    },

    addHistoryPoint: function (argsArray, action) {
        /// <summary>Executes a given function and also adds the function call as a history point into the browser history. 
        /// When the user, by clicking the "Back" browser button, navigates back to a saved history point, the function call is executed
        /// again with the same arguments.</summary>
        /// <param name="argsArray" type="Array">The array of arguments to be passed to the function.</param>
        /// <param name="action" type="Function">The function to be called. This function must not refer to captured variables of the
        /// enclosing scope or a reference error will occur during deserialization (because during deserialization the function
        /// will be executed in a different scope). The function may only use its arguments. If it
        /// is necessary to refer to captured variables or to "this", then they must be directly passed as arguments in "argsArray".</param>
    },

    reloadCurrentHistoryPoint: function () {
        /// <summary>This function is called internally when the jpvs library is started. If the url contains a reference to a history point,
        /// reloads that history point by executing the associated action.</summary>
    }
};

