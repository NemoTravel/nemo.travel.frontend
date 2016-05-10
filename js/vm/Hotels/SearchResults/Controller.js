'use strict';
define(
    ['knockout', 'js/vm/helpers', 'js/vm/BaseControllerModel', 'jsCookie', 'dotdotdot'],
    function (ko, helpers, BaseControllerModel, Cookie, dotdotdot) {
        function HotelsSearchResultsController (componentParameters) {
            BaseControllerModel.apply(this, arguments);

            this.name = 'HotelsSearchResultsController';
            this.error = ko.observable(false);
            this.$$loading = ko.observable(false);
            this.PFActive = ko.observable(false);
            this.mode = 'id'; // 'search'
            this.resultsTypeCookie = 'HotelsSearchForm';
            this.searchParameters = {
                cityId: 0,
                hotelId: 0,
                checkInDate: '',
                checkOutDate: '',
                isDelayed: false,
                rooms: [
                    {
                        ADT: 0,
                        CLD: 0,
                        childAges: []
                    }
                ],
                id: 0,
                uri: ''
            };

            this.countOfNights = ko.observable(0);
            this.labelAfterNights = ko.observable(this.$$controller.i18n('HotelsSearchResults', 'PH__label_after_nights_more_than_five'));

            this.PFActive = ko.observable(false);

            this.isListView = ko.observable(true);
            this.isMapView = ko.observable(false);
            this.changeViewButtonLabel = ko.observable(this.$$controller.i18n('HotelsSearchResults', 'map__button-show'));
            this.onMapPanelImageSrc = ko.observable('/img/show_on_map.png');

            // this.map = function (block, position) {
            //     new google.maps.Map(block, position);
            // };
            this.geocoder = new google.maps.Geocoder();

            this.changeView = function () {
                if ( this.resultsLoaded() ) {
                    if ( this.isListView() ) {
                        this.isMapView(true);
                        this.isListView(false);
                        this.changeViewButtonLabel(this.$$controller.i18n('HotelsSearchResults', 'list__button-show'));
                        this.onMapPanelImageSrc('/img/show_on_list.png');

                        this.map = new google.maps.Map(
                            document.getElementById('map'),
                            {
                                center: {lat: -34.397, lng: 150.644},
                                zoom: 8
                            }
                        );

                    } else {
                        this.isListView(true);
                        this.isMapView(false);
                        this.changeViewButtonLabel(this.$$controller.i18n('HotelsSearchResults', 'map__button-show'));
                        this.onMapPanelImageSrc('/img/show_on_map.png');

                        this.cutDescription();
                    }
                }
            };

            this.postfiltersData = {
                configs: {
                    price: {
                        name: 'price',
                        type: 'Number',
                        isLegged: false,
                        legNumber: 0,
                        getter: function (obj) {
                            // We are forced to use Math.ceil here due to a bug in jQueryUI.slider
                            // which is used for Number postFilters' view
                            return Math.ceil(obj.getTotalPrice().amount());
                        },
                        options: {
                            /* Filter-specific options here */
                            onInit: function (initParams) {
                                var currency = '',
                                    keys = Object.keys(initParams.items);

                                if (keys.length) {
                                    currency = initParams.items[keys[0]].getTotalPrice().currency();
                                }
                                
                                this.displayValues.min = this.$$controller.getModel('Common/Money', {amount: 0, currency: currency});
                                this.displayValues.max = this.$$controller.getModel('Common/Money', {amount: 0, currency: currency});
                            },
                            onValuesUpdate: function (newValue) {
                                this.displayValues.min.amount(newValue.min);
                                this.displayValues.max.amount(newValue.max);
                            }
                        }
                    }
                },
                order: ['price'],
                preInitValues: {
                    price: null
                }
            };
            this.postFilters = ko.observableArray([]);
            this.visiblePostFilters = ko.observableArray([]);
            this.usePostfilters = false;

            this.searchInfo = ko.observable({});

            this.mode = 'id';
            this.resultsLoaded = ko.observable(false);

            ko.bindingHandlers.afterHtmlRender = {
                update: function(element, valueAccessor, allBindings){
                    $(element).dotdotdot({
                        watch: 'window'
                    });
                }
            }

            this.hotels = ko.observableArray([]);

            this.filters = new HotelsFiltersViewModel(ko);
            
            this.hideShowMoreButton = ko.observable(false);
            this.countsOfHotels = ko.observable(0);
            this.visibleHotels = ko.observable(5);
            this.remainderHotels = ko.observable(25);
            this.showNext25hotels = function (controller) {
                this.visibleHotels(this.visibleHotels() + this.remainderHotels());
                this.remainderHotels(
                    (this.countsOfHotels() - this.visibleHotels()) > this.remainderHotels() ? this.remainderHotels() : this.countsOfHotels() - this.visibleHotels()
                );
                
                if ( this.remainderHotels() === 0 ) {
                    this.hideShowMoreButton(true);
                }
            };

            this.cutDescription = function() {
                var descriptions = $('.nemo-hotels-results__hotelsGroup__mainInfo__description-jquery-dotdotdot'),
                    i;

                descriptions.dotdotdot({
                        watch: 'window'
                    });
                };

            this.$$controller.hotelsSearchCardActivated = ko.observable(false);
            this.isCardHotelView = ko.observable(false);
            this.showCardHotel = function (hotel, root) {
                /*var proto = Object.getPrototypeOf(root.controller);
                 proto.navigate.call(root.controller, '/hotels/results/' + hotel.id, false);*/

                this.$$controller.navigate('/hotels/results/' + hotel.id, false);
                this.isCardHotelView(true);

                this.$$controller.hotelsSearchCardActivated(true);
                this.$$controller.hotelsSearchController = this;
            };

            this.processInitParams();

		}

        // Extending from dictionaryModel
        helpers.extendModel(HotelsSearchResultsController, [BaseControllerModel]);

        HotelsSearchResultsController.prototype.$$KOBindings = ['common','PostFilters', 'HotelsResults'];

        HotelsSearchResultsController.prototype.$$usedModels = [
            'Common/Date',
            'Common/Duration',
            'Common/Money',
            'Common/PostFilter/Abstract',
            'Common/PostFilter/String',
            'Common/PostFilter/Number',
            'Hotels/Common/Geo'
        ];

        HotelsSearchResultsController.prototype.$$i18nSegments = ['HotelsSearchForm', 'HotelsSearchResults'];

        HotelsSearchResultsController.prototype.processInitParams = function () {
            this.mode = 'search';

            this.searchInfo(Cookie.getJSON(this.$$controller.options.cookiesPrefix+this.resultsTypeCookie));
        };

        HotelsSearchResultsController.prototype.dataURL = function () {
            if (this.mode == 'id') {
                return '/hotels/search/results/' + this.id;
            }
            else {
                return '/hotels/search/request';
            }
        };

        HotelsSearchResultsController.prototype.dataPOSTParameters = function () {
            var cookie_params = {},
                params = {},
                ret = {};

            if (this.mode != 'id') {
                cookie_params = Cookie.getJSON(this.$$controller.options.cookiesPrefix+this.resultsTypeCookie);

                params.cityId = cookie_params.segments[0][1];
                params.hotelId = null;

                params.checkInDate = ISODateString(new Date(cookie_params.segments[0][2]));
                params.checkOutDate = ISODateString(new Date(cookie_params.segments[0][3]));

                params.isDelayed = false;

                params.rooms = [{
                    ADT: cookie_params.rooms[0].adults
                }];

                // ret.request = JSON.stringify(params);
                // ret.request = JSON.stringify({
                //     "cityId": 1870586,
                //     "hotelId": null,
                //     "checkInDate": "2016-08-05T00:00:00",
                //     "checkOutDate": "2016-08-07T00:00:00",
                //     "isDelayed": false,
                //     "rooms": [
                //         {
                //             "ADT": 1
                //         }
                //     ]
                // });

                // ret.request = JSON.stringify({
                //     "cityId": 28193,
                //     "hotelId": null,
                //     "checkInDate": "2016-09-05T00:00:00",
                //     "checkOutDate": "2016-09-07T00:00:00",
                //     "isDelayed": false,
                //     "rooms": [
                //         { "ADT": 1 },
                //         { "ADT": 1 }
                //     ]
                // }); //163157

                // ret.request = JSON.stringify({
                //     "cityId": 4754,
                //     "hotelId": null,
                //     "checkInDate": "2016-08-12T00:00:00",
                //     "checkOutDate": "2016-08-14T00:00:00",
                //     "isDelayed": false,
                //     "rooms": [
                //         {
                //             "ADT": 2
                //         }
                //     ]
                // });

                ret.request = JSON.stringify({
                    "cityId": 1934864,
                    "checkInDate": "2016-10-12T00:00:00",
                    "checkOutDate": "2016-10-14T00:00:00",
                    "isDelayed": false,
                    "rooms": [
                        {
                            "ADT": 1,
                            "CLD": 1,
                            "childAges": [
                                10
                            ]
                        }
                    ]
                });
            }

            return ret;

            function ISODateString(d){
                function pad(n){return n<10 ? '0'+n : n}
                return d.getUTCFullYear()+'-'
                    + pad(d.getUTCMonth()+1)+'-'
                    + pad(d.getUTCDate())+'T'
                    + pad(d.getUTCHours())+':'
                    + pad(d.getUTCMinutes())+':'
                    + pad(d.getUTCSeconds())}
        };

        HotelsSearchResultsController.prototype.pageTitle = 'HotelsResults';

        HotelsSearchResultsController.prototype.buildModels = function () {
            var self = this;

            function searchError (message, systemData) {
                if (typeof systemData != 'undefined' && systemData[0] !== 0) {
                    self.$$controller.error('SEARCH ERROR: '+message, systemData);
                }

                if (typeof systemData == 'undefined' || systemData[0] !== 0) {
                    self.error(message);
                }
            }

            this.$$controller.loadData(
                this.dataURL(),
                this.dataPOSTParameters(),
                function (text, request) {
                    var response;

                    try {
                        response = JSON.parse(text);

                        // Checking for errors
                        if (!response.system || !response.system.error) {
                            if (!response.hotels.search.results.info.errorCode) {
                                self.$$rawdata = response;
                                
                                self.processSearchResults();
                            }
                            else {
                                searchError(response.hotels.search.results.info.errorCode);
                            }
                        }
                        else {
                            searchError('systemError', response.system.error);
                        }
                    }
                    catch (e) {
                        console.error(e);
                    }
                },
                function (request) {

                }
            );

        };

        HotelsSearchResultsController.prototype.addLabelAfterNights = function () {
            switch(this.countOfNights()) {
                case 1:
                    return this.labelAfterNights(this.$$controller.i18n('HotelsSearchResults', 'PH__label_after_nights_one'));
                    break;
                case 2:
                case 3:
                case 4:
                    return this.labelAfterNights(this.$$controller.i18n('HotelsSearchResults', 'PH__label_after_nights_two_to_four'));
                    break;
                default:
                    return this.labelAfterNights(this.$$controller.i18n('HotelsSearchResults', 'PH__label_after_nights_more_than_five'));
                    break;
            }
        };

        HotelsSearchResultsController.prototype.processSearchResults = function () {
            var self = this;

            var searchData = this.$$rawdata.hotels.search ? this.$$rawdata.hotels.search : null,
                staticData = this.$$rawdata.hotels.staticDataInfo ? this.$$rawdata.hotels.staticDataInfo : null,
                hotelsArr = [],
                roomsArr = [],
                roomsDictionary = {},
                starRatingArr = [],
                hotelId;

            //creating roomMeals association
            for ( var indexMeal = 0; indexMeal < searchData.results.roomMeals.length; indexMeal++ ) {
                for ( var indexRG = 0; indexRG < searchData.results.roomsGroup.length; indexRG++ ) {
                    if ( searchData.results.roomMeals[indexMeal].id === searchData.results.roomsGroup[indexRG].mealId ) {
                        searchData.results.roomsGroup[indexRG].meal = searchData.results.roomMeals[indexMeal];
                    }
                }
            }

            //creating roomRates association
            for ( var indexRate = 0; indexRate < searchData.results.roomRates.length; indexRate++ ) {
                for ( var indexRG = 0; indexRG < searchData.results.roomsGroup.length; indexRG++ ) {
                    if ( searchData.results.roomRates[indexRate].id === searchData.results.roomsGroup[indexRG].rateId ) {
                        searchData.results.roomsGroup[indexRG].rate = searchData.results.roomRates[indexRate];
                    }
                }
            }

            // creating roomTypes association
            for ( var indexType = 0; indexType < searchData.results.roomTypes.length; indexType++ ) {
                for ( var indexRG = 0; indexRG < searchData.results.roomsGroup.length; indexRG++ ) {
                    if ( searchData.results.roomTypes[indexType].id === searchData.results.roomsGroup[indexRG].typeId ) {
                        searchData.results.roomsGroup[indexRG].type = searchData.results.roomTypes[indexType];
                    }
                }
            }

            // creating dictionary with properties rooms
            for ( var indexDictionary = 0; indexDictionary < searchData.results.roomsGroup.length; indexDictionary++ ) {
                if ( searchData.results.roomsGroup[indexDictionary].id || searchData.results.roomsGroup[indexDictionary].id === 0 ) {
                    var idPropertie = searchData.results.roomsGroup[indexDictionary].id;

                    roomsDictionary[idPropertie] = searchData.results.roomsGroup[indexDictionary];
                }
            }

            // console.dir(roomsDictionary);

            // adding static data to hotel with identical id
            for ( var index = 0; index < staticData.hotels.length; index++ ) {
                if ( searchData.results.hotels[staticData.hotels[index].id] ) {
                    searchData.results.hotels[staticData.hotels[index].id].staticDataInfo = staticData.hotels[index];
                }
            }

            // running through all hotels in search results
            for ( hotelId in searchData.results.hotels ) {
                roomsArr = [];

                // binding rooms data to hotels by index = searchRoomId
                for ( var indexGroups = 0; indexGroups < searchData.results.hotels[hotelId].roomGroups.length; indexGroups++ ) {
                    for ( var indexVariants = 0; indexVariants < searchData.results.hotels[hotelId].roomGroups[indexGroups].roomVariants.length; indexVariants++ ) {
                        var searchRoomId = searchData.results.hotels[hotelId].roomGroups[indexGroups].searchRoomId,
                            roomVariants = searchData.results.hotels[hotelId].roomGroups[indexGroups].roomVariants[indexVariants];

                        //creating rooms associations
                        roomVariants = roomsDictionary[roomVariants];

                        if ( !roomsArr[searchRoomId] ) {
                            roomsArr[searchRoomId] = [];
                        }
                        roomsArr[searchRoomId].push(roomVariants);
                    }
                }

                //create properties which include data about rooms
                searchData.results.hotels[hotelId].rooms = roomsArr;

                //create array with hotels,static data and rooms
                hotelsArr.push(searchData.results.hotels[hotelId]);
            }

            for ( var indexHotelArr = 0; indexHotelArr < hotelsArr.length; indexHotelArr++ ) {
                starRatingArr = [];
                for ( var indexStar = 0; indexStar < hotelsArr[indexHotelArr].staticDataInfo.starRating; indexStar++ ) {
                    starRatingArr.push('1');
                }
                hotelsArr[indexHotelArr].staticDataInfo.starRating = starRatingArr;
            }

            console.dir(hotelsArr);
            //counts of hotels remainder
            this.countsOfHotels(hotelsArr.length);

            this.hotels = ko.observableArray(hotelsArr);

            self.filteredHotels = ko.computed(function() {
                var filters = self.filters;

                if (self.filters.isFilterEmpty()){
                    return self.hotels();
                }

                return ko.utils.arrayFilter(self.hotels(), function(hotel) {
                    return self.filters.isMatchFilter(hotel);
                });
            });

            self.filteredHotels.subscribe(function(){
                //TODO work with map
            });

            this.countOfNights = ko.observable(
                Math.floor((new Date(searchData.request.checkOutDate) - new Date(searchData.request.checkInDate)) / 24 / 60 / 60 / 1000)
            );

            this.addLabelAfterNights();

            if (typeof this.$$rawdata.system != 'undefined' && typeof this.$$rawdata.system.error != 'undefined') {
                this.$$error(this.$$rawdata.system.error.message);
            } else {
                // Ids
                this.id = this.$$rawdata.hotels.search.results.id;

                // Processing options
                this.options = this.$$rawdata.hotels.search.resultData;

                // this.processSearchInfo();
            }

            this.resultsLoaded(true);
            //this.cutDescription();
        };

        //HotelsSearchFormController.prototype.$$KOBindings = ['HotelsSearchForm'];
        // HotelsSearchResultsController.prototype.$$KOBindings = ['HotelsSearchForm', 'HotelsSearchResults'];

        return HotelsSearchResultsController;
    }
);

var HotelsFiltersViewModel = function(ko){
    var self = this;

    self.starRating0 = ko.observable(false);
    self.starRating1 = ko.observable(false);
    self.starRating2 = ko.observable(false);
    self.starRating3 = ko.observable(false);
    self.starRating4 = ko.observable(false);
    self.starRating5 = ko.observable(false);

    self.isStarFilterEmpty = ko.computed(function(){
       return !self.starRating0() &&
           !self.starRating1() &&
           !self.starRating2() &&
           !self.starRating3() &&
           !self.starRating4() &&
           !self.starRating5();
    });



    self.isFilterEmpty = ko.computed(function(){
       return self.isStarFilterEmpty();
    });

    self.isMatchStarFilter = function(hotelStars){
        if (self.isStarFilterEmpty()){
            return true;
        }

        return (self.starRating0() && hotelStars === 0) ||
            (self.starRating1() && hotelStars === 1) ||
            (self.starRating2() && hotelStars === 2) ||
            (self.starRating3() && hotelStars === 3) ||
            (self.starRating4() && hotelStars === 4) ||
            (self.starRating5() && hotelStars === 5);
    }

    self.isMatchFilter = function(hotel){
        var hotelStars = hotel.staticDataInfo.starRating ? hotel.staticDataInfo.starRating.length : 0;
        return self.isMatchStarFilter(hotelStars);
    }
}