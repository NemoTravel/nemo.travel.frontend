'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseStaticModel'],
	function (ko, helpers, BaseModel) {
		function Group (initialData) {
			BaseModel.apply(this, arguments);

			var self = this;

			this.flightsById = {};
			this.selectedFlight = ko.observable(this.flights[0]);
			this.legGroupings = [];

			for (var i = 0; i < this.flights.length; i++) {
				this.flightsById[this.flights[i].id] = this.flights[i];
			}

			for (var siter = 0; siter < this.flights[0].legs.length; siter++) {
				var addObj = {
						options: [],
						selected: ko.observable(),
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
					key;

				for (var fiter = 0; fiter < this.flights.length; fiter++) {
					key = this.flights[fiter].legs[siter].depAirp.IATA +
						this.flights[fiter].legs[siter].arrAirp.IATA +
						this.flights[fiter].legs[siter].depDateTime.getISODateTime() +
						this.flights[fiter].legs[siter].arrDateTime.getISODateTime() +
						this.flights[fiter].legs[siter].timeEnRoute.length();

					if (!tmp[key]) {
						tmp[key] = [];
					}

					tmp[key].push(this.flights[fiter].id);
				}

				// Converting to array
				tmpIter = Object.keys(tmp);
				for (var i = 0; i < tmpIter.length; i++) {
					var adder = {
						flights: tmp[tmpIter[i]]
					};

					// Computed that decides wheter option is disabled
					adder.disabled = ko.computed(function () {
						var option = this.flights,
							ret = false;

						for (var i = 0; i < option.length; i++) {
							ret = ret || !self.flightsById[option[i]].filteredOut();
						}

						return !ret;
					}, adder);

					addObj.options.push(
//						tmp[tmpIter[i]]
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



				this.legGroupings.push(addObj);
			}

			this.selectedFlights = ko.computed(function () {
				var ret;

				for (var i = 0; i < this.legGroupings.length; i++) {
					var tmp = [],
						flights = this.legGroupings[i].selected().flights,
						i;

					for (i = 0; i < flights.length; i++) {
						if (
							(
								typeof ret == 'undefined' ||
								ret.indexOf(flights[i]) >= 0
							) &&
							!this.flightsById[flights[i]].filteredOut()
						) {
							tmp.push(flights[i]);
						}
					}

					ret = tmp;
				}

				return ret;
			}, this);

			this.filteredOut = ko.computed(function () {
				for (var i = 0; i < this.flights.length; i++) {
					if (!this.flights[i].filteredOut()) {
						return false;
					}
				}

				return true;
			}, this);

			this.durationOnLeg = ko.computed(function () {
				var duration = 0;

				for (var i = 0; i < this.selectedFlight().timeEnRouteByLeg.length; i++) {
					if (this.selectedFlight().timeEnRouteByLeg[i].length() > duration) {
						duration = this.selectedFlight().timeEnRouteByLeg[i].length();
					}
				}

				return duration;
			}, this);

			this.recommendRating = ko.computed(function () {
				return this.selectedFlight().recommendRating;
			}, this);
		}

		// Extending from dictionaryModel
		helpers.extendModel(Group, [BaseModel]);

		Group.prototype.getSelectedFlightsData = function (flarr, leg) {
			var ret = '';

			ret += this.flightsById[flarr.flights[0]].legs[leg].depDateTime.getISODateTime() + ' - ' + this.flightsById[flarr.flights[0]].legs[leg].arrDateTime.getISODateTime()

			return ret;
		};

		Group.prototype.getTotalPrice = function () {
			return this.flights[0].price.totalPrice;
		};

		Group.prototype.getValidatingCompany = function () {
			return this.flights[0].price.validatingCompany;
		};

		return Group;
	}
);