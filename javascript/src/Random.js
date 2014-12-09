(function () {

    var chars = "QWERTYUIOPLKJHGFDSAZXCVBNM1234567890";
    var N = chars.length;
    var M = 10 * N;

    jpvs.randomString = function (len) {
        var s = "";
        for (var i = 0; i < len; i++) {
            var c = Math.floor(Math.random() * M) % N;
            var ch = chars[c];
            s += ch;
        }

        return s;
    };

})();
