'use strict';
define(
	['knockout', 'jquery', 'jqueryUI'],
	function (ko, $) {
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
					value = viewModel.value();

				$element.slider({
					range: viewModel.type == 'range' || viewModel.type,
					min: values.min,
					max: values.max,
					values: viewModel.type == 'range' ? [ value.min, value.max ] : (viewModel.type == 'min' ? value.max : value.min),
					slide: function( event, ui ) {
						// TODO values display
					},
					change: function( event, ui ) {
						if (event.originalEvent) {
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

				// We update values on clear only due to strange bug in jQueryUI when both handles are to the right
				if (value.min == values.min && value.max == values.max) {
					$(element).slider(
						viewModel.type == 'range' ? 'values' : 'value',
						viewModel.type == 'range' ? [ value.min, value.max ] : (viewModel.type == 'min' ? value.max : value.min)
					);
				}
			}
		};
	}
);