define(['knockout', 'js/vm/helpers'], function (ko, helpers) {

    /**
     * Uses to store room tariffs
     * @param {Array} tariffs
     * @constructor
     */
    function RoomTariffsModel(tariffs) {

        tariffs = typeof tariffs === 'undefined' ? [] : tariffs;

        var self = this;

        // tariffs count displayed by room
        var visibleTariffsCount = ko.observable(RoomTariffsModel.INITIAL_VISIBLE_COUNT);

        // all tariffs
        this.tariffs = ko.observableArray(tariffs);

        /**
         * Returns tariffs which will be displayed to user (depends lazy load)
         */
        this.splicedTariffs = ko.computed(function () {
            return this.tariffs().slice(0, visibleTariffsCount());
        }, this);

        /**
         * Returns rooms count what can be loaded with lazy loading
         */
        this.notLoadedTariffsCount = ko.computed(function () {
            return this.tariffs().length - this.splicedTariffs().length;
        }, this);

        // Checks is there hidden data
        this.hasNotLoadedRooms = ko.computed(function () {
            return this.notLoadedTariffsCount() > 0;
        }, this);

        /**
         * Load other tariffs which is currently hidden
         */
        this.showAllTariffs = function () {
            visibleTariffsCount(visibleTariffsCount() + self.notLoadedTariffsCount());
        };

        this.hideTariffs = function () {
            visibleTariffsCount(RoomTariffsModel.INITIAL_VISIBLE_COUNT);
        };

        this.buttonLoadAllText = ko.computed(function () {
            var count = this.notLoadedTariffsCount();
            return 'Показать еще ' + count + ' ' + helpers.getNumeral(count, 'тариф', 'тарифа', 'тарифов');
        }, this);

        this.showHideButton = ko.computed(function () {
            return visibleTariffsCount() > RoomTariffsModel.INITIAL_VISIBLE_COUNT;
        }, this);
    }

    RoomTariffsModel.INITIAL_VISIBLE_COUNT = 3;

    return RoomTariffsModel;
});
