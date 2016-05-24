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
            this.currentCity = ko.observable('');
            this.currentActiveTab = ko.observable('Rooms');
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
            //this.labelAfterNights = ko.observable(this.$$controller.i18n('HotelsSearchResults', 'PH__label_after_nights_more_than_five'));

            this.PFActive = ko.observable(false);

            this.isListView = ko.observable(true);
            this.isMapView = ko.observable(false);
            this.oldMarkers = ko.observable([]);
            // this.changeViewButtonLabel = ko.observable(this.$$controller.i18n('HotelsSearchResults', 'map__button-show'));
            this.changeViewButtonLabel = ko.observable('Показать на карте');
            this.onMapPanelImageSrc = ko.observable('/img/show_on_map.png');

            // this.map = function (block, position) {
            //     new google.maps.Map(block, position);
            // };
            this.initMap = function (hotel) {
                var marker;

                var mapId = hotel ? 'cardHotelMap' : 'map';

                console.log('hotel ' + (hotel == true))

                // Init map and show center
                this.map = new google.maps.Map(
                    document.getElementById(mapId),
                    {
                        center: {lat: 0, lng: 0},
                        zoom: 10
                    }
                );

                if (!hotel) {
                    // Add circle overlay and bind to center
                    this.circle = new google.maps.Circle({
                        map: this.map,
                        fillOpacity: 0,
                        strokeColor: '#0D426D',
                        radius: 3000,    // 3 metres
                        strokeWeight: 1
                    });
                }

                // Check center of map
                this.geocoder = new google.maps.Geocoder();

                this.checkGeocoderLocation = function geocodeAddress(geocoder, resultsMap, hotels, circle) {
                    var self = this;
                    this.geocoder.geocode({'address': this.currentCity()}, function(results, status) {
                        var centerLocation;
                        // If we know location it'll be center otherwise it'll be first hotel
                        if (status === google.maps.GeocoderStatus.OK) {
                            centerLocation = {lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng()};
                        } else {
                            console.dir('Geocode was not successful for the following reason: ' + status);
                            centerLocation = {lat: hotels[0].staticDataInfo.posLatitude , lng: hotels[0].staticDataInfo.posLongitude};
                        }

                        resultsMap.setCenter(centerLocation);

                        if (!hotel) {
                            self.circle.setCenter(centerLocation);
                            self.setDistances(centerLocation);

                            self.distanceFromCenter.rangeMin(3);
                            self.distanceFromCenter.displayRangeMin(3);
                        }
                    });
                };

                var hotels = hotel ? [hotel] : this.inCircleFilteredHotels();

                this.checkGeocoderLocation(this.geocoder, this.map, hotels, this.circle);

                // Add markers on map
                this.addMarkersOnMap(hotels, hotel ? true : false);
            };

            this.addMarkersOnMap = function(hotels, withoutMarkerEventListeners) {
                if (hotels) {
                    var showCardHotel = this.showCardHotel,
                        infowindow = new google.maps.InfoWindow(),
                        markers = [],
                        i,
                        iconBase = '/img/',
                        icons = {
                            nearByCenter: {
                                icon: iconBase + 'marker.svg'
                            }
                        };

                    if (this.oldMarkers()) {
                        var oldMarkersArr = this.oldMarkers();

                        for (var indexMarker in oldMarkersArr) {
                            oldMarkersArr[indexMarker].setMap(null);
                        }
                    }

                    for(i = 0; i < hotels.length; i++) {
                        if (hotels[i].staticDataInfo.posLatitude && hotels[i].staticDataInfo.posLongitude) {
                            // Add marker on map
                            markers[i] = new google.maps.Marker({
                                position: new google.maps.LatLng(hotels[i].staticDataInfo.posLatitude, hotels[i].staticDataInfo.posLongitude),
                                map: this.map,
                                icon: icons.nearByCenter.icon,
                                content: this.getHotelCardHtml(hotels[i])
                            });

                            if (!withoutMarkerEventListeners) {
                                // Add mouseover event on marker
                                google.maps.event.addListener(markers[i], 'mouseover', (function (marker, i) {
                                    return function () {
                                        infowindow.setContent(this.content);
                                        infowindow.open(this.map, marker);
                                        $('.mapItem').find('p.text').dotdotdot({ watch: 'window'});
                                    }
                                })(markers[i], i));

                                // Add click event on marker
                                google.maps.event.addListener(markers[i], 'click', (function (marker, i) {
                                    return function () {
                                        showCardHotel(hotels[i]);
                                    }
                                })(markers[i], i));
                            }
                        }
                    }

                    this.oldMarkers(markers);
                }
            };

            this.changeView = function () {
                if ( this.resultsLoaded() ) {
                    if ( this.isListView() ) {
                        // Show map with hotels
                        this.isMapView(true);
                        this.isListView(false);

                        // Change name of button and icon
                        this.changeViewButtonLabel(this.$$controller.i18n('HotelsSearchResults', 'list__button-show'));
                        this.onMapPanelImageSrc('/img/show_on_list.png');

                        this.initMap();
                    } else {
                        // Show list with hotels
                        this.isListView(true);
                        this.isMapView(false);

                        // Change name of button and icon
                        this.changeViewButtonLabel(this.$$controller.i18n('HotelsSearchResults', 'map__button-show'));
                        this.onMapPanelImageSrc('/img/show_on_map.png');
                    }
                }
            };

            this.searchInfo = ko.observable({});

            this.mode = 'id';
            this.resultsLoaded = ko.observable(false);

            this.searchFormActive = ko.observable(false);
            this.searchFormActive.subscribe(function(){ $('.nemo-hotels-form').css('margin-top', 0)});

            this.hotels = ko.observableArray([]);

            this.$$controller.hotelsSearchCardActivated = ko.observable(false);
            this.isCardHotelView = ko.observable(false);
            this.hotelCard = ko.observable([]);

            this.isFilterNotificationVisible = ko.observable(true);

            this.showCardHotel = (function (hotel, root) {
                /*var proto = Object.getPrototypeOf(root.controller);
                 proto.navigate.call(root.controller, '/hotels/results/' + hotel.id, false);*/

                this.$$controller.navigate('/hotels/results/' + hotel.id, false);
                this.isCardHotelView(true);

                this.$$controller.hotelsSearchCardActivated(true);
                this.$$controller.hotelsSearchController = this;

                hotel.staticDataInfo.currentCity = this.currentCity();
                this.hotelCard([hotel]);
                console.dir(this.hotelCard());
                this.initMap(hotel);
            }).bind(this);

            this.addCustomBindings(ko);

            this.processInitParams();

		}

        // Extending from dictionaryModel
        helpers.extendModel(HotelsSearchResultsController, [BaseControllerModel]);

        HotelsSearchResultsController.prototype.$$KOBindings = ['common', 'HotelsResults'];

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
                ret = {},
                roomsArr = [];

            if (this.mode != 'id') {
                cookie_params = Cookie.getJSON(this.$$controller.options.cookiesPrefix+this.resultsTypeCookie);

                params.cityId = cookie_params.segments[0][1];
                params.hotelId = null;

                params.checkInDate = ISODateString(new Date(cookie_params.segments[0][2]));
                params.checkOutDate = ISODateString(new Date(cookie_params.segments[0][3]));

                params.isDelayed = false;

                for (var i = 0; i < cookie_params.rooms.length; i++) {
                    if (!roomsArr[i]) {
                        roomsArr[i] = {};
                    }

                    roomsArr[i].ADT = cookie_params.rooms[i].adults;

                    if (cookie_params.rooms[i].infants.length) {
                        roomsArr[i].CLD = cookie_params.rooms[i].infants.length;
                        for (var indexInfants = 0; indexInfants < cookie_params.rooms[i].infants.length; indexInfants++) {
                            if (!roomsArr[i].childAges) {
                                roomsArr[i].childAges = []
                            }
                            roomsArr[i].childAges.push(cookie_params.rooms[i].infants[indexInfants]);
                        }
                    }
                }

                params.rooms = roomsArr;

                ret.request = JSON.stringify({
                    "cityId": 1934864,
                    "checkInDate": "2016-10-28T00:00:00",
                    "checkOutDate": "2016-10-30T00:00:00",
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

                // ret.request = JSON.stringify({
                //     "cityId": params.cityId,
                //     "checkInDate": params.checkInDate,
                //     "checkOutDate": params.checkOutDate,
                //     "isDelayed": false,
                //     "rooms": params.rooms
                // });
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
                        console.log(response)

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

        HotelsSearchResultsController.prototype.getLabelAfterNights = function () {
            switch(this.countOfNights()) {
                case 1:
                    return this.$$controller.i18n('HotelsSearchResults', 'PH__label_after_nights_one');
                case 2:
                case 3:
                case 4:
                    return this.$$controller.i18n('HotelsSearchResults', 'PH__label_after_nights_two_to_four');
                default:
                    return this.$$controller.i18n('HotelsSearchResults', 'PH__label_after_nights_more_than_five');
            }
        };

        HotelsSearchResultsController.prototype.getFirstRoomsPrice = function(hotel){

            var result = 0;

            var rlength = hotel.rooms.length;
            for (var i = 0; i < rlength; i++){
                result += hotel.rooms[i][0].rate.price.amount;
            }

            return result;
        }

        HotelsSearchResultsController.prototype.getDistances = function(hotel){
            var distances = hotel.staticDataInfo.distances;
            var result = ['', ''];

            var length = distances.length;
            for (var i = 0; i< length; i++){
                var item = distances[i];
                if (item.typeName === 'Центр' && item.distancesArray && item.distancesArray.length > 0){
                    var cd = item.distancesArray[0].value;
                    if (cd){
                        result[0] = cd.distance + ' ' + cd.measurement;
                    }
                }

                if (item.typeName === "Аэропорт" && item.distancesArray && item.distancesArray.length > 0){
                    var cd = item.distancesArray[0].value;
                    if (cd){
                        result[1] = cd.distance + ' ' + cd.measurement;
                    }
                }
            }

            return result;
        }

        HotelsSearchResultsController.prototype.processSearchResults = function () {
            var self = this;

            var searchData = this.$$rawdata.hotels.search ? this.$$rawdata.hotels.search : null,
                staticData = this.$$rawdata.hotels.staticDataInfo ? this.$$rawdata.hotels.staticDataInfo : null,
                hotelsArr = [],
                roomsArr = [],
                roomsDictionary = {},
                starRatingArr = [],
                distancesArr = [],
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

            for ( var indexHotelArr = 0; indexHotelArr < hotelsArr.length; indexHotelArr++ ) {
                distancesArr = [];
                for ( var indexDistance in hotelsArr[indexHotelArr].staticDataInfo.distances ) {
                    distancesArr.push(hotelsArr[indexHotelArr].staticDataInfo.distances[indexDistance]);
                }
                hotelsArr[indexHotelArr].staticDataInfo.distances = distancesArr;
            }

            console.dir(hotelsArr);

            this.minHotelPrice = 999999;
            this.maxHotelPrice = 0;

            var hLength = hotelsArr.length;
            for (var hIndex = 0; hIndex < hLength; hIndex++){
                var price = this.getFirstRoomsPrice(hotelsArr[hIndex]);
                hotelsArr[hIndex].hotelPrice = price;

                if (this.minHotelPrice > price){
                    this.minHotelPrice = price;
                }

                if (this.maxHotelPrice < price){
                    this.maxHotelPrice = price;
                }
            }

            this.currentCity(this.$$rawdata.hotels.staticDataInfo.cities[0].name);
            this.hotels = ko.observableArray(hotelsArr);

            this.countOfNights = ko.observable(
                Math.floor((new Date(searchData.request.checkOutDate) - new Date(searchData.request.checkInDate)) / 24 / 60 / 60 / 1000)
            );

            this.filters = new HotelsFiltersViewModel(ko, this.minHotelPrice, this.maxHotelPrice, this.countOfNights());

            this.visibleHotelsCount = ko.observable(5);

            this.filteredHotels = ko.computed(function() {
                var filters = self.filters;
                filters.dummyObservalbe();

                var sortHotels = function(item1, item2){
                    if (!item1.staticDataInfo.averageCustomerRating){
                        return 1;
                    }

                    if (!item2.staticDataInfo.averageCustomerRating){
                        return -11;
                    }

                    return item1.staticDataInfo.averageCustomerRating.value > item2.staticDataInfo.averageCustomerRating.value ? -11 : 1;
                }

                if (self.filters.sortType() === 2){
                    sortHotels = function(item1, item2){
                        return item1.hotelPrice > item2.hotelPrice ? 1 : -1;
                    }
                }

                var hotels = self.hotels().sort(sortHotels);

                if (self.filters.isFilterEmpty()){
                    return hotels;
                }

                return ko.utils.arrayFilter(hotels, function(hotel) {
                    return self.filters.isMatchFilter(hotel);
                });
            });

            this.slicedFilteredHotels = ko.computed(function(){
               return self.filteredHotels().slice(0, self.visibleHotelsCount());
            });

            this.distanceFromCenter = new SliderViewModel(ko, 'min', 1, 30);

            this.inCircleFilteredHotels = ko.computed(function(){
                self.filters.dummyObservalbe();
                return ko.utils.arrayFilter(self.filteredHotels(), function(hotel) {
                    return hotel.distanceFromCenter <= self.distanceFromCenter.rangeMin();
                });
            });

            this.inCircleFilteredHotels.subscribe(function(newVal){
                self.circle.setRadius(self.distanceFromCenter.rangeMin() * 1000);
                self.addMarkersOnMap(newVal);
            });

            this.countsOfHotels = ko.computed(function(){
                return self.filteredHotels().length;
            });

            this.remainderHotels = ko.computed(function(){
                var count = self.countsOfHotels() - self.visibleHotelsCount();

                if (count < 0){
                    return 0;
                }

                if (count > 25){
                    return 25;
                }

                return count;
            });

            this.hideShowMoreButton = ko.computed(function(){
                return self.remainderHotels() === 0;
            });

            this.showNext25hotels = function (controller) {
                var newVisibleCount = self.visibleHotelsCount() + self.remainderHotels();
                self.visibleHotelsCount(newVisibleCount);
            };

            this.labelAfterNights = ko.computed(function(){
                return self.getLabelAfterNights(self.countOfNights());
            });

            this.displayCountOfNightsPrice = ko.computed(function(){
                return self.$$controller.i18n('HotelsSearchResults', 'PF__filter__price_part') +
                        ' ' + self.countOfNights() + ' ' + self.labelAfterNights();
            });

            //this.addLabelAfterNights();

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
        };

        //HotelsSearchFormController.prototype.$$KOBindings = ['HotelsSearchForm'];
        // HotelsSearchResultsController.prototype.$$KOBindings = ['HotelsSearchForm', 'HotelsSearchResults'];

        HotelsSearchResultsController.prototype.addCustomBindings = function(ko){

            ko.bindingHandlers.afterHtmlRender = {
                update: function(element, valueAccessor, allBindings){
                    setTimeout(function(){
                        $(element).dotdotdot({
                            watch: 'window'
                        });
                    }, 1);
                }
            }

            ko.bindingHandlers.hotelsResultsSearchFormHider = {
                init: function (element, valueAccessor) {
                    function hide (e) {
                        var $this = $(e.target);

                        var isOnSearchFormClick = $this.hasClass('nemo-hotels-form__formContainer') ||
                            $this.parents('.nemo-hotels-form__formContainer').length > 0;

                        var isOnFormOpenerClick = $this.hasClass('js-hotels-results__formOpener') ||
                            $this.parents('.js-hotels-results__formOpener').length > 0;

                        if (valueAccessor()() && !isOnSearchFormClick &&!isOnFormOpenerClick) {
                            valueAccessor()(false);
                        }
                    }

                    $('body').on('click', hide);

                    ko.utils.domNodeDisposal.addDisposeCallback(element, function() {$('body').off('click', hide)});
                }
            };

            ko.bindingHandlers.slider = {
                init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

                    var vm = viewModel;
                    var $element = $(element);

                    $element.slider({
                        range: vm.type === 'range' || vm.type,
                        min: vm.min,
                        max: vm.max,
                        values: vm.type == 'range' ? [ vm.min, vm.max ] : vm.max,

                        slide: function( event, ui ) {
                            if (vm.type === 'range') {
                                vm.displayRangeMin(ui.values[0]);
                                vm.displayRangeMax(ui.values[1]);
                            }
                            else if (vm.type == 'min') {
                                vm.displayRangeMin(ui.value);
                            }
                        },

                        change: function( event, ui ) {
                            if (event.originalEvent) {
                                if (vm.type === 'range') {
                                    vm.rangeMin(ui.values[0]);
                                    vm.rangeMax(ui.values[1]);
                                }
                                else if (vm.type === 'min'){
                                    vm.rangeMin(ui.value);
                                }

                                if (bindingContext.$parent.dummyObservalbe) {
                                    bindingContext.$parent.dummyObservalbe.notifySubscribers();
                                }

                                if (bindingContext.$parent.filters) {
                                    bindingContext.$parent.filters.dummyObservalbe.notifySubscribers();
                                }
                            }
                        }
                    });

                    // Do not forget to add destroy callbacks
                    ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                        try {
                            $element.slider('destroy');
                        }
                        catch (e) {}
                    });
                },

                update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var vm = viewModel;

                    if (vm.rangeMin() < vm.rangeMax()) {
                        $(element).slider(
                            vm.type == 'range' ? 'values' : 'value',
                            vm.type == 'range' ? [vm.rangeMin(), vm.rangeMax()] : vm.rangeMin()
                        );
                    }
                }
            };
        };

        HotelsSearchResultsController.prototype.setDistances = function(centerLocation){

            // http://stackoverflow.com/questions/27928/calculate-distance-between-two-latitude-longitude-points-haversine-formula
            var getDistanceFromLatLonInKm = function(lat1,lon1,lat2,lon2) {
                var deg2rad = function (deg) {
                    return deg * (Math.PI/180)
                }
                var R = 6371; // Radius of the earth in km
                var dLat = deg2rad(lat2-lat1);  // deg2rad below
                var dLon = deg2rad(lon2-lon1);
                var a =
                        Math.sin(dLat/2) * Math.sin(dLat/2) +
                        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
                        Math.sin(dLon/2) * Math.sin(dLon/2)
                    ;
                var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                var d = R * c; // Distance in km
                return d;
            }

            var hotels = this.hotels();
            var length = hotels.length;
            var maxDistance = 0;
            for (var i = 0; i < length; i++){
                if (hotels[i].staticDataInfo.posLatitude && hotels[i].staticDataInfo.posLongitude) {
                    hotels[i].distanceFromCenter = getDistanceFromLatLonInKm(
                        centerLocation.lat,
                        centerLocation.lng,
                        hotels[i].staticDataInfo.posLatitude,
                        hotels[i].staticDataInfo.posLongitude);
                }
                else{
                    hotels[i].distanceFromCenter = 0;
                }

                if (hotels[i].distanceFromCenter > maxDistance){
                    maxDistance = hotels[i].distanceFromCenter;
                }
            }
        }

        HotelsSearchResultsController.prototype.getHotelCardHtml = function(hotel){
            var self = this;

            var getStarsHtml = function (hotel){
                var result = '';
                for (var i = 0; i < hotel.staticDataInfo.starRating.length; i++){
                    result += '<div class="item"></div>';
                }
                return result;
            }

            var getFeaturesHtml = function(hotel){
                var popularFeatures = hotel.staticDataInfo.popularFeatures;
                if (!popularFeatures)
                    return '';

                var getLiHtml = function(popularFeautures, feature, iconClass){
                    if (popularFeatures.indexOf('Pool') > -1) {
                        return '<li class="service"><span class="icon ' + iconClass + '"></span></li>';
                    }
                    else{
                        return '';
                    }
                }

                var result = '';
                var template = '<li class="service active"><span class="icon icon_template"></span></li>';


                if (popularFeatures.indexOf('Pool') > -1){
                    result += '<li class="service active"><span class="icon icon_pool"></span></li>';
                }

                return  getLiHtml(popularFeatures, 'Pool', 'icon_pool') +
                    getLiHtml(popularFeatures, 'Parking', 'icon_parking') +
                    getLiHtml(popularFeatures, 'Gym', 'icon_sport') +
                    getLiHtml(popularFeatures, 'ConferenceFacilities', 'icon_electricity') +
                    getLiHtml(popularFeatures, 'WiFi', 'icon_wifi') +
                    getLiHtml(popularFeatures, 'Laundry', 'icon_laundry') +
                    getLiHtml(popularFeatures, 'Transfer', 'icon_transport') +
                    getLiHtml(popularFeatures, 'ExpressCheckIn', 'icon_roundTheClock') +
                    getLiHtml(popularFeatures, 'ClimateControl', 'icon_fridge') +
                    getLiHtml(popularFeatures, 'BusinessCenter', 'icon_luggage') +
                    getLiHtml(popularFeatures, 'SPA', 'icon_spa') +
                    getLiHtml(popularFeatures, 'Bar', 'icon_bar') +
                    getLiHtml(popularFeatures, 'Restaurant', 'icon_resturant') +
                    getLiHtml(popularFeatures, 'Meal', 'icon_infinity');
            }

            var photoUrl = hotel.staticDataInfo.photos ?
                'url(' + hotel.staticDataInfo.photos[hotel.staticDataInfo.mainPhotoId] + ')' :
                'url(/img/no%20hotel.svg)';
            photoUrl += ', url(/img/no%20hotel.svg)'

            var acRating = 0;
            var acDescription = this.$$controller.i18n('HotelsSearchResults', 'PH__averageCustomerRating_description_default');
            if (hotel.staticDataInfo.averageCustomerRating){
                acRating = hotel.staticDataInfo.averageCustomerRating.value;
                if (hotel.staticDataInfo.averageCustomerRating.description){
                    acDescription = hotel.staticDataInfo.averageCustomerRating.description;
                }
            }

            var commentsStr = this.$$controller.i18n('HotelsSearchResults', 'PH__reviews_link_title') + ': ' + hotel.staticDataInfo.usersOpinionInfo.opinionsCount;
            var address = this.currentCity() + hotel.staticDataInfo.addresses[0];
            var distances = this.getDistances(hotel);
            var fromCenterStr = distances[0] ? (this.$$controller.i18n('HotelsSearchResults', 'from__center') + (distances[1] ? ',' : '')) : '';
            var fromAirportStr = distances[1] ? this.$$controller.i18n('HotelsSearchResults', 'from__airport') : '';

            //$('body').on('click', 'button[data-hotel-id="' + hotel.id + '"]', function(){
                //self.showCardHotel(hotel);
            //});

            var result =
                '<div class="mapItem">' +
                    '<div class="hotel">' +
                        '<div class="header">' +
                            '<div class="title">' +
                                '<a class="text" href="javascript:void(0);">' + hotel.name + '</a>' +
                                '<div class="stars">' +
                                    getStarsHtml(hotel) +
                                '</div>' +
                            '</div>' +
                            '<div class="additional">' + this.$$controller.i18n('HotelsSearchResults', 'header-flag__best_price') + '</div>' +
                        '</div>' +
                        '<div class="content">' +
                            '<div class="mainInfo">' +
                                '<div class="photoWrap" style="background-image: ' + photoUrl + '"></div>' +
                                '<div class="rating">' +
                                    '<span class="number">' + acRating + '</span>' +
                                    '<span class="text">' + acDescription + '</span>' +
                                    '<a href="javascript:void(0);" class="link">' + commentsStr + '</a>' +
                                '</div>' +
                                '<div class="infoBlock">' +
                                    '<div class="addressWrap">' +
                                        '<div>' + address + '</div>' +
                                        '<div class="distances">' +
                                            '<span>' +
                                                '<span>' + distances[0] + '</span>' +
                                                '<span class="target">' + fromCenterStr + '</span>' +
                                            '</span>' +
                                            '<span>' +
                                                '<span>' + distances[1] + '</span>' +
                                                '<span class="target">' + fromAirportStr + '</span>' +
                                            '</span>' +
                                            //'<a href="#" class="mapLink">Карта</a>' +
                                        '</div>' +
                                    '</div>' +
                                    '<div class="description">' +
                                        '<p class="text">' + hotel.staticDataInfo.description.replace(/<(?:.|\n)*?>/gm, '') + '</p>' +
                                        //'<a href="#" class="link"></a>' +
                                    '</div>' +
                                '</div>' +
                                '<ul class="services">' +
                                    getFeaturesHtml(hotel) +
                                '</ul>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>';

            return result;// + '<button class="open-hotel-card-btn" data-hotel-id="' + hotel.id + '">awerwerertert</button>';
        }

        return HotelsSearchResultsController;
    }
);

var HotelsFiltersViewModel = function(ko, minRoomPrice, maxRoomPrice, countOfNights){
    var self = this;

    self.countOfNights = countOfNights;
    self.minRoomPrice = minRoomPrice;
    self.maxRoomPrice = maxRoomPrice;

    self.dummyObservalbe = ko.observable();

    self.sortType = ko.observable(1);
    self.sortTypes = ko.observableArray([1,2]);

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

    self.resetStarFilter = function(){
        self.starRating0(false);
        self.starRating1(false);
        self.starRating2(false);
        self.starRating3(false);
        self.starRating4(false);
        self.starRating5(false);
    };

    self.fiveNightPrice = new SliderViewModel(ko, 'range',
        Math.floor(minRoomPrice * countOfNights),
        Math.ceil(maxRoomPrice * countOfNights));

    self.averageCustomerRating = new SliderViewModel(ko, 'min', 1, 10);

    self.isFilterEmpty = ko.computed(function(){
       return self.isStarFilterEmpty() && self.fiveNightPrice.isDefault() && self.averageCustomerRating.isDefault();
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

    self.isMatchFiveNightPriceFilter = function(hotelPrice){
        if (self.fiveNightPrice.isDefault()){
            return true;
        }

        return hotelPrice * self.countOfNights >= self.fiveNightPrice.rangeMin() &&
            hotelPrice * self.countOfNights <= self.fiveNightPrice.rangeMax();
    }

    self.isMatchAverageCustomerRatingFilter = function(averageCustomerRating){
        if (self.averageCustomerRating.isDefault()){
            return true;
        }

        return averageCustomerRating && self.averageCustomerRating.rangeMin() <= averageCustomerRating.value;
    }

    self.isMatchFilter = function(hotel){
        var hotelStars = hotel.staticDataInfo.starRating ? hotel.staticDataInfo.starRating.length : 0;

        return self.isMatchStarFilter(hotelStars) &&
            self.isMatchFiveNightPriceFilter(hotel.hotelPrice) &&
            self.isMatchAverageCustomerRatingFilter(hotel.staticDataInfo.averageCustomerRating);
    }

    self.resetFilters = function(){
        self.resetStarFilter();
        self.fiveNightPrice.reset();
        self.averageCustomerRating.reset();
    }
}

var SliderViewModel = function(ko, type, min, max){
    var self = this;

    self.type = type;
    self.min = min;
    self.max = max;
    self.rangeMin = ko.observable(min);
    self.rangeMax = ko.observable(max);
    self.displayRangeMin = ko.observable(min);
    self.displayRangeMax = ko.observable(max);

    self.isDefault = ko.computed(function(){
        if (self.type === 'range') {
            return self.rangeMin() == self.min && self.rangeMax() == max;
        }

        if (self.type === 'min'){
            return self.rangeMin() == self.min;
        }

        return false;
    });

    self.reset = function(){
        self.rangeMin(self.min);
        self.rangeMax(self.max);
        self.displayRangeMin(self.min);
        self.displayRangeMax(self.max);
    }
}