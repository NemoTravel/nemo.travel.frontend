'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseControllerModel'],
	function (ko, helpers, BaseControllerModel) {
		function FlightsSearchResultsFareFeaturesController(componentParameters) {
			BaseControllerModel.apply(this, arguments);
			
			var self = this;
			
			this.flight = componentParameters.flight;	
			this.resultsController = componentParameters.resultsController;
			this.isFullMode = componentParameters.fullMode === true;
			this.leftColumn = [];
			this.rightColumn = [];
			this.miscColumn = [];

			if ('segmentId' in componentParameters && this.flight.fareFeatures.bySegments.hasOwnProperty(componentParameters.segmentId)) {
				this.features = this.flight.fareFeatures.bySegments[componentParameters.segmentId];
			}
			else {
				this.features = this.flight.fareFeatures.getFirstFamily();
			}
			
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
			}
		}

		helpers.extendModel(FlightsSearchResultsFareFeaturesController, [BaseControllerModel]);

		return FlightsSearchResultsFareFeaturesController;
	}
);