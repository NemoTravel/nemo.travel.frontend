define([], function () {

    function HotelsBaseModel() {

    }

    HotelsBaseModel.SORT_TYPES = {
        BY_POPULAR: 1,
        BY_PRICE: 2,
        BY_STARS: 3
    };

    HotelsBaseModel.MODE_ID = 'id';
    HotelsBaseModel.MODE_SEARCH = 'search';

    // cookies are exists and valid
    HotelsBaseModel.MODE_PREINITTED = 'preinitted';
    HotelsBaseModel.MODE_TUNESEARCH = 'tunesearch';
    HotelsBaseModel.MODE_NORMAL = 'normal';

    HotelsBaseModel.SERVICES_ICONS = [
        {name: 'Pool', cssClassSuffix: 'pool'},
        {name: 'Parking', cssClassSuffix: 'parking'},
        {name: 'Gym', cssClassSuffix: 'sport'},
        {name: 'ConferenceFacilities', cssClassSuffix: 'electricity'},
        {name: 'WiFi', cssClassSuffix: 'wifi'},
        {name: 'Laundry', cssClassSuffix: 'laundry'},
        {name: 'Transfer', cssClassSuffix: 'transport'},
        {name: 'ExpressCheckIn', cssClassSuffix: 'roundTheClock'},
        {name: 'ClimateControl', cssClassSuffix: 'fridge'},
        {name: 'BusinessCenter', cssClassSuffix: 'luggage'},
        {name: 'SPA', cssClassSuffix: 'spa'},
        {name: 'Bar', cssClassSuffix: 'bar'},
        {name: 'Restaurant', cssClassSuffix: 'resturant'},
        {name: 'Meal', cssClassSuffix: 'infinity'}
    ];

    HotelsBaseModel.ROOM_SERVICES = [
        {name: 'Мини-бар'},
        {name: 'Кофеварка / Электрический чайник'},
        {name: 'Hi-Fi'},
        {name: 'Ванна'},
        {name: 'Ванна'},
        {name: 'Мини-кухня'},
        {name: 'Круглосуточное облуживание номеров'},
        {name: 'Мини-кухня'},
        {name: 'Мини-бар'},
        {name: 'Кофеварка / Электрический чайник'},
        {name: 'Hi-Fi'}
    ];

    HotelsBaseModel.TAB_ROOMS = 'Rooms';

    HotelsBaseModel.DEFAULT_TAB = HotelsBaseModel.TAB_ROOMS;
    HotelsBaseModel.DEFAULT_VISIBLE_HOTELS_COUNT = 5;

    HotelsBaseModel.MAX_HOTELS_COUNT_WHAT_CAN_BE_LOADED_WITH_LAZY_LOADING = 25;

    return HotelsBaseModel;
});
