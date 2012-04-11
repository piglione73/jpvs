/*
*************************************************
Storage (backed by localStorage/sessionStorage)
*************************************************



EXAMPLE

var d1 = jpvs.Storage.getDomain(localStorage, "Domain 1");
var d2 = jpvs.Storage.getDomain(sessionStorage, "Domain 2");

d1.setItem(0, { col1: "Val 1", col2: "Val2", col3: [ "A", "B", "C" ] });
d1.setItem(1, { col1: "Val 1b", col2: "Val2b" });

d2.setItem(0, { A: "AAA", "B": "BBB" });

d1.each(function(item, i) {
...
});

d1.removeItem(0);

var first = d1.getItem(0);
var N = d1.getCount();
*/

/* JPVS
Module: storage
Classes: Storage
Depends: core, utils
*/
(function () {

    var KEY_PREFIX = "jpvs.Storage.";
    var KEY_PREFIX_LEN = KEY_PREFIX.length;

    function getObject(storage, key, defaultObj) {
        var objAsString = storage[KEY_PREFIX + key];
        if (!objAsString)
            return defaultObj;

        var obj = $.parseJSON(objAsString);
        return obj;
    }

    function setObject(storage, key, obj) {
        var objAsString = jpvs.toJSON(obj);
        storage[KEY_PREFIX + key] = objAsString;
    }

    function removeObject(storage, key) {
        storage.removeItem(KEY_PREFIX + key);
    }

    function eachObject(storage, action) {
        var N = storage.length;
        for (var i = 0; i < N; i++) {
            var entireKey = storage.key(i);
            if (entireKey.indexOf(KEY_PREFIX) != 0)
                continue;

            var key = entireKey.substring(KEY_PREFIX_LEN);
            var valueAsString = storage.getItem(key);
            var value = $.parseJSON(valueAsString);

            if (action(key, value) === false)
                return;
        }
    }

    function getItemKey(domainName, itemIndex) {
        return domainName + "." + itemIndex;
    }

    /*
    Domain class
    */
    function Domain(storage, domain) {
        this.storage = storage;
        this.id = domain.id;
        this.name = domain.name;
    }


    /*
    Get 1 + max(itemIndex)
    */
    Domain.prototype.getCount = function () {
        if (this.deleted)
            return 0;

        var prefix = this.name + ".";
        var prefixLen = prefix.length;

        var N = 0;
        eachObject(this.storage, function (key, value) {
            if (key.indexOf(prefix) == 0) {
                var index = key.substring(prefixLen);
                var nIndex = parseInt(index);
                N = Math.max(N, nIndex + 1);
            }
        });

        return N;
    };

    Domain.prototype.getItem = function (itemIndex) {
        if (this.deleted)
            return null;

        var key = getItemKey(this.name, itemIndex);
        var item = getObject(this.storage, key, null);
        return item;
    };

    Domain.prototype.setItem = function (itemIndex, item) {
        if (this.deleted)
            return;

        var key = getItemKey(this.name, itemIndex);
        setObject(this.storage, key, item);
    };

    Domain.prototype.removeItem = function (itemIndex) {
        if (this.deleted)
            return;

        var key = getItemKey(this.name, itemIndex);
        removeObject(this.storage, key);
    };

    Domain.prototype.removeAllItems = function () {
        if (this.deleted)
            return;

        var N = this.getCount();
        for (var i = 0; i < N; i++)
            this.removeItem(i);
    };

    Domain.prototype.listItems = function () {
        if (this.deleted)
            return [];

        var list = [];
        this.each(function (i, item) {
            list.push(item);
        });
        return list;
    };

    Domain.prototype.each = function (action) {
        if (this.deleted)
            return;

        var N = this.getCount();
        for (var i = 0; i < N; i++) {
            if (action(i, this.getItem(i)) === false)
                return;
        }
    };

    Domain.prototype.deleteDomain = function () {
        if (this.deleted)
            return;

        this.removeAllItems();

        //Remove the entry from the list of domains
        var domains = getObject(this.storage, "Domains", {});
        delete domains[this.id];
        setObject(this.storage, "Domains", domains);

        //Deactivate this
        this.deleted = true;
    };

    jpvs.Storage = {
        listDomains: function (storage) {
            var domains = getObject(storage, "Domains", {});
            var objs = [];
            $.each(domains, function (key, d) {
                objs.push(new Domain(storage, d));
            });

            return objs;
        },

        getDomain: function (storage, domainName) {
            //See if the domain is already there
            var domains = getObject(storage, "Domains", {});
            var found;
            $.each(domains, function (id, d) {
                if (d.name == domainName) {
                    found = new Domain(storage, d);
                    return false;
                }
            });

            if (found)
                return found;

            //Not found in list, let's create it now
            var newD = {
                id: jpvs.randomString(20),
                name: domainName
            };

            var newDomObj = new Domain(storage, newD);

            //Let's add it back into the list of domains
            domains[newD.id] = newD;

            setObject(storage, "Domains", domains);

            return newDomObj;
        }
    };
})();
