define([], function () {

    function LocalStorage() {

    }

    var PREFIX = 'nemo-';

    function localStorageGet(key, defaultValue) {

        defaultValue = typeof defaultValue === 'undefined' ? {} : defaultValue;

        var json = window.localStorage.getItem(PREFIX + key) || JSON.stringify(defaultValue);

        try {
            var data = JSON.parse(json);
        } catch (e) {
            data = defaultValue;
        }

        return data;
    }

    function localStorageSet(key, value) {
        window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    }

    LocalStorage.get = localStorageGet;
    LocalStorage.set = localStorageSet;

    return LocalStorage;
});