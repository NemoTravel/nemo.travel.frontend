'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseStaticModel'],
	function (ko, helpers, BaseModel) {
		function FlightsSearchResultsFlightPrice (initialData, controller) {
			BaseModel.apply(this, arguments);

			this.totalPrice = this.$$controller.getModel('common/Money', this.totalPrice);
			this.flightPrice = this.$$controller.getModel('common/Money', this.flightPrice);
			this.agencyCharge = this.$$controller.getModel('common/Money', this.agencyCharge);

			this.ticketTimeLimit = this.$$controller.getModel('common/Date', this.ticketTimeLimit);
		}

		// Extending from dictionaryModel
		helpers.extendModel(FlightsSearchResultsFlightPrice, [BaseModel]);

		return FlightsSearchResultsFlightPrice;
	}
);