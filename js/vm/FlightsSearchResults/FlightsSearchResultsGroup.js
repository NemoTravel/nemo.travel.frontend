'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseStaticModel'],
	function (ko, helpers, BaseModel) {
		function FlightsSearchResultsGroup (initialData) {
			BaseModel.apply(this, arguments);

			this.flightsById = {};
			this.selectedFlight = ko.observable(this.flights[0]);

			for (var i = 0; i < this.flights.length; i++) {
				this.flightsById[this.flights[i].id] = this.flights[i];
			}

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