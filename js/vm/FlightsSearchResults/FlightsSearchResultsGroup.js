'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseStaticModel'],
	function (ko, helpers, BaseModel) {
		function FlightsSearchResultsGroup (initialData, controller) {
			BaseModel.apply(this, arguments);

			this.flightsById = {};
			this.selectedFlightId = ko.observable(this.flights[0].id);

			for (var i = 0; i < this.flights.length; i++) {
				this.flightsById[this.flights[i].id] = this.flights[i];
			}

			this.filteredOut = ko.computed(function () {
				for (var i = 0; i < this.flights.length; i++) {
					if (!this.flights[i].filteredOut) {
						return false;
					}
				}

				return true;
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