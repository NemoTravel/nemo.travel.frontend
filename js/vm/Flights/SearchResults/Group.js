'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseStaticModel'],
	function (ko, helpers, BaseModel) {
		function FlightsSearchResultsGroup (initialData) {
			BaseModel.apply(this, arguments);

			this.flightsById = {};
			this.selectedFlight = ko.observable(this.flights[0]);
			this.legGroupings = [];

			for (var i = 0; i < this.flights.length; i++) {
				this.flightsById[this.flights[i].id] = this.flights[i];
			}

			for (var siter = 0; siter < this.flights[0].legs.length; siter++) {
				var addObj = {
						options: [],
						selected: ko.observable()
					},
					tmp = {},
					tmpIter,
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
					addObj.options.push(tmp[tmpIter[i]]);
				}

				// Add sorting

				this.legGroupings.push(addObj);
			}

			// TODO Defining set flight
			console.log(this.legGroupings);

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
		helpers.extendModel(FlightsSearchResultsGroup, [BaseModel]);

		FlightsSearchResultsGroup.prototype.getTotalPrice = function () {
			return this.flights[0].price.totalPrice;
		};

		FlightsSearchResultsGroup.prototype.getValidatingCompany = function () {
			return this.flights[0].price.validatingCompany;
		};

		return FlightsSearchResultsGroup;
	}
);