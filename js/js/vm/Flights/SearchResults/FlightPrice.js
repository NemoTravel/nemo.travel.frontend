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
			this.availableSeats = [];

			// Computing available seats by leg
			for (var i = 0; i < this.segmentInfo.length; i++) {
				var leg = this.segmentInfo[i].routeNumber;

				if (typeof this.availableSeats[leg] == 'undefined') {
					this.availableSeats[leg] = null;
				}

				if (
					this.availableSeats[leg] == null ||
					this.availableSeats[leg] > this.segmentInfo[i].avlSeats
				) {
					this.availableSeats[leg] = this.segmentInfo[i].avlSeats;
				}
			}
		}

		// Extending from dictionaryModel
		helpers.extendModel(FlightsSearchResultsFlightPrice, [BaseModel]);

		return FlightsSearchResultsFlightPrice;
	}
);