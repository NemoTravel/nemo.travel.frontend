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
								if (baggage.passtype && baggage.passtype == 'INF') {
									baggage.text = this.$$controller.i18n('FlightsFlightInfo','leg__segment__baggage__carryOn_only_INF');
								}
								else {
									baggage.text = this.$$controller.i18n('FlightsFlightInfo','leg__segment__baggage__carryOn_only');
								}
							}
							else {
								baggage.value = parseInt(baggage.value);
								baggage.text = baggage.value + ' ';
								var suffix = '';
								if (baggage.measurement && baggage.measurement == 'pc') {
									switch (baggage.value.toString()) {
										case '0':
										case '5':
										case '6':
										case '7':
										case '8':
										case '9':
										case '10':
										case '11':
										case '12':
										case '13':
										case '14':
										case '15':
											suffix = 'leg__segment__baggage__metric_bag_3';
											break;
										case '1':
											suffix = 'leg__segment__baggage__metric_bag_1';
											break;
										case '2':
										case '3':
										case '4':
											suffix = 'leg__segment__baggage__metric_bag_2';
											break;
									}
								}
								else {
									suffix = baggage.measurement ? 'leg__segment__baggage__metric_' + baggage.measurement : '';	
								}
								baggage.text += this.$$controller.i18n('FlightsFlightInfo',suffix);
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
			
			this.passengerFaresBase = [];
			this.passengerFaresTaxes = [];
			this.passengerFaresTotal = [];
			this.passengerFaresTotalSum = [];
			for (var i = 0; i < this.passengerFares.length; i++) {
				this.passengerFaresBase.push(this.$$controller.getModel('Common/Money', this.passengerFares[i].baseFare));
				this.passengerFaresTotal.push(this.$$controller.getModel('Common/Money', this.passengerFares[i].totalFare));
				this.passengerFaresTotalSum.push(this.$$controller.getModel('Common/Money', 
				{amount: this.passengerFares[i].totalFare.amount * this.passengerFares[i].count, currency: this.passengerFares[i].totalFare.currency}));
				var taxesArr = [];
				for (var j = 0; j < this.passengerFares[i].taxes.length; j++) {
					for (var key in this.passengerFares[i].taxes[j]) {
						taxesArr.push([key, this.$$controller.getModel('Common/Money', this.passengerFares[i].taxes[j][key])]);
					}
				}
				this.passengerFaresTaxes.push(taxesArr);
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