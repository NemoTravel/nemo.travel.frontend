define(['js/vm/helpers', 'js/vm/Models/LocalStorage'], function (helpers, LocalStorage) {

    function RecentHotelsModel() { }

    var LOCAL_STORAGE_HOTELS_KEY = 'recentViewedHotels';

    /**
     * Add hotel to the recent list (don't add the same hotels)
	 * 
     * @param hotel
     */
    RecentHotelsModel.add = function (hotel) {
        var recentHotels = this.getAllRecentHotels(),
			hotelExists = recentHotels.find(function (hotelId) {
				return hotelId == hotel.id;
			});
        
		if (!hotelExists) {
			recentHotels.push(hotel.id);
		}

        LocalStorage.set(LOCAL_STORAGE_HOTELS_KEY, recentHotels);
    };

    /**
     * @returns {array}
     */
	RecentHotelsModel.getAllRecentHotels = function() {
        return LocalStorage.get(LOCAL_STORAGE_HOTELS_KEY, []);
    };

    /**
     * Returns last three viewed hotels except current hotel.
     * 
     * @returns {Array}
     */
    RecentHotelsModel.getLastThreeHotels = function (currentHotel, hotelsPool) {
        var recentHotels = this.getAllRecentHotels(),
            lastHotels = [];

		if (recentHotels.length > 3) {
			recentHotels.reverse();
			recentHotels = recentHotels.slice(0, 3);
		}
		
		recentHotels.map(function (recentHotelId) {
			if (parseInt(recentHotelId) !== parseInt(currentHotel.id) && recentHotelId in hotelsPool) {
				lastHotels.push(hotelsPool[recentHotelId]);
			}
        });

        return lastHotels;
    };

    /**
     * @param {number} id
     * @returns {boolean}
     */
    RecentHotelsModel.hotelIsViewed = function (id) {
        return !!this.getAllRecentHotels().find(function (hotelId) {
        	return hotelId == id;
		});
    };

    RecentHotelsModel.clearRecent = function () {
        LocalStorage.set(LOCAL_STORAGE_HOTELS_KEY, [])
    };

    return RecentHotelsModel;
});