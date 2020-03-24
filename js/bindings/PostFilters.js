'use strict';
define(
	['knockout', 'jquery', 'js/vm/EventManager', 'jqueryUI'],
	function (ko, $, Analytics) {
		// Common Knockout bindings are defined here
		/*
		 ko.bindingHandlers.testBinding = {
			 init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {},
			 update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {}
		 };
		 */
		ko.bindingHandlers.flightsResultsPFNumberSlider = {
			init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var $element = $(element),
					values = viewModel.values(),
					value = viewModel.value(),
					type = viewModel.type == 'range' || viewModel.type;

				$element.addClass('nemo-ui-slider_' + viewModel.type).slider({
					range: type,
					min: values.min,
					max: values.max,
					values: viewModel.type == 'range' ? [ value.min, value.max ] : (viewModel.type == 'min' ? value.max : value.min),
					slide: function( event, ui ) {
						var setter = viewModel.config.name == 'price' ? 'amount' : 'length';

						if (viewModel.type == 'range') {
							viewModel.displayValues.min[setter](ui.values[0]);
							viewModel.displayValues.max[setter](ui.values[1]);
						}
						else if (viewModel.type == 'min') {
							viewModel.displayValues.max[setter](ui.value);
						}
						else {
							viewModel.displayValues.min[setter](ui.value);
						}
					},
					change: function( event, ui ) {
						if (event.originalEvent) {
							Analytics.tap('searchResults.filter.value', { name: viewModel.config.name, value: ko.unwrap(valueAccessor()) });
							
							switch (viewModel.type) {
								case 'range':
									valueAccessor()({
										min: ui.values[0],
										max: ui.values[1]
									});
									break;
								case 'min':
									valueAccessor()({
										min: viewModel.values().min,
										max: ui.value
									});
									break;
								case 'max':
									valueAccessor()({
										min: ui.value,
										max: viewModel.values().max
									});
									break;
							}
						}
					}
				});

				// Do not forget to add destroy callbacks
				ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
					try {
						$element.slider('destroy');
					}
					catch (e) {}
				});
			},

			update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var value = viewModel.value(),
					values = viewModel.values();

				if (value.min != value.max) {
					$(element).slider(
						viewModel.type == 'range' ? 'values' : 'value',
						viewModel.type == 'range' ? [ value.min, value.max ] : (viewModel.type == 'min' ? value.max : value.min)
					);
				}
			}
		};
	}
);