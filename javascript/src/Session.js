/* JPVS
Module: utils
Classes: 
Depends: core
*/

(function () {

    var KEY_SESSIONID = "jpvs.SessionID";
    var sessionID;

    jpvs.getSessionID = function () {
        if (!sessionID) {
            //If not here, try to load it from sessionStorage
            try {
                sessionID = sessionStorage[KEY_SESSIONID];
            }
            catch (e) {
            }
        }

        if (!sessionID) {
            //If still not here, create a new one...
            sessionID = jpvs.randomString(50);

            //... and try to save it
            try {
                sessionStorage[KEY_SESSIONID] = sessionID;
            }
            catch (e) {
            }
        }

        //Now we certainly have it, although we might have not been able to save it into the sessionStorage in very old browsers
        return sessionID;
    };

})();
