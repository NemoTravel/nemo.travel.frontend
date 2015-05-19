'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseControllerModel'],
	function (ko, helpers, BaseControllerModel) {
		function FlightsSearchResultsController (componentParameters) {
			BaseControllerModel.apply(this, arguments);

			this.postfiltersData = {
				configs: {
					'transfersCount': {
						name: 'transfersCount',
						type: 'String',
						isLegged: false,
						legNumber: 0,
						getter: function (obj) {
							return [[obj.transfersCount, obj.transfersCount]];
						},
						options: {/* Filter-specific options here */}
					},
					'price': {
						name: 'price',
						type: 'Number',
						isLegged: false,
						legNumber: 0,
						getter: function (obj) {
							return obj.getTotalPrice().amount();
						},
						options: {/* Filter-specific options here */}
					},
					'carrier': {
						name: 'carrier',
						type: 'String',
						isLegged: false,
						legNumber: 0,
						getter: function (item) {
							var ret = [];

							for (var i = 0; i < item.segments.length; i++) {
								ret.push([item.segments[i].operatingCompany.IATA, item.segments[i].operatingCompany])
							}

							return ret;
						},
						options: {/* Filter-specific options here */}
					},
					'transfersLength': {
						name: 'transfersLength',
						type: 'Number',
						isLegged: false,
						legNumber: 0,
						getter: function (obj) {
							if (obj.totalTimeTransfers > 0) {
								return obj.totalTimeTransfers;
							}
						},
						options: {/* Filter-specific options here */}
					},
					'departureTime': {
						name: 'departureTime',
						type: 'Number',
						isLegged: true,
						legNumber: 0,
						getter: function (obj) {
							return obj.legs[this.legNumber].depDateTime.getTimestamp();
						},
						options: {/* Filter-specific options here */}
					},
					'arrivalTime': {
						name: 'arrivalTime',
						type: 'Number',
						isLegged: true,
						legNumber: 0,
						getter: function (obj) {
							return obj.legs[this.legNumber].arrDateTime.getTimestamp();
						},
						options: {/* Filter-specific options here */}
					},
					'departureAirport': {
						name: 'departureAirport',
						type: 'String',
						isLegged: true,
						legNumber: 0,
						getter: function (obj) {
							return [[obj.legs[this.legNumber].depAirp.IATA, obj.legs[this.legNumber].depAirp]];
						},
						options: {/* Filter-specific options here */}
					},
					'arrivalAirport': {
						name: 'arrivalAirport',
						type: 'String',
						isLegged: true,
						legNumber: 0,
						getter: function (obj) {
							return [[obj.legs[this.legNumber].arrAirp.IATA, obj.legs[this.legNumber].arrAirp]];
						},
						options: {/* Filter-specific options here */}
					},
					'timeEnRoute': {
						name: 'timeEnRoute',
						type: 'Number',
						isLegged: false,
						legNumber: 0,
						getter: function (obj) {
							return obj.totalTimeEnRoute.length();
						},
						options: {/* Filter-specific options here */}
					}
				},
				order: ['price','transfersCount','carrier','transfersLength','departureTime','arrivalTime','departureAirport','arrivalAirport','timeEnRoute']
			};

			this.segments = {};
			this.prices = {};
			this.flights = {};
			this.airlines = {};

			this.groups = ko.observableArray([]);
			this.hasVisibleResult = ko.observable(true);

			this.showcase = {
				recommended: ko.observable(null),
				fastest: ko.observable(null),
				cheapest: ko.observable(null),
				bestCompanies: []
			};

			this.searchInfo = {
				segments: [],
				tripType: '',
				passengers: {},
				vicinityDates: 0
			};

			this.postfilters = ko.observableArray([]);
			this.usePostfilters = false;

			this.possibleSorts = ['price', 'durationOnLeg', 'recommended'];
			this.sort = ko.observable(null);

			this.sort.subscribe(function (newValue) {
				switch (newValue) {
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
					case 'recommended':
						this.groups.sort(function (a, b) {
							return a.recommendRating() - b.recommendRating();
						});
						break;
				}
			}, this);

			this.postFiltersHaveValue = ko.computed(function () {
				var postfilters = this.postfilters();

				for (var i = 0; i < postfilters.length; i++) {
					if (postfilters[i].hasValue()) {
						return true;
					}
				}

				return false;
			}, this);
		}

		// Extending from dictionaryModel
		helpers.extendModel(FlightsSearchResultsController, [BaseControllerModel]);

		// Own prototype stuff
		FlightsSearchResultsController.prototype.buildModels = function () {
			var setSegmentsGuide = true,
				self = this,
				tmpGroups = {},
				filtersOrderObject = {},
				tmp,
				mindur, maxdur, minprice, maxprice;

			// Processing search info
			// Segments
			for (var i = 0; i < this.$$rawdata.flights.search.request.segments.length; i++) {
				var data = this.$$rawdata.flights.search.request.segments[i];

				// departureDate = 2015-04-11T00:00:00
				this.searchInfo.segments.push({
					departure: this.$$controller.getModel('Flights/common/Geo', {data: data.departure, guide: this.$$rawdata.guide}),
					arrival: this.$$controller.getModel('Flights/common/Geo', {data: data.arrival, guide: this.$$rawdata.guide}),
					departureDate: this.$$controller.getModel('common/Date', data.departureDate)
				});
			}

			// Processing passengers
			for (var i = 0; i < this.$$rawdata.flights.search.request.passengers.length; i++) {
				this.searchInfo.passengers[this.$$rawdata.flights.search.request.passengers[i].type] = this.$$rawdata.flights.search.request.passengers[i].count;
			}

			// Processing other options
			this.searchInfo.tripType = this.$$rawdata.flights.search.request.parameters.searchType;
			this.searchInfo.vicinityDates = this.$$rawdata.flights.search.request.parameters.aroundDates != 0;

			// Processing guide
			// Processing airlines
			for (var i in this.$$rawdata.guide.airlines) {
				if (this.$$rawdata.guide.airlines.hasOwnProperty(i)) {
					this.airlines[i] = this.$$controller.getModel('BaseStaticModel', this.$$rawdata.guide.airlines[i]);
				}
			}

			// Processing segments
			for (var i in this.$$rawdata.flights.search.results.groupsData.segments) {
				if (this.$$rawdata.flights.search.results.groupsData.segments.hasOwnProperty(i)) {
					this.segments[i] = this.$$controller.getModel('BaseStaticModel', this.$$rawdata.flights.search.results.groupsData.segments[i]);

					// Times
					this.segments[i].depDateTime = this.$$controller.getModel('common/Date', this.segments[i].depDateTime);
					this.segments[i].arrDateTime = this.$$controller.getModel('common/Date', this.segments[i].arrDateTime);

					// Time in air - from minutes to seconds
					this.segments[i].flightTime *= 60;

					// Companies
					this.segments[i].marketingCompany = this.airlines[this.segments[i].marketingCompany];
					this.segments[i].operatingCompany = this.airlines[this.segments[i].operatingCompany];

					this.segments[i].depAirp = this.$$controller.getModel(
						'Flights/common/Geo',
						{
							data: {
								IATA: this.segments[i].depAirp
							},
							guide: setSegmentsGuide ? this.$$rawdata.guide : null
						}
					);

					// Guide for Flights/common/Geo is already set
					this.segments[i].arrAirp = this.$$controller.getModel(
						'Flights/common/Geo',
						{
							data: {
								IATA: this.segments[i].arrAirp
							},
							guide: null
						}
					);

					setSegmentsGuide = false;
				}
			}

			// Processing price objects
			for (var i in this.$$rawdata.flights.search.results.groupsData.prices) {
				if (this.$$rawdata.flights.search.results.groupsData.prices.hasOwnProperty(i)) {
					this.$$rawdata.flights.search.results.groupsData.prices[i].validatingCompany = this.airlines[this.$$rawdata.flights.search.results.groupsData.prices[i].validatingCompany];
					this.prices[i] = this.$$controller.getModel('Flights/SearchResults/FlightPrice', this.$$rawdata.flights.search.results.groupsData.prices[i]);
				}
			}

			// Processing flights (iterating over groups because flights are grouped by routes)
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
							price: this.prices[source.flights[j].price],
							segments: segsarr
						}
					);

					if (typeof minprice == 'undefined' || minprice > this.flights[source.flights[j].id].getTotalPrice().normalizedAmount()) {
						minprice = this.flights[source.flights[j].id].getTotalPrice().normalizedAmount();
					}

					if (typeof maxprice == 'undefined' || maxprice < this.flights[source.flights[j].id].getTotalPrice().normalizedAmount()) {
						maxprice = this.flights[source.flights[j].id].getTotalPrice().normalizedAmount();
					}

					if (typeof mindur == 'undefined' || mindur > this.flights[source.flights[j].id].totalTimeEnRoute.length()) {
						mindur = this.flights[source.flights[j].id].totalTimeEnRoute.length();
					}

					if (typeof maxdur == 'undefined' || maxdur < this.flights[source.flights[j].id].totalTimeEnRoute.length()) {
						maxdur = this.flights[source.flights[j].id].totalTimeEnRoute.length();
					}
				}
			}

			// Creating flight groups (we group by same price and validating company)
			// Also - post-processing flights for them to calculate their "recommended" rating
			// that relies on maximum/minimum values for all flights
			for (var i in this.flights) {
				if (this.flights.hasOwnProperty(i)) {
					tmp = this.flights[i].getTotalPrice().normalizedAmount() + '-' + this.flights[i].getTotalPrice().currency() + '-' + this.flights[i].getValidatingCompany();

					if (!tmpGroups[tmp]) {
						tmpGroups[tmp] = [];
					}

					tmpGroups[tmp].push(this.flights[i]);

					this.flights[i].calculateRecommendRating(mindur, maxdur, minprice, maxprice);
				}
			}

			for (var i in tmpGroups) {
				if (tmpGroups.hasOwnProperty(i)) {
					this.groups.push(
						this.$$controller.getModel('Flights/SearchResults/Group', {flights: tmpGroups[i]})
					);
				}
			}

			this.buildPFs();

			this.sort(this.possibleSorts[0]);

			this.setShowcase();
		};

		FlightsSearchResultsController.prototype.buildPFs = function () {
			var self = this,
				filtersOrderObject = {},
				tmp;

			// Creating filters
			// Preparing filters array - flipping
			for (var key in this.postfiltersData.order ) {
				if (this.postfiltersData.order.hasOwnProperty(key)) {
					filtersOrderObject[this.postfiltersData.order[key]] = key;
				}
			}

			// Creating
			for (var i = 0; i < this.postfiltersData.order.length; i++) {
				if (this.postfiltersData.configs[this.postfiltersData.order[i]].isLegged) {
					var pfConfig;

					for (var j = 0; j < this.searchInfo.segments.length; j++) {
						pfConfig = helpers.cloneObject(this.postfiltersData.configs[this.postfiltersData.order[i]]);

						pfConfig.legNumber = j;

						tmp = this.$$controller.getModel(
							'common/PostFilter/' + pfConfig.type,
							{
								config: pfConfig,
								items: this.flights,
								onChange: function () {self.PFChanged.apply(self, arguments);}
							}
						);

						if (tmp.isActive()) {
							this.postfilters.push(tmp);
						}
					}
				}
				else {
					tmp = this.$$controller.getModel(
						'common/PostFilter/' + this.postfiltersData.configs[this.postfiltersData.order[i]].type,
						{
							config: this.postfiltersData.configs[this.postfiltersData.order[i]],
							items: this.flights,
							onChange: function () {self.PFChanged.apply(self, arguments);}
						}
					);

					if (tmp.isActive()) {
						this.postfilters.push(tmp);
					}
				}
			}

			// Sorting
			this.postfilters.sort(function (a, b) {
				if (a.config.isLegged && b.config.isLegged) {
					return a.config.legNumber - b.config.legNumber;
				}
				else {
					return filtersOrderObject[a.config.name] - filtersOrderObject[b.config.name];
				}
			});

			// Setting postfilters to work
			this.usePostfilters = true;
		};

		FlightsSearchResultsController.prototype.PFChanged = function (filter) {
			var filterResults = {},
				filters = this.postfilters(),
				result,
				visibleResult = false,
				tmp,i,j;

			if (!this.usePostfilters) {
				return;
			}

			for (i = 0; i < filters.length; i++) {
				if (filters[i].hasValue()) {
					var t =[];

					for (j in this.flights) {
						if (this.flights.hasOwnProperty(j) && filters[i].filter(this.flights[j])) {
							t.push(this.flights[j].id);
						}
					}

					filterResults[i] = t;
				}
			}

			// Intersecting filter results
			for (var i in filterResults) {
				if (filterResults.hasOwnProperty(i)) {
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

			// Displaying
			for (var i in this.flights) {
				if (this.flights.hasOwnProperty(i)) {
					tmp = typeof result == 'undefined' || result.indexOf(parseInt(i)) >= 0;
					this.flights[i].filteredOut(!tmp);

					if (tmp) {
						visibleResult = true;
					}
				}
			}

			this.hasVisibleResult(visibleResult);

			this.setShowcase();
		};

		FlightsSearchResultsController.prototype.PFClearAll = function () {
			var filters = this.postfilters();

			this.usePostfilters = false;
			for (var i = 0; i < filters.length; i++) {
				filters[i].clear();
			}
			this.usePostfilters = true;

			this.PFChanged();
		};

		FlightsSearchResultsController.prototype.setShowcase = function () {
			// Defining best flight
			var bestFlight = null,
				fastestFlight = null,
				cheapestGroup = null,
				groups = this.groups();

			for (var i in this.flights) {
				if (this.flights.hasOwnProperty(i) && !this.flights[i].filteredOut()) {
					if(!bestFlight || bestFlight.recommendRating < this.flights[i].recommendRating) {
						bestFlight = this.flights[i];
					}

					if(!fastestFlight || fastestFlight.totalTimeEnRoute.length() > this.flights[i].totalTimeEnRoute.length()) {
						fastestFlight = this.flights[i];
					}
				}
			}

			this.showcase.recommended(bestFlight);
			this.showcase.fastest(fastestFlight);

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

			this.showcase.cheapest(cheapestGroup);

			// TODO compile best flights for best companies
		};

		FlightsSearchResultsController.prototype.$$usedModels = [
			'Flights/SearchResults/FlightPrice',
			'Flights/SearchResults/Flight',
			'Flights/SearchResults/Group',
			'common/Date',
			'common/Duration',
			'common/Money',
			'common/PostFilter/Abstract',
			'common/PostFilter/String',
			'common/PostFilter/Number',
			// FIXME move to common location
			'Flights/common/Geo'
		];

		FlightsSearchResultsController.prototype.$$KOBindings = ['PostFilters'];

		FlightsSearchResultsController.prototype.dataURL = function () {
			return '/flights/search/results/'+this.$$componentParameters.route[0];
		};

		return FlightsSearchResultsController;
	}
);