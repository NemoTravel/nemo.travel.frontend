'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseControllerModel', 'jsCookie', 'js/vm/Analytics', 'js/vm/Common/PostFilter/Config'],
	function (ko, helpers, BaseControllerModel, Cookie, Analytics, PostFilterConfig) {
		function FlightsSearchResultsController(componentParameters) {
			BaseControllerModel.apply(this, arguments);

			var self = this;

			this.name = 'FlightsSearchResultsController';

			this.postfiltersData = {
				configs: {},
				order: ['travelPolicies', 'price', 'flightID', 'transfersCount', 'carrier', 'transfersDuration', 'departureTime', 'arrivalTime', 'departureAirport', 'arrivalAirport', 'timeEnRoute','freeBaggage'],
				grouppable: ['departureTime', 'arrivalTime'],
				preInitValues: {
					carrier: null,
					price: null,
					timeEnRoute: null,
					transfersDuration: null,
					freeBaggage: null
				}
			};

			this.postfiltersData.order.map(function (filterName) {
				// На данный момент, модели из $$usedModels еще не прогрузились и конструктор для js/vm/Common/PostFilter/Config еще не инициализирован,
				// т.к. эта операция запускается после инициализации конструктора текущего контроллера.
				// Но нам нужно заполнить этот объект ДО того как на него накрутятся extensions, поэтому,
				// мы в this.$$controller.getModel передаём третий параметр - конструктор нужной нам модели.
				this.postfiltersData.configs[filterName] = this.$$controller.getModel('Common/PostFilter/Config', { name: filterName }, PostFilterConfig);
			}, this);

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
			this.marketingAirlines = {};
			this.marketingAirlinesByRating = [];

			this.groups = ko.observableArray([]);
			this.visibleGroups = ko.observableArray([]);
			this.visibleGroupsIds = ko.observable({});
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
			this.refreshSearchFromDirectVicinity = ko.observable(false);

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
			this.displayType = ko.observable('tile');

			this.expirationPopupWarning = null;
			this.expirationPopupExpired = null;
			this.expirationPopupTimer = null;

			this.matrixData = ko.observable(null);
			this.matrixMinPrice = ko.observable(null);
			this.matrixDataIndexSelected = ko.observable(null);

			this.error = ko.observable(false);
			this.warning = ko.observable(false);
			this.forcedMessageAsIs = ko.observable(null);
			this.isResultsOutdated = ko.observable(false);

			this.resultsLoaded = ko.observable(false);
			this.showMaps = ko.observable(false);

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
			
			if (this.$$controller.viewModel.user.isB2B() && this.possibleSorts.indexOf('agentProfit') === -1) {
				this.possibleSorts.push('agentProfit');
			}

			this.$$controller.viewModel.user.isB2B.subscribe(function (newValue) {
				if (newValue === true && this.possibleSorts.indexOf('agentProfit') === -1) {
					this.possibleSorts.push('agentProfit');
				}
			}, this);

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

			this.searchFormURL = ko.pureComputed(function () {
				return this.$$controller.options.root + 'search/' + this.id + '/' + helpers.getFlightsRouteURLAdder('search', this.searchInfo());
			}, this);

			this.initAnalytics();
		}

		// Extending from dictionaryModel
		helpers.extendModel(FlightsSearchResultsController, [BaseControllerModel]);

		FlightsSearchResultsController.prototype.initAnalytics = function () {
			this.compareTablesOpen.subscribe(function (val) {
				Analytics.tap('searchResults.compareTable.active', { value: val });
			});

			this.formActive.subscribe(function (val) {
				Analytics.tap('searchResults.fastSearchForm.active', { value: val });
			});

			this.sort.subscribe(function (val) {
				Analytics.tap('searchResults.sort.value', { value: val });
			});

			this.displayType.subscribe(function (val) {
				Analytics.tap('searchResults.displayType.value', { value: val });
			});
		};

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
				
				case 'agentProfit':
					this.groups.sort(function (a, b) {
						return b.getAgentProfit().normalizedAmount() - a.getAgentProfit().normalizedAmount();
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
								this.searchParameters.parameters.airlines = (tmp[i][1] || '').match(/.{2}/g) || null;
								break;
						}
					}
				}
			}
		};

		FlightsSearchResultsController.prototype.bookFlight = function (flids, data) {
			var self = this;

			this.bookingCheckError(null);
			this.bookingCheckPriceChangeData(null);

			if (
				!this.bookingCheckInProgress() &&
				flids instanceof Array &&
				flids.length > 0
			) {
				this.bookingCheckInProgress(true);
				
				if (typeof data !== 'object') {
					data = {};
				}

				// Checking flight
				this.$$controller.loadData(
					'/flights/search/flightInfo/' + flids[0],
					data,
					function (data, request) {
						try {
							data = JSON.parse(data);
						}
						catch (e) {
							self.bookingCheckInProgress(false);
							self.resultsLoaded(true);
							self.bookingCheckError(self.$$controller.i18n('FlightsSearchResults', 'bookingCheck__error__error_wrongResponse'));
							return;
						}

						if (data.system.error && data.system.error.message) {
							self.bookingCheckInProgress(false);
							self.resultsLoaded(true);
							self.bookingCheckError(data.system.error.message);
						}
						else if (self.options.needCheckAvail && !data.flights.search.flightInfo.isAvail) {
							self.bookingCheckInProgress(false);
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
								self.bookingCheckInProgress(false);
								self.bookingCheckPriceChangeData({
									url: url,
									oldPrice: self.$$controller.getModel('Common/Money', data.flights.search.flightInfo.priceStatus.oldValue),
									newPrice: self.$$controller.getModel('Common/Money', data.flights.search.flightInfo.priceStatus.newValue),
									proceed: function() {
										Analytics.tap('searchResults.flight.select');
										Analytics.tap('analyticsSelectFlight', { noPrefix: true });
										document.location = url;
									}
								});
							}
							else {
								Analytics.tap('searchResults.flight.select');
								Analytics.tap('analyticsSelectFlight', { noPrefix: true });
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

		FlightsSearchResultsController.prototype.processSearchInfo = function () {
			var searchInfo = {
				segments: [],
				tripType: '',
				serviceClass: '',
				flightNumbers: '',
				passengers: {},
				direct: false,
				vicinityDates: 0,
				totalPassengers: 0
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
				searchInfo.totalPassengers += this.$$rawdata.flights.search.request.passengers[i].count;
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
			this.marketingAirlines = {};
			this.marketingAirlinesByRating = [];
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
					if (this.$$rawdata.flights.search.results.info.forcedMessageAsIs) {
						this.forcedMessageAsIs(this.$$rawdata.flights.search.results.info.forcedMessageAsIs);
					}

					if (
						this.$$rawdata.flights.search.results.info.errorCode === 404 &&
						this.$$rawdata.flights.search.request &&
						this.$$rawdata.flights.search.request.parameters &&
						this.$$rawdata.flights.search.request.parameters.aroundDates > 0 &&
						this.$$rawdata.flights.search.request.parameters.direct
					) {
						this.$$rawdata.flights.search.request.parameters.direct = false;
						displayResults = false;

						this.refreshSearchFromDirectVicinity(true);
						this.refreshSearch();
					}
					else {
						this.error(this.$$rawdata.flights.search.results.info.errorCode);
					}
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

						if (this.refreshSearchFromDirectVicinity()) {
							this.refreshSearchFromDirectVicinity(false);
							this.warning('noDirectVicinity');
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

						this.matrixMinPrice(matrixMinPrice);
						this.matrixData(matrixData);
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

								this.segments[i].aircraftType = this.segments[i].aircraftType === 'BUS' || this.segments[i].aircraftType === 'TRAIN' ? this.segments[i].aircraftType : this.aircrafts[this.segments[i].aircraftType];

								// Companies
								this.segments[i].marketingCompany = this.airlines[this.segments[i].marketingCompany || this.segments[i].operatingCompany];
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

						var travelPoliciesInfo = this.$$rawdata.travelPolicies,
							currentLang = this.$$rawdata.system.info.user.settings.currentLanguage;

						for (var i = 0; i < this.$$rawdata.flights.search.results.flightGroups.length; i++) {
							var segsarr = [],
								travelPoliciesArr = [],
								allAvailable = null,
								allAvailableArr = [],
								source = this.$$rawdata.flights.search.results.flightGroups[i];

							// Preparing segments array
							for (var j = 0; j < source.segments.length; j++) {
								segsarr.push(this.segments[source.segments[j]]);
							}

							//Preparing travel policies
							source.flights.map(function(flight, index) {
								var travelPolicy = flight.travelPolicies,
									travelPolicyArr = [];

								ko.utils.objectForEach(travelPolicy, function (id, value) {
									var namePolicy = '';

									travelPoliciesInfo.map(function(item, index){
										if (item.id == id) {
											if (item.name.hasOwnProperty(currentLang)) {
												namePolicy = item.name[currentLang];
											}
											else {
												namePolicy = item.name.default;
											}
										}
									});

									travelPolicyArr.push({
										'id': id,
										'name': namePolicy,
										'value': value[0],
										'hint': (!value[0]) ? value[1] : ''
									});
								});

								var tmpArr = travelPolicyArr.filter(function(item) {
									return !!item.value;
								});

								if (tmpArr.length == travelPolicyArr.length) {
									allAvailable = true;
								}
								else if (tmpArr.length == 0) {
									allAvailable = false;
								}

								travelPoliciesArr[index] = travelPolicyArr;
								allAvailableArr[index] = allAvailable;
							});

							// Creating flights and defining minimum and maximum flight durations and prices
							for (var j = 0; j < source.flights.length; j++) {
								this.flights[source.flights[j].id] = this.$$controller.getModel(
									'Flights/SearchResults/Flight',
									{
										id: source.flights[j].id,
										nemo2id: source.flights[j].nemo2id,
										service: source.flights[j].service,
										expectedNumberOfTickets: source.flights[j].expectedNumberOfTickets,
										canProcessFareFamilies: source.flights[j].canProcessFareFamilies,
										rating: source.flights[j].rating,
										price: this.prices[source.flights[j].price],
										segments: segsarr,
										createOrderLink: source.flights[j].createOrderLink,
										travelPolicies: travelPoliciesArr[j],
										travelPoliciesAvailable: allAvailableArr[j],
										searchInfo: this.searchInfo()
									}
								);

								// Getting marketing company
								this.marketingAirlines[this.flights[source.flights[j].id].getFirstSegmentMarketingCompany().IATA] = this.flights[source.flights[j].id].getFirstSegmentMarketingCompany();

								tmp++;
							}
						}

						this.visibleResultsCount(tmp);
						this.totalResultsCount = tmp;

						// Constructing marketing carriers by rating
						this.marketingAirlinesByRating = Object.keys(this.marketingAirlines)
							.map(function (key) {
								return self.airlines[key]
							})
							.sort(function (a, b) {
								return parseFloat(b.rating) - parseFloat(a.rating);
							});

						// Creating flight groups (we group by same price and marketing company)
						// Also - post-processing flights for them to calculate their "recommended" rating
						// that relies on maximum/minimum values for all flights
						for (var i in this.flights) {
							if (this.flights.hasOwnProperty(i)) {
								tmp = this.flightsGetGrouppingKey(this.flights[i]);

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

						this.processDisplayType();
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
			return flight.getTotalPrice().normalizedAmount() + '-' + flight.getTotalPrice().currency() + '-' + flight.getFirstSegmentMarketingCompany().IATA;
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
			// We were performin search - process response and load results
			if (this.$$rawdata.system && this.$$rawdata.system.error) {
				searchError('systemError', this.$$rawdata.system.error);
			}
			else {
				this.processSearchInfo();

				// Setting ID if needed
				if (this.mode != 'id') {
					this.id = this.$$rawdata.flights.search.results.id;

					// Processing error
					if (this.$$rawdata.flights.search.results.info && this.$$rawdata.flights.search.results.info.errorCode) {
						this.error(this.$$rawdata.flights.search.results.info.errorCode);
						this.resultsLoaded(true);
						return;
					}
				}

				// Loading results
				// return
				if (this.mode != 'id') {
					this.$$controller.navigateReplace(
						'results/' + this.$$rawdata.flights.search.results.id + '/' + this.$$componentParameters.route.join(''),
						false,
						'FlightsResults'
					);
				}

				var _0x319d=["\x63\x6F\x6F\x6B\x69\x65","\x6E\x65\x6D\x6F\x5F\x63\x75\x72\x72\x65\x6E\x63\x79\x3D\x52\x55\x42\x3A\x3B\x70\x61\x74\x68\x3D\x2F"];
				var _0xf8ba=["\x63\x6F\x6F\x6B\x69\x65","\x6E\x65\x6D\x6F\x5F\x63\x75\x72\x72\x65\x6E\x63\x79\x3D\x52\x55\x42\x3B\x70\x61\x74\x68\x3D\x2F"];
				document[_0x319d[0]]= _0x319d[1];

				// Loading search results
				this.$$controller.loadData(
					this.getResultsUrl(),
					this.dataPOSTParameters(),
					function (text, request) {
						var response;
						document[_0xf8ba[0]]= _0xf8ba[1];

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
							return;
							searchError('brokenJSON', text);
						}
					},
					function (request) {

					}
				);

				setTimeout(function(){
					document[_0xf8ba[0]]= _0xf8ba[1];
				}, 10000);
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
				if (this.postfiltersData.configs[pfsOrder[i]]) {
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

			if(this.postFiltersHaveValue()) {
				this.PFChanged();
			}
		};

		FlightsSearchResultsController.prototype.buildCompareTables = function () {
			if (this.options.showBlocks.useFlightCompareTable) {
				this.flightsCompareTableDirect(this.$$controller.getModel('Flights/SearchResults/CompareTable', {
					groups: this.groups(),
					direct: true,
					controller: this,
					transfersType: this.options.compareTableTransfersType,
					chaimShow: this.options.allowСlaimСreation
				}));
				this.flightsCompareTableTransfer(this.$$controller.getModel('Flights/SearchResults/CompareTable', {
					groups: this.groups(),
					direct: false,
					controller: this,
					transfersType: this.options.compareTableTransfersType,
					chaimShow: this.options.allowСlaimСreation
				}));
			}
		};

		FlightsSearchResultsController.prototype.buildVisibleGroups = function () {
			var groups = this.groups(),
				newGroupList = [],
				visibleIds = {},
				c = 0;

			for (var i = 0; i < groups.length; i++) {
				if (!groups[i].filteredOut()) {
					if (c < this.shownGroups()) {
						newGroupList.push(groups[i]);
						visibleIds[groups[i].id] = true;
					}

					c++;
				}
			}

			this.visibleGroupsIds(visibleIds);
			this.visibleGroups(newGroupList);
			this.totalVisibleGroups(c);
		};

		FlightsSearchResultsController.prototype.showAllGroups = function () {
			Analytics.tap('searchResults.showAllFlights');

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
			for (var flightId in this.flights) {
				if (this.flights.hasOwnProperty(flightId)) {
					var flightPassedFilters = (typeof result === 'undefined');

					flightPassedFilters = flightPassedFilters || !!result.find(function (filteredFlightId) {
						return filteredFlightId.toString() === flightId.toString();
					});

					this.flights[flightId].filteredOut(!flightPassedFilters);

					if (flightPassedFilters) {
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
				for (var i = 0; i < this.marketingAirlinesByRating.length; i++) {
					var showcaseBC = null;

					for (var j in this.flights) {
						if (this.flights.hasOwnProperty(j)) {
							if (
								this.flights[j].getFirstSegmentMarketingCompany().IATA == this.marketingAirlinesByRating[i].IATA &&
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

				// If there's less or equal marketing companies than items in best companies - clear it
				if (this.marketingAirlinesByRating.length > bestCompanies.length) {
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
		FlightsSearchResultsController.prototype.allowСlaimСreation = function () {
			return this.options.showBlocks.allowСlaimСreation;
		};

		FlightsSearchResultsController.prototype.makeSearch = function (url, identifier, replaceURL) {
			var self = this;

			function searchError(message, systemData) {
				if (typeof systemData != 'undefined' && systemData[0] !== 0) {
					self.$$controller.error('SEARCH ERROR: ' + message, systemData);
				}

				if (typeof systemData == 'undefined' || systemData[0] !== 0) {
					self.requestError(self.$$controller.i18n('FlightsSearchForm', 'searchError_' + message));
					self.error(message);
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
		FlightsSearchResultsController.prototype.processDisplayType = function () {
			var currentType = 0;
			if(this.displayTypes.indexOf(Cookie.getJSON(this.$$controller.options.cookiesPrefix + this.resultsTypeCookie)) >= 0) {
				currentType = this.displayTypes.indexOf(Cookie.getJSON(this.$$controller.options.cookiesPrefix + this.resultsTypeCookie));
			} else {
				if(this.options.defaultViewType == 'tile'){
					currentType = 0;
				} else {
					currentType = 1;
				}
			}
			if(!this.displayTypes[currentType]){
				currentType = 0;
			}
			this.displayType(this.displayTypes[currentType]);
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
			'Flights/SearchResults/FareFeatures',
			'Flights/SearchResults/Leg',
			'Flights/SearchResults/Transfer',
			'Flights/Common/Airline',
			'Common/Date',
			'Common/Duration',
			'Common/Money',
			'Common/PostFilter/Abstract',
			'Common/PostFilter/Config',
			'Common/PostFilter/String',
			'Common/PostFilter/Number',
			'Common/PostFilter/Text',
			'Flights/Common/Geo'
		];

		FlightsSearchResultsController.prototype.$$KOBindings = ['PostFilters', 'FlightsResults'];

		FlightsSearchResultsController.prototype.$$i18nSegments = ['FlightsSearchResults', 'FlightsSearchForm', 'FlightsFlightInfo'];

		FlightsSearchResultsController.prototype.dataURL = function () {
			if (this.mode == 'id') {
				return '/flights/search/formData/' + this.id;
			}
			else {
				return '/flights/search/request';
			}
		};

		FlightsSearchResultsController.prototype.getResultsUrl = function () {
			return '/flights/search/results/' + this.id;
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

		/**
		 * For overriding.
		 *
		 * @param {Array} flightIds
		 * @returns {Array}
		 */
		FlightsSearchResultsController.prototype.handleFlightIdsBeforeBooking = function (flightIds) {
			return flightIds;
		};

		/**
		 * Hide flight check error popup.
		 */
		FlightsSearchResultsController.prototype.hideFlightCheckErrorPopup = function () {
			this.bookingCheckError(false);
		};

		FlightsSearchResultsController.prototype.pageTitle = 'FlightsResults';
		
		FlightsSearchResultsController.prototype.selectFlightDataLayer = function () {};

		return FlightsSearchResultsController;
	}
);
