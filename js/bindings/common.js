'use strict';
define(
	[
		'knockout',
		'jquery',
		'touchPunch',
		'js/lib/jquery.select2/v.4.0.0/select2.full',
		'js/lib/jquery.tooltipster/v.3.3.0/jquery.tooltipster.min',
		'js/lib/jquery.ui.popup/jquery.ui.popup'
	],
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

		ko.bindingHandlers.tooltip = {
			init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
					try{
						$(element).tooltipster('destroy');
					}
					catch (e) {/* do nothing */}
				});
			},
			update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var $element = $(element),
					options = valueAccessor();

				// Overriding default options
				options.content = options.content || ' ';
				options.content = (options.header ? '<div class="tooltipster-header">'+options.header+'</div>' : '') + options.content;
				options.theme = options.cssClass || '';
				options.arrow = options.arrow || false;
				options.contentAsHTML = typeof options.contentAsHTML != 'undefined' ? options.contentAsHTML : true;
				options.offsetX = 0;
				options.offsetY = 0;

				delete options.cssClass;

				if ($element.data('tooltipsterNs')) {
					$element.tooltipster('content', options.content);
				}
				else {
					$element.tooltipster(options);
				}
			}
		};

		ko.bindingHandlers.money = {
			init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {},
			update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var $moneyElement = $(element),
					money = valueAccessor();

				$moneyElement
					.attr('currency', money.currency())
					.attr('amount', money.amount())
					.text(Math.ceil(money.normalizedAmount()) + ' ' + money.currency())
					.trigger('cc:updated');
			}
		}

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
				simpleSelect.width = simpleSelect.width || 'resolve';
				simpleSelect.dropdownAutoWidth = simpleSelect.dropdownAutoWidth || true;
				simpleSelect.minimumResultsForSearch = simpleSelect.minimumResultsForSearch || Infinity;
				simpleSelect.fixWidth = true;

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

		ko.bindingHandlers.popup = {
			init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var defaults = {
						block: '',
						contentType: 'html',
						modal: true,
						draggable: false,
						closeText: bindingContext.$root.i18n('common', 'popup_closeText'),
						width: 'auto',
						height: 'auto',
						title: '',
						parentClass: 'js-nemoApp__component',
						beforeOpen: null,
						close: function () {console.log(this, arguments)}
					},
					params = ko.utils.unwrapObservable(valueAccessor()),
					$element = $(element);

				if (
					typeof params == 'object' &&
					typeof params.block != "undefined"
				) {
					$element.on('click', function (e) {
						e.preventDefault();

						var popupParams = $.extend({},defaults,params),
							$target = $element.parents('.' + popupParams.parentClass);

						if (typeof popupParams.beforeOpen == 'function') {
							popupParams.beforeOpen();
						}

						if ($target.length == 0) {
							console.error('Component parent node not found (.' + popupParams.parentClass + ')');
							return;
						}

						$target = $target.find('.js-nemoApp__popupBlock[data-block="'+popupParams.block+'"]');

						delete popupParams.block;
						delete popupParams.beforeOpen;

						if (!$element.data('ui-popup')) {
							if ($target.length == 1) {
								popupParams.contentData = $target.show();

								$element.popup(popupParams);
							}
							else {
								console.error('Error on displaying popup. Collection length = '+$target.length+' (.js-nemoApp__popupBlock[data-block="'+params.block+'"])', popupParams);
							}
						}
						else {
							$element.popup('open');
						}
					});
				}

				ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
					try {
						$element.popup("destroy");
					}
					catch (e) {}
				});
			},
			update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {}
		};
	}
);