'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseStaticModel'],
	function (ko, helpers, BaseModel) {
		
		/**
		 * @param initialData
		 * @param controller
		 * 
		 * @property {Array} segmentInfo
		 * @property {Object} $$controller
		 * @property {Object} pricingDebug
		 * 
		 * @constructor
		 */
		function FlightsSearchResultsFlightPrice (initialData, controller) {
			BaseModel.apply(this, arguments);

			this.totalPrice = this.$$controller.getModel('Common/Money', this.totalPrice);
			this.flightPrice = this.$$controller.getModel('Common/Money', this.flightPrice);
			this.agencyCharge = this.$$controller.getModel('Common/Money', this.agencyCharge);

			if (typeof this.subagentProfit !== 'undefined') {
				this.subagentProfit = this.$$controller.getModel('Common/Money', this.subagentProfit);
			}

			if (typeof this.agentProfit !== 'undefined') {
				this.agentProfit = this.$$controller.getModel('Common/Money', this.agentProfit);
			}

			this.ticketTimeLimit = this.$$controller.getModel('Common/Date', this.ticketTimeLimit);

			/**
			 * @type {Array}
			 */
			this.availableSeats = [];
			
			/**
			 * Baggage grouped by legs and segments.
			 * 
			 * [ legIndex: [ segmentIndex: [baggages] ] ]
			 * 
			 * @type {Array}
			 */
			this.baggageRules = [];
			
			/**
			 * Min. baggage grouped by legs and segments.
			 * 
			 * [ legIndex: [ segmentIndex: minBaggage ] ]
			 * 
			 * @type {Array}
			 */
			this.minBaggages = [];
			
			var baggageRules = [];

			this.segmentInfo.map(function (segment) {
				var leg = segment.routeNumber,
					segmentId = segment.segNum;

				// Available seats
				if (typeof this.availableSeats[leg] === 'undefined') {
					this.availableSeats[leg] = null;
				}

				if (
					this.availableSeats[leg] === null ||
					this.availableSeats[leg] > segment.avlSeats
				) {
					this.availableSeats[leg] = segment.avlSeats;
				}

				// Baggage rules
				if (typeof baggageRules[leg] === 'undefined') {
					baggageRules[leg] = [];
				}

				if (typeof baggageRules[leg][segmentId] === 'undefined') {
					baggageRules[leg][segmentId] = [];
				}

				if (segment.freeBaggage instanceof Array) {
					segment.freeBaggage.map(function (baggage) {
						if (baggage) {
							// В baggage.value может лежать null, undefined, 0, '0' и кто знает что еще...
							if (!baggage.value && baggage.value !== 0 && baggage.value !== '0') {
								baggage.value = null;
							}
							else {
								baggage.value = parseInt(baggage.value);
							}
							
							baggageRules[leg][segmentId].push(baggage);
						}
					}, this);
				}

				// Baggage rules
				if (typeof this.minBaggages[leg] === 'undefined') {
					this.minBaggages[leg] = [];
				}

				this.minBaggages[leg][segmentId] = segment.minBaggage;
			}, this);
			
			// Cleaning baggage rules arrays
			this.baggageRules = baggageRules.map(function (segmentBaggage) {
				var tmp = [];
				
				if (typeof segmentBaggage !== 'undefined') {
					segmentBaggage.map(function (baggage) {
						if (typeof baggage !== 'undefined') {
							tmp.push(baggage);
						}
					});
				}
				
				return tmp;
			}, this);

			// Pricing debug
			if (typeof this.pricingDebug !== 'undefined' && this.pricingDebug.link.indexOf('//') < 0 && this.pricingDebug.link[0] !== '/') {
				this.pricingDebug.link = '/' + this.pricingDebug.link;
			}
		}

		// Extending from dictionaryModel
		helpers.extendModel(FlightsSearchResultsFlightPrice, [BaseModel]);

		/**
		 * Get adult-passenger fare or the first matched one.
		 * 
		 * @returns {Object}
		 */
		FlightsSearchResultsFlightPrice.prototype.getMainPassengerFare = function () {
			var mainFare = null,
				fallbackFare = null;
			
			if ('passengerFares' in this && this.passengerFares instanceof Array) {
				this.passengerFares.every(function (fare) {
					if (!fallbackFare) {
						fallbackFare = fare;
					}
					
					if (fare.type === 'ADT') {
						mainFare = fare;
						return false;
					}
					
					return true;
				});
				
				if (!mainFare) {
					mainFare = fallbackFare;
				}
			}
			
			return mainFare;
		};

		/**
		 * Get tariffs for the main passenger fare.
		 * 
		 * @returns {Array}
		 */
		FlightsSearchResultsFlightPrice.prototype.getTariffs = function () {
			var result = [],
				mainFare = this.getMainPassengerFare();
			
			if (mainFare && 'tariffs' in mainFare && mainFare.tariffs instanceof Array) {
				result = mainFare.tariffs;
			}
			
			return result;
		};

		return FlightsSearchResultsFlightPrice;
	}
);