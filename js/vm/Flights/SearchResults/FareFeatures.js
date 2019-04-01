'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseControllerModel'], 
	function (ko, helpers, BaseControllerModel) {
		function FlightsSearchResultsFareFeatures (initialData) {
			BaseControllerModel.apply(this, arguments);
			
			/**
			 * Fare features grouped by `routeNumber_segmentNumber` => `features`.
			 *
			 * @type {Object}
			 */
			this.bySegments = {};

			/**
			 * Fare features grouped by `routeNumber` => [`features`, `features`].
			 *
			 * @type {Object}
			 */
			this.byLegs = {};

			this.parseFareFeatures(this.findMainFare(initialData));
		}

		helpers.extendModel(FlightsSearchResultsFareFeatures, [BaseControllerModel]);

		/**
		 * @param {String} segmentId
		 * @returns {*}
		 */
		FlightsSearchResultsFareFeatures.prototype.getBaggageInfoForSegment = function (segmentId) {
			var result, features;

			if (this.hasFeaturesForSegment(segmentId)) {
				features = this.bySegments[segmentId].list;

				if (features.hasOwnProperty('baggage') && features.baggage instanceof Array) {
					result = this.findMainFeature('baggage', features.baggage);
				}
			}

			return result;
		};

		/**
		 * @param {String} segmentId
		 * @returns {*}
		 */
		FlightsSearchResultsFareFeatures.prototype.getRefundInfoForSegment = function (segmentId) {
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

		/**
		 * @param {String} segmentId
		 * @returns {*}
		 */
		FlightsSearchResultsFareFeatures.prototype.getExchangeInfoForSegment = function (segmentId) {
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
		FlightsSearchResultsFareFeatures.prototype.getFeaturesByCode = function (code, array) {
			var result = [];

			array.map(function (feature) {
				if (feature.code === code) {
					result.push(feature);
				}
			});

			return result;
		};

		/**
		 * @param {String} code
		 * @param {Array} array
		 * @returns {*}
		 */
		FlightsSearchResultsFareFeatures.prototype.findMainFeature = function (code, array) {
			var result, feature, mainCandidate, secondCandidate, i, max;

			for (i = 0, max = array.length; i < max; i++) {
				feature = array[i];

				if (feature.code === code) {
					if (!mainCandidate || (mainCandidate.priority > feature.priority)) {
						mainCandidate = feature;
					}
				}
				else {
					if (!secondCandidate || (secondCandidate.priority > feature.priority)) {
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
		FlightsSearchResultsFareFeatures.prototype.findMainFare = function (fares) {
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
		 * Group features by legs and segments.
		 *
		 * @param {Object} passengerFare
		 */
		FlightsSearchResultsFareFeatures.prototype.parseFareFeatures = function (passengerFare) {
			var self = this,
				legsMap = {};

			if (passengerFare && passengerFare.tariffs instanceof Array) {
				passengerFare.tariffs.map(function (tariff) {
					if (tariff.features instanceof Object && tariff.features.hasFeatures) {
						var legId = tariff.routeNumber,
							segmentId = legId + '_' + tariff.segNum,
							features = {
								segmentId: segmentId,
								list: tariff.features,
								name: tariff.familyName,
								code: tariff.code,
								hasFeatures: tariff.features.hasFeatures
							};

						// There can be multiple fare families per leg.
						if (!self.byLegs.hasOwnProperty(legId)) {
							self.byLegs[legId] = [];
						}

						if (!legsMap.hasOwnProperty(legId)) {
							legsMap[legId] = {};
						}

						self.bySegments[segmentId] = features;

						// Do not show duplicate fare families on one leg.
						if (!legsMap[legId].hasOwnProperty(features.code)) {
							self.byLegs[legId].push(features);
							legsMap[legId][features.code] = true;
						}
					}
				});
			}
		};

		/**
		 * @returns {*}
		 */
		FlightsSearchResultsFareFeatures.prototype.getFirstFamily = function () {
			var result = null, i;

			for (i in this.bySegments) {
				if (this.bySegments.hasOwnProperty(i) && this.bySegments[i].hasFeatures) {
					result = this.bySegments[i];
					break;
				}
			}

			return result;
		};

		/**
		 * @param {String} segmentId
		 * @returns {Boolean}
		 */
		FlightsSearchResultsFareFeatures.prototype.hasFeaturesForSegment = function (segmentId) {
			return this.bySegments.hasOwnProperty(segmentId) && this.bySegments[segmentId].hasFeatures;
		};

		/**
		 * @param featureName
		 * @return {Array}
		 */
		FlightsSearchResultsFareFeatures.prototype.getFeaturesFromSegments = function (featureName) {
			var result = [],
				fareFeaturesNames = [];

			for (var segment in this.bySegments) {
				if (
					this.bySegments.hasOwnProperty(segment) &&
					this.bySegments[segment].hasFeatures &&
					this.bySegments[segment].list[featureName] &&
					fareFeaturesNames.indexOf(this.bySegments[segment].name) === -1
				) {
					result = result.concat(this.bySegments[segment].list[featureName]);

					fareFeaturesNames.push(this.bySegments[segment].name);
				}
			}

			return result;
		};

		/**
		 * @param {String} featureName
		 * @returns {{isAvailable: boolean, description: string, isVisible: boolean}}
		 */
		FlightsSearchResultsFareFeatures.prototype.isFeatureAvailable = function (featureName) {
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
						featuresArray = this.getFeaturesFromSegments('baggage');
						break;

					case 'exchangeable':
					case 'refundable':
						featuresArray = this.getFeaturesFromSegments('refunds');
						break;

					case 'vip_service':
						featuresArray = this.getFeaturesFromSegments('misc');
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

		return FlightsSearchResultsFareFeatures;
	}
);
