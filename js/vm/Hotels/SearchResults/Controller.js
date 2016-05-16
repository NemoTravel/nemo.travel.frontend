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
            this.changeViewButtonLabel = ko.observable(this.$$controller.i18n('HotelsSearchResults', 'map__button-show'));
            this.onMapPanelImageSrc = ko.observable('/img/show_on_map.png');

            // this.map = function (block, position) {
            //     new google.maps.Map(block, position);
            // };
            this.initMap = function () {
                var marker,
                    circle;

                // Init map and show center
                this.map = new google.maps.Map(
                    document.getElementById('map'),
                    {
                        center: {lat: 0, lng: 0},
                        zoom: 10
                    }
                );

                // Add circle overlay and bind to center
                circle = new google.maps.Circle({
                    map: this.map,
                    fillOpacity: 0,
                    strokeColor: '#0D426D',
                    radius: 3000,    // 3 metres
                    strokeWeight: 1
                });

                // Check center of map
                this.geocoder = new google.maps.Geocoder();

                this.checkGeocoderLocation = function geocodeAddress(geocoder, resultsMap, hotels, circle) {
                    this.geocoder.geocode({'address': this.currentCity()}, function(results, status) {
                        // If we know location it'll be center otherwise it'll be first hotel
                        if (status === google.maps.GeocoderStatus.OK) {
                            resultsMap.setCenter(results[0].geometry.location);
                            circle.setCenter(results[0].geometry.location);
                        } else {
                            console.dir('Geocode was not successful for the following reason: ' + status);
                            resultsMap.setCenter({lat: hotels[0].staticDataInfo.posLatitude , lng: hotels[0].staticDataInfo.posLongitude});
                            circle.setCenter({lat: hotels[0].staticDataInfo.posLatitude , lng: hotels[0].staticDataInfo.posLongitude});
                        }
                    });
                };

                this.checkGeocoderLocation(this.geocoder, this.map, this.filteredHotels(), circle);

                // Add markers on map
                this.addMarkersOnMap(this.filteredHotels());
            };

            this.addMarkersOnMap = function(hotels) {
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
                        },
                        hotelCardHtml;

                    hotelCardHtml = function() {
                        var html  = "<div>";
                        html += "<div data-bind='text: name'></div>";
                        html += "</div>";

                        html = $.parseHTML(html)[0];
                        return html;
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
                                content: hotelCardHtml()
                            });

                            // Add mouseover event on marker
                            google.maps.event.addListener(markers[i], 'mouseover', (function(marker, i) {
                                return function() {
                                    var hotelCardModel = function() {
                                        return hotels[i];
                                    };

                                    ko.cleanNode(this.content);
                                    ko.applyBindings(hotelCardModel, this.content);

                                    infowindow.setContent(this.content);
                                    infowindow.open(this.map, marker);
                                }
                            })(markers[i], i));

                            // Add click event on marker
                            google.maps.event.addListener(markers[i], 'click', (function(marker, i) {
                                return function() {
                                    showCardHotel(hotels[i]);
                                }
                            })(markers[i], i));
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
                this.hotelCard(hotel);
                console.dir(this.hotelCard());
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
                    "checkInDate": "2016-09-23T00:00:00",
                    "checkOutDate": "2016-09-25T00:00:00",
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

        HotelsSearchResultsController.prototype.getMinRoomPrice = function(hotel){
            var min = 999999;
            var rooms = hotel.rooms[0];
            var roomsLength = rooms.length;
            for (var i = 0; i < roomsLength; i++){
                if (min > rooms[i].rate.price.amount){
                    min = rooms[i].rate.price.amount;
                }
            }

            return min;
        }

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

            this.minHotelPrice = 999999;
            this.maxHotelPrice = 0;

            var hLength = hotelsArr.length;
            for (var hIndex = 0; hIndex < hLength; hIndex++){
                var price = this.getMinRoomPrice(hotelsArr[hIndex]);
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

            this.filteredHotels.subscribe((function(newVal){
                //TODO work with map
                this.addMarkersOnMap(newVal);
            }).bind(this));

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
                            else if (viewModel.type == 'min') {
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

                                bindingContext.$parent.dummyObservalbe.notifySubscribers();
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