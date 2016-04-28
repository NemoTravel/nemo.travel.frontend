'use strict';
define(
    ['knockout', 'js/vm/helpers', 'js/vm/BaseControllerModel', 'jsCookie'],
    function (ko, helpers, BaseControllerModel, Cookie) {
        function HotelsSearchResultsController (componentParameters) {
            BaseControllerModel.apply(this, arguments);

            this.name = 'HotelsSearchResultsController';
			this.error = ko.observable(false);
            this.$$loading = ko.observable(false);
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

            this.searchInfo = ko.observable({});

            this.mode = 'id';
            this.resultsLoaded = ko.observable(false);

            this.hotels = ko.observable([]);

            this.processInitParams();

		}

        // Extending from dictionaryModel
        helpers.extendModel(HotelsSearchResultsController, [BaseControllerModel]);

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
                //     "checkInDate": "2016-09-03T00:00:00",
                //     "checkOutDate": "2016-09-05T00:00:00",
                //     "isDelayed": false,
                //     "rooms": [
                //         {
                //             "ADT": 1
                //         }
                //     ]
                // });

                //ret.request = JSON.stringify({
                //    "cityId":1870586,
                //    "hotelId":50294523,
                //    "checkInDate":"2016-09-03T00:00:00",
                //    "checkOutDate":"2016-09-20T00:00:00",
                //    "isDelayed":false,
                //    "rooms":[{"ADT":1}]
                //});

                ret.request = JSON.stringify({
                    "cityId": 28193,
                    "hotelId": null,
                    "checkInDate": "2016-09-05T00:00:00",
                    "checkOutDate": "2016-09-07T00:00:00",
                    "isDelayed": false,
                    "rooms": [
                        {
                            "ADT": 1
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

        HotelsSearchResultsController.prototype.processSearchResults = function () {
            var searchData = this.$$rawdata.hotels.search ? this.$$rawdata.hotels.search : null,
                staticData = this.$$rawdata.hotels.staticDataInfo ? this.$$rawdata.hotels.staticDataInfo : null,
                hotelsArr = [],
                hotelId;

            //getting hotels and convert them to array

            //adding static data to hotel with identical id
            for (var index = 0; index < staticData.hotels.length; index++) {
                if (searchData.results.hotels[staticData.hotels[index].id]) {
                    searchData.results.hotels[staticData.hotels[index].id].staticDataInfo = staticData.hotels[index];
                }
            }

            //create array with hotels and static data with identical id
            for (hotelId in searchData.results.hotels) {
                hotelsArr.push(searchData.results.hotels[hotelId]);
            }

            this.hotels = ko.observable(hotelsArr);

            if (typeof this.$$rawdata.system != 'undefined' && typeof this.$$rawdata.system.error != 'undefined') {
                this.$$error(this.$$rawdata.system.error.message);
            } else {
                // Ids
                this.id = this.$$rawdata.hotels.search.results.id;

                // Processing options
                this.options = this.$$rawdata.hotels.search.resultData;

                // this.processSearchInfo(); //TODO wtf?
            }

            this.resultsLoaded(true);
        };


        //HotelsSearchFormController.prototype.$$KOBindings = ['HotelsSearchForm'];
        // HotelsSearchResultsController.prototype.$$KOBindings = ['HotelsSearchForm', 'HotelsSearchResults'];

        return HotelsSearchResultsController;
    }
);