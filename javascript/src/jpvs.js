/* JPVS
Module: bootstrap
*/

var jpvs = (function () {
    function loadJS(url, callback) {
        var head = document.getElementsByTagName("head")[0] || document.documentElement;
        var script = document.createElement("script");
        script.src = url;

        // Handle Script loading
        var done = false;

        // Attach handlers for all browsers
        script.onload = script.onreadystatechange = function () {
            if (!done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete")) {
                done = true;
                callback();
            }
        };

        // Use insertBefore instead of appendChild to circumvent an IE6 bug.
        head.insertBefore(script, head.firstChild);
    }

    function setAdd(list, item) {
        var found = false;
        for (var i in list) {
            var x = list[i];
            if (x == item) {
                found = true;
                break;
            }
        }

        if (!found) {
            list.push(item);
            return true;
        }
        else
            return false;
    }

    function resolveDependencies(classes, modules) {
        //The following comment is a placeholder. During the build process it will be replaced with a dependency tree
        //of all files, classes and modules.
        /* $JPVSTREE$ */

        //Start from classes and get a list of modules
        var mods = [];
        if (classes) {
            for (var i in classes) {
                var cls = classes[i];
                var mod = tree.ClassToModule[cls];
                setAdd(mods, mod);
            }
        }

        //Next, add modules
        if (modules) {
            for (var i in modules) {
                var mod = modules[i];
                setAdd(mods, mod);
            }
        }

        //Finally, let's add all dependencies
        var loopAgain = true;
        while (loopAgain) {
            loopAgain = false;
            for (var i in mods) {
                var mod = mods[i];
                var depends = tree.ModuleToDepends[mod];
                for (var j in depends) {
                    var depend = depends[j];
                    if (setAdd(mods, depend))
                        loopAgain = true;
                }
            }
        }

        //Now we have all required modules
        //Let's determine the files to load
        var jpvsBaseUrl = jpvs.baseUrl || "jpvs";

        var files = [];
        for (var i in mods) {
            var mod = mods[i];
            var fileGroup = tree.ModuleToFiles[mod];
            for (var j in fileGroup) {
                var file = fileGroup[j];
                setAdd(files, jpvsBaseUrl + "/" + file);
            }
        }

        //Return in reverse order
        files.reverse();
        return files;
    }

    return function (classesAndModules, onready) {
        //Variable number of parameters
        if (!classesAndModules) {
            //No params
        }
        else if (typeof (classesAndModules) == "function") {
            //One param: callback
            onready = classesAndModules;
            $(document).ready(function () {
                jpvs.createAllWidgets();
                onready(jpvs.widgets);
            });
        }
        else {
            //Two params: classesAndModules, onready
            //Javascript files to load
            var files = resolveDependencies(classesAndModules.classes, classesAndModules.modules);

            function loadAllJS() {
                if (!files.TotalCount)
                    files.TotalCount = files.length;

                var firstJS = files.shift();
                if (firstJS) {
                    setTimeout(function () {
                        loadJS(firstJS, loadAllJS);
                    }, 10);
                }
                else {
                    //Done
                    jpvs.createAllWidgets();
                    if (onready)
                        onready(jpvs.widgets);
                }
            }

            $(document).ready(loadAllJS);
        }
    };
})();
