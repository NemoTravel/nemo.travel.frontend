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
			this.baggageRules = [];

			// Computing available seats and baggage rules by leg
			for (var i = 0; i < this.segmentInfo.length; i++) {
				var leg = this.segmentInfo[i].routeNumber,
					segment = this.segmentInfo[i].segNum;

				// Available seats
				if (typeof this.availableSeats[leg] == 'undefined') {
					this.availableSeats[leg] = null;
				}

				if (
					this.availableSeats[leg] == null ||
					this.availableSeats[leg] > this.segmentInfo[i].avlSeats
				) {
					this.availableSeats[leg] = this.segmentInfo[i].avlSeats;
				}

				// Baggage rules
				if (typeof this.baggageRules[leg] == 'undefined') {
					this.baggageRules[leg] = [];
				}

				if (typeof this.baggageRules[leg][segment] == 'undefined') {
					this.baggageRules[leg][segment] = [];
				}

				if (this.segmentInfo[i].freeBaggage instanceof Array) {
					for (var j = 0; j < this.segmentInfo[i].freeBaggage.length; j++) {
						if (this.segmentInfo[i].freeBaggage[j]) {
							this.segmentInfo[i].freeBaggage[j].value = parseInt(this.segmentInfo[i].freeBaggage[j].value);
							this.baggageRules[leg][segment].push(this.segmentInfo[i].freeBaggage[j]);
						}
					}
				}
			}

			// Cleaning baggage rules arrays
			for (var i = 0; i < this.baggageRules.length; i++) {
				var tmp = [];
				if (typeof this.baggageRules[i] != 'undefined') {
					this.baggageRules[i].map(function (currentVal) {
						if (typeof currentVal != 'undefined') {
							this.push(currentVal);
						}
					}, tmp);
				}
				this.baggageRules[i] = tmp;
			}

			//console.log(this.baggageRules);

			// Pricing debug
			if (typeof this.pricingDebug != 'undefined' && this.pricingDebug.link.indexOf('//') < 0 && this.pricingDebug.link[0] != '/') {
				this.pricingDebug.link = '/' + this.pricingDebug.link;
			}
		}

		// Extending from dictionaryModel
		helpers.extendModel(FlightsSearchResultsFlightPrice, [BaseModel]);

		return FlightsSearchResultsFlightPrice;
	}
);