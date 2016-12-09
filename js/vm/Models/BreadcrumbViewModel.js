define(['js/vm/helpers'], function (helpers) {

    function BreadcrumbViewModel(searchInfo, controller, staticDataInfo) {

        var self = this,
            segment = searchInfo.segments && searchInfo.segments[0] ? searchInfo.segments[0] : [];

        // returns current city data
        var createCity = function (cityId, staticData) {

            var data = {
                id: cityId,
                name: '',
                country: ''
            };

            var currentCity = helpers.arrayFirst(staticData.cities || [], function (city) {
                return city.id == data.id;
            });

            if (currentCity) {

                data.name = currentCity.name;

                if (currentCity.countryId) {

                    var currentCountry = helpers.arrayFirst(staticData.countries || [], function (country) {
                        return country.id === parseInt(currentCity.countryId, 10);
                    });

                    if (currentCountry) {
                        data.country = currentCountry.name;
                    }
                }
            }

            return data;
        };

        // returns string like "2 взрослых, 1 ребенек"
        var getGuestsSummary = function (rooms) {

            var adults = 0,
                childrenCount = 0,
                result = [];

            rooms.forEach(function (room) {
                adults += room.adults || 0;
                childrenCount += room.infants ? room.infants.length : 0;
            });

            if (adults > 0) {
                var adultStrKey = adults === 1 ? 'passSummary_numeral_ADT_one' : 'passSummary_numeral_ADT_twoToFour';
                var adultStr = adults + ' ' + controller.i18n('HotelsSearchForm', adultStrKey);
                result.push(adultStr);
            }

            if (childrenCount > 0) {
                var infantStrKey = childrenCount === 1 ?
                    'passSummary_numeral_CLD_one' :
                    'passSummary_numeral_CLD_twoToFour';
                var infantStr = childrenCount + ' ' + controller.i18n('HotelsSearchForm', infantStrKey);
                result.push(infantStr);
            }

            return result.join(', ');
        };

        self.city = createCity(segment[1], staticDataInfo);
        self.arrivalDate = controller.getModel('Common/Date', segment[2]);
        self.departureDate = controller.getModel('Common/Date', segment[3]);
        self.guestsSummary = getGuestsSummary(searchInfo.rooms || []);
    }

    return BreadcrumbViewModel;
});
