'use strict';
define(
	[
		'knockout',
		'jquery',
		'js/vm/Common/Cache/Cache',
		'js/lib/md5/md5',
		'js/vm/Common/Money',
		'numeralJS',
		'js/lib/jquery.currencyConverter/jquery.currencyConverter',
		'js/lib/jquery.tooltipster/v.3.3.0/jquery.tooltipster.min',
		'js/lib/jquery.ui.popup/jquery.ui.popup',
		'js/lib/jquery.tablesorter/v.2.0.5/jquery.tablesorter.min',
		'touchpunch',
		'js/lib/lightslider/dist/js/lightslider.min',
		'jqueryUI'
	],
	function (ko, $, Cache, md5, Money) {
		// Common Knockout bindings are defined here
		/*
		 ko.bindingHandlers.testBinding = {
			 init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {},
			 update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {}
		 };
		 */

		/**
		 * Advanced 'with' binding from knockout 3.5.0.
		 */
		ko.bindingHandlers['let'] = {
			init: function(element, valueAccessor, allBindings, vm, bindingContext) {
				var innerContext = bindingContext.extend(valueAccessor);
				ko.applyBindingsToDescendants(innerContext, element);

				return { controlsDescendantBindings: true };
			}
		};

		ko.virtualElements.allowedBindings['let'] = true;

		ko.bindingHandlers.console = {
			init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var data = valueAccessor();

				if (!(data instanceof Array)) {
					data = [data];
				}

				console.log.apply(console, data);
			}
		};

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
				ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
					try {
						$(element).tooltipster('destroy');
					}
					catch (e) {/* do nothing */}
				});

				$(document).on('cc:changeCurrency', function () {
					ko.bindingHandlers.tooltip.update(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
				});
			},
			update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var $element = $(element),
					options = valueAccessor();

				// Overriding default options
				if(options.content){
					options.content = options.content || '';
					options.trigger = options.trigger || 'hover';

					if (options.header) {
						if (options.content instanceof $ && options.content.length === 1) {
							options.content = options.content.html();
						}

						options.content = '<div class="tooltipster-header">' + options.header + '</div>' + options.content;
					}

					options.theme = options.cssClass || '';
					options.arrow = options.arrow || false;
					options.contentAsHTML = typeof options.contentAsHTML != 'undefined' ? options.contentAsHTML : true;
					options.offsetX = options.offsetX || 0;
					options.offsetY = options.offsetY || 0;
					options.position = options.position || 'top';
					options.functionBefore = function(origin, continueTooltip) {
						if (
							!options.detectOverflow ||
							origin[0].offsetWidth < origin[0].scrollWidth
						) {
							continueTooltip();
						}
					};

					delete options.cssClass;
				}else{
					return false;
				}
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
					money = valueAccessor(),
					moneyObject;

				if (money) {
					if (typeof money === 'object' && !(money instanceof Money) && bindingContext.$root.controller) {
						moneyObject = bindingContext.$root.controller.getModel('Common/Money', {
							amount: money.amount,
							currency: money.currency
						});
					}
					else {
						moneyObject = money;
					}

					$moneyElement
						.attr('currency', moneyObject.currency())
						.attr('amount', moneyObject.amount())
						.text(Math.ceil(moneyObject.normalizedAmount()) + ' ' + moneyObject.currency());
				}

				$moneyElement.trigger('cc:updated');
			}
		};

		ko.bindingHandlers.spinner = {
			init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				// initialize datepicker with some optional options
				var options = allBindingsAccessor().spinnerOptions || {};

				$(element).spinner(options);

				// handle the field changing
				ko.utils.registerEventHandler(
					element,
					'spinstop',
					function (event) {
						if (event.keyCode !== undefined) {
							return;
						}

						var $self = $(element),
							room = $self.attr('room'),
							type = $self.attr('passengerType'),
							idPass = $self.attr('idPass'),
							count = $(element).spinner('value');

						bindingContext.$parent.setPassengersCount(type, count, idPass);
					}
				);

				// handle disposal (if KO removes by the template binding)
				ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
					$(element).spinner('destroy');
				});
			},
			update: function (element, valueAccessor) {
				var value   = ko.utils.unwrapObservable(valueAccessor()),
					current = $(element).spinner('value'),
					msg     = 'You have entered an Invalid Quantity';

				if (isNaN(parseInt(value))) {
					alert(msg);
				}

				if (value !== current && !isNaN(parseInt(value))) {
					$(element).spinner('value', value);
				}
			}
		};
		
		/**
		 * Dynamically adds currency-icon class to an element.
		 */
		ko.bindingHandlers.currencyIcon = {
			_icons: {
				RUB: 'fa-rub',
				USD: 'fa-usd',
				EUR: 'fa-eur',
				GBP: 'fa-gbp',
				JPY: 'fa-jpy',
				ILS: 'fa-ils',
				KRW: 'fa-krw',
				TRY: 'fa-try'
			},
			init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var $element = $(element),
					param = ko.unwrap(valueAccessor()),
					defaultCurrency = param && param in ko.bindingHandlers.currencyIcon._icons ? param : 'USD';
				
				$element.removeClass();
				$element.addClass('fa ' + ko.bindingHandlers.currencyIcon._icons[defaultCurrency]);

				// Subscribe on currency changing event.
				$(document).on('cc:changeCurrency', function (e, data) {
					var currency = defaultCurrency;

					if (data && data.currency && data.currency in ko.bindingHandlers.currencyIcon._icons) {
						currency = data.currency;
					}

					$element.removeClass();
					$element.addClass('fa ' + ko.bindingHandlers.currencyIcon._icons[currency]);
				});
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

		ko.bindingHandlers.doubleFade = {
			update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var isVisible = ko.utils.unwrapObservable(valueAccessor()),
					$element = $(element);

				if (isVisible) {
					$element.fadeIn(150);
				}
				else {
					$element.fadeOut(150);
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
						onlyFirstBlock: false,
						beforeOpen: null,
						checkPopupInParentExist: false,
						close: function () {}
					},
					params = ko.utils.unwrapObservable(valueAccessor()),
					$element = $(element),
					block = '';

				if (
					typeof params === 'object' &&
					typeof params.block !== 'undefined'
				) {
					$element.on('click', function (e) {
						e.preventDefault();

						var popupParams = $.extend({},defaults,params),
							$target = $element.parents('.' + popupParams.parentClass);

						if (typeof popupParams.beforeOpen === 'function') {
							popupParams.beforeOpen();
						}

						if ($target.length === 0) {
							return;
						}

						// проверяем, не был ли создан попап в рамках родительского класса parentClass
						// если был создан, то открываем его
						if (popupParams.checkPopupInParentExist) {
							var temp = $target.find('.js-popup-'+popupParams.block);

							if (temp.length && temp.data('ui-popup')) {
								temp.popup('open');
								return;
							}
						}

						$target = $target.find('.js-nemoApp__popupBlock[data-block="'+popupParams.block+'"]');

						if (params.onlyFirstBlock === true && $target.length > 1) {
							$target = $target.first();
						}

						if (params.onlyFirstBlock === true && $target.length > 1) {
							$target = $target.first();
						}

						block = popupParams.block;

						delete popupParams.block;
						delete popupParams.beforeOpen;

						if (!$element.data('ui-popup')) {
							if ($target.length == 1) {
								popupParams.contentData = $target.show();

								$element.popup(popupParams);

								if (popupParams.checkPopupInParentExist) {
									$element.addClass('js-popup-' + block);
								}
							}
							else if (viewModel && viewModel.$$controller) {
								viewModel.$$controller.error('Error on displaying popup. Collection length = '+$target.length+' (.js-nemoApp__popupBlock[data-block="'+params.block+'"])', popupParams);
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

		ko.bindingHandlers.carrierSelectedFlightsScroller = {
			init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				function keepSelectedVisible (e) {
					var $this = $(this);

					setTimeout(function () {
						var pageScrollTop = $(document).scrollTop(),
							offsetTop = $this.offset().top,
							height = $this.outerHeight();

						if (pageScrollTop > offsetTop) {
							$('html,body').animate({scrollTop: offsetTop + 'px'}, 1);
						}
					}, 10);
				}

				$(document).on('click', '.js-flights-carrierResults__leg__fareSelector', keepSelectedVisible);

				ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
					$(document).off('click', keepSelectedVisible);
				});
			}
		};

		ko.bindingHandlers.moneyInit = {
			init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				$(document).currencyConverter({
					defaultCurrency: 'EUR',
					conversionTable: valueAccessor(),
					currencyType: 'symbol',
					roundingFunction: Math.round,
					useCache: false
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
                        }

                        return false;

                    } else {
                        $(element).addClass("js-common-scrollable_off");
                    }
                }

            }
        };

		ko.bindingHandlers.pseudoSelect = {
			init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var $this = $(element),
					$root = $this.parents('.js-common-pseudoSelect'),
					$dropdown = $root.find('.js-common-pseudoSelect__dropdown'),
					$close = $root.find('.js-common-pseudoSelect__close'),
					options = $.extend({}, {
						reposition: true,
						adjustWidth: true,

						// т.к. в этом биндинге не реализован метод update, а нам как-то нужно отслеживать
						// изменения извне, приходится извращаться.
						isDisabled: ko.observable(false)
					}, valueAccessor() || {}),
					close = true;

				function hideDropdown (e) {
					if (
						!$(e.target).closest('.js-common-pseudoSelect__toggle').length ||
						($dropdown.is(':visible') && close)
					) {
						$dropdown.hide();
						$this.removeClass('nemo-ui-select__toggle_open');
					}

					close = true;
				}

				$close.on('click', function (e) {
					hideDropdown(e);
				});

				// Adjusting width
				if (options.adjustWidth) {
					setTimeout(function () {
						$dropdown.show();

						$this.css('min-width',$dropdown.children().eq(0).width() + ($this.outerWidth() - $this.width()) + 'px');

						$dropdown.hide();
					}, 1);
				}

				$this.on('click', function (e) {
					if (ko.unwrap(options.isDisabled)) {
						return false;
					}

					var $dropdown  = $root.find('.js-common-pseudoSelect__dropdown'),
						vpHeight   = $(window).height(),
						vpOffset   = $(document).scrollTop(), // positive
						rootHeight = $root.outerHeight(),
						rootOffset,// = $root.offset().top,
						dropHeight;

					e.preventDefault();

					if (!$dropdown.length) {
						console.log($root);
						return;
					}

					$this.addClass('nemo-ui-select__toggle_open');

					close = $dropdown.is(':visible');

					$dropdown.css({top: '', bottom: ''}).show();

					if (options.reposition) {
						// Process positioning
						rootOffset = $root.offset().top
						dropHeight = $dropdown.outerHeight();

						if (
							rootOffset + rootHeight + dropHeight > vpHeight + vpOffset && // Drop is lower than bottom screen border
							rootOffset > dropHeight                                       // Drop won't be cut off by screen top
						) {
							$dropdown.css({bottom: '100%'});
						}
						else {
							$dropdown.css({top: '100%'});
						}
					}
				});

				$(document).on('click', hideDropdown);

				ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
					$(document).off('click', hideDropdown);
				});
			}
		};

		ko.bindingHandlers.toggleBlock = {
			init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var $this = $(element),
					$root = $this.parents('.js-common-toggleBlock'),
					$dropdown = $root.find('.js-common-toggleBlock__dropdown'),
					openToggleBlockClass = 'toggleBlock-open';

				$this.on('click', function (e) {
					var $dropdown = $root.find('.js-common-toggleBlock__dropdown');

					e.preventDefault();

					if ($dropdown.is(':visible')) {
						$dropdown.hide();
						$this.removeClass(openToggleBlockClass);
					}
					else {
						$dropdown.show();
						$this.addClass(openToggleBlockClass);
					}
				});

				ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
					$this.removeClass(openToggleBlockClass);
					$dropdown.hide();
				});
			}
		};

		ko.bindingHandlers.setBodyClass = {
			update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var data = valueAccessor();

				if (typeof data != 'object') {
					data = {
						className: data,
						condition: true
					};
				}

				if (data.condition) {
					$('body').addClass(data.className);
				}
				else {
					$('body').removeClass(data.className);
				}

				ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
					$('body').removeClass(data.className);
				});
			}
		};

		ko.bindingHandlers.timedBlockToggle = {
			init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var $element = $(element),
					timeout = setTimeout(function () {
						$element.toggle();
					}, valueAccessor() * 1000);

				ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
					clearTimeout(timeout);
				});
			}
		};

		ko.bindingHandlers.tableSorter = {

			/**
			 * Init tablesort plugin on table.
			 * setTimeout 200ms is a small hack to let knockout to complete table render.
			 *
			 * @param element
			 * @param valueAccessor
			 * @param allBindingsAccessor
			 * @param viewModel
			 * @param bindingContext
			 */
			init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var $element = $(element),
					options = ko.utils.unwrapObservable(valueAccessor);

				$element.ready(function () {
					setTimeout(function () {
						$element.tablesorter(options);
					}, 200);
				});
			}
		};

		ko.bindingHandlers.debugger = {
			init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				debugger;
			}
		};

		ko.bindingHandlers.log = {
			init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				console.debug({
					'log': valueAccessor()
				});
			}
		};

		ko.bindingHandlers.loadTemplate = {
			init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var cache = Cache.storage(),
					templateId = $(element).prop('id'),
					templateUrl = bindingContext.$root.controller.options.hotelsTemplateSourceURL + '/html/partials/' + templateId + '.html',
					templateHash = md5(templateUrl);

				if (cache.has(templateHash)) {
					var html = cache.get(templateHash);
					$(element).html(html);
				}
				else {
					$.get(templateUrl).then(function (res) {
						$(element).html(res);
					}, function () {
						console.error('Template "%s" not found!', templateUrl);
					});
				}
			}
		};

		ko.bindingHandlers.fotorama = {
			init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				$(element).fotorama({
					nav: 'thumbs',
					loop: true,
					data: valueAccessor(),
					fit: 'none',
					arrows: true,
					keyboard: true,
					margin: 0,
					glimpse: 0
				});
			}
		};

		ko.bindingHandlers.navigate = {
			init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				$(element).on('click', function () {
					var URL = ko.unwrap(valueAccessor());

					if (bindingContext.$root && bindingContext.$root.controller) {
						bindingContext.$root.controller.navigate(URL);
					}
				});
			}
		};

		ko.bindingHandlers.lightslider = {
			init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var photos = ko.unwrap(valueAccessor());

				if (photos instanceof Array && photos.length) {
					var $inner = $('<ul></ul>');

					photos.map(function (photo) {
						$inner.append('' +
							'<li data-thumb="' + photo.thumb + '">' +
								'<div class="lslideUndercover" style="background-image: url(' + photo.img + ')"></div>' +
								'<div class="lslideUndercoverDarken"></div>' +
								'<img src="' + photo.img + '">' +
							'</li>' +
						'');
					});

					$(element).append($inner);

					$inner.lightSlider({
						gallery: true,
						item: 1,
						controls: false,
						loop: false,
						slideMargin: 0,
						thumbItem: photos.length < 12 ? photos.length : 12,
						adaptiveHeight: true,
						responsive : [
							{
								breakpoint: 1000,
								settings: {
									thumbItem: photos.length < 9 ? photos.length : 9
								}
							},
							{
								breakpoint: 800,
								settings: {
									thumbItem: photos.length < 7 ? photos.length : 7
								}
							},
							{
								breakpoint: 600,
								settings: {
									thumbItem: photos.length < 5 ? photos.length : 5
								}
							},
							{
								breakpoint: 500,
								settings: {
									thumbItem: photos.length < 4 ? photos.length : 4
								}
							}
						]
					});
				}
			}
		};

		ko.bindingHandlers.i18n = {
			update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

				var i18nTranslationKey = valueAccessor();
				var i18n = bindingContext.$root.i18n;
				var keys = i18nTranslationKey.split('.');
				var text = i18n(keys[0], keys[1]);

				$(element).text(text);
			}
		};
	}
);
