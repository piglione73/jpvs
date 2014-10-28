window.jpvs = window.jpvs || {};


function JPVS_Domain() {
}

JPVS_Domain.prototype.getCount = function () {
    /// <summary>Returns the number of items currently stored in this data domain.</summary>
    /// <returns type="Number">The number of items.</returns>
};

JPVS_Domain.prototype.getItem = function (itemIndex) {
    /// <summary>Returns a data item, given the item index.</summary>
    /// <param name="itemIndex" type="Number">The 0-based item index.</param>
    /// <returns type="Object">The data item, or null if no data item was found at the specified index.</returns>
};

JPVS_Domain.prototype.setItem = function (itemIndex, item) {
    /// <summary>Stores a data item at a given index.</summary>
    /// <param name="itemIndex" type="Number">The 0-based item index.</param>
    /// <param name="item" type="Object">The item to store.</param>
};

JPVS_Domain.prototype.removeItem = function (itemIndex) {
    /// <summary>Removes the data item at a given index.</summary>
    /// <param name="itemIndex" type="Number">The 0-based item index.</param>
};

JPVS_Domain.prototype.removeAllItems = function () {
    /// <summary>Removes all data items.</summary>
};

JPVS_Domain.prototype.listItems = function () {
    /// <summary>Returns all the items in the domain.</summary>
    /// <returns type="Array">Array of data items. Some elements may be null, if the corresponding item is missing or has been removed.</returns>
};

JPVS_Domain.prototype.each = function (action) {
    /// <summary>Iterates over all the data items and executes a callback on each item.</summary>
    /// <param name="action" type="Function">The callback to execute on each item. The callback is defined as follows: function(index, item) {}.</param>
};

JPVS_Domain.prototype.deleteDomain = function () {
    /// <summary>Removes all data items and deletes the domain.</summary>
};

jpvs.Storage = {
    listDomains: function (storage) {
        /// <summary>Returns a list of domains registered in a given storage object.</summary>
        /// <param name="storage" type="StorageObject">localStorage or sessionStorage.</param>
        /// <returns type="Array">Array of data domains.</returns>
        return [new JPVS_Domain(), new JPVS_Domain(), new JPVS_Domain()];
    },

    getDomain: function (storage, domainName) {
        /// <summary>Gets a domain by storage and name.</summary>
        /// <param name="storage" type="StorageObject">localStorage or sessionStorage.</param>
        /// <param name="domainName" type="String">Domain name. If no domain with this name is found in the given "storage", then a new domain is implicitly created and registered.</param>
        /// <returns type="JPVS_Domain">The requested data domain.</returns>
        return new JPVS_Domain();
    }
};

