'use strict';

define([
    'js/vm/helpers',
    'js/vm/Common/Cache/Storage',
    'js/vm/Common/Cache/__cache'
], function (helpers,
             BaseStorage,
             cache) {

    function JsVarsStorage() {

    }

    helpers.extendModel(JsVarsStorage, [BaseStorage]);

    JsVarsStorage.prototype.storage = cache;

    return JsVarsStorage;
});
