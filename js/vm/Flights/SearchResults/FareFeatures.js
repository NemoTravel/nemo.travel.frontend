'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseControllerModel'], 
	function (ko, helpers, BaseControllerModel) {
		function FlightsSearchResultsFareFeatures (initialData) {
			BaseControllerModel.apply(this, arguments);
			
			var self = this;

			/**
			 * Fare features grouped by `routeNumber_segmentNumber` => `features`.
			 *
			 * @type {Object}
			 */
			this.bySegments = {};

			this.getBaggageInfoForSegment = function (segmentId) {
				var result, features;
				
				if (this.hasFeaturesForSegment(segmentId)) {
					features = this.bySegments[segmentId].list;

					if (features.hasOwnProperty('baggage') && features.baggage instanceof Array) {
						result = this.findMainFeature('baggage', features.baggage);
					}
				}

				return result;
			};

			this.getRefundInfoForSegment = function (segmentId) {
				var result, features, refunds;

				if (this.hasFeaturesForSegment(segmentId)) {
					features = this.bySegments[segmentId].list;

					if (features.hasOwnProperty('refunds') && features.refunds instanceof Array) {
						refunds = this.getFeaturesByCode('refundable', features.refunds);
						result = this.findMainFeature('refundable', refunds);
					}
				}

				return result;
			};

			this.getExchangeInfoForSegment = function (segmentId) {
				var result, features, refunds;

				if (this.hasFeaturesForSegment(segmentId)) {
					features = this.bySegments[segmentId].list;

					if (features.hasOwnProperty('refunds') && features.refunds instanceof Array) {
						refunds = this.getFeaturesByCode('exchangeable', features.refunds);
						result = this.findMainFeature('exchangeable', refunds);
					}
				}

				return result;
			};

			/**
			 * @param {String} code
			 * @param {Array} array
			 * @returns {Array}
			 */
			this.getFeaturesByCode = function (code, array) {
				var result = [];

				array.map(function (feature) {
					if (feature.code === code) {
						result.push(feature);
					}
				});

				return result;
			};

			/**
			 *
			 * @param {String} code
			 * @param {Array} array
			 * @returns {*}
			 */
			this.findMainFeature = function (code, array) {
				var result, feature, mainCandidate, secondCandidate, i, max;

				for (i = 0, max = array.length; i < max; i++) {
					feature = array[i];

					if (feature.code === code) {
						if (!mainCandidate || (mainCandidate.priority < feature.priority)) {
							mainCandidate = feature;
						}
					}
					else {
						if (!secondCandidate || (secondCandidate.priority < feature.priority)) {
							secondCandidate = feature;
						}
					}
				}

				if (mainCandidate) {
					result = mainCandidate;
				}
				else {
					result = secondCandidate;
				}

				return result;
			};
			
			/**
			 * Find valuable passenger fare.
			 * (First matched adult fare or the first fare from the list)
			 *
			 * @param fares
			 * @returns {null|Array}
			 */
			this.findMainFare = function (fares) {
				var fare = null;

				for (var i = 0, max = fares.length; i < max; i++) {
					if (fares[i].type === 'ADT') {
						fare = fares[i];
						break;
					}
				}
				
				if (!fare && fares.length) {
					fare = fares[0];
				}

				return fare;
			};

			/**
			 * Group fare features by legs.
			 * 
			 * @param passengerFare
			 * @returns {Boolean}
			 */
			this.parseFareFeatures = function (passengerFare) {
				var isOneFamily = true,
					hash = null;
				
				if (passengerFare && passengerFare.tariffs instanceof Array) {
					for (var i = 0, max = passengerFare.tariffs.length; i < max; i++) {
						var tariff = passengerFare.tariffs[i];
						
						if (tariff.features instanceof Object && tariff.features.hasFeatures) {
							var segmentId = tariff.routeNumber + '_' + tariff.segNum;

							self.bySegments[segmentId] = {
								segmentId: segmentId,
								list: tariff.features,
								name: tariff.familyName,
								code: tariff.code,
								hash: tariff.hash,
								hasFeatures: tariff.features.hasFeatures
							};
							
							if (hash === null) {
								hash = tariff.hash;
							}
							else if (hash !== tariff.hash && isOneFamily === true) {
								isOneFamily = false;
							}
						}
					}
				}

				return isOneFamily;
			};

			/**
			 * Determines if only one fare family is used in the flight.
			 * 
			 * @type {Boolean}
			 */
			this.isOneFamily = this.parseFareFeatures(this.findMainFare(initialData));

			/**
			 * Get first fare family object, we do not support 
			 * multiple fare families selection yet :(
			 * 
			 * @returns {Object|null}
			 */
			this.getFirstFamily = function () {
				var result = null, i;
				
				for (i in self.bySegments) {
					if (self.bySegments.hasOwnProperty(i) && self.bySegments[i].hasFeatures) {
						result = self.bySegments[i];
						break;
					}
				}
				
				return result;
			};

			/**
			 * @param {String} segmentId
			 * @returns {Boolean}
			 */
			this.hasFeaturesForSegment = function (segmentId) {
				return self.bySegments.hasOwnProperty(segmentId) && self.bySegments[segmentId].hasFeatures;
			};

			/**
			 * @param {String} featureName
			 */
			this.isFeatureAvailable = function (featureName) {
				var isAvailable = false,
					isVisible = true,
					hasFreeFeatures = false,
					allFeaturesAreDisabled = true,
					allFeaturesAreUnknown = true,
					featuresArray = [],
					fullDescription = '',
					family = this.getFirstFamily();

				if (family && family.hasOwnProperty('segmentId')) {
					switch (featureName) {
						case 'baggage':
							featuresArray = family.list.baggage;
							break;
							
						case 'exchangeable':
						case 'refundable':
							featuresArray = family.list.refunds;
							break;
							
						case 'vip_service':
							featuresArray = family.list.misc;
							break;
					}
					
					if (featuresArray && featuresArray instanceof Array) {
						featuresArray.map(function (feature) {
							if (feature.code === featureName) {
								if (feature.description.full) {
									fullDescription += '<div>' + feature.description.full + '</div>';
								}
								else {
									fullDescription += '<div>' + feature.description.short + '</div>';
								}

								hasFreeFeatures = hasFreeFeatures || (feature.needToPay === 'Free');
								allFeaturesAreDisabled = allFeaturesAreDisabled && (feature.needToPay === 'NotAvailable');
								allFeaturesAreUnknown = allFeaturesAreUnknown && (feature.needToPay === 'Unknown');
							}
						});

						switch (featureName) {
							// Если есть хотя бы один бесплатный багаж - то отображаем иконку.
							// Иначе отображаем её перечеркнутой.
							case 'baggage':
								isAvailable = hasFreeFeatures;
								isVisible = !allFeaturesAreUnknown;
								break;

							// Если есть хотя бы один бесплатный вариант обмена\возврата, то отображаем иконку.
							// Если обмен\возврат не доступен вообще (ни платно, ни бесплатно) - отображаем иконку перечеркнутой.
							// Если есть только платные - то не отображаем иконку.
							case 'exchangeable':
							case 'refundable':
								isAvailable = hasFreeFeatures;
								isVisible = hasFreeFeatures || allFeaturesAreDisabled;
								break;

							// Если есть хотя бы одна бесплатная вип-услуга, то отображаем иконку.
							// Иначе прячем иконку.
							case 'vip_service':
								isAvailable = hasFreeFeatures;
								isVisible = hasFreeFeatures;
								break;
						}
					}
				}

				return { isAvailable: isAvailable, description: fullDescription, isVisible: isVisible };
			};

		}

		helpers.extendModel(FlightsSearchResultsFareFeatures, [BaseControllerModel]);
		
		return FlightsSearchResultsFareFeatures;
	}
);
