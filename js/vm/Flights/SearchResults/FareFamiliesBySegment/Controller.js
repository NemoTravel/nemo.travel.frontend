'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/Flights/SearchResults/FareFamilies/Controller', '../FareFamilies/Abstract', 'js/lib/md5/md5', 'js/vm/Analytics'],
	function (ko, helpers, FlightsSearchResultsFareFamiliesController, AbstractFareFamiliesController, md5, Analytics) {
		function FlightsSearchResultsFareFamiliesBySegmentController(componentParameters) {
			FlightsSearchResultsFareFamiliesController.apply(this, arguments);
			AbstractFareFamiliesController.apply(this, arguments);

			this.parentFlightId = this.parentFlight.id;
			this.requestURL = this.$$controller.options.dataURL + '/flights/search/fareFamiliesSegmented/' + this.parentFlightId;
			this.hash = md5(this.parentFlight.id + Math.random() + 'fareFamiliesBySegment');
		}

		helpers.extendModel(FlightsSearchResultsFareFamiliesBySegmentController, [FlightsSearchResultsFareFamiliesController, AbstractFareFamiliesController]);

		FlightsSearchResultsFareFamiliesBySegmentController.prototype.bookFlight = function () {
			if (this.selectedFlightId && this.isValid() && !this.state().choosingFlight()) {
				var self = this;

				this.state().choosingFlight(true);

				this.resultsController.bookFlight([this.selectedFlightId], {
					altFlightHasBeenChosen: true,
					parentFlightId: this.parentFlight.id
				});

				// Turn off flight choosing loader if price has changed.
				this.resultsController.bookingCheckPriceChangeData.subscribe(function (newVal) {
					if (newVal) {
						self.state().choosingFlight(false);
					}
				});
			}
		};
		
		FlightsSearchResultsFareFamiliesBySegmentController.prototype.i18n = function (module, key) {
			return this.$$controller.i18n(module, key);
		};

		FlightsSearchResultsFareFamiliesBySegmentController.prototype.getMoneyModel = function (object) {
			return this.$$controller.getModel('Common/Money', object);
		};

		FlightsSearchResultsFareFamiliesBySegmentController.prototype.analytics = function (name) {
			Analytics.tap(name);
		};

		FlightsSearchResultsFareFamiliesBySegmentController.prototype.processResponse = function (response) {
			return response;
		};

		FlightsSearchResultsFareFamiliesBySegmentController.prototype.getFamilyName = function (family) {
			return family.familyName;
		};

		FlightsSearchResultsFareFamiliesBySegmentController.prototype.processFareFamily = function (data) {
			var family = Object.create(data);
			family.familyCode = family.id;

			return family;
		};

		return FlightsSearchResultsFareFamiliesBySegmentController;
	}
);
