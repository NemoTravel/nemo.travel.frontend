'use strict';
define(
	['knockout', 'jquery', 'js/vm/EventManager'],
	function (ko, $, Analytics) {
		ko.bindingHandlers.fareFamiliesChooseFlight = {
			init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var data = ko.utils.unwrapObservable(valueAccessor());
				
				if (typeof data.setHasBeenChosen === 'undefined') {
					data.setHasBeenChosen = false;
				}
				
				$(element).on('click', function () {
					if (!data.controller.state().choosingFlight()) {
						var flightIds = [data.flightId];
						
						Analytics.tap('searchResults.fareFamilies.select');
						Analytics.tap('analyticsSelectFareFamily', { noPrefix: true });
						
						data.controller.state().choosingFlight(true);
						data.controller.currentFlightId(data.flightId);

						flightIds = data.controller.handleFlightIdsBeforeBooking(flightIds);
						
						data.controller.resultsController.bookFlight(flightIds, { 
							altFlightHasBeenChosen: data.setHasBeenChosen, 
							parentFlightId: data.controller.parentFlight.id 
						});
						
						// Turn off flight choosing loader if price has changed.
						data.controller.resultsController.bookingCheckPriceChangeData.subscribe(function (newVal) {
							if (newVal) {
								data.controller.state().choosingFlight(false);
							}
						});
					}
				});
			}
		};
	}
);