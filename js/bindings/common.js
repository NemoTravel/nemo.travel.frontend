'use strict';
define(
	['knockout', 'jquery','js/lib/jquery.select2/v.4.0.0/select2.full'],
	function (ko, $) {
		// Common Knockout bindings are defined here
		/*
		 ko.bindingHandlers.testBinding = {
			 init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {},
			 update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {}
		 };
		 */

		ko.bindingHandlers.clickSelf = {
			init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				function doMagic (event) {
					var f = valueAccessor();
					if (typeof f == 'function' && event.target == this) {
						f.apply(element, [viewModel, event]);
					}
				}
				if (typeof element.addEventListener == 'function') {
					element.addEventListener('click', doMagic);
				}
				else if (typeof element.attachEvent == 'function') {
					element.attachEvent('onclick', doMagic);

					ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
						element.detachEvent('onclick', doMagic);
					});
				}
			}
		};

		ko.bindingHandlers.simpleSelect = {
			init: function(el, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				ko.utils.domNodeDisposal.addDisposeCallback(el, function() {
					$(el).select2('destroy');
				});

				var allBindings = allBindingsAccessor(),
					simpleSelect = ko.utils.unwrapObservable(allBindings.simpleSelect);

				simpleSelect.templateResult = simpleSelect.templateSelection = function (state) {
					if (simpleSelect.i18nPrefix && simpleSelect.i18nSegment) {
						return bindingContext.$root.i18n(simpleSelect.i18nSegment, simpleSelect.i18nPrefix + state.text);
					}
					return state.text;
				};

				simpleSelect.containerCssClass = simpleSelect.containerCssClass || 'new-ui-select2__container';
				simpleSelect.dropdownCssClass = simpleSelect.dropdownCssClass || 'new-ui-select2__dropdown';

				// Overriding width
				simpleSelect.width = simpleSelect.width || 'auto';

				$(el).select2(simpleSelect);
			},
			update: function (el, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var allBindings = allBindingsAccessor();

				if ("value" in allBindings) {
					if (allBindings.simpleSelect.multiple && allBindings.value().constructor != Array) {
						$(el).select2("val", allBindings.value().split(","));
					}
					else {
						$(el).select2("val", allBindings.value());
					}
				}
				else if ("selectedOptions" in allBindings) {
					var converted = [],
						textAccessor = function(value) { return value; };

					if ("optionsText" in allBindings) {
						textAccessor = function(value) {
							var valueAccessor = function (item) { return item; }

							if ("optionsValue" in allBindings) {
								valueAccessor = function (item) { return item[allBindings.optionsValue]; }
							}
							var items = $.grep(allBindings.options(), function (e) { return valueAccessor(e) == value});
							if (items.length == 0 || items.length > 1) {
								return "UNKNOWN";
							}
							return items[0][allBindings.optionsText];
						}
					}

					$.each(allBindings.selectedOptions(), function (key, value) {
						converted.push({id: value, text: textAccessor(value)});
					});

					$(el).select2("data", converted);
				}
			}
		};
	}
);