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

			if ('segmentId' in componentParameters && this.flight.fareFeatures.bySegments.hasOwnProperty(componentParameters.segmentId)) {
				this.features = this.flight.fareFeatures.bySegments[componentParameters.segmentId];
			}
			else {
				this.features = this.flight.fareFeatures.getFirstFamily();
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
			if (this.features && this.features.hasFeatures) {
				if (this.features.list.hasOwnProperty('baggage')) {
					this.leftColumn = this.features.list.baggage;
				}

				if (this.features.list.hasOwnProperty('refunds')) {
					this.rightColumn = this.features.list.refunds;
				}

				if (this.features.list.hasOwnProperty('misc')) {
					this.miscColumn = this.features.list.misc;
				}

				if (!this.isFullMode) {
					var newLeftColumn = [],
						newRightColumn = [];

					newLeftColumn = newLeftColumn.concat(this.leftColumn);
					newRightColumn = newRightColumn.concat(this.rightColumn);

					this.miscColumn.map(function (feature) {
						if (feature.code === 'seats_registration') {
							newRightColumn.push(feature);
						}
						else if (feature.code === 'vip_service') {
							newLeftColumn.push(feature);
						}
					});

					this.leftColumn = newLeftColumn;
					this.rightColumn = newRightColumn;
				}

				this.fareRulesLinkText = this.$$controller.i18n('FlightsSearchResults', 'flightsGroup__fareFamilies__title__tariff') + ' &laquo;' + this.features.name + '&raquo;';
			}
		};

		return FlightsSearchResultsFareFeaturesController;
	}
);