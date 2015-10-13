'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseStaticModel'],
	function (ko, helpers, BaseModel) {
		function Group (initialData) {
			BaseModel.apply(this, arguments);

			var self = this;

			this.id = Group.prototype.globalIdIterator++;

			this.flightsById = {};
			this.legGroupings = [];
			this.recalculateSelectedFlights = true;

			this.isDirectGroup = false;

			this.carriersMismatch = ko.observable(false);
			this.carriersMismatchNames = ko.observable([]);

			this.filteredOut = ko.observable(false);
			this.selectedFlightsIds = ko.observable([]);

			this.couplingTable = null;
			this.couplingTableOpen = ko.observable(false);

			for (var i = 0; i < this.flights.length; i++) {
				this.flightsById[this.flights[i].id] = this.flights[i];
			}

			for (var siter = 0; siter < this.flights[0].legs.length; siter++) {
				var addObj = {
						options: [],
						selected: ko.observable(),

						open: ko.observable(false),
						detailsOpen: ko.observable(false),

						setOptionDisable: function (option, item) {
							ko.applyBindingsToNode(
								option,
								{
									disable: item.disabled
								},
								item
							);
						}
					},
					tmpIter,
					tmp = {},
					tmpSeats = {},
					key;

				for (var fiter = 0; fiter < this.flights.length; fiter++) {
					key = this.getGroupingKey(this.flights[fiter], siter);

					if (!tmp[key]) {
						tmp[key] = [];
						tmpSeats[key] = null;
					}

					tmp[key].push(this.flights[fiter].id);

					if (
						this.flights[fiter].legs[siter].availSeats > 0 &&
						(
							tmpSeats[key] === null ||
							this.flights[fiter].legs[siter].availSeats < tmpSeats[key]
						)
					) {
						tmpSeats[key] = this.flights[fiter].legs[siter].availSeats;
					}
				}

				// Converting to array
				tmpIter = Object.keys(tmp);
				for (var i = 0; i < tmpIter.length; i++) {
					var adder = {
						flights: tmp[tmpIter[i]],
						uncombinable: ko.observableArray([]),
						disabled: ko.observable(false),
						availSeats: tmpSeats[tmpIter[i]]
					};

					//for (var j = 0; j < adder.flights.length; j++) {
					//	tmp = this.flightsById[adder.flights[j]].legs[siter].availSeats;
					//	if (adder.avlSeats === null || tmp < adder.avlSeats) {
					//		adder.avlSeats = tmp;
					//	}
					//}

					addObj.options.push(
						adder
					);
				}

				// Add sorting
				addObj.options.sort(function (a, b) {
					var af = self.flightsById[a.flights[0]],
						bf = self.flightsById[b.flights[0]];

					if (af.legs[siter].depDateTime.getTimestamp() != bf.legs[siter].depDateTime.getTimestamp()) {
						return af.legs[siter].depDateTime.getTimestamp() - bf.legs[siter].depDateTime.getTimestamp();
					}
					else {
						return af.legs[siter].arrDateTime.getTimestamp() - bf.legs[siter].arrDateTime.getTimestamp();
					}
				});

				addObj.selected(addObj.options[0]);

				// Setting listener to addObj.selected to recalculate selected flights
				addObj.selected.subscribe(function () {
					if (this.recalculateSelectedFlights) {
						this.selectedFlightsIds(this.calculateSelectedFlights());
					}

					this.recalculateUncombinable();
				}, this);

				addObj.selectableCount = ko.computed(function () {
					var ret = 0;

					for (var i = 0; i < this.options.length; i++) {
						if (!this.options[i].disabled()) {
							ret++;
						}
					}

					return ret;
				}, addObj);

				this.legGroupings.push(addObj);
			}

			this.selectedFlightsIds(this.calculateSelectedFlights());

			this.recalculateUncombinable();

			this.recalculateSelf();

			this.durationOnLeg = ko.computed(function () {
				var duration = 0,
					selectedFlight;

				if (this.selectedFlightsIds().length) {
					selectedFlight = this.flightsById[this.selectedFlightsIds()[0]];
				}

				if (selectedFlight) {
					for (var i = 0; i < selectedFlight.timeEnRouteByLeg.length; i++) {
						if (selectedFlight.timeEnRouteByLeg[i].length() < duration) {
							duration = selectedFlight.timeEnRouteByLeg[i].length();
						}
					}
				}

				return duration;
			}, this);
			this.durationOnLegString = ko.computed(function () {
				var duration = 0,
					selectedFlight;

				if (this.selectedFlightsIds().length) {
					selectedFlight = this.flightsById[this.selectedFlightsIds()[0]];
				}

				if (selectedFlight) {
					for (var i = 0; i < selectedFlight.timeEnRouteByLeg.length; i++) {
						if (selectedFlight.timeEnRouteByLeg[i].length() > duration) {
							duration = selectedFlight.timeEnRouteByLeg[i].length();
						}
					}
				}

				return this.$$controller.getModel('Common/Duration', duration);
			}, this);
			this.recommendRating = ko.computed(function () {
				return this.selectedFlightsIds().length ? this.flightsById[this.selectedFlightsIds()[0]].recommendRating : 0;
			}, this);

			for (var i = 0; i < this.flights.length; i++) {
				this.isDirectGroup = this.isDirectGroup || this.flights[i].isDirect;
			}

			this.selectedFlight = ko.computed(function () {
				return this.selectedFlightsIds().length ? this.flightsById[this.selectedFlightsIds()[0]] : this.flights[0];
			}, this);
		}
		// Extending from dictionaryModel
		helpers.extendModel(Group, [BaseModel]);

		Group.prototype.globalIdIterator = 0;

		Group.prototype.getGroupingKey = function (flight, legNumber) {
			return flight.legs[legNumber].depAirp.IATA + '-' +
				flight.transfers[legNumber].length + '-' +
				flight.legs[legNumber].arrAirp.IATA + '-' +
				flight.legs[legNumber].depDateTime.getISODateTime() + '-' +
				flight.legs[legNumber].arrDateTime.getISODateTime() + '-' +
				flight.legs[legNumber].timeEnRoute.length() + '-' +
				flight.getTotalPrice().normalizedAmount();
		};

		Group.prototype.buildCouplingTable = function (flights) {
			var usedFlights = [],
				price = this.getTotalPrice().normalizedAmount(),
				minprice = price / 2,
				maxprice = price * 2;

			for (var i in flights) {
				if (flights.hasOwnProperty(i)) {
					if (
						flights[i].getValidatingCompany().IATA == this.getValidatingCompany().IATA &&
						flights[i].getTotalPrice().normalizedAmount() > minprice &&
						flights[i].getTotalPrice().normalizedAmount() < maxprice
					) {
						usedFlights.push(flights[i]);
					}
				}
			}

			if (usedFlights.length) {
				this.couplingTable = this.$$controller.getModel('Flights/SearchResults/CouplingTable', {flights: usedFlights, group: this});
			}
		};

		Group.prototype.recalculateSelf = function () {
			var i, j, k,
				tmp,
				filteredOut = true,
				carriersMismatch = false,
				carriersMismatchData = {},
				carriersMismatchDataArray = [];

			this.recalculateSelectedFlights = false;

			// Calculating filteredOut status
			for (i = 0; i < this.flights.length; i++) {
				filteredOut = filteredOut && this.flights[i].filteredOut();

				carriersMismatch = carriersMismatch || this.flights[i].carriersMismatch;

				if (this.flights[i].carriersMismatch) {
					carriersMismatch = true;

					for (j in this.flights[i].carriersMismatchData) {
						if (this.flights[i].carriersMismatchData.hasOwnProperty(j)) {
							carriersMismatchData[j] = this.flights[i].carriersMismatchData[j];
						}
					}
				}
			}

			this.filteredOut(filteredOut);

			if (this.filteredOut()) {
				return;
			}

			this.carriersMismatch(carriersMismatch);

			for (i in carriersMismatchData) {
				if (carriersMismatchData.hasOwnProperty(i)) {
					carriersMismatchDataArray.push(carriersMismatchData[i].name);
				}
			}

			this.carriersMismatchNames(carriersMismatchDataArray);

			// Calculating options disabled status
			for (i = 0; i < this.legGroupings.length; i++) {
				for (j = 0; j < this.legGroupings[i].options.length; j++) {
					var disabled = true;

					for (k = 0; k < this.legGroupings[i].options[j].flights.length; k++) {
						disabled = disabled && this.flightsById[this.legGroupings[i].options[j].flights[k]].filteredOut();
					}

					this.legGroupings[i].options[j].disabled(disabled);
				}
			}

			// Fixing selected options
			// If on recalculation we have no selected flight - we select a flight with
			// earliest departure time on first leg
			// (first non-disabled flight of first non-disabled option on first leg)
			if (this.calculateSelectedFlights().length == 0) {
				tmp = null;

				for (i = 0; i < this.legGroupings[0].options.length; i++) {
					if (!this.legGroupings[0].options[i].disabled()) {
						for (j = 0; j < this.legGroupings[0].options[i].flights.length; j++) {
							if (!this.flightsById[this.legGroupings[0].options[i].flights[j]].filteredOut()) {
								tmp = this.legGroupings[0].options[i].flights[j];
								break;
							}
						}

						if (tmp) {
							break;
						}
					}
				}

				// If found - setting stuff
				if (tmp) {
					for (i = 0; i < this.legGroupings.length; i++) {
						for (j = 0; j < this.legGroupings[i].options.length; j++) {
							if (this.legGroupings[i].options[j].flights.indexOf(tmp) >= 0) {
								this.legGroupings[i].selected(this.legGroupings[i].options[j]);
								break;
							}
						}
					}
				}
			}

			this.selectedFlightsIds(this.calculateSelectedFlights());

			this.recalculateSelectedFlights = true;
		};

		Group.prototype.clone = function () {
			var ret = this.$$controller.getModel('Flights/SearchResults/Group', this.$$originalData);

			ret.buildCouplingTable(this.couplingTable.flights);

			return ret;
		};

		Group.prototype.recalculateUncombinable = function () {
			var i, j, k;

			for (i = 0; i < this.legGroupings.length; i++) {
				for (j = 0; j < this.legGroupings[i].options.length; j++) {
					this.legGroupings[i].options[j].uncombinable([]);

					for (k = 0; k < this.legGroupings.length; k++) {
						if (
							i != k &&
							helpers.intersectArrays(
								this.legGroupings[i].options[j].flights,
								this.legGroupings[k].selected().flights
							).length == 0
						) {
							this.legGroupings[i].options[j].uncombinable.push(k + 1);
						}
					}
				}
			}
		};

		Group.prototype.calculateSelectedFlights = function () {
			var ret;

			for (var i = 0; i < this.legGroupings.length; i++) {
				var tmp = [],
					flights = this.legGroupings[i].selected().flights,
					j;

				for (j = 0; j < flights.length; j++) {
					if (
						(
							typeof ret == 'undefined' ||
							ret.indexOf(flights[j]) >= 0
						) &&
						!this.flightsById[flights[j]].filteredOut()
					) {
						tmp.push(flights[j]);
					}
				}

				ret = tmp;
			}

			return ret;
		};

		Group.prototype.getTotalPrice = function () {
			return this.flights[0].price.totalPrice;
		};

		Group.prototype.getValidatingCompany = function () {
			return this.flights[0].getValidatingCompany();
		};

		return Group;
	}
);