'use strict';
define(
	[
		'knockout',
		'jquery',
		'numeralJS',
		'js/lib/jquery.currencyConverter/jquery.currencyConverter',
		'js/lib/jquery.select2/v.4.0.0/select2.full',
		'js/lib/jquery.tooltipster/v.3.3.0/jquery.tooltipster.min',
		'js/lib/jquery.ui.popup/jquery.ui.popup',
		'touchpunch'
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
					.attr('currency', money ? money.currency() : '')
					.attr('amount', money ? money.amount() : '')
					.text(money ? Math.ceil(money.normalizedAmount()) + ' ' + money.currency() : '')
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
				simpleSelect.width = typeof simpleSelect.width != 'undefined' ? simpleSelect.width : 'resolve';
				simpleSelect.dropdownAutoWidth = simpleSelect.dropdownAutoWidth || true;
				simpleSelect.minimumResultsForSearch = simpleSelect.minimumResultsForSearch || Infinity;
				simpleSelect.fixWidth = typeof simpleSelect.fixWidth != 'undefined' ? simpleSelect.fixWidth : true;

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

		ko.bindingHandlers.automaticPopup = {
			init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
					try {
						$(element).popup("destroy");
					}
					catch (e) {}
				});
			},
			update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var defaults = {
						modal: true,
						draggable: false,
						closeText: bindingContext.$root.i18n('common', 'popup_closeText'),
						width: 'auto',
						height: 'auto',
						title: '',
						beforeOpen: null,
						autoOpen: true,
						close: function () {}
					},
					params = ko.utils.unwrapObservable(valueAccessor()),
					$element = $(element);

				if (typeof params == 'object') {
					var popupParams = $.extend({},defaults,params),
						$target = $element.children();

					popupParams.contentType = 'html';

					if (typeof popupParams.beforeOpen == 'function') {
						popupParams.beforeOpen();
					}

					delete popupParams.beforeOpen;

					try {
						$element.popup("destroy");
					}
					catch (e) {}


					setTimeout(function (){
						popupParams.contentData = $target.show();
						$element.popup(popupParams);
					},1);
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
						close: function () {}
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

		ko.bindingHandlers.moneyInit ={
			init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				$(document).currencyConverter({
					defaultCurrency: 'EUR',
					conversionTable: {},
					currencyType: 'symbol',
					roundingFunction: Math.round
				});
			}
		};

        ko.bindingHandlers.customScroll = {
            init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

                // TODO Initial state should be checked (when we finally loaded view)

                $(element).addClass("nemo-common-scrollable js-common-scrollable");
                $(element).children().wrapAll("<div class='nemo-common-scrollable__content js-scrollable__content'><div class='nemo-common-scrollable__content_inner js-scrollable__content_inner'>");
                $(element).append("<div class='nemo-common-scrollable__scroller js-scrollable__scroller'><div class='nemo-common-scrollable__scroller__control js-scrollable__scroller__control'></div></div>");

                var scrollAmount, scrollDistance, scrollerControlMoveAmount, scrollProportion, scrollerControlHeight;

                var scrollableContent       = $(".js-scrollable__content");
                var scrollableContentInner  = $(".js-scrollable__content_inner");
                var scroller                = $(element).children(".js-scrollable__scroller");
                var scrollerControl         = scroller.children(".js-scrollable__scroller__control");
                var scrollDecay             = 0.5;
                var scrollableDistance      = scrollableContentInner.height() - scrollableContent.height();
                var dragging;

                scroller.on("mousedown", function(event){
                    dragging = true;
                });

                $(document).on("mouseup", function(event){
                    dragging = false;
                });

                $(element).parent().on("mousemove", function(event) {

                    if (dragging) {

                        var scrollTo = event.pageY - scroller.offset().top;
                        scrollProportion = scrollableContent.height() / scrollableContentInner.height();
                        scrollerControlHeight = scroller.height() * scrollProportion;
                        scrollerControl.css('height', scrollerControlHeight);

                        if (scrollProportion < 1) {
                            $(element).removeClass("js-common-scrollable_off");

                            scrollableDistance = scrollableContentInner.height() - scrollableContent.height();
                            scrollDistance = (scrollTo - scrollerControl.height()/2) / scrollProportion;
                            scrollAmount = scrollDistance;

                            if (scrollAmount > scrollableDistance) {
                                scrollAmount = scrollableDistance;
                            } else if (scrollAmount < 0) {
                                scrollAmount = 0;
                            }

                            scrollableContent.scrollTop(scrollAmount);
                            scrollerControlHeight = scroller.height() * scrollProportion;
                            scrollerControlMoveAmount = scrollAmount * scrollProportion;
                            scrollerControl.css('top', scrollerControlMoveAmount);
                            scrollerControl.css('height', scrollerControlHeight);
                        } else {
                            $(element).addClass("js-common-scrollable_off");
                        }

                        return false;
                    }

                });

                scroller.on("click", function(event) {

                    var scrollTo = event.pageY - $(this).offset().top;
                    scrollProportion = scrollableContent.height() / scrollableContentInner.height();
                    scrollerControlHeight = scroller.height() * scrollProportion;
                    scrollerControl.css('height', scrollerControlHeight);


                    if (scrollProportion < 1) {
                        $(element).removeClass("js-common-scrollable_off");

                        scrollableDistance = scrollableContentInner.height() - scrollableContent.height();
                        scrollDistance = (scrollTo - scrollerControl.height()/2) / scrollProportion;
                        scrollAmount = scrollDistance;

                        if (scrollAmount > scrollableDistance) {
                            scrollAmount = scrollableDistance;
                        } else if (scrollAmount < 0) {
                            scrollAmount = 0;
                        }

                        scrollableContent.scrollTop(scrollAmount);
                        scrollerControlHeight = scroller.height() * scrollProportion;
                        scrollerControlMoveAmount = scrollAmount * scrollProportion;
                        scrollerControl.css('top', scrollerControlMoveAmount);
                        scrollerControl.css('height', scrollerControlHeight);
                    } else {
                        $(element).addClass("js-common-scrollable_off");
                    }

                    return false;
                });

                $(element).on("click", function(){
                   scrollRedraw(1, 0);
                });

                $(window).on("resize", function(){
                    scrollRedraw(1, 0);
                });

                $(element).mousewheel(function (event) {
                    return (scrollRedraw(event.deltaY, event.deltaFactor));
                });

                function scrollRedraw(scrollDirection, scrollDistance) {
                    scrollProportion = scrollableContent.height() / scrollableContentInner.height();

                    if (scrollProportion < 1) {
                        $(element).removeClass("js-common-scrollable_off");

                        scrollableDistance = scrollableContentInner.height() - scrollableContent.height();
                        scrollDistance = scrollDirection * scrollDistance * scrollDecay;
                        scrollAmount = scrollableContent.scrollTop() - scrollDistance;

                        if (scrollAmount > scrollableDistance) {
                            scrollAmount = scrollableDistance;

                            scrollableContent.scrollTop(scrollAmount);
                            scrollerControlHeight = scroller.height() * scrollProportion;
                            scrollerControlMoveAmount = scrollAmount * scrollProportion;
                            scrollerControl.css('top', scrollerControlMoveAmount);
                            scrollerControl.css('height', scrollerControlHeight);
                        } else if (scrollAmount < 0) {
                            scrollAmount = 0;

                            scrollableContent.scrollTop(scrollAmount);
                            scrollerControlHeight = scroller.height() * scrollProportion;
                            scrollerControlMoveAmount = scrollAmount * scrollProportion;
                            scrollerControl.css('top', scrollerControlMoveAmount);
                            scrollerControl.css('height', scrollerControlHeight);
                        } else {
                            scrollableContent.scrollTop(scrollAmount);
                            scrollerControlHeight = scroller.height() * scrollProportion;
                            scrollerControlMoveAmount = scrollAmount * scrollProportion;
                            scrollerControl.css('top', scrollerControlMoveAmount);
                            scrollerControl.css('height', scrollerControlHeight);
                            return false;
                        }

                    } else {
                        $(element).addClass("js-common-scrollable_off");
                    }
                }

            },

            update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

            }
        };
	}
);