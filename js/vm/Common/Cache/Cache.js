define(['js/vm/Common/Cache/Storage', 'js/vm/Common/Cache/JsVarsStorage'], function (BaseStorage, JsVarsStorage) {

    function Cache() {

    }

    // returns storage if set or default
    Cache.storage = function (storageType) {

        storageType = typeof storageType === 'undefined' ? BaseStorage.TYPE_JS : storageType;

        if (storageType === BaseStorage.TYPE_JS) {
            return new JsVarsStorage();
        }

        throw new Error('Incorrect storage type "' + storageType + '"');
    };

    return Cache;
});
