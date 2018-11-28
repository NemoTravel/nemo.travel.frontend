'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseStaticModel'],
	function (ko, helpers, BaseModel) {
		function CouplingTable (initialData, controller) {
			BaseModel.apply(this, arguments);

			this.flightsById = {};

			this.isActive = false;
			this.realSortTypes = [];
			this.sort = ko.observable();
			this.legGroupings = [];
			this.selectedFlightsIds = ko.observable();
			this.shownFlights = ko.observable(10);
			this.maxFlights = 0;

			this.detailsPopupOpen = ko.observable(false);
			this.detailsPopupFlight = ko.observable(false);
			this.detailsPopupLeg = ko.observable(0);

			var self = this,
				// Needed for sort types availablilty checking
				availSortIndex = {
					price: [],
					timeEnRoute: [],
					departureTime: []
				};

			// FIXME crutch for 2-leg routes only
			if (this.flights.length && this.flights[0].legs.length > 2) {
				return;
			}

			for (var i = 0; i < this.flights.length; i++) {
				this.flightsById[this.flights[i].id] = this.flights[i];
			}

			for (var siter = 0; siter < this.flights[0].legs.length; siter++) {
				var addObj = {
						flights: ko.observableArray([]),
						selected: ko.observable(),
						legActive: ko.observable(siter == 0)
					},
					tmp = {};

				availSortIndex.price.push({});
				availSortIndex.timeEnRoute.push({});
				availSortIndex.departureTime.push({});

				for (var fiter = 0; fiter < this.flights.length; fiter++) {
					//var key = this.group.getGroupingKey(this.flights[fiter], siter);
					var key = this.flights[fiter].legs[siter].depAirp.IATA + '-' +
						this.flights[fiter].legs[siter].arrAirp.IATA + '-' +
						this.flights[fiter].legs[siter].depDateTime.getISODateTime() + '-' +
						this.flights[fiter].legs[siter].arrDateTime.getISODateTime() + '-' +
						this.flights[fiter].legs[siter].timeEnRoute.length() + '-' +
						this.flights[fiter].legs[siter].transfersCount;

					if (!tmp[key]) {
						tmp[key] = [];
					}

					tmp[key].push(this.flights[fiter].id);

					// Setting data for available sorts detecting
					availSortIndex.timeEnRoute[availSortIndex.timeEnRoute.length - 1][this.flights[fiter].legs[siter].timeEnRoute.length()] = true;
					availSortIndex.departureTime[availSortIndex.departureTime.length - 1][this.flights[fiter].legs[siter].depDateTime.getISODateTime()] = true;
				}

				// Converting
				addObj.flights(Object.keys(tmp).map(function (key) {
					var ret = {
						ids: tmp[key],
						referenceFlight: self.flightsById[tmp[key][0]],
						disabled: ko.observable(false),
						minPrice: null,
						cheapestId: 0,
						otherPrices: 0
					};

					// Additional field for last leg
					if (siter == (self.flights[0].legs.length - 1)) {
						ret.selectedPrice = ko.observable();
					}

					for (var i = 0; i < tmp[key].length; i++) {
						if (
							!ret.minPrice ||
							ret.minPrice.normalizedAmount() >= self.flightsById[tmp[key][i]].getTotalPrice().normalizedAmount()
						) {
							ret.minPrice = self.flightsById[tmp[key][i]].getTotalPrice();
							ret.cheapestId = tmp[key][i];
						}
						else {
							ret.otherPrices++;
						}
					}

					// Setting data for available sorts detecting
					availSortIndex.price[availSortIndex.price.length - 1][ret.minPrice.normalizedAmount()] = true;

					return ret;
				}));

				this.legGroupings.push(addObj);
				this.isActive = this.isActive || this.legGroupings[siter].flights().length > 1;

				if (this.maxFlights == 0 || this.maxFlights < this.legGroupings[siter].flights().length) {
					this.maxFlights = this.legGroupings[siter].flights().length;
				}
			}

			for (var i = 0; i < this.sortTypes.length; i++) {
				if (availSortIndex.hasOwnProperty(this.sortTypes[i])) {
					var hasSort = false;

					for (var j = 0; j < availSortIndex[this.sortTypes[i]].length; j++) {
						hasSort = hasSort || Object.keys(availSortIndex[this.sortTypes[i]][j]).length > 1;
					}

					if (hasSort) {
						this.realSortTypes.push(this.sortTypes[i]);
					}
				}
			}

			this.cheapestSelected = ko.computed(function () {
				var selectedIds = this.selectedFlightsIds() || [],
					cheapest;

				for (var i = 0; i < selectedIds.length; i++) {
					if (
						!cheapest ||
						cheapest.getTotalPrice().normalizedAmount() > this.flightsById[selectedIds[i]].getTotalPrice().normalizedAmount()
					) {
						cheapest = this.flightsById[selectedIds[i]];
					}
				}

				return cheapest;
			}, this);

			this.sort.subscribe(function () {
				var self = this;

				switch (this.sort()) {
					case 'price':
						for (var i = 0; i < this.legGroupings.length; i++) {
							this.legGroupings[i].flights.sort(
								function (a, b) {
									var ret = a.minPrice.normalizedAmount() - b.minPrice.normalizedAmount();

									if (ret == 0) {
										return self.flightsById[a.ids[0]].legs[i].depDateTime.getTimestamp() - self.flightsById[b.ids[0]].legs[i].depDateTime.getTimestamp();
									}

									return ret;
								}
							);
						}
						break;
					case 'timeEnRoute':
						for (var i = 0; i < this.legGroupings.length; i++) {
							this.legGroupings[i].flights.sort(
								function (a, b) {
									var ret = self.flightsById[a.ids[0]].legs[i].timeEnRoute.length() - self.flightsById[b.ids[0]].legs[i].timeEnRoute.length();

									if (ret == 0) {
										return self.flightsById[a.ids[0]].legs[i].depDateTime.getTimestamp() - self.flightsById[b.ids[0]].legs[i].depDateTime.getTimestamp();
									}

									return ret;
								}
							);
						}
						break;
					case 'departureTime':
						for (var i = 0; i < this.legGroupings.length; i++) {
							this.legGroupings[i].flights.sort(
								function (a, b) {
									var ret = self.flightsById[a.ids[0]].legs[i].depDateTime.getTimestamp() - self.flightsById[b.ids[0]].legs[i].depDateTime.getTimestamp();

									if (ret == 0) {
										return a.minPrice.normalizedAmount() - b.minPrice.normalizedAmount();
									}

									return ret;
								}
							);
						}
						break;
//					case 'transfers':
//						break;
				}

			}, this);


			this.sort(this.realSortTypes[0]);

			this.selectVariant(this.legGroupings[0].flights()[0], 0);
		}

		// Extending from dictionaryModel
		helpers.extendModel(CouplingTable, [BaseModel]);

		CouplingTable.prototype.recalculateSelf = function () {
			this.selectedFlightsIds(this.calculateSelectedFlights());

			// Recalculating disabled
			var allPossibleFlights = {},
				// This is needed for price on last leg (selectedPrice)
				possibleFlightsWithoutLastLeg = {};

			for (var i = 0; i < this.legGroupings.length; i++) {
				var tmp = this.legGroupings[i].selected();

				if (tmp.ids) {
					for (var j = 0; j < tmp.ids.length; j++) {
						allPossibleFlights[tmp.ids[j]] = tmp.ids[j];

						if (i != (this.legGroupings.length - 1)) {
							possibleFlightsWithoutLastLeg[tmp.ids[j]] = tmp.ids[j];
						}
					}
				}
			}

			possibleFlightsWithoutLastLeg = Object.keys(possibleFlightsWithoutLastLeg).map(function (key) {return possibleFlightsWithoutLastLeg[key]});

			for (var i = 0; i < this.legGroupings.length; i++) {
				var tmp = this.legGroupings[i].flights(),
					disabled = [];

				for (var j = 0; j < tmp.length; j++) {
					var found = false;

					for (var k = 0; k < tmp[j].ids.length; k++) {
						if (typeof allPossibleFlights[tmp[j].ids[k]] != 'undefined') {
							found = true;
							break;
						}
					}

					tmp[j].disabled(!found);

					if (i == (this.legGroupings.length - 1)) {
						var possible = null,
							cheapest = null;

						if (this.legGroupings.length == 1) {
							possible = tmp[j].ids;
						}
						else {
							possible = helpers.intersectArrays(possibleFlightsWithoutLastLeg, tmp[j].ids) || [];
						}

						for (var l = 0; l < possible.length; l++) {
							if (!cheapest || cheapest.getTotalPrice().normalizedAmount() > this.flightsById[possible[l]].getTotalPrice().normalizedAmount()) {
								cheapest = this.flightsById[possible[l]];
							}
						}

						if (cheapest) {
							tmp[j].selectedPrice(cheapest.getTotalPrice());
						}
					}
				}
			}
		};

		CouplingTable.prototype.calculateSelectedFlights = function () {
			var ret;

			for (var i = 0; i < this.legGroupings.length; i++) {
				var tmp = [],
					flights = this.legGroupings[i].selected(),
					j;

				if (flights && flights.ids) {
					for (j = 0; j < flights.ids.length; j++) {
						if (
							typeof ret == 'undefined' ||
							ret.indexOf(flights.ids[j]) >= 0
						) {
							tmp.push(flights.ids[j]);
						}
					}
				}

				ret = tmp;
			}

			return ret || [];
		};

		CouplingTable.prototype.selectVariant = function (data, leg) {
			if (this.group.resultsController.bookingCheckInProgress()) {
				return;
			}

			this.legGroupings[leg].selected(data);

			// Checking whether we have flights selected
			// If not - select first variant that suits us
			if (this.calculateSelectedFlights().length == 0) {
				var selected = data.ids;

				// For every leg
				for (var i = 0; i < this.legGroupings.length; i++) {
					var flights = this.legGroupings[i].flights();

					for (var j = 0; j < flights.length; j++) {
						if (flights[j].ids.indexOf(data.cheapestId) >= 0) {
							this.legGroupings[i].selected(flights[j]);
							break;
						}
					}
				}
			}

			this.recalculateSelf();
		};

		CouplingTable.prototype.sortTypes = ['price','departureTime','timeEnRoute'/*,''*/];

		return CouplingTable;
	}
);