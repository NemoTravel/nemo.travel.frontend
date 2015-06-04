'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseControllerModel'],
	function (ko, helpers, BaseControllerModel) {
		function FlightsSearchResultsController (componentParameters) {
			BaseControllerModel.apply(this, arguments);

			var self = this;

			this.postfiltersData = {
				configs: {
					transfersCount: {
						name: 'transfersCount',
						type: 'String',
						isLegged: false,
						legNumber: 0,
						getter: function (obj) {
							return [[obj.transfersCount, obj.transfersCount]];
						},
						options: {
							// Filter-specific options here
							valuesSorter: function (a,b) {
								return a.value - b.value;
							}
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
						options: {/* Filter-specific options here */}
					},
					carrier: {
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
						options: {
							// Filter-specific options here
							valuesSorter: function (a,b) {
								return a.value.name.localeCompare(b.value.name);
							}
						}
					},
					transfersLength: {
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
							valuesSorter: function (a,b) {
								var sort = {
									n: 0,
									m: 1,
									d: 2,
									e: 3
								};

								return sort[a.key] - sort[b.key];
							}
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
							valuesSorter: function (a,b) {
								var sort = {
									n: 0,
									m: 1,
									d: 2,
									e: 3
								};

								return sort[a.key] - sort[b.key];
							}
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
							valuesSorter: function (a,b) {
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
							return [[obj.legs[this.legNumber].arrAirp.IATA, obj.legs[this.legNumber].arrAirp]];
						},
						options: {
							// Filter-specific options here
							valuesSorter: function (a,b) {
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
						options: {/* Filter-specific options here */}
					}
				},
				order: ['price','transfersCount','carrier','transfersLength','departureTime','arrivalTime','departureAirport','arrivalAirport','timeEnRoute'],
				grouppable: ['departureTime','arrivalTime']
			};

			this.segments = {};
			this.prices = {};
			this.flights = {};
			this.airlines = {};
			this.airlinesByRating = [];
			this.flightsCompareTableDirect = null;
			this.flightsCompareTableTransfer = null;

			this.groups = ko.observableArray([]);
			this.hasVisibleResult = ko.observable(true);

			this.formActive = ko.observable(false);

			this.showcase = {
				recommended: ko.observable(null),
				fastest: ko.observable(null),
				cheapest: ko.observable(null),
				bestCompanies: ko.observable()
			};

			this.searchInfo = {
				segments: [],
				tripType: '',
				passengers: {},
				vicinityDates: 0
			};

			this.postFilters = ko.observableArray([]);
			this.visiblePostFilters = ko.observableArray([]);
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
							return b.recommendRating() - a.recommendRating();
						});
						break;
				}
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
		}

		// Extending from dictionaryModel
		helpers.extendModel(FlightsSearchResultsController, [BaseControllerModel]);

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
			alert('Booking flights: ' + flids);
		};

		FlightsSearchResultsController.prototype.getTimeType = function (d) {
			var dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0),
				timeFromDayStart = 0,
				timeType = 'n';

			// Defining time type
			timeFromDayStart = Math.floor(
				(
					d.getTime() -
						dayStart.getTime()
					) /
					1000
			);

			for (var i = 0; i < this.PFTimeTypes.length; i++) {
				if (timeFromDayStart < this.PFTimeTypes[i].seconds) {
					timeType = this.PFTimeTypes[i].type;
					break;
				}
			}

			return timeType;
		}

		FlightsSearchResultsController.prototype.buildModels = function () {
			var setSegmentsGuide = true,
				self = this,
				tmpGroups = {},
				tmp;

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

			this.airlinesByRating = Object.keys(this.airlines)
				.map(function (key) {return self.airlines[key]})
				.sort(function (a, b) {
					return parseFloat(b.rating) - parseFloat(a.rating);
				});

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
					this.prices[i] = this.$$controller.getModel('Flights/SearchResults/FlightPrice', this.$$rawdata.flights.search.results.groupsData.prices[i]);
					this.prices[i].validatingCompany = this.airlines[this.$$rawdata.flights.search.results.groupsData.prices[i].validatingCompany];
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
				}
			}

			for (var i in tmpGroups) {
				if (tmpGroups.hasOwnProperty(i)) {
					var tmp = this.$$controller.getModel('Flights/SearchResults/Group', {flights: tmpGroups[i]});

					// Setting group "conjunction table"
					tmp.buildCouplingTable(this.flights);

					this.groups.push(tmp);
				}
			}

			this.flightsCompareTableDirect = this.$$controller.getModel('Flights/SearchResults/CompareTable', {groups: this.groups(), direct:true});
			this.flightsCompareTableTransfer = this.$$controller.getModel('Flights/SearchResults/CompareTable', {groups: this.groups(), direct:false});

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
					var pfConfig,
						pfGroup = [];

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

						this.postFilters.push(tmp);

						if (tmp.isActive()) {
							if (this.postfiltersData.grouppable.indexOf(pfConfig.name) >= 0) {
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
								'Flights/SearchResults/'+this.postfiltersData.configs[this.postfiltersData.order[i]].type+'PFGroup',
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
						'common/PostFilter/' + this.postfiltersData.configs[this.postfiltersData.order[i]].type,
						{
							config: this.postfiltersData.configs[this.postfiltersData.order[i]],
							items: this.flights,
							onChange: function () {self.PFChanged.apply(self, arguments);}
						}
					);

					if (tmp.isActive()) {
						this.postFilters.push(tmp);
						this.visiblePostFilters.push(tmp);
					}
				}
			}

			// Sorting
			this.postFilters.sort(function (a, b) {
//				if (a.config.isLegged && b.config.isLegged) {
//					return a.config.legNumber - b.config.legNumber;
//				}
//				else {
//					return filtersOrderObject[a.config.name] - filtersOrderObject[b.config.name];
//				}
				return filtersOrderObject[a.config.name] - filtersOrderObject[b.config.name] || a.config.legNumber - b.config.legNumber;
			});

			// Setting postFilters to work
			this.usePostfilters = true;
		};

		FlightsSearchResultsController.prototype.PFChanged = function (filter) {
			var filterResults = {},
				filters = this.postFilters(),
				groups = this.groups(),
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

			// Recalculating groups
			// We can not rely on knockout's subscribe mechanism due to too many recalculations
			// on each flights' filteredOut status change
			for (var i = 0; i < groups.length; i++) {
				groups[i].recalculateSelf();
			}

			this.hasVisibleResult(visibleResult);

			this.setShowcase();
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
				bestCompaniesCount = 3;

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

			this.showcase.cheapest(cheapestGroup ? cheapestGroup.clone() : cheapestGroup);

			if (!this.showcase.bestCompanies()) {
				for (var i = 0; i < this.airlinesByRating.length; i++) {
					var showcaseBC = null;

					for (var j in this.flights) {
						if (this.flights.hasOwnProperty(j)) {
							if (
								this.flights[j].getValidatingCompany().IATA == this.airlinesByRating[i].IATA &&
								(
									showcaseBC == null ||
									showcaseBC.recommendRating < this.flights[j].recommendRating
								)
							) {
								showcaseBC = this.flights[j];
							}
						}
					}

					if (showcaseBC) {
						var tmp = this.$$controller.getModel('Flights/SearchResults/Group', {flights: [showcaseBC.clone()]});

						// Setting group "conjunction table"
						tmp.buildCouplingTable(this.flights);

						bestCompanies.push(tmp);
					}

					if (bestCompanies.length >= bestCompaniesCount) {
						break;
					}
				}

				this.showcase.bestCompanies(bestCompanies);
			}
		};

		FlightsSearchResultsController.prototype.$$usedModels = [
			'Flights/SearchResults/FlightPrice',
			'Flights/SearchResults/Flight',
			'Flights/SearchResults/Group',
			'Flights/SearchResults/CouplingTable',
			'Flights/SearchResults/StringPFGroup',
			'Flights/SearchResults/CompareTable',
			'common/Date',
			'common/Duration',
			'common/Money',
			'common/PostFilter/Abstract',
			'common/PostFilter/String',
			'common/PostFilter/Number',
			'Flights/common/Geo'
		];

		FlightsSearchResultsController.prototype.$$KOBindings = ['PostFilters'];

		FlightsSearchResultsController.prototype.dataURL = function () {
			return '/flights/search/results/'+this.$$componentParameters.route[0];
		};

		return FlightsSearchResultsController;
	}
);