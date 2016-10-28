define(['js/vm/helpers', 'js/vm/Models/LocalStorage'], function (helpers, LocalStorage) {

    function RecentHotelsModel() {

    }

    var LOCAL_STORAGE_HOTELS_KEY = 'recentViewedHotels';

    /**
     * Add hotel to the recent list (don't add the same hotels)
     * @param hotel
     */
    RecentHotelsModel.add = function (hotel) {

        var allHotelsArray = getAllRecentHotels();

        if (!helpers.findObjectInArrayByProperty(allHotelsArray, 'id', hotel.id)) {
            allHotelsArray.push(hotel);
        }

        LocalStorage.set(LOCAL_STORAGE_HOTELS_KEY, allHotelsArray);
    };

    /**
     *
     * @returns {Array}
     */
    function getAllRecentHotels() {
        return LocalStorage.get(LOCAL_STORAGE_HOTELS_KEY, []);
    }

    /**
     * Returns last three viewed hotels
     * @returns {Array|Object}
     */
    RecentHotelsModel.getLastThreeHotels = function () {

        var allHotels = getAllRecentHotels(),
            lastHotels = [];

        if (allHotels.length <= 3) {
            lastHotels = allHotels;
        } else {
            for (var i = allHotels.length - 1; (i > (allHotels.length - 4) && i >= 0); i--) {
                lastHotels.push(allHotels[i]);
            }
        }

        return lastHotels;
    };

    /**
     *
     * @param id
     * @returns {*}
     */
    RecentHotelsModel.getHotelById = function (id) {
        return helpers.findObjectInArrayByProperty(getAllRecentHotels(), 'id', id);
    };

    RecentHotelsModel.clearRecent = function () {
        LocalStorage.set(LOCAL_STORAGE_HOTELS_KEY, [])
    };

    return RecentHotelsModel;
});