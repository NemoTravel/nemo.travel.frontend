'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseControllerModel'],
	function (ko, helpers, BaseControllerModel) {
		function FlightsSearchResultsFareFeaturesController(componentParameters) {
			BaseControllerModel.apply(this, arguments);
			
			this.flight = componentParameters.flight;	
			this.resultsController = componentParameters.resultsController;
			this.isFullMode = componentParameters.fullMode === true;
			this.isListMode = componentParameters.listMode === true;
			this.features = componentParameters.features;
			this.featuresBySegments = [];
			this.isMultipleFares = false;
			this.leftColumn = [];
			this.rightColumn = [];
			this.miscColumn = [];

			this.featuresAreVisible = ko.observable(false);
			
			this.icons = ko.pureComputed(function () {
				var iconsList = [
					{ name: 'baggage',      icon: 'fa fa-suitcase' },
					{ name: 'exchangeable', icon: 'fa fa-refresh' },
					{ name: 'vip_service',  icon: 'fa fa-star' },
					{ name: 'refundable',   icon: 'fa fa-undo' }
				];

				return iconsList.map(function (item) {
					var featureInfo = this.flight.fareFeatures.isFeatureAvailable(item.name);

					return {
						icon: item.icon,
						isAvailable: featureInfo.isAvailable,
						isVisible: featureInfo.isVisible,
						title: this.$$controller.i18n('FlightsSearchResults', 'flightsGroup__fareFamilies__param__' + item.name),
						description: featureInfo.description
					};
				}, this);
			}, this);

			this.fareFeaturesArray = [];

			if (this.features && this.features.hasFeatures) {
				this.fareFeaturesArray.push(this.features);
			}
			else {
				this.features = this.flight.fareFeatures.getFirstFamily();

				var featuresInAllSegments = this.flight.fareFeatures.bySegments,
					fareFeaturesName = []; // тут будут названия

				for (var segment in featuresInAllSegments) {
					if (featuresInAllSegments.hasOwnProperty(segment)) {
						var fareSegment = featuresInAllSegments[segment];

						if (fareFeaturesName.indexOf(fareSegment.name) === -1) {
							this.fareFeaturesArray.push(fareSegment);

							fareFeaturesName.push(fareSegment.name);
						}
					}
				}
			}

			if (this.fareFeaturesArray.length > 1) {
				this.isMultipleFares = true;
				this.fareRulesLinkText = this.$$controller.i18n('FlightsSearchResults', 'flightsGroup__fareFamilies__title__multipleTariff');
			}
			else if (this.fareFeaturesArray.length === 1) {
				this.fareRulesLinkText = this.$$controller.i18n('FlightsSearchResults', 'flightsGroup__fareFamilies__title__tariff') + ' &laquo;' + this.fareFeaturesArray[0].name + '&raquo;';
			}

			this.groupFeaturesByColumns();
		}

		helpers.extendModel(FlightsSearchResultsFareFeaturesController, [BaseControllerModel]);

		/**
		 * Прячет\показывает полный список фич на поисковой выдаче.
		 */
		FlightsSearchResultsFareFeaturesController.prototype.toggleFeaturesBlock = function () {
			this.featuresAreVisible(!this.featuresAreVisible());
		};

		/**
		 * Распределяет фичи семейства по трём колонкам:
		 * - багаж
		 * - возврат + обмен
		 * - всё остальное
		 */
		FlightsSearchResultsFareFeaturesController.prototype.groupFeaturesByColumns = function () {
			for (var segment = 0; segment < this.fareFeaturesArray.length; segment++) {
				var features = this.fareFeaturesArray[segment];

				if (features.list.hasOwnProperty('baggage')) {
					this.leftColumn[segment] = features.list.baggage;
				}

				if (features.list.hasOwnProperty('refunds')) {
					this.rightColumn[segment] = features.list.refunds;
				}

				if (features.list.hasOwnProperty('misc')) {
					this.miscColumn[segment] = features.list.misc;
				}

				if (!this.isFullMode) {
					var newLeftColumn = [],
						newRightColumn = [];

					newLeftColumn = newLeftColumn.concat(this.leftColumn[segment]);
					newRightColumn = newRightColumn.concat(this.rightColumn[segment]);

					this.miscColumn[segment].map(function (feature) {
						if (feature.code === 'seats_registration') {
							newRightColumn.push(feature);
						}
						else if (feature.code === 'vip_service' || feature.code === 'miles') {
							newLeftColumn.push(feature);
						}
					});

					this.leftColumn[segment] = newLeftColumn;
					this.rightColumn[segment] = newRightColumn;
				}

				this.featuresBySegments.push({
					miscColumn: this.miscColumn[segment],
					leftColumn: this.leftColumn[segment],
					rightColumn: this.rightColumn[segment],
					depAirp: this.flight.segments[segment].depAirp,
					arrAirp: this.flight.segments[segment].arrAirp,
					tariffName: this.fareFeaturesArray[segment].name,
					marketingCompany: this.flight.segments[segment].marketingCompany
				});
			}
		};

		return FlightsSearchResultsFareFeaturesController;
	}
);
