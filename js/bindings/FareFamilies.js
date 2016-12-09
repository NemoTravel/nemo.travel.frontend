'use strict';
define(
	['knockout', 'jquery'],
	function (ko, $) {
		ko.bindingHandlers.fareFamiliesChooseFlight = {
			init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var data = ko.utils.unwrapObservable(valueAccessor());
				
				if (typeof data.setHasBeenChosen === 'undefined') {
					data.setHasBeenChosen = false;
				}
				
				$(element).on('click', function () {
					if (!data.controller.state().choosingFlight()) {
						$(document).trigger("analyticsSelectFareFamily");
						data.controller.state().choosingFlight(true);
						data.controller.currentFlightId(data.flightId);
						data.controller.resultsController.bookFlight([data.flightId], { 
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