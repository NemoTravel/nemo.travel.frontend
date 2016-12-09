'use strict';

define([], function () {

    function Storage() {

    }

    Storage.prototype.storage = null;

    Storage.prototype.set = function (key, value) {
        this.storage[key] = value;
    };

    Storage.prototype.get = function (key, defaultValue) {
        return this.storage[key] ? this.storage[key] : defaultValue;
    };

    Storage.prototype.has = function (key) {
        return typeof this.storage[key] !== 'undefined';
    };

    Storage.prototype.all = function () {
        return this.storage;
    };

    Storage.TYPE_JS = 'js';

    return Storage;
});
