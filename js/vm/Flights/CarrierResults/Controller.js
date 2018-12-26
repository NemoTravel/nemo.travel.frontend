'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/Flights/SearchResults/Controller'],
	function (ko, helpers, BaseControllerModel) {
		function FlightsCarrierResultsController(componentParameters) {
			BaseControllerModel.apply(this, arguments);

			this.routeLegs = ko.observable([]);
			this.fares = {};
			this.legs = {};
			this.prices = {};
			this.fareCompareTable = [];
			this.noResultsMatrix = ko.observable([]);

			this.otherDatesRequest = false;

			this.shiftedDateDepartSelected = ko.observable(false);
			this.shiftedDateReturnSelected = ko.observable(false);
			
			this.carrierPossibleSorts = ['depTime', 'arrTime', 'durationOnLeg', 'price', 'transfersDurationOnLeg'];
			this.sortByLeg = ko.observable([]);
			this.filteredDirectOnlyByLeg = ko.observable([]);
			this.directOnlyFilterEnableByLeg = ko.observable([]);

			this.realFlightSelected = ko.computed(function () {
				var legs = this.routeLegs(),
					ret = [];

				for (var i = 0; i < legs.length; i++) {
					if (legs[i].selectedPrice()) {
						ret.push(legs[i].selectedPrice().realFlightsIds);
					}
				}

				ret = helpers.intersectArrays.apply(helpers, ret);

				ret = ret.length ? this.flights[ret[0]] : null;

				return ret;
			}, this);

			// Listening error
			this.error.subscribe(function (newValue) {
				if (newValue == 404) {
					var self = this,
						routeLegs = [],
						segments = this.searchInfo().segments,
						tmp;

					// Mimicking route legs structure
					for (var i = 0; i < segments.length; i++) {
						routeLegs.push({
							date: segments[i].departureDate.offsetDate(0),
							otherDates: ko.observable([]),
							prevDate: null,
							nextDate: null
						});
					}

					this.processBuiltLegs(routeLegs);

					this.noResultsMatrix(routeLegs);

					this.$$controller.loadData(
						'/flights/search/airlineMatrix/' + this.id,
						{},
						function (response) {
							try {
								var data = JSON.parse(response),
									matrix = self.noResultsMatrix();

								for (var legIterator = 0; legIterator < data.flights.search.airlineMatrix.legs.length; legIterator++) {
									var legData = data.flights.search.airlineMatrix.legs[legIterator],
										leg = self.noResultsMatrix()[legIterator],
										otherDates,
										tmp;

									if (leg) {
										otherDates = leg.otherDates();
										tmp = {};

										for (var i = 0; i < legData.matrix.length; i++) {
											if (legData.matrix[i].minPrice && legData.matrix[i].date) {
												tmp[legData.matrix[i].date] = legData.matrix[i].minPrice;
											}
										}

										for (var i = 0; i < otherDates.length; i++) {
											var key = otherDates[i].date.getISODate();

											if (key in tmp && tmp[key]) {
												otherDates[i].minPrice(self.$$controller.getModel('Common/Money', tmp[key]));
											}
											else {
												if (self.searchInfo().tripType != "CR") {
													otherDates[i].active(false);
												}
											}
										}
									}
								}

								self.noResultsMatrix(matrix);
							}
							catch (e) { console.error(e); }
						},
						function () { /* do nothing */ }
					);
				}
			},this);
		}

		// Extending from dictionaryModel
		helpers.extendModel(FlightsCarrierResultsController, [BaseControllerModel]);

		FlightsCarrierResultsController.prototype.legDatesShift = 3;

		FlightsCarrierResultsController.prototype.paramsParsers = {
			rtseg: /^([ac][A-ZА-Я]{3})([ac][A-ZА-Я]{3})(\d{8})(\d{8})$/g,
			segs: /([ac][A-ZА-Я]{3})([ac][A-ZА-Я]{3})(\d{8})/g,
			passengers: /([A-Z]{3})(\d+)/g
		};

		FlightsCarrierResultsController.prototype.$$usedModels = [
			'Flights/Common/Airline',
			'Flights/CarrierResults/Flight',
			'Flights/SearchResults/Flight',
			'Flights/SearchResults/FlightPrice',
			'Flights/SearchResults/FareFeatures',
			'Flights/SearchResults/Leg',
			'Flights/SearchResults/Transfer',
			'Common/Date',
			'Common/Duration',
			'Common/Money',
			'Flights/Common/Geo'
		];

		FlightsCarrierResultsController.prototype.$$i18nSegments = ['FlightsSearchResults', 'FlightsSearchForm'];

		FlightsCarrierResultsController.prototype.clearResults = function () {
			BaseControllerModel.prototype.clearResults.apply(this, arguments);

			this.routeLegs([]);
			this.fares = {};
			this.legs = {};
			this.prices = {};
			this.fareCompareTable = [];

			if (this.otherDatesRequest) {
				this.otherDatesRequest.abort();
				this.otherDatesRequest = false;
			}
		};

		FlightsCarrierResultsController.prototype.makeShiftedDateSearch = function (leg, date, isRT) {
			var data = this.searchInfo();

			date.setHours(0,0,0);
			data.segments[leg].departureDate = date;

			this.$$controller.navigate(
				'results/' + helpers.getFlightsRouteURLAdder('results', this.searchInfo()),
				true,
				'FlightsResults'
			);

		};

		FlightsCarrierResultsController.prototype.getOtherDatesPrices = function () {
			var self = this,
				routeLegs = this.routeLegs();

			this.$$controller.loadData(
				'/flights/search/airlineMatrix/' + this.id,
				{},
				function (response) {
					try {
						var data = JSON.parse(response);

						for (var legIterator = 0; legIterator < data.flights.search.airlineMatrix.legs.length; legIterator++) {
							var legData = data.flights.search.airlineMatrix.legs[legIterator],
								leg = routeLegs[legData.routeNumber],
								otherDates, tmp;

							if (leg) {
								otherDates = leg.otherDates();
								tmp = {};

								for (var i = 0; i < legData.matrix.length; i++) {
									if (legData.matrix[i].minPrice && legData.matrix[i].date) {
										tmp[legData.matrix[i].date] = legData.matrix[i].minPrice;
									}
								}

								for (var i = 0; i < otherDates.length; i++) {
									var key = otherDates[i].date.getISODate();

									if (key in tmp && tmp[key]) {
										otherDates[i].minPrice(self.$$controller.getModel('Common/Money', tmp[key]));
									}
									else {
										if (self.searchInfo().tripType != "CR") {
											otherDates[i].active(false);
										}
									}
								}
							}
						}
					}
					catch (e) { console.error(e); }
				},
				function () { /* do nothing */ }
			);
		};

		FlightsCarrierResultsController.prototype.processBuiltLegs = function (routeLegs) {
			for (var i = 0; i < routeLegs.length; i++) {
				var prevdate = i ? new Date(routeLegs[i - 1].date.dateObject()) : new Date(),
					nextdate = i + 1 < routeLegs.length ? new Date(routeLegs[i + 1].date.dateObject()) : null,
					tmpDates = [],
					tmp = routeLegs[i];

				prevdate.setHours(0, 0, 0, 0);
				prevdate = this.$$controller.getModel('Common/Date', prevdate);

				if (nextdate) {
					nextdate = this.$$controller.getModel('Common/Date', nextdate);
				}

				tmp.date.setHours(0,0,0);

				// Defining prev arrow date - max of prevdate and leg date - (2 * this.legDatesShift + 1) days
				tmp.prevDate = tmp.date.offsetDate( - (2 * this.legDatesShift + 1));

				if (tmp.prevDate.getTimestamp() < prevdate.getTimestamp()) {
					tmp.prevDate = prevdate;
				}

				// Checking whether we can have a date shift backwards
				if (tmp.prevDate.getTimestamp() >= tmp.date.offsetDate(-this.legDatesShift).getTimestamp()) {
					tmp.prevDate = null;
				}

				// Defining next arrow date - leg date + (2 * this.legDatesShift + 1) days
				// Checking will be performed later
				tmp.nextDate = tmp.date.offsetDate(2 * this.legDatesShift + 1);

				for (var j = -this.legDatesShift; j <= this.legDatesShift; j++) {
					var newdate = tmp.date.offsetDate(j);

					newdate.setHours(0, 0, 0);

					tmpDates.push({
						date: newdate,
						active: ko.observable(newdate.getTimestamp() >= prevdate.getTimestamp() && (!nextdate || newdate.getTimestamp() <= nextdate.getTimestamp())),
						minPrice: ko.observable(false)
					});
				}

				tmp.otherDates(tmpDates);

				if (routeLegs.length > i + 1) {
					// Checking next date
					if (routeLegs[i].nextDate.getTimestamp() >= routeLegs[i + 1].date.getTimestamp()) {
						routeLegs[i].nextDate = routeLegs[i + 1].date;
					}

					// Checking whether we can have a date shift forward
					if (routeLegs[i].nextDate.getTimestamp() <= routeLegs[i].date.offsetDate(this.legDatesShift).getTimestamp()) {
						routeLegs[i].nextDate = null;
					}
				}
			}
		};

		FlightsCarrierResultsController.prototype.processSearchResults = function () {
			var setSegmentsGuide = true,
				self = this,
				globalLegs = [],
				carrierData,
				fareArray = [],
				minFares = {},
				tmp;

			this.clearResults();

			if (
				typeof this.$$rawdata.system != 'undefined' &&
				typeof this.$$rawdata.system.error != 'undefined'
			) {
				this.$$error(this.$$rawdata.system.error.message);
			}
			else if (this.$$rawdata.flights.search.results.info.errorCode === 410) {
				this.formActive(true);
				this.isResultsOutdated(true);
				this.error(410);
			}
			else {
				var data = this.$$rawdata.flights.search.airlinesResults;

				// Ids
				this.id = this.$$rawdata.flights.search.request.id;

				// Processing options
				this.options = this.$$rawdata.flights.search.resultData;

				if (
					this.$$rawdata.flights.search.results.info &&
					this.$$rawdata.flights.search.results.info.forcedMessageAsIs
				) {
					this.forcedMessageAsIs(this.$$rawdata.flights.search.results.info.forcedMessageAsIs);
				}

				this.processSearchInfo();

				// FIXME
				if (!data || (data[0].prices instanceof Array && !data[0].prices.length)) {
					this.error(404);
				}
				else {
					try {
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

						// Parsing by company
						// FIXME
						var carrierIter = 0;
						//for (var carrierIter = 0; carrierIter < data.length; carrierIter++) {
						carrierData = data[carrierIter];

						// Processing carrier
						// TODO

						this.fareCompareTable = helpers.cloneObject(carrierData.fareCompareTable);

						// Processing segments
						for (var i in carrierData.segments) {
							if (carrierData.segments.hasOwnProperty(i)) {
								carrierData.segments[i].depTerminal = (carrierData.segments[i].depTerminal || '').replace(/\s/, '');
								carrierData.segments[i].arrTerminal = (carrierData.segments[i].arrTerminal || '').replace(/\s/, '');

								this.segments[i] = this.$$controller.getModel('BaseStaticModel', carrierData.segments[i]);

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

						// Processing Fares
						for (var i = 0; i < carrierData.fareGroups.length; i++) {
							this.fares[carrierData.fareGroups[i].id] = this.$$controller.getModel('BaseStaticModel', carrierData.fareGroups[i]);

							// сортируем опции. сначала бесплатные, потом платные и недоступные
							this.fares[carrierData.fareGroups[i].id].options.sort(function (a, b) {
								if (a.payment === true && b.payment === false) {
									return 1;
								}
								if (a.payment === false && (b.payment === true || b.payment == null)) {
									return -1;
								}
								if (a.payment == null && b.payment != null) {
									return 1;
								}
								if (a.payment != null && b.payment == null) {
									return -1;
								}

								return 0;
							});

							fareArray.push(this.fares[carrierData.fareGroups[i].id]);
						}

						// Processing legs
						for (var i = 0; i < carrierData.flightLegs.length; i++) {
							tmp = {
								id: carrierData.flightLegs[i].id,
								index: i,
								flights: [],
								flightsById: {},
								date: false,
								otherDates: ko.observable([]),
								fareArray: fareArray,
								selectedPrice: ko.observable(),
								minPrice: null,
								prevDate: null,
								nextDate: null,
								checkGroupIsAvailable: function (group, searchResultsController, flights, groups) {
									var result = true;
									var airlineCode = flight.segments[0].marketingCompany.IATA;
									var hideEmptyGroups = groups.length > 5 && airlineCode !== 'R3';
									var hideR3PromoGroup = (group.name === 'Промо' || group.name === 'Promo') && airlineCode === 'R3';

									// Для а\к R3 скрываем колонку с тарифом "Промо", если на плече на этом тарифе нет мест.
									// Также, если на плече больше 5 тарифов, то прячем те, на которых нет мест.
									if (hideR3PromoGroup || hideEmptyGroups) {
										result = flights.reduce(function (result, flight) {
											return result || searchResultsController.prices[flight.id + group.id] && searchResultsController.prices[flight.id + group.id].avlSeats > 0;
										}, false);
									}
									return result;
								}
							};

							for (var j = 0; j < carrierData.flightLegs[i].flights.length; j++) {
								var flight = helpers.cloneObject(carrierData.flightLegs[i].flights[j]);

								for (var k = 0; k < carrierData.flightLegs[i].flights[j].segments.length; k++) {
									flight.segments[k] = this.segments[carrierData.flightLegs[i].flights[j].segments[k]];
								}

								flight.leg = null;

								flight.minPrice = null;
								flight.searchInfo = this.searchInfo();

								flight = this.$$controller.getModel('Flights/CarrierResults/Flight', flight);

								this.flights[flight.id] = flight;

								tmp.flightsById[flight.id] = flight;

								tmp.flights.push(flight);
							}

							// Adding info to legs
							tmp.date = tmp.flights[0].segments[0].depDateTime.offsetDate(0);

							this.legs[tmp.id] = this.$$controller.getModel('BaseStaticModel', tmp);

							for (var j = 0; j < this.legs[tmp.id].flights.length; j++) {
								this.legs[tmp.id].flights[j].leg = this.legs[tmp.id];
							}

							// Setting global legs
							globalLegs.push(this.legs[tmp.id]);
						}

						this.processBuiltLegs(globalLegs);

						// Processing Prices === flights
						for (var i in carrierData.prices) {
							if (carrierData.prices.hasOwnProperty(i)) {
								carrierData.prices[i].id = i;
								this.prices[i] = this.$$controller.getModel('BaseStaticModel', carrierData.prices[i]);

								this.prices[i].fareGroup = this.fares[this.prices[i].fareGroup];
								this.prices[i].flight = this.flights[this.prices[i].flight];
								this.prices[i].totalPrice = self.$$controller.getModel('Common/Money', this.prices[i].totalPrice);

								if (!(this.prices[i].flight.leg.id in minFares) || minFares[this.prices[i].flight.leg.id].totalPrice.amount() > this.prices[i].totalPrice.amount()) {
									minFares[this.prices[i].flight.leg.id] = this.prices[i];
								}

								if (
									!this.prices[i].flight.minPrice ||
									this.prices[i].flight.minPrice.amount() > this.prices[i].totalPrice.amount()
								) {
									this.prices[i].flight.minPrice = this.prices[i].totalPrice;
								}

								for (var j = 0; j < globalLegs.length; j++) {
									if (
										this.prices[i].flight.id in globalLegs[j].flightsById &&
										(
											!globalLegs[j].minPrice ||
											globalLegs[j].minPrice.totalPrice.amount() > this.prices[i].totalPrice.amount()
										)
									) {
										globalLegs[j].minPrice = this.prices[i];
									}
								}
							}
						}

						for (var i in minFares) {
							if (minFares.hasOwnProperty(i) && this.legs.hasOwnProperty(i)) {
								if(this.legs[i].flights.length === 1){
									minFares[i].flight.detailsOpen(true);
								}
								this.legs[i].selectedPrice(minFares[i]);
							}
						}
						//}

						// Processing real prices
						for (var i in this.$$rawdata.flights.search.results.groupsData.prices) {
							if (this.$$rawdata.flights.search.results.groupsData.prices.hasOwnProperty(i)) {
								this.prices[i] = this.$$controller.getModel('Flights/SearchResults/FlightPrice', this.$$rawdata.flights.search.results.groupsData.prices[i]);
								this.prices[i].validatingCompany = this.airlines[this.$$rawdata.flights.search.results.groupsData.prices[i].validatingCompany];
							}
						}

						// Processing real flights
						for (var i = 0; i < this.$$rawdata.flights.search.results.flightGroups.length; i++) {
							var segsarr = [];

							for (var j = 0; j < this.$$rawdata.flights.search.results.flightGroups[i].segments.length; j++) {
								if (this.segments[this.$$rawdata.flights.search.results.flightGroups[i].segments[j]]) {
									segsarr.push(this.segments[this.$$rawdata.flights.search.results.flightGroups[i].segments[j]]);
								}
							}

							for (var j = 0; j < this.$$rawdata.flights.search.results.flightGroups[i].flights.length; j++) {
								this.flights[this.$$rawdata.flights.search.results.flightGroups[i].flights[j].id] = this.$$controller.getModel(
									'Flights/SearchResults/Flight',
									{
										id: this.$$rawdata.flights.search.results.flightGroups[i].flights[j].id,
										rating: this.$$rawdata.flights.search.results.flightGroups[i].flights[j].rating,
										price: this.prices[this.$$rawdata.flights.search.results.flightGroups[i].flights[j].price],
										segments: segsarr,
										createOrderLink: this.$$rawdata.flights.search.results.flightGroups[i].flights[j].createOrderLink,
										searchInfo: this.searchInfo()
									}
								);
							}
						}
						
						this.routeLegs(globalLegs);
						
						this.getOtherDatesPrices();
					}
					catch (e) {
						console.error(e);

						this.$$loading(false);
						this.error(404);
					}
				}
			}
			
			var firstSort = this.carrierPossibleSorts.indexOf(this.options.carrierDefaultSort) >= 0 ? this.options.carrierDefaultSort : this.carrierPossibleSorts[0];
			for (var i = 0; i < this.routeLegs().length; i++) {
				this.directOnlyFilterEnableByLeg()[i] = this.isFlightsWithTransfersOnLeg(i);
				this.carrierSort(firstSort, i);
				this.filteredDirectOnlyByLeg()[i] = false;
			}
			this.directOnlyFilterEnableByLeg(this.directOnlyFilterEnableByLeg());
			this.filteredDirectOnlyByLeg(this.filteredDirectOnlyByLeg());

			this.resultsLoaded(true);
		};
		
		FlightsCarrierResultsController.prototype.carrierSort = function (type, leg) {
			var routeLegs = this.routeLegs();
			switch (type) {
				case 'depTime':
					routeLegs[leg].flights.sort(function(a, b){
						var dif = a.depDateTime.getTimestamp() - b.depDateTime.getTimestamp();
						if (dif !== 0) {
							return dif;
						} else {
							return a.minPrice.normalizedAmount() - b.minPrice.normalizedAmount(); 
						}
					});
					break;
					
				case 'arrTime':
					routeLegs[leg].flights.sort(function(a, b){
						var dif = a.arrDateTime.getTimestamp() - b.arrDateTime.getTimestamp();
						if (dif !== 0) {
							return dif;
						} else {
							return a.minPrice.normalizedAmount() - b.minPrice.normalizedAmount(); 
						}
					});
					break;
					
				case 'durationOnLeg':
					routeLegs[leg].flights.sort(function(a, b){
						var dif = a.totalTimeEnRoute.length() - b.totalTimeEnRoute.length();
						if (dif !== 0) {
							return dif;
						} else {
							return a.minPrice.normalizedAmount() - b.minPrice.normalizedAmount(); 
						}
					});
					break;
					
				case 'price':
					routeLegs[leg].flights.sort(function(a, b){
						return a.minPrice.normalizedAmount() - b.minPrice.normalizedAmount();
					});
					break;
					
				case 'transfersDurationOnLeg':
					routeLegs[leg].flights.sort(function(a, b){
						var dif = (a.totalTimeEnRoute.length() - a.timeEnRoute.length()) - (b.totalTimeEnRoute.length() - b.timeEnRoute.length());
						if (dif !== 0) {
							return dif;
						} else {
							return a.minPrice.normalizedAmount() - b.minPrice.normalizedAmount(); 
						}
					});
					break;
			}
			this.routeLegs([]);
			this.routeLegs(routeLegs);
			this.sortByLeg()[leg] = type;
			this.sortByLeg(this.sortByLeg());
		};
		
		FlightsCarrierResultsController.prototype.filterDirectOnly = function (newValue, leg) {
			var routeLegs = this.routeLegs();
			this.filteredDirectOnlyByLeg()[leg] = newValue;
			this.filteredDirectOnlyByLeg(this.filteredDirectOnlyByLeg());
			for (var i = 0; i < routeLegs[leg].flights.length; i++) {
				if (routeLegs[leg].flights[i].totalTimeEnRoute.length() > routeLegs[leg].flights[i].timeEnRoute.length()) {
					routeLegs[leg].flights[i].isHidden(newValue);
				}
			}
			this.routeLegs([]);
			this.routeLegs(routeLegs);
		};
		
		FlightsCarrierResultsController.prototype.isFlightsWithTransfersOnLeg = function (leg) {
			var routeLegs = this.routeLegs();
			for (var i = 0; i < routeLegs[leg].flights.length; i++) {
				if (routeLegs[leg].flights[i].totalTimeEnRoute.length() > routeLegs[leg].flights[i].timeEnRoute.length()) {
					return true;
				}
			}
			return false;
		};

		return FlightsCarrierResultsController;
	}
);
