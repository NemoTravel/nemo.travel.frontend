'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/Flights/SearchForm/Controller'],
	function (ko, helpers, BaseControllerModel) {
		function FlightsScheduleSearchFormController (componentParameters) {
			BaseControllerModel.apply(this, arguments);

			this.name = 'FlightsScheduleSearchFormController';
			this.scheduleLoading = ko.observable(false);
			this.schedule = {
				flightsById: {},
				flights: ko.observableArray([]),
				dates: ko.observableArray([]),
				visibleFlights: ko.observableArray([]),
				visibleDates: ko.observableArray([])
			};
			this.loadScheduleRequest = false;

			// PFs stuff
			this.postFilters = ko.observableArray([]);
			this.visiblePostFilters = ko.observableArray([]);
			this.postFiltersObject = ko.observable({});
			this.usePostfilters = false;

			this.schedulePeriodBegin = ko.observable(null);
			this.schedulePeriodEnd = ko.observable(null);

			this.possibleSorts = ['depTime', 'arrTime', 'timeEnRoute'];
			this.sort = ko.observable(this.possibleSorts[0]);

			this.sort.subscribe(function (type) {
				this.doSort(type);
			}, this);
		}

		// Extending from dictionaryModel
		helpers.extendModel(FlightsScheduleSearchFormController, [BaseControllerModel]);

		// Inheritance override
		FlightsScheduleSearchFormController.prototype.cookieName     = 'FlightsScheduleSearchForm';
		FlightsScheduleSearchFormController.prototype.$$i18nSegments = ['FlightsScheduleSearchForm'];
		FlightsScheduleSearchFormController.prototype.$$KOBindings   = ['PostFilters', 'FlightsSearchForm'];
		FlightsScheduleSearchFormController.prototype.$$usedModels   = [
			'Flights/SearchForm/Segment',
			'Common/Date',
			'Common/Duration',
			'Flights/Common/Geo',
			'Flights/Common/Airline',
			'Flights/ScheduleSearch/Flight',
			'Common/PostFilter/Abstract',
			'Common/PostFilter/String',
			'Common/PostFilter/Number'
		];

		FlightsScheduleSearchFormController.prototype.PFOrder = ['transfersCount', 'carrier', /*'departureTime', 'arrivalTime',*/ 'departureAirport', 'arrivalAirport', 'timeEnRoute'];
		FlightsScheduleSearchFormController.prototype.PFConfig = {
			transfersCount: {
				name: 'transfersCount',
				type: 'String',
				getter: function (obj) {
					//var tmp = Math.min.apply(Math, obj.legs.map(function (item, i) {
					//	return item.transfersCount;
					//}));
					var tmp = obj.segments.length - 1;

					return [[tmp, tmp]];
				},
				options: {
					// Filter-specific options here
					valuesSorter: function (a, b) {
						return a.value - b.value;
					}
				}
			},
			carrier: {
				name: 'carrier',
				type: 'String',
				getter: function (obj) {
					var ret = [];

					ret.push([
						obj.getMarketingCompany().IATA,
						obj.getMarketingCompany()
					]);

					return ret;
				},
				options: {
					// Filter-specific options here
					valuesSorter: function (a, b) {
						return a.value.name.localeCompare(b.value.name);
					}
				}
			},
			departureAirport: {
				name: 'departureAirport',
				type: 'String',
				isLegged: true,
				legNumber: 0,
				getter: function (obj) {
					return [[obj.depAirp.IATA, obj.depAirp]];
				},
				options: {
					// Filter-specific options here
					valuesSorter: function (a, b) {
						return a.value.name.localeCompare(b.value.name);
					}
				}
			},
			arrivalAirport: {
				name: 'arrivalAirport',
				type: 'String',
				isLegged: true,
				legNumber: 0,
				getter: function (obj) {
					return [[obj.arrAirp.IATA, obj.arrAirp]];
				},
				options: {
					// Filter-specific options here
					valuesSorter: function (a, b) {
						return a.value.name.localeCompare(b.value.name);
					}
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
		};

		FlightsScheduleSearchFormController.prototype.periodLength = 7;

		// Cleaning unneeded stuff
		FlightsScheduleSearchFormController.prototype.loadAirlines = function () {};

		// Modifying buildModels - truncating segments to make only one of them
		FlightsScheduleSearchFormController.prototype._super_buildModels = FlightsScheduleSearchFormController.prototype.buildModels;
		FlightsScheduleSearchFormController.prototype.buildModels = function () {
			this._super_buildModels.apply(this, arguments);

			// Resetting segments - we need only one of them
			this.tripType('OW');

			this.calculatePeriod(this.segments()[0].items.departureDate.value());
		};

		FlightsScheduleSearchFormController.prototype.calculatePeriod = function (date) {
			if (date) {
				this.schedulePeriodBegin(date.offsetDate(1 - date.getDOW()).dropTime());
				this.schedulePeriodEnd(date.offsetDate(this.periodLength - date.getDOW()).dropTime());
			}
		};

		FlightsScheduleSearchFormController.prototype.clearSchedule = function () {
			for (var i in this.schedule) {
				if (this.schedule.hasOwnProperty(i)) {
					if (i != 'flightsById') {
						this.schedule[i]([]);
					}
					else {
						this.schedule[i] = {};
					}
				}
			}

			// Clearing PFS
			this.postFilters([]);
			this.visiblePostFilters([]);
			this.postFiltersObject({});
			this.flightNumbers([]);
		};

		// Overriding segmentGeoChanged that's called when segment's date is changed
		FlightsScheduleSearchFormController.prototype.segmentGeoChanged = function (segment, geo) {
			this.abortScheduleSearch();
			this.clearSchedule();
		};

		// Overriding segmentDateChanged that's called when segment's date is changed
		FlightsScheduleSearchFormController.prototype.segmentDateChanged = function (segment) {
			this.abortScheduleSearch();
			this.clearSchedule();
			this.calculatePeriod(segment.items.departureDate.value());
		};

		// Overriding startSearch
		FlightsScheduleSearchFormController.prototype.startSearch = function () {
			var self = this,
				params,
				segment;

			function searchError (message, systemData) {
				if (typeof systemData != 'undefined' && systemData[0] !== 0) {
					self.$$controller.error('SEARCH ERROR: '+message, systemData);
				}

				if (typeof systemData == 'undefined' || systemData[0] !== 0) {
					self.searchError(self.$$controller.i18n('FlightsSearchForm', 'searchError_' + message));
				}

				self.scheduleLoading(false);
			}

			if (this.scheduleLoading()) {
				return;
			}

			if (!this.isValid()) {
				this.validaTERROR(true);
				this.processValidation();
				return;
			}

			segment = this.segments()[0];

			params = {
				departure: {
					IATA: segment.items.departure.value().IATA,
					isCity: segment.items.departure.value().isCity
				},
				arrival: {
					IATA: segment.items.arrival.value().IATA,
					isCity: segment.items.arrival.value().isCity
				},
				datePeriodBegin: this.schedulePeriodBegin().getISODate(),
				datePeriodEnd: this.schedulePeriodEnd().getISODate(),
				direct: this.directFlights()
			};

			// Getting schedule
			this.clearSchedule();
			this.scheduleLoading(true);
			this.loadScheduleRequest = this.$$controller.loadData(
				'/flights/search/scheduleRequest',
				{scheduleRequest: JSON.stringify(params)},
				function (data, request) {
					try {
						var results = JSON.parse(data),
							guide = results.guide;

						if (!results.system || !results.system.error) {
							// Processing guide
							// Airlines
							for (var i in guide.airlines) {
								if (guide.airlines.hasOwnProperty(i)) {
									guide.airlines[i] = self.$$controller.getModel('Flights/Common/Airline', guide.airlines[i]);
								}
							}

							// Aircrafts
							for (var i in guide.aircrafts) {
								if (guide.aircrafts.hasOwnProperty(i)) {
									guide.aircrafts[i] = self.$$controller.getModel('BaseStaticModel', guide.aircrafts[i]);
								}
							}

							results = results.flights.search.scheduleResults;

							if (!results.info || !results.info.errorCode) {
								try {
									// Building schedule
									var flights = [],
										visibleFlights = [],
										dates = [],
										visibleDates = [],
										todayTimestamp = Math.floor((new Date()).setHours(0,0,0) / 1000),
										tmp;

									// Constructing flights
									for (var i in results.flights) {
										if (results.flights.hasOwnProperty(i)) {
											tmp = self.$$controller.getModel('Flights/ScheduleSearch/Flight', {
												id: i,
												segments: results.flights[i],
												guide: guide,
												form: self
											});

											flights.push(tmp);
											visibleFlights.push(tmp);
											self.schedule.flightsById[tmp.id] = tmp;
										}
									}

									// Processing days
									for (var i in results.dates) {
										if (results.dates.hasOwnProperty(i)) {
											var dayTimestamp = i.split("-");
											dayTimestamp = Math.floor((new Date(dayTimestamp[0], dayTimestamp[1]-1, dayTimestamp[2], 0, 0, 0)).getTime() / 1000);
											tmp = {
												date: self.$$controller.getModel('Common/Date', i),
												flights: todayTimestamp <= dayTimestamp ? results.dates[i] || [] : []
											};

											// Setting fly dates
											for (var i = 0; i < tmp.flights.length; i++) {
												self.schedule.flightsById[tmp.flights[i]].addScheduleDate(tmp.date);
											}

											dates.push(tmp);
										}
									}

									self.schedule.flights(flights);
									self.schedule.dates(dates);

									self.buildFilters();

									self.doSort(self.sort());
								}
								catch (e) {
									console.error(e);
								}
							}
							else {
								searchError('emptyResult');
							}
						}
						else {
							searchError('systemError', results.system.error);
						}
					}
					catch (e) {
						searchError('brokenJSON', data);
					}

					self.scheduleLoading(false);
				},
				function () {
					searchError('requestFailed', [request.status, request.statusText]);
				}
			);
		};

		FlightsScheduleSearchFormController.prototype.startActualSearch = function (date, flightNumbers) {
			this.searchError(false);

			this.segments()[0].items.departureDate.value(date);
			this.flightNumbers(flightNumbers);

			if (this.delayedSearch && this.$$controller.navigateGetPushStateSupport()) {
				this.goToResults();
			}
			else {
				this.makeSynchronousSeach();
			}
		};

		FlightsScheduleSearchFormController.prototype.buildFilters = function () {
			var tmp,
				self = this,
				flights = this.schedule.flights(),
				filtersOrderObject = {},
				filtersObject = {};

			for (var i = 0; i < this.PFOrder.length; i++) {
				filtersOrderObject[this.PFOrder[i]] = i;

				tmp = this.$$controller.getModel(
					'Common/PostFilter/' + this.PFConfig[this.PFOrder[i]].type,
					{
						config: this.PFConfig[this.PFOrder[i]],
						items: flights,
						onChange: function () {
							self.PFChanged.apply(self, arguments);
						}
					}
				);

				if (tmp.isActive()) {
					this.postFilters.push(tmp);
					this.visiblePostFilters.push(tmp);
				}
			}

			// Sorting
			this.visiblePostFilters.sort(function (a, b) {
				return filtersOrderObject[a.config.name] - filtersOrderObject[b.config.name];
			});

			// Constructing filters object
			this.postFilters().map(function (item) {
				filtersObject[item.config.name] = item;
			});

			this.postFiltersObject(filtersObject);

			// Setting postFilters to work
			this.usePostfilters = true;

			this.PFChanged();
		};

		FlightsScheduleSearchFormController.prototype.PFChanged = function () {
			var self = this,
				filterResults = {},
				filters = this.visiblePostFilters(),
				result,
				flights = this.schedule.flightsById,
				tmp, i, j;

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
				return;
			}

			for (i = 0; i < filters.length; i++) {
				if (filters[i].hasValue()) {
					var t = [];

					for (j in flights) {
						if (flights.hasOwnProperty(j) && filters[i].filter(flights[j])) {
							t.push(flights[j].id);
						}
					}

					filterResults[i] = t;
				}
			}

			// Intersecting filter results
			result = intersectFilterResults(filterResults);

			// Recalculating PFs
			for (i = 0; i < filters.length; i++) {
				if (typeof filters[i].recalculateOptions == 'function') {
					// Creating needed flights list
					tmp = intersectFilterResults(filterResults, i) || Object.keys(flights);

					filters[i].recalculateOptions(
						tmp.map(function (key) {
							return flights[key];
						})
					);
				}
			}

			// Displaying
			for (i in flights) {
				if (flights.hasOwnProperty(i)) {
					tmp = typeof result == 'undefined' || result.indexOf(i) >= 0;
					flights[i].filteredOut = !tmp;
				}
			}

			this.buildVisibleFlights();
		};

		FlightsScheduleSearchFormController.prototype.doSort = function (type) {
			var sortFunc;

			switch (type) {
				case 'depTime':
					sortFunc = function (a, b) {
						return a.depTimeSeconds - b.depTimeSeconds;
					};
					break;
				case 'arrTime':
					sortFunc = function (a, b) {
						return a.arrTimeSeconds - b.arrTimeSeconds;
					};
					break;
				case 'timeEnRoute':
					sortFunc = function (a, b) {
						return a.totalTimeEnRoute.length() - b.totalTimeEnRoute.length();
					};
					break;
			}

			if (sortFunc) {
				this.schedule.flights.sort(sortFunc);
			}

			this.buildVisibleFlights();
		};

		FlightsScheduleSearchFormController.prototype.buildVisibleFlights = function () {
			var flights = [],
				list = this.schedule.flights();

			for (var i = 0; i < list.length; i++) {
				if (!list[i].filteredOut) {
					flights.push(list[i]);
				}
			}

			this.schedule.visibleFlights(flights);
		};

		FlightsScheduleSearchFormController.prototype.abortScheduleSearch = function () {
			if (this.loadScheduleRequest) {
				this.loadScheduleRequest.abort();
				this.scheduleLoading(false);
			}
		};

		FlightsScheduleSearchFormController.prototype.pageTitle = 'FlightsScheduleSearch';

		return FlightsScheduleSearchFormController;
	}
);