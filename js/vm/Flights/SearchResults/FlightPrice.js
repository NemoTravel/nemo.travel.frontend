'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseStaticModel'],
	function (ko, helpers, BaseModel) {
		function FlightsSearchResultsFlightPrice (initialData, controller) {
			BaseModel.apply(this, arguments);

			this.totalPrice = this.$$controller.getModel('Common/Money', this.totalPrice);
			this.flightPrice = this.$$controller.getModel('Common/Money', this.flightPrice);
			this.agencyCharge = this.$$controller.getModel('Common/Money', this.agencyCharge);

			this.ticketTimeLimit = this.$$controller.getModel('Common/Date', this.ticketTimeLimit);
		}

		// Extending from dictionaryModel
		helpers.extendModel(FlightsSearchResultsFlightPrice, [BaseModel]);

		return FlightsSearchResultsFlightPrice;
	}
);