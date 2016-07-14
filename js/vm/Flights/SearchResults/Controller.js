'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseControllerModel', 'jsCookie'],
	function (ko, helpers, BaseControllerModel, Cookie) {
		function FlightsSearchResultsController(componentParameters) {
			BaseControllerModel.apply(this, arguments);

			var self = this,
				/**
				 * Checks minimal value
				 * @param current value
				 * @param candidate object from whick a new or old value should be returned
				 * @returns {*}
				 */
				stringPFMinPrice = function (current, candidate) {
					if (!current || candidate.getTotalPrice().amount() < current.amount()) {
						return candidate.getTotalPrice();
					}

					return current;
				};

			this.name = 'FlightsSearchResultsController';

			this.postfiltersData = {
				configs: {
					transfersCount: {
						name: 'transfersCount',
						type: 'String',
						isLegged: false,
						legNumber: 0,
						getter: function (obj) {
							var tmp = Math.min.apply(Math, obj.legs.map(function (item, i) {
								return item.transfersCount;
							}));

							return [[tmp, tmp]];
						},
						options: {
							// Filter-specific options here
							valuesSorter: function (a, b) {
								return a.value - b.value;
							},
							additionalValueChooser: stringPFMinPrice
						}
					},
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

								this.displayValues.min = this.$$controller.getModel('Common/Money', {
									amount: 0,
									currency: currency
								});
								this.displayValues.max = this.$$controller.getModel('Common/Money', {
									amount: 0,
									currency: currency
								});
							},
							onValuesUpdate: function (newValue) {
								this.displayValues.min.amount(newValue.min);
								this.displayValues.max.amount(newValue.max);
							}
						}
					},
					carrier: {
						name: 'carrier',
						type: 'String',
						isLegged: false,
						legNumber: 0,
						getter: function (item) {
							var ret = [];

							ret.push([
								item.getValidatingCompany().IATA,
								item.getValidatingCompany()
							]);

							return ret;
						},
						options: {
							// Filter-specific options here
							valuesSorter: function (a, b) {
								return a.value.name.localeCompare(b.value.name);
							},
							additionalValueChooser: stringPFMinPrice,
							type: 'multiChoice'
						}
					},
					transfersDuration: {
						name: 'transfersDuration',
						type: 'Number',
						isLegged: false,
						legNumber: 0,
						getter: function (obj) {
							if (obj.totalTimeTransfers > 0) {
								return obj.totalTimeTransfers;
							}
						},
						options: {
							/* Filter-specific options here */
							onInit: function (initParams) {
								this.displayValues.min = this.$$controller.getModel('Common/Duration', {length: 0});
								this.displayValues.max = this.$$controller.getModel('Common/Duration', {length: 0});
							},
							onValuesUpdate: function (newValue) {
								this.displayValues.min.length(newValue.min);
								this.displayValues.max.length(newValue.max);
							}
						}
					},
//					departureTime: {
//						name: 'departureTime',
//						type: 'Number',
//						isLegged: true,
//						legNumber: 0,
//						getter: function (obj) {
//							return obj.legs[this.legNumber].depDateTime.getTimestamp();
//						},
//						options: {/* Filter-specific options here */}
//					},
//					arrivalTime: {
//						name: 'arrivalTime',
//						type: 'Number',
//						isLegged: true,
//						legNumber: 0,
//						getter: function (obj) {
//							return obj.legs[this.legNumber].arrDateTime.getTimestamp();
//						},
//						options: {/* Filter-specific options here */}
//					},
					departureTime: {
						name: 'departureTime',
						type: 'String',
						isLegged: true,
						legNumber: 0,
						getter: function (obj) {
							var d = obj.legs[this.legNumber].depDateTime.dateObject(),
								timeType = self.getTimeType(d);

							return [[timeType, timeType]];
						},
						options: {
							// Filter-specific options here
							valuesSorter: function (a, b) {
								var sort = {
									n: 0,
									m: 1,
									d: 2,
									e: 3
								};

								return sort[a.key] - sort[b.key];
							},
							additionalValueChooser: stringPFMinPrice
						}
					},
					arrivalTime: {
						name: 'arrivalTime',
						type: 'String',
						isLegged: true,
						legNumber: 0,
						getter: function (obj) {
							var d = obj.legs[this.legNumber].arrDateTime.dateObject(),
								timeType = self.getTimeType(d);

							return [[timeType, timeType]];
						},
						options: {
							// Filter-specific options here
							valuesSorter: function (a, b) {
								var sort = {
									n: 0,
									m: 1,
									d: 2,
									e: 3
								};

								return sort[a.key] - sort[b.key];
							},
							additionalValueChooser: stringPFMinPrice
						}
					},
					departureAirport: {
						name: 'departureAirport',
						type: 'String',
						isLegged: true,
						legNumber: 0,
						getter: function (obj) {
							return [[obj.legs[this.legNumber].depAirp.IATA, obj.legs[this.legNumber].depAirp]];
						},
						options: {
							// Filter-specific options here
							valuesSorter: function (a, b) {
								return a.value.name.localeCompare(b.value.name);
							},
							additionalValueChooser: stringPFMinPrice
						}
					},
					arrivalAirport: {
						name: 'arrivalAirport',
						type: 'String',
						isLegged: true,
						legNumber: 0,
						getter: function (obj) {
							return [[obj.legs[this.legNumber].arrAirp.IATA, obj.legs[this.legNumber].arrAirp]];
						},
						options: {
							// Filter-specific options here
							valuesSorter: function (a, b) {
								return a.value.name.localeCompare(b.value.name);
							},
							additionalValueChooser: stringPFMinPrice
						}
					},
					timeEnRoute: {
						name: 'timeEnRoute',
						type: 'Number',
						isLegged: false,
						legNumber: 0,
						getter: function (obj) {
							return obj.totalTimeEnRoute.length();
						},
						options: {
							/* Filter-specific options here */
							onInit: function (initParams) {
								this.displayValues.min = this.$$controller.getModel('Common/Duration', {length: 0});
								this.displayValues.max = this.$$controller.getModel('Common/Duration', {length: 0});
							},
							onValuesUpdate: function (newValue) {
								this.displayValues.min.length(newValue.min);
								this.displayValues.max.length(newValue.max);
							}
						}
					}
				},
				order: ['price', 'transfersCount', 'carrier', 'transfersDuration', 'departureTime', 'arrivalTime', 'departureAirport', 'arrivalAirport', 'timeEnRoute'],
				grouppable: ['departureTime', 'arrivalTime'],
				preInitValues: {
					carrier: null,
					price: null,
					timeEnRoute: null,
					transfersDuration: null
				}
			};

			this.PFHintCookie = 'flightsResults__PFHintRemoved';
			this.resultsTypeCookie = 'flightsResults__resultsType';

			this.id = 0;//this.$$componentParameters.route[0];

			this.options = {};

			this.segments = {};
			this.prices = {};
			this.flights = {};
			this.aircrafts = {};
			this.airlines = {};
			this.airlinesByRating = [];
			this.validatingAirlines = {};
			this.validatingAirlinesByRating = [];

			this.groups = ko.observableArray([]);
			this.visibleGroups = ko.observableArray([]);

			this.shownGroups = ko.observable(this.baseShownGroups);
			this.totalVisibleGroups = ko.observable(0);

			this.visibleResultsCount = ko.observable(0);
			this.totalResultsCount = 0;

			this.flightsCompareTableDirect = ko.observable();
			this.flightsCompareTableTransfer = ko.observable();

			this.compareTablesOpen = ko.observable(false);
			this.compareTablesOpenGroups = ko.observable(2);
			this.compareTableLongestColumn = ko.observable(0);
			this.compareTablesRenderFlag = ko.observable(false);

			this.PFActive = ko.observable(false);
			this.PFWorking = ko.observable(false);
			this.PFHintActive = ko.observable(!Cookie.getJSON(this.$$controller.options.cookiesPrefix + this.PFHintCookie));

			this.formActive = ko.observable(false);

			this.requestActive = ko.observable(false);
			this.requestError = ko.observable(false);
			this.request = false;

			this.showcase = {
				main: ko.observable([]),
				mainFlightsCount: ko.observable(0),
				bestCompanies: ko.observable()
			};

			/**
			 * Information about current search
			 *
			 * @type {{}}
			 {
				segments: [], - segments array
				tripType: '', - trip type: "OW"/"RT"/"CR"
				serviceClass: '', - string of service class
				passengers: {}, - passengers: "ADT": 3, "CLD": 0 etc
				direct: boolean
				vicinityDates: 0 - matix (OW/RT only) - count of days to search for before/after the date set by user
			};
			 */
			this.searchInfo = ko.observable({});

			this.postFilters = ko.observableArray([]);
			this.postFiltersObject = ko.observable({});
			this.visiblePostFilters = ko.observableArray([]);
			this.usePostfilters = false;

			this.possibleSorts = ['rating', 'price', 'durationOnLeg'];
			this.sort = ko.observable(null);

			this.displayTypes = ['tile', 'list'];
			this.displayType = ko.observable(
				this.displayTypes.indexOf(Cookie.getJSON(this.$$controller.options.cookiesPrefix + this.resultsTypeCookie)) >= 0 ?
					Cookie.getJSON(this.$$controller.options.cookiesPrefix + this.resultsTypeCookie) :
					this.displayTypes[0]
			);

			this.expirationPopupWarning = null;
			this.expirationPopupExpired = null;
			this.expirationPopupTimer = null;

			this.matrixData = ko.observable(null);
			this.matrixMinPrice = ko.observable(null);
			this.matrixDataIndexSelected = ko.observable(null);

			this.error = ko.observable(false);
			this.warning = ko.observable(false);

			this.resultsLoaded = ko.observable(false);

			this.bookingCheckInProgress = ko.observable(false);
			this.bookingCheckError = ko.observable(null);
			this.bookingCheckPriceChangeData = ko.observable(null);

			this.searchParameters = {
				segments: [],
				passengers: [],
				parameters: {
					direct: false,
					aroundDates: 0,
					serviceClass: 'All',
					flightNumbers: null,
					airlines: [],
					delayed: true
				}
			};

			this.mode = 'id'; // 'search'

			this.formReloader = ko.observable(1);

			this.processInitParams();

			this.displayType.subscribe(function (newValue) {
				Cookie.set(this.$$controller.options.cookiesPrefix + this.resultsTypeCookie, newValue, {expires: 365});
			}, this);

			this.sort.subscribe(function (type) {
				this.doSort(type);
			}, this);

			this.postFiltersHaveValue = ko.computed(function () {
				var postfilters = this.postFilters();

				for (var i = 0; i < postfilters.length; i++) {
					if (postfilters[i].hasValue()) {
						return true;
					}
				}

				return false;
			}, this);

			this.compareTablesDisplayable = ko.computed(function () {
				return (
						this.flightsCompareTableDirect() &&
						this.flightsCompareTableDirect().isDisplayable()
					) ||
					(
						this.flightsCompareTableTransfer() &&
						this.flightsCompareTableTransfer().isDisplayable()
					);
			}, this);
		}

		// Extending from dictionaryModel
		helpers.extendModel(FlightsSearchResultsController, [BaseControllerModel]);

		FlightsSearchResultsController.prototype.paramsParsers = {
			rtseg: /^([ac][A-ZА-Я]{3})([ac][A-ZА-Я]{3})(\d{8})(\d{8})$/g,
			segs: /([ac][A-ZА-Я]{3})([ac][A-ZА-Я]{3})(\d{8})/g,
			passengers: /([A-Z]{3})(\d+)/g
		};

		FlightsSearchResultsController.prototype.baseShownGroups = 12;

		FlightsSearchResultsController.prototype.doSort = function (type) {
			switch (type) {
				case 'price':
					this.groups.sort(function (a, b) {
						return a.getTotalPrice().normalizedAmount() - b.getTotalPrice().normalizedAmount();
					});
					break;
				case 'durationOnLeg':
					this.groups.sort(function (a, b) {
						return a.durationOnLeg() - b.durationOnLeg();
					});
					break;
				case 'rating':
					this.groups.sort(function (a, b) {
						var ret = b.recommendRating() - a.recommendRating();

						if (ret == 0) {
							ret = a.getTotalPrice().normalizedAmount() - b.getTotalPrice().normalizedAmount();
						}

						return ret;
					});
					break;
			}

			this.buildVisibleGroups();
		};

		FlightsSearchResultsController.prototype.processInitParams = function () {
			// We have the ID
			if (this.$$componentParameters.route.length < 3) {
				this.id = this.$$componentParameters.route[0];
			}
			// Initialized by URL - we must start searching
			else if (this.$$componentParameters.route.length == 3) {
				this.mode = 'search';

				// Parsing segments
				// Resetting regexps
				this.paramsParsers.rtseg.lastIndex = 0;
				var tmp = this.paramsParsers.rtseg.exec(this.$$componentParameters.route[0]),
					tmpsegs = [];

				// RT - 2 cIATAs and 2 dates
				if (tmp) {
					tmpsegs.push(
						[tmp[1], tmp[2], tmp[3]]
					);

					tmpsegs.push(
						[tmp[2], tmp[1], tmp[4]]
					);
				}
				// Everything else
				else {
					while (tmp = this.paramsParsers.segs.exec(this.$$componentParameters.route[0])) {
						tmpsegs.push(
							[tmp[1], tmp[2], tmp[3]]
						);
					}
				}

				for (var i = 0; i < tmpsegs.length; i++) {
					this.searchParameters.segments.push({
						departure: {
							IATA: tmpsegs[i][0].substr(1),
							isCity: tmpsegs[i][0][0] == 'c'
						},
						arrival: {
							IATA: tmpsegs[i][1].substr(1),
							isCity: tmpsegs[i][1][0] == 'c'
						},
						departureDate: tmpsegs[i][2].substr(0, 4) + '-' + tmpsegs[i][2].substr(4, 2) + '-' + tmpsegs[i][2].substr(6) + 'T00:00:00'
					});
				}

				// Parsing passengers
				while (tmp = this.paramsParsers.passengers.exec(this.$$componentParameters.route[1])) {
					this.searchParameters.passengers.push({
						type: tmp[1],
						count: parseInt(tmp[2])
					});
				}

				tmp = this.$$componentParameters.route[2].split('-');

				for (var i = 0; i < tmp.length; i++) {
					// Direct flights flag
					if (tmp[i] == 'direct') {
						this.searchParameters.parameters.direct = true;
					}

					// Vicinity dates flag
					if (tmp[i].substr(0, 14) == 'vicinityDates=') {
						this.searchParameters.parameters.aroundDates = parseInt(tmp[i].substr(14));
					}

					// Class
					if (tmp[i].substr(0, 6) == 'class=') {
						this.searchParameters.parameters.serviceClass = tmp[i].substr(6);
					}
					
					// flight numbers
					if (tmp[i].substr(0, 14) == 'flightNumbers=') {
						this.searchParameters.parameters.flightNumbers = tmp[i].substr(14).split('+');
					}
				}
			}

			// Additional Preferences
			if (this.$$componentParameters.route.length > 1) {
				if (this.$$componentParameters.route.length == 2) {
					tmp = this.$$componentParameters.route[1];
				}
				else {
					tmp = this.$$componentParameters.route[2];
				}

				tmp = (tmp || '').split('-');

				for (var i = 0; i < tmp.length; i++) {
					tmp[i] = tmp[i].split('=');

					if (tmp[i].length > 1 && tmp[i][1]) {
						switch (tmp[i][0]) {
							case 'PMaxPrice':
								this.postfiltersData.preInitValues.price = parseInt(tmp[i][1]) || null;
								break;
							case 'PMaxTimeEnRoute':
								this.postfiltersData.preInitValues.timeEnRoute = parseInt(tmp[i][1]) * 3600 || null;
								break;
							case 'PMaxTransfersLength':
								this.postfiltersData.preInitValues.transfersDuration = parseInt(tmp[i][1]) * 3600 || null;
								break;
							case 'PCarriers':
								this.postfiltersData.preInitValues.carrier = (tmp[i][1] || '').match(/.{2}/g) || null;
								break;
						}
					}
				}
			}
		};

		// Own prototype stuff
		FlightsSearchResultsController.prototype.PFTimeTypes = [
			{
				type: 'n',
				seconds: 18000
			},
			{
				type: 'm',
				seconds: 43200
			},
			{
				type: 'd',
				seconds: 64800
			},
			{
				type: 'e',
				seconds: 79200
			},
			{
				type: 'n',
				seconds: 86400
			}
		];

		FlightsSearchResultsController.prototype.bookFlight = function (flids) {
			var self = this;

			this.bookingCheckError(null);
			this.bookingCheckPriceChangeData(null);

			if (
				!this.bookingCheckInProgress() &&
				flids instanceof Array &&
				flids.length > 0
			) {
				this.bookingCheckInProgress(true);

				// Checking flight
				this.$$controller.loadData(
					'/flights/search/flightInfo/' + flids[0],
					{},
					function (data, request) {
						self.bookingCheckInProgress(false);

						try {
							data = JSON.parse(data);
						}
						catch (e) {
							self.resultsLoaded(true);
							self.bookingCheckError(self.$$controller.i18n('FlightsSearchResults', 'bookingCheck__error__error_wrongResponse'));
							return;
						}

						if (data.system.error && data.system.error.message) {
							self.resultsLoaded(true);
							self.bookingCheckError(
								self.$$controller.i18n('FlightsSearchResults', 'bookingCheck__error__error_serverError') + ' ' +
								data.system.error.message
							);
						}
						else if (self.options.needCheckAvail && !data.flights.search.flightInfo.isAvail) {
							self.resultsLoaded(true);
							self.bookingCheckError(self.$$controller.i18n('FlightsSearchResults', 'bookingCheck__error__error_unavailable'));
						}
						else {
							var url;

							// FIXME
							if (self.$$controller.options.dataURL.indexOf('http://') === 0 || self.$$controller.options.dataURL.indexOf('https://') === 0) {
								url = self.$$controller.options.dataURL.split('/').slice(0, 3).join('/') + data.flights.search.flightInfo.createOrderLink;
							}
							else {
								url = data.flights.search.flightInfo.createOrderLink;
							}

							if (data.flights.search.flightInfo.priceStatus.changed && !data.flights.search.flightInfo.hasAltFlights) {
								self.resultsLoaded(true);
								self.bookingCheckPriceChangeData({
									url: url,
									oldPrice: self.$$controller.getModel('Common/Money', data.flights.search.flightInfo.priceStatus.oldValue),
									newPrice: self.$$controller.getModel('Common/Money', data.flights.search.flightInfo.priceStatus.newValue)
								});
							}
							else {
								document.location = url;
							}
						}
					},
					function (request) {
						self.bookingCheckInProgress(false);
						self.bookingCheckError(self.$$controller.i18n('FlightsSearchResults', 'bookingCheck__error__error_wrongResponse'));
					}
				);
			}
		};

		FlightsSearchResultsController.prototype.getTimeType = function (d) {
			var dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0),
				timeFromDayStart = 0,
				timeType = 'n';

			// Defining time type
			timeFromDayStart = Math.floor((d.getTime() - dayStart.getTime()) / 1000);

			for (var i = 0; i < this.PFTimeTypes.length; i++) {
				if (timeFromDayStart < this.PFTimeTypes[i].seconds) {
					timeType = this.PFTimeTypes[i].type;
					break;
				}
			}

			return timeType;
		};

		FlightsSearchResultsController.prototype.processSearchInfo = function () {
			var searchInfo = {
				segments: [],
				tripType: '',
				serviceClass: '',
				flightNumbers: '',
				passengers: {},
				direct: false,
				vicinityDates: 0
			};

			// Segments
			for (var i = 0; i < this.$$rawdata.flights.search.request.segments.length; i++) {
				var data = this.$$rawdata.flights.search.request.segments[i];

				// departureDate = 2015-04-11T00:00:00
				searchInfo.segments.push({
					departure: this.$$controller.getModel('Flights/Common/Geo', {
						data: data.departure,
						guide: this.$$rawdata.guide
					}),
					arrival: this.$$controller.getModel('Flights/Common/Geo', {
						data: data.arrival,
						guide: this.$$rawdata.guide
					}),
					departureDate: this.$$controller.getModel('Common/Date', data.departureDate)
				});
			}

			// Processing passengers
			for (var i = 0; i < this.$$rawdata.flights.search.request.passengers.length; i++) {
				searchInfo.passengers[this.$$rawdata.flights.search.request.passengers[i].type] = this.$$rawdata.flights.search.request.passengers[i].count;
			}

			// Processing other options
			searchInfo.tripType = this.$$rawdata.flights.search.request.parameters.searchType;
			searchInfo.serviceClass = this.$$rawdata.flights.search.request.parameters.serviceClass;
			searchInfo.vicinityDates = this.$$rawdata.flights.search.request.parameters.aroundDates;
			searchInfo.direct = this.$$rawdata.flights.search.request.parameters.direct;
			searchInfo.flightNumbers = this.$$rawdata.flights.search.request.parameters.flightNumbers;

			this.searchInfo(searchInfo);
		};

		FlightsSearchResultsController.prototype.clearResults = function () {
			this.segments = {};
			this.prices = {};
			this.flights = {};
			this.aircrafts = {};
			this.airlines = {};
			this.airlinesByRating = [];
			this.validatingAirlines = {};
			this.validatingAirlinesByRating = [];
			this.matrixData(null);
			this.matrixMinPrice(null);
			this.matrixDataIndexSelected(null);
			this.groups([]);
			this.visibleGroups([]);
			this.shownGroups(this.baseShownGroups);
			this.totalVisibleGroups(0);
			this.visibleResultsCount(0);
			this.totalResultsCount = 0;
		};

		FlightsSearchResultsController.prototype.processSearchResults = function () {
			var setSegmentsGuide = true,
				self = this,
				tmpGroups = {},
				displayResults = true,
				sort = this.sort(),
				newsort,
				tmp;

			this.clearResults();

			if (
				typeof this.$$rawdata.system != 'undefined' &&
				typeof this.$$rawdata.system.error != 'undefined'
			) {
				this.$$error(this.$$rawdata.system.error.message);
			}
			else {
				// Ids
				this.id = this.$$rawdata.flights.search.results.id;

				// Processing options
				this.options = this.$$rawdata.flights.search.resultData;

				this.processSearchInfo();

				// Processing guide
				// Proessing aircrafts
				for (var i in this.$$rawdata.guide.aircrafts) {
					if (this.$$rawdata.guide.aircrafts.hasOwnProperty(i)) {
						this.aircrafts[i] = this.$$controller.getModel('BaseStaticModel', this.$$rawdata.guide.aircrafts[i]);
					}
				}

				// Processing airlines
				for (var i in this.$$rawdata.guide.airlines) {
					if (this.$$rawdata.guide.airlines.hasOwnProperty(i)) {
						this.airlines[i] = this.$$controller.getModel('Flights/Common/Airline', this.$$rawdata.guide.airlines[i]);
					}
				}

				this.airlinesByRating = Object.keys(this.airlines)
					.map(function (key) {
						return self.airlines[key]
					})
					.sort(function (a, b) {
						return parseFloat(b.rating) - parseFloat(a.rating);
					});

				// 204 error processing (204 means there's no flights we were looking for but we have alternatives)
				if (
					this.$$rawdata.flights.search.results.info &&
					this.$$rawdata.flights.search.results.info.errorCode == 204
				) {
					this.warning(this.$$rawdata.flights.search.results.info.errorCode);
				}

				// Checking results
				if (
					this.$$rawdata.flights.search.results.info &&
					this.$$rawdata.flights.search.results.info.errorCode &&
					this.$$rawdata.flights.search.results.info.errorCode != 204
				) {
					this.error(this.$$rawdata.flights.search.results.info.errorCode);
				}
				else {
					// If there's no warnings and no errors and we have only one flight
					// and we were searcing for specific flights - book it immediately
					// TODO make a setting for that
					if (
						!this.warning() &&
						this.$$rawdata.flights.search.results.flightGroups.length == 1 &&
						this.$$rawdata.flights.search.results.flightGroups[0].flights.length == 1 &&
						this.searchInfo().flightNumbers.length > 0
					) {
						this.bookFlight([this.$$rawdata.flights.search.results.flightGroups[0].flights[0].id]);
						displayResults = false;
					}

					if (this.$$rawdata.flights.search.resultMatrix && this.$$rawdata.flights.search.resultMatrix.rangeData) {
						var days = this.$$rawdata.flights.search.request.parameters.aroundDates,
							matrixHash = {},
							matrixData = [],
							matrixMinPrice = null;

						// Preparing matrix data
						for (var i = 0; i < this.$$rawdata.flights.search.resultMatrix.rangeData.length; i++) {
							var key = this.$$rawdata.flights.search.resultMatrix.rangeData[i].flightDate + (this.searchInfo().tripType == 'RT' ? '-' + this.$$rawdata.flights.search.resultMatrix.rangeData[i].flightDateBack : '');

							matrixHash[key] = this.$$rawdata.flights.search.resultMatrix.rangeData[i];
						}


						for (var i = -days; i <= days; i++) {
							var tmp = [],
								date = new Date(this.searchInfo().segments[0].departureDate.dateObject()),
								returndate = null,
								tmp2, key;

							date.setDate(date.getDate() + i);

							if (this.searchInfo().tripType == 'RT') {
								for (var j = -days; j <= days; j++) {
									returndate = new Date(this.searchInfo().segments[1].departureDate.dateObject());
									returndate.setDate(returndate.getDate() + j);

									tmp2 = {
										date: this.$$controller.getModel('Common/Date', date),
										returndate: this.$$controller.getModel('Common/Date', returndate),
										price: null,
										company: null,
										uri: null
									};

									key = tmp2.date.getISODate() + '-' + tmp2.returndate.getISODate();

									if (typeof matrixHash[key] != 'undefined') {
										tmp2.price = this.$$controller.getModel('Common/Money', matrixHash[key].minPriceFlight.minPrice);
										tmp2.company = this.airlines[matrixHash[key].minPriceFlight.carrier];
										tmp2.uri = matrixHash[key].uri;
									}

									tmp.push(tmp2);
								}
							}
							else {
								tmp = {
									date: this.$$controller.getModel('Common/Date', date),
									returndate: null,
									price: null,
									company: null,
									uri: null
								};

								key = tmp.date.getISODate();

								if (typeof matrixHash[key] != 'undefined') {
									tmp.price = this.$$controller.getModel('Common/Money', matrixHash[key].minPriceFlight.minPrice);
									tmp.company = this.airlines[matrixHash[key].minPriceFlight.carrier];
									tmp.uri = matrixHash[key].uri;
								}
							}

							matrixData.push(tmp);
						}

						if (this.searchInfo().tripType != 'RT') {
							matrixData = [matrixData];
						}

						for (var i = 0; i < matrixData.length; i++) {
							var tmp = {
								days: [],
								hasResults: false,
								minPrice: null
							};

							for (var j = 0; j < matrixData[i].length; j++) {
								if (matrixData[i][j].price && (!tmp.minPrice || tmp.minPrice.normalizedAmount() > matrixData[i][j].price.normalizedAmount())) {
									tmp.minPrice = matrixData[i][j].price;

									tmp.hasResults = true;

									if (this.matrixDataIndexSelected() === null) {
										this.matrixDataIndexSelected(i);
									}

									if (!matrixMinPrice || matrixMinPrice.normalizedAmount() > tmp.minPrice.normalizedAmount()) {
										matrixMinPrice = tmp.minPrice;
									}
								}

								tmp.days.push(matrixData[i][j]);
							}

							matrixData[i] = tmp;
						}

						this.matrixData(matrixData);
						this.matrixMinPrice(matrixMinPrice);
					}
					else {
						// Processing segments
						for (var i in this.$$rawdata.flights.search.results.groupsData.segments) {
							if (this.$$rawdata.flights.search.results.groupsData.segments.hasOwnProperty(i)) {
								this.$$rawdata.flights.search.results.groupsData.segments[i].depTerminal = (this.$$rawdata.flights.search.results.groupsData.segments[i].depTerminal || '').replace(/\s/, '');
								this.$$rawdata.flights.search.results.groupsData.segments[i].arrTerminal = (this.$$rawdata.flights.search.results.groupsData.segments[i].arrTerminal || '').replace(/\s/, '');

								this.segments[i] = this.$$controller.getModel('BaseStaticModel', this.$$rawdata.flights.search.results.groupsData.segments[i]);

								// Times
								this.segments[i].depDateTime = this.$$controller.getModel('Common/Date', this.segments[i].depDateTime);
								this.segments[i].arrDateTime = this.$$controller.getModel('Common/Date', this.segments[i].arrDateTime);

								// Time in air - from minutes to seconds
								this.segments[i].flightTime *= 60;
								this.segments[i].flightTime = this.$$controller.getModel('Common/Duration', this.segments[i].flightTime);

								// Aircraft
								this.segments[i].aircraftType = this.aircrafts[this.segments[i].aircraftType];
								
								// Companies
								this.segments[i].marketingCompany = this.airlines[this.segments[i].marketingCompany];
								this.segments[i].operatingCompany = this.airlines[this.segments[i].operatingCompany];

								this.segments[i].depAirp = this.$$controller.getModel(
									'Flights/Common/Geo',
									{
										data: {
											IATA: this.segments[i].depAirp
										},
										guide: setSegmentsGuide ? this.$$rawdata.guide : null
									}
								);

								// Guide for Flights/Common/Geo is already set
								this.segments[i].arrAirp = this.$$controller.getModel(
									'Flights/Common/Geo',
									{
										data: {
											IATA: this.segments[i].arrAirp
										},
										guide: null
									}
								);

								setSegmentsGuide = false;

								if (
									this.segments[i].stopPoints != null &&
									this.segments[i].stopPoints.length > 0
								) {
									// This is needed for not to link models to raw data
									this.segments[i].stopPoints = helpers.cloneObject(this.segments[i].stopPoints);

									for (var j = 0; j < this.segments[i].stopPoints.length; j++) {
										this.segments[i].stopPoints[j].airport = this.$$controller.getModel(
											'Flights/Common/Geo',
											{
												data: {
													IATA: this.segments[i].stopPoints[j].airportCode
												},
												guide: null
											}
										);

										this.segments[i].stopPoints[j].depDateTime = this.$$controller.getModel('Common/Date', this.segments[i].stopPoints[j].depDateTime);
										this.segments[i].stopPoints[j].arrDateTime = this.$$controller.getModel('Common/Date', this.segments[i].stopPoints[j].arrDateTime);

										this.segments[i].stopPoints[j].duration = this.$$controller.getModel(
											'Common/Duration',
											this.segments[i].stopPoints[j].depDateTime.getTimestamp() - this.segments[i].stopPoints[j].arrDateTime.getTimestamp()
										);

										this.segments[i].stopPoints[j].passengersLanding = !!this.segments[i].stopPoints[j].passengersLanding;
									}
								}
								else {
									this.segments[i].stopPoints = [];
								}
							}
						}

						// Processing price objects
						for (var i in this.$$rawdata.flights.search.results.groupsData.prices) {
							if (this.$$rawdata.flights.search.results.groupsData.prices.hasOwnProperty(i)) {
								this.prices[i] = this.$$controller.getModel('Flights/SearchResults/FlightPrice', this.$$rawdata.flights.search.results.groupsData.prices[i]);
								this.prices[i].validatingCompany = this.airlines[this.$$rawdata.flights.search.results.groupsData.prices[i].validatingCompany];
							}
						}

						// Processing flights (iterating over groups because flights are grouped by routes)
						tmp = 0;

						for (var i = 0; i < this.$$rawdata.flights.search.results.flightGroups.length; i++) {
							var segsarr = [],
								source = this.$$rawdata.flights.search.results.flightGroups[i];

							// Preparing segments array
							for (var j = 0; j < source.segments.length; j++) {
								segsarr.push(this.segments[source.segments[j]]);
							}

							// Creating flights and defining minimum and maximum flight durations and prices
							for (var j = 0; j < source.flights.length; j++) {
								this.flights[source.flights[j].id] = this.$$controller.getModel(
									'Flights/SearchResults/Flight',
									{
										id: source.flights[j].id,
										rating: source.flights[j].rating,
										price: this.prices[source.flights[j].price],
										segments: segsarr,
										createOrderLink: source.flights[j].createOrderLink
									}
								);

								// Getting validating company
								this.validatingAirlines[this.flights[source.flights[j].id].getValidatingCompany().IATA] = this.flights[source.flights[j].id].getValidatingCompany();

								tmp++;
							}
						}

						this.visibleResultsCount(tmp);
						this.totalResultsCount = tmp;

						// Constructing validating carriers by rating
						this.validatingAirlinesByRating = Object.keys(this.validatingAirlines)
							.map(function (key) {
								return self.airlines[key]
							})
							.sort(function (a, b) {
								return parseFloat(b.rating) - parseFloat(a.rating);
							});

						// Creating flight groups (we group by same price and validating company)
						// Also - post-processing flights for them to calculate their "recommended" rating
						// that relies on maximum/minimum values for all flights
						for (var i in this.flights) {
							if (this.flights.hasOwnProperty(i)) {
								tmp = this.flightsGetGrouppingKey(this.flights[i]);//this.flights[i].getTotalPrice().normalizedAmount() + '-' + this.flights[i].getTotalPrice().currency() + '-' + this.flights[i].getValidatingCompany();

								if (!tmpGroups[tmp]) {
									tmpGroups[tmp] = [];
								}

								tmpGroups[tmp].push(this.flights[i]);
							}
						}

						for (var i in tmpGroups) {
							if (tmpGroups.hasOwnProperty(i)) {
								tmp = this.$$controller.getModel('Flights/SearchResults/Group', {
									flights: tmpGroups[i],
									resultsController: this
								});

								// Setting group "conjunction table"
								tmp.buildCouplingTable(this.flights);

								this.groups.push(tmp);
							}
						}

						this.buildCompareTables();

						this.buildPFs();

						// We force sorting whether sort has changed or not
						newsort = this.possibleSorts.indexOf(this.options.defaultSort) >= 0 ? this.options.defaultSort : this.possibleSorts[0];

						if (sort != newsort) {
							this.sort(newsort);
						}
						else {
							this.sort.valueHasMutated();
						}

						this.setShowcase();
					}
				}

				// Processing search timeouts
				// Just in case
				clearInterval(this.expirationPopupTimer);

				if (this.options.searchTimeout.useSearchTimeout) {
					this.expirationPopupWarning = this.$$controller.getModel('Common/Duration', self.options.searchTimeout.warningBeforeSearchTimeout);
					this.expirationPopupExpired = this.$$controller.getModel('Common/Duration', self.options.searchTimeout.searchTimeout);

					this.expirationPopupTimer = setInterval(function () {
						// We haven't shown expiration warning popup and the time has come
						if (
							self.expirationPopupWarning.length() < self.expirationPopupExpired.length() &&
							self.expirationPopupWarning.length() >= 0
						) {
							self.expirationPopupWarning.decrement();
						}

						// We haven't shown expiration popup and the time has come
						if (self.expirationPopupExpired.length() >= 0) {
							self.expirationPopupExpired.decrement();
						}

						if (self.expirationPopupExpired.length() < 0) {
							clearInterval(self.expirationPopupTimer);
						}
					}, 1000);
				}
			}

			this.resultsLoaded(displayResults);
		};

		FlightsSearchResultsController.prototype.flightsGetGrouppingKey = function (flight) {
			return flight.getTotalPrice().normalizedAmount() + '-' + flight.getTotalPrice().currency() + '-' + flight.getValidatingCompany().IATA;
		};

		FlightsSearchResultsController.prototype.buildModels = function () {
			var self = this;

			function searchError(message, systemData) {
				if (typeof systemData != 'undefined' && systemData[0] !== 0) {
					self.$$controller.error('SEARCH ERROR: ' + message, systemData);
				}

				if (typeof systemData == 'undefined' || systemData[0] !== 0) {
					self.error(message);
				}
			}

			// We have results - build models
			if (this.mode == 'id') {
				this.processSearchResults();
			}
			// We were performin search - process response and load results
			else {
				if (this.$$rawdata.system && this.$$rawdata.system.error) {
					searchError('systemError', this.$$rawdata.system.error);
				}
				else {
					this.processSearchInfo();

					this.id = this.$$rawdata.flights.search.results.id;

					// Processing error
					if (this.$$rawdata.flights.search.results.info && this.$$rawdata.flights.search.results.info.errorCode) {
						this.error(this.$$rawdata.flights.search.results.info.errorCode);
						this.resultsLoaded(true);
					}
					// Loading results
					else {
						//return
						this.$$controller.navigateReplace(
							'results/' + this.$$rawdata.flights.search.results.id + '/' + this.$$componentParameters.route.join(''),
							false,
							'FlightsResults'
						);

						this.mode = 'id';

						// Loading search results
						this.$$controller.loadData(
							this.dataURL(),
							this.dataPOSTParameters(),
							function (text, request) {
								var response;

								try {
									response = JSON.parse(text);

									// Checking for errors
									if (!response.system || !response.system.error) {
										self.$$rawdata = response;

										self.processSearchResults();
										//if (!response.flights.search.results.info.errorCode) {
										//}
										//else {
										//	searchError(response.flights.search.results.info.errorCode);
										//}
									}
									else {
										searchError('systemError', response.system.error);
									}
								}
								catch (e) {
									console.error(e);
									searchError('brokenJSON', text);
								}
							},
							function (request) {

							}
						)
					}
				}

			}
		};

		FlightsSearchResultsController.prototype.getPFsOrder = function () {
			if (this.options.postFilters && this.options.postFilters.postFiltersSort && this.options.postFilters.postFiltersSort instanceof Array) {
				return this.options.postFilters.postFiltersSort;
			}

			return this.postfiltersData.order;
		};

		FlightsSearchResultsController.prototype.buildPFs = function () {
			var self = this,
				filtersOrderObject = {},
				filtersObject = {},
				pfsOrder = this.getPFsOrder(),
				tmp;

			// Cleaning initial state
			this.postFilters([]);
			this.visiblePostFilters([]);
			this.postFiltersObject({});

			// Creating filters
			// Preparing filters array - flipping
			for (var key in pfsOrder) {
				if (pfsOrder.hasOwnProperty(key)) {
					filtersOrderObject[pfsOrder[key]] = parseInt(key);
				}
			}

			// Creating
			for (var i = 0; i < pfsOrder.length; i++) {
				if (this.postfiltersData.configs[pfsOrder[i]].isLegged) {
					var pfConfig,
						pfGroup = [];

					for (var j = 0; j < this.searchInfo().segments.length; j++) {
						pfConfig = helpers.cloneObject(this.postfiltersData.configs[pfsOrder[i]]);

						pfConfig.legNumber = j;

						tmp = this.$$controller.getModel(
							'Common/PostFilter/' + pfConfig.type,
							{
								config: pfConfig,
								items: this.flights,
								onChange: function () {
									self.PFChanged.apply(self, arguments);
								}
							}
						);

						this.postFilters.push(tmp);

						if (tmp.isActive()) {
							if (this.postfiltersData.grouppable.indexOf(pfConfig.name) >= 0 && this.searchInfo().tripType == 'RT') {
								pfGroup.push(tmp);
							}
							else {
								this.visiblePostFilters.push(tmp);
							}
						}
					}

					if (pfGroup.length) {
						this.visiblePostFilters.push(
							this.$$controller.getModel(
								'Flights/SearchResults/' + this.postfiltersData.configs[pfsOrder[i]].type + 'PFGroup',
								{
									filters: pfGroup,
									resultsController: this
								}
							)
						);
					}
				}
				else {
					tmp = this.$$controller.getModel(
						'Common/PostFilter/' + this.postfiltersData.configs[pfsOrder[i]].type,
						{
							config: this.postfiltersData.configs[pfsOrder[i]],
							items: this.flights,
							onChange: function () {
								self.PFChanged.apply(self, arguments);
							}
						}
					);

					if (tmp.isActive()) {
						var tmp2;

						this.postFilters.push(tmp);
						this.visiblePostFilters.push(tmp);

						// Setting preInittedValue
						if (this.postfiltersData.preInitValues[tmp.config.name]) {
							switch (tmp.config.name) {
								case 'price':
								case 'transfersDuration':
								case 'timeEnRoute':
									tmp2 = tmp.value();

									tmp2.max = Math.min(tmp2.max, Math.max(tmp2.min, this.postfiltersData.preInitValues[tmp.config.name]));

									tmp.value(tmp2);
									break;
								case 'carrier':
									tmp2 = tmp.value() || [];

									for (var j = 0; j < this.postfiltersData.preInitValues[tmp.config.name].length; j++) {
										if (this.airlines[this.postfiltersData.preInitValues[tmp.config.name][j]]) {
											tmp.addValue(
												this.postfiltersData.preInitValues[tmp.config.name][j],
												this.airlines[this.postfiltersData.preInitValues[tmp.config.name][j]],
												true
											);

											tmp2.push(this.postfiltersData.preInitValues[tmp.config.name][j]);
										}
									}

									tmp.setValues(tmp2);

									tmp.sort();

									break;
							}
						}
					}
				}
			}

			// Sorting
			this.visiblePostFilters.sort(function (a, b) {
				return filtersOrderObject[a.config.name] - filtersOrderObject[b.config.name] || a.config.legNumber - b.config.legNumber;
			});

			// Constructing filters object
			this.postFilters().map(function (item) {
				if (item.config.isLegged) {
					if (!(item.config.name in filtersObject)) {
						filtersObject[item.config.name] = [];
					}

					filtersObject[item.config.name].push(item);
				}
				else {
					filtersObject[item.config.name] = item;
				}
			});

			this.postFiltersObject(filtersObject);

			// Setting postFilters to work
			this.usePostfilters = true;

			this.PFChanged();
		};

		FlightsSearchResultsController.prototype.buildCompareTables = function () {
			if (this.options.showBlocks.useFlightCompareTable) {
				this.flightsCompareTableDirect(this.$$controller.getModel('Flights/SearchResults/CompareTable', {
					groups: this.groups(),
					direct: true,
					controller: this,
					transfersType: this.options.compareTableTransfersType
				}));
				this.flightsCompareTableTransfer(this.$$controller.getModel('Flights/SearchResults/CompareTable', {
					groups: this.groups(),
					direct: false,
					controller: this,
					transfersType: this.options.compareTableTransfersType
				}));
			}
		};

		FlightsSearchResultsController.prototype.buildVisibleGroups = function () {
			var groups = this.groups(),
				newGroupList = [],
				c = 0;

			for (var i = 0; i < groups.length; i++) {
				if (!groups[i].filteredOut()) {
					if (c < this.shownGroups()) {
						newGroupList.push(groups[i]);
					}

					c++;
				}
			}

			this.visibleGroups(newGroupList);
			this.totalVisibleGroups(c);
		};

		FlightsSearchResultsController.prototype.showAllGroups = function () {
			this.shownGroups(Infinity);

			this.buildVisibleGroups();
		};

		FlightsSearchResultsController.prototype.PFChanged = function (filter) {
			var self = this,
				filterResults = {},
				filters = this.postFilters(),
				groups = this.groups(),
				result,
				visibleCount = 0,
				tmp, i, j;

			this.PFWorking(true);

			function intersectFilterResults(filterResults, skipIndex) {
				var result;

				for (var i in filterResults) {
					if (filterResults.hasOwnProperty(i) && (typeof skipIndex == 'undefined' || i != skipIndex)) {
						if (typeof result == 'undefined') {
							result = filterResults[i].slice(0);
						}
						else {
							result = result.filter(function (elt) {
								return filterResults[i].indexOf(elt) != -1
							});
						}
					}
				}

				return result;
			}

			if (!this.usePostfilters) {
				this.PFWorking(false);
				return;
			}

			for (i = 0; i < filters.length; i++) {
				if (filters[i].hasValue()) {
					var t = [];

					for (j in this.flights) {
						if (this.flights.hasOwnProperty(j) && filters[i].filter(this.flights[j])) {
							t.push(this.flights[j].id);
						}
					}

					filterResults[i] = t;
				}
			}

			// Intersecting filter results
			result = intersectFilterResults(filterResults);

			// Recalculating PFs
			for (var i = 0; i < filters.length; i++) {
				if (typeof filters[i].recalculateOptions == 'function') {
					// Creating needed flights list
					var tmp = intersectFilterResults(filterResults, i) || Object.keys(this.flights);

					filters[i].recalculateOptions(
						tmp.map(function (key) {
							return self.flights[key];
						})
					);
				}
			}

			// Displaying
			for (var i in this.flights) {
				if (this.flights.hasOwnProperty(i)) {
					tmp = typeof result == 'undefined' || result.indexOf(parseInt(i)) >= 0;
					this.flights[i].filteredOut(!tmp);

					if (tmp) {
						visibleCount++;
					}
				}
			}

			// Recalculating groups
			// We can not rely on knockout's subscribe mechanism due to too many recalculations
			// on each flights' filteredOut status change
			for (var i = 0; i < groups.length; i++) {
				groups[i].recalculateSelf();
			}

			this.visibleResultsCount(visibleCount);

			this.setShowcase();
			this.buildVisibleGroups();
			this.PFWorking(false);
			this.compareTablesOpen(false);
			this.compareTablesRenderFlag(false);
		};

		FlightsSearchResultsController.prototype.PFClearAll = function () {
			var filters = this.postFilters();

			this.usePostfilters = false;
			for (var i = 0; i < filters.length; i++) {
				filters[i].clear();
			}
			this.usePostfilters = true;

			this.PFChanged();
		};

		FlightsSearchResultsController.prototype.setShowcase = function () {
			// Defining best flight
			var self = this,
				bestFlight = null,
				fastestFlight = null,
				cheapestGroup = null,
				groups = this.groups(),
				bestCompanies = [],
				bestCompaniesCount = 3,
				mainCount = 0,
				fastestInCheapest, bestInCheapest, fastestIsBest, tmp;

			if (this.options.showBlocks.useShowCase) {
				for (var i in this.flights) {
					if (this.flights.hasOwnProperty(i) && !this.flights[i].filteredOut()) {
						if(
							!bestFlight ||
							bestFlight.recommendRating < this.flights[i].recommendRating ||
							(
								bestFlight.recommendRating == this.flights[i].recommendRating &&
								bestFlight.getTotalPrice().normalizedAmount() > this.flights[i].getTotalPrice().normalizedAmount()
							)
						) {
							bestFlight = this.flights[i];
						}

						if (!fastestFlight || fastestFlight.totalTimeEnRoute.length() > this.flights[i].totalTimeEnRoute.length()) {
							fastestFlight = this.flights[i];
						}
					}
				}

				// Cheapest
				for (var i = 0; i < groups.length; i++) {
					if (
						!groups[i].filteredOut() &&
						(
							!cheapestGroup ||
							cheapestGroup.getTotalPrice().amount() > groups[i].getTotalPrice().amount()
						)
					) {
						cheapestGroup = groups[i];
					}
				}

				tmp = [];

				if (cheapestGroup) {
					fastestInCheapest = fastestFlight.id in cheapestGroup.flightsById;
					bestInCheapest = bestFlight.id in cheapestGroup.flightsById;
					fastestIsBest = fastestFlight.id == bestFlight.id;

					bestFlight = this.$$controller.getModel('Flights/SearchResults/Group', {
						flights: [bestFlight],
						resultsController: this
					});
					fastestFlight = this.$$controller.getModel('Flights/SearchResults/Group', {
						flights: [fastestFlight],
						resultsController: this
					});

					// Setting group "conjunction table"
					bestFlight.buildCouplingTable(this.flights);
					fastestFlight.buildCouplingTable(this.flights);

					tmp.push({
						group: cheapestGroup.clone(),
						modifiers: ['cheapest']
					});

					if (bestInCheapest && fastestInCheapest) {
						tmp[0].modifiers.push('recommended');
						tmp[0].modifiers.push('fastest');
					}
					else if (fastestIsBest) {
						tmp.unshift({
							group: bestFlight,
							modifiers: ['recommended', 'fastest']
						});
					}
					else {
						if (!bestInCheapest) {
							tmp.unshift({
								group: bestFlight,
								modifiers: ['recommended']
							});
						}

						if (!fastestInCheapest) {
							tmp.push({
								group: fastestFlight,
								modifiers: ['fastest']
							});
						}

						if (!bestInCheapest && fastestInCheapest) {
							tmp[1].modifiers.push('fastest');
						}

						if (bestInCheapest && !fastestInCheapest) {
							tmp[0].modifiers.push('recommended');
						}
					}

					for (var i = 0; i < tmp.length; i++) {
						tmp[i].modifiers.sort();

						if (tmp.length < 3) {
							tmp[i].modifiers.push('joined');
						}
					}
				}

				for (var i = 0; i < tmp.length; i++) {
					mainCount += tmp[i].group.flights.length;
				}

				this.showcase.main(tmp);
				this.showcase.mainFlightsCount(mainCount);
			}

			if (this.options.showBlocks.showBestOffers && !this.showcase.bestCompanies()) {
				for (var i = 0; i < this.validatingAirlinesByRating.length; i++) {
					var showcaseBC = null;

					for (var j in this.flights) {
						if (this.flights.hasOwnProperty(j)) {
							if (
								this.flights[j].getValidatingCompany().IATA == this.validatingAirlinesByRating[i].IATA &&
								(
									showcaseBC == null ||
									showcaseBC.recommendRating < this.flights[j].recommendRating ||
									(
										showcaseBC.recommendRating == this.flights[j].recommendRating &&
										showcaseBC.getTotalPrice().normalizedAmount() > this.flights[j].getTotalPrice().normalizedAmount()
									)
								)
							) {
								showcaseBC = this.flights[j];
							}
						}
					}

					if (showcaseBC) {
						var tmp = this.$$controller.getModel('Flights/SearchResults/Group', {
							flights: [showcaseBC.clone()],
							resultsController: this
						});

						// Setting group "conjunction table"
						tmp.buildCouplingTable(this.flights);

						bestCompanies.push(tmp);
					}

					if (bestCompanies.length >= bestCompaniesCount) {
						break;
					}
				}

				// If there's less or equal validating companies than items in best companies - clear it
				if (this.validatingAirlinesByRating.length > bestCompanies.length) {
					// Sorting by price
					bestCompanies.sort(function (a, b) {
						return a.getTotalPrice().normalizedAmount() - b.getTotalPrice().normalizedAmount();
					});
				}
				else {
					bestCompanies = [];
				}

				this.showcase.bestCompanies(bestCompanies);
			}
		};

		FlightsSearchResultsController.prototype.refreshSearch = function () {
			this.makeSearch('/flights/search/request', 'refreshing', true);
		};

		FlightsSearchResultsController.prototype.makeSearch = function (url, identifier, replaceURL) {
			var self = this;

			function searchError(message, systemData) {
				if (typeof systemData != 'undefined' && systemData[0] !== 0) {
					self.$$controller.error('SEARCH ERROR: ' + message, systemData);
				}

				if (typeof systemData == 'undefined' || systemData[0] !== 0) {
					self.requestError(self.$$controller.i18n('FlightsSearchForm', 'searchError_' + message));
				}

				self.requestActive(false);
			}

			self.resultsLoaded(false);

			this.requestActive(identifier);
			this.request = this.$$controller.loadData(
				url,
				{request: JSON.stringify(this.$$rawdata.flights.search.request)},
				function (text, request) {
					var response;

					try {
						response = JSON.parse(text);

						// Checking for errors
						if (!response.system || !response.system.error) {
							// Empty results check (automatically passed if we have a delayed search)
							if (!response.flights.search.results.info || !response.flights.search.results.info.errorCode) {
								self.$$rawdata = response;

								self.processSearchInfo();

								self.formReloader(self.formReloader() + 1);

								if (replaceURL) {
									self.$$controller.navigateReplace(
										'results/' + response.flights.search.request.id + '/' + helpers.getFlightsRouteURLAdder('results', self.searchInfo()),
										false,
										'FlightsResults'
									);
								}
								else {
									self.$$controller.navigate(
										'results/' + response.flights.search.request.id + '/' + helpers.getFlightsRouteURLAdder('results', self.searchInfo()),
										false,
										'FlightsResults'
									);
								}

								// Loading results data
								self.$$controller.loadData(
									'/flights/search/results/' + response.flights.search.request.id,
									{},
									function (text, request) {
										self.$$rawdata = JSON.parse(text);

										self.processSearchResults();
									},
									function (request) {
										searchError('requestFailed', [request.status, request.statusText]);
									}
								);
							}
							else {
								searchError(response.flights.search.results.info.errorCode);
							}
						}
						else {
							searchError('systemError', response.system.error);
						}
					}
					catch (e) {
						console.error(e);
						searchError('brokenJSON', text);
					}
				},
				function (request) {
					searchError('requestFailed', [request.status, request.statusText]);
				}
			);
		};

		FlightsSearchResultsController.prototype.abortRequest = function () {
			if (this.requestActive()) {
				this.requestActive(false);
				this.request.abort();
			}
		};

		FlightsSearchResultsController.prototype.datesMatrixDateRequest = function (data) {
			if (data.uri) {
				var searchInfo = this.searchInfo();

				// Setting for correct pseudoresults
				searchInfo.vicinityDates = 0;

				searchInfo.segments[0].departureDate = this.$$controller.getModel('Common/Date', data.date.getISODate());

				if (data.returndate) {
					searchInfo.segments[1].departureDate = this.$$controller.getModel('Common/Date', data.returndate.getISODate());
				}

				this.searchInfo(searchInfo);

				this.matrixData(null);

				this.makeSearch('/flights/search/results/' + this.id + '/' + data.date.getISODate() + (data.returndate ? '/' + data.returndate.getISODate() : ''), 'matrixSubSearch');
			}
		};

		FlightsSearchResultsController.prototype.disablePFHint = function (data) {
			this.PFHintActive(false);

			Cookie.set(this.$$controller.options.cookiesPrefix + this.PFHintCookie, true, {expires: 365});
		};

		FlightsSearchResultsController.prototype.passengersSummary = function () {
			var ret = '',
				total = 0,
				passengers = this.searchInfo().passengers,
				passTypes = [];

			for (var i in passengers) {
				if (passengers.hasOwnProperty(i)) {
					var t = passengers[i];
					if (t > 0) {
						total += t;
						passTypes.push(i);
					}
				}
			}

			if (passTypes.length == 0) {
				ret = this.$$controller.i18n('FlightsSearchForm', 'passSummary_numeral_noPassengers');
			}
			else if (passTypes.length == 1) {
				ret = total + ' ' + this.$$controller.i18n('FlightsSearchForm', 'passSummary_numeral_' + passTypes.pop() + '_' + helpers.getNumeral(total, 'one', 'twoToFour', 'fourPlus'));
			}
			else {
				ret = total + ' ' + this.$$controller.i18n('FlightsSearchForm', 'passSummary_numeral_mixed_' + helpers.getNumeral(total, 'one', 'twoToFour', 'fourPlus'));
			}

			return ret;
		};

		FlightsSearchResultsController.prototype.$$usedModels = [
			'Flights/SearchResults/FlightPrice',
			'Flights/SearchResults/Flight',
			'Flights/SearchResults/Group',
			'Flights/SearchResults/CouplingTable',
			'Flights/SearchResults/StringPFGroup',
			'Flights/SearchResults/CompareTable',
			'Flights/Common/Airline',
			'Common/Date',
			'Common/Duration',
			'Common/Money',
			'Common/PostFilter/Abstract',
			'Common/PostFilter/String',
			'Common/PostFilter/Number',
			'Flights/Common/Geo'
		];

		FlightsSearchResultsController.prototype.$$KOBindings = ['PostFilters', 'FlightsResults'];

		FlightsSearchResultsController.prototype.$$i18nSegments = ['FlightsSearchResults', 'FlightsSearchForm', 'FlightsFlightInfo'];

		FlightsSearchResultsController.prototype.dataURL = function () {
			if (this.mode == 'id') {
				return '/flights/search/results/' + this.id;
			}
			else {
				return '/flights/search/request';
			}
		};

		FlightsSearchResultsController.prototype.dataPOSTParameters = function () {
			var ret = {};

			if (this.mode != 'id') {
				ret.request = JSON.stringify(this.searchParameters);
			}

			if (this.postfiltersData.preInitValues.carrier && this.postfiltersData.preInitValues.carrier.length) {
				ret.resources = {};
				for (var i = 0; i < this.postfiltersData.preInitValues.carrier.length; i++) {
					ret.resources['guide/airlines/' + this.postfiltersData.preInitValues.carrier[i]] = {};
				}

				ret.resources = JSON.stringify(ret.resources);
			}

			return ret;
		};

		FlightsSearchResultsController.prototype.pageTitle = 'FlightsResults';

		return FlightsSearchResultsController;
	}
);
