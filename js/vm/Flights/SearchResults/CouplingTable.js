'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseStaticModel'],
	function (ko, helpers, BaseModel) {
		function CouplingTable (initialData, controller) {
			BaseModel.apply(this, arguments);

			this.flightsById = {};

			this.isActive = false;
			this.sort = ko.observable();
			this.legGroupings = [];
			this.disabledGroupings = [];
			this.selectedFlightsIds = ko.observable();

			var initiallySelected = this.group.selectedFlightsIds()[0];

			for (var i = 0; i < this.flights.length; i++) {
				this.flightsById[this.flights[i].id] = this.flights[i];
			}

			for (var siter = 0; siter < this.flights[0].legs.length; siter++) {
//				console.log(this.flights[0].legs[i]);
				var addObj = {
						flights: ko.observableArray([]),
						selected: ko.observable(),
						legActive: ko.observable(siter == 0)
					},
					tmp = {};

				for (var fiter = 0; fiter < this.flights.length; fiter++) {
					// FOR KEY REFER TO "GROUP". MUST CORRESPOND. HERE IS ADDED PRICE FOR OBVIOUS REASONS
					/*this.flights[fiter].legs[siter].depAirp.IATA + '-' +
						this.flights[fiter].legs[siter].arrAirp.IATA + '-' +
						this.flights[fiter].legs[siter].depDateTime.getISODateTime() + '-' +
						this.flights[fiter].legs[siter].arrDateTime.getISODateTime() + '-' +
						this.flights[fiter].legs[siter].timeEnRoute.length() + '-' +
						this.flights[fiter].getTotalPrice().normalizedAmount();*/
					var key = this.group.getGroupingKey(this.flights[fiter], siter);

					if (!tmp[key]) {
						tmp[key] = [];
					}

					tmp[key].push(this.flights[fiter].id);
				}

				// Converting to array
				addObj.flights(Object.keys(tmp).map(function (key) {return tmp[key]}));
				this.legGroupings.push(addObj);
				console.warn(this)
				console.log(this.legGroupings[siter]);
				for (var i = 0; i < this.legGroupings[siter].flights().length; i++) {
					if (this.legGroupings[siter].flights()[i].indexOf(initiallySelected) >= 0) {
						this.legGroupings[siter].selected(this.legGroupings[siter].flights()[i]);
					}else{
						this.legGroupings[siter].selected(this.legGroupings[siter].flights()[0])
					}
				}

				this.disabledGroupings.push(ko.observableArray([]));

				this.isActive = this.isActive || this.legGroupings[siter].flights().length > 1;
			}

			this.sort.subscribe(function () {
				var self = this;

				switch (this.sort()) {
					case 'price':
						for (var i = 0; i < this.legGroupings.length; i++) {
							this.legGroupings[i].flights.sort(
								function (a, b) {
									return (
										self.flightsById[a[0]].getTotalPrice().normalizedAmount() -
										self.flightsById[b[0]].getTotalPrice().normalizedAmount()
									);
								}
							);
						}
						break;
					case 'timeEnRoute':
						for (var i = 0; i < this.legGroupings.length; i++) {
							this.legGroupings[i].flights.sort(
								function (a, b) {
									return (
										self.flightsById[a[0]].legs[i].timeEnRoute.length() -
										self.flightsById[b[0]].legs[i].timeEnRoute.length()
									);
								}
							);
						}
						break;
					case 'departureTime':
						for (var i = 0; i < this.legGroupings.length; i++) {
							this.legGroupings[i].flights.sort(
								function (a, b) {
									return (
										self.flightsById[a[0]].legs[i].depDateTime.getTimestamp() -
										self.flightsById[b[0]].legs[i].depDateTime.getTimestamp()
									);
								}
							);
						}
						break;
//					case 'transfers':
//						break;
				}

			}, this);

			this.sort(this.sortTypes[0]);

			this.recalculateSelf();
		}

		// Extending from dictionaryModel
		helpers.extendModel(CouplingTable, [BaseModel]);

		CouplingTable.prototype.recalculateSelf = function () {
			this.selectedFlightsIds(this.calculateSelectedFlights());

			// Recalculating disabled
			var allPossibleFlights = {};

			for (var i = 0; i < this.legGroupings.length; i++) {
				var tmp = this.legGroupings[i].selected();

				for (var j = 0; j < tmp.length; j++) {
					allPossibleFlights[tmp[j]] = tmp[j];
				}
			}

			for (var i = 0; i < this.legGroupings.length; i++) {
				var tmp = this.legGroupings[i].flights(),
					disabled = [];

				for (var j = 0; j < tmp.length; j++) {
					var found = false;

					for (var k = 0; k < tmp[j].length; k++) {
						if (typeof allPossibleFlights[tmp[j][k]] != 'undefined') {
							found = true;
							break;
						}
					}

					if (!found) {
						disabled.push(tmp[j]);
					}
				}

				this.disabledGroupings[i](disabled);
			}
		};

		CouplingTable.prototype.calculateSelectedFlights = function () {
			var ret;

			for (var i = 0; i < this.legGroupings.length; i++) {
				var tmp = [],
					flights = this.legGroupings[i].selected(),
					j;

				for (j = 0; j < flights.length; j++) {
					if (
						typeof ret == 'undefined' ||
						ret.indexOf(flights[j]) >= 0
					) {
						tmp.push(flights[j]);
					}
				}

				ret = tmp;
			}

			return ret;
		};

		CouplingTable.prototype.selectVariant = function (data, leg) {
			this.legGroupings[leg].selected(data);

			// Checking whether we have flights selected
			if (this.calculateSelectedFlights().length == 0) {
				var selected = data;

				for (var i = 0; i < this.legGroupings.length; i++) {
					var legSelected = helpers.intersectArrays(this.legGroupings[i].selected(), selected);

					if (!legSelected.length) {
						var flights = this.legGroupings[i].flights();

						// Changing selected
						for (var j = 0; j < flights.length; j++) {
							legSelected = helpers.intersectArrays(selected, flights[j]);

							if (legSelected.length) {
								this.legGroupings[i].selected(flights[j]);
								break;
							}
						}
					}

					selected = legSelected;
				}
			}

			this.recalculateSelf();
		};

		CouplingTable.prototype.sortTypes = ['price','timeEnRoute','departureTime'/*,''*/];

		return CouplingTable;
	}
);