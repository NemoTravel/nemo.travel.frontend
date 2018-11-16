'use strict';
define(['knockout', 'js/vm/mobileDetect', 'js/vm/helpers', 'jquery', 'jqueryUI', 'js/lib/jquery.pickmeup/jquery.pickmeup', 'js/lib/jquery.chosen/v.1.4.2/chosen.jquery.min'],
	function (ko, mobileDetect, helpers, $) {
		// Extending jQueryUI.autocomplete for Flights Search Form geo autocomplete
		$.widget('nemo.HotelsFormGeoAC', $.ui.autocomplete, {
			_create: function () {
				this._super();

				this.widget().menu('option', 'items', '> :not(.ui-autocomplete-category)');
			},
			_renderItem: function (ul, item) {
				var text;
				if (typeof item.label == 'undefined') {
					text = item.name
							.replace(
								new RegExp(
									'(' + (this.term.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '')) + ')',
									'i'
								),
								'<span class="nemo-ui-autocomplete__match">$1</span>'
							) +
						(item.country ? '<span class="nemo-hotels-form__geoAC__item__country">, ' + item.country + '</span>' : '');
				}
				else {
					text = item.label;
				}

				//text += '</span>' + ('<span class="nemo-hotels-form__staying__segment_autocomplete_item__second">' + item.country + '</span>');


				return $('<li>')
				.addClass('nemo-hotels-form__staying__segment_autocomplete_item')
				.append(text)
				.attr('data-value',
					typeof item.label == 'undefined')
				.appendTo(ul);
			},
			_renderMenu: function (ul, items) {
				var that = this;

				$.each(items, function (index, item) {
					that._renderItemData(ul, item);
				});

				$(ul).addClass('nemo-hotels-form__staying__segment_autocomplete_container');
			}
		});

		ko.bindingHandlers.flightsFormSelect = {
			init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				if ($(element).chosen) {
					var options = $.extend(
						{
							width: '100%',
							display_selected_options: false,
							display_disabled_options: false,
							placeholder_text_multiple: '',
							no_results_text: '',
							max_selected_options: 5
						},
						valueAccessor()
					);

					$(element).chosen(options);

					//preventing strange glitch with "no results" <li> and focus
					var closeChosen = function () {
						console.log(element);
						$(element).trigger('chosen:close')
					};

					$(document).on('click', '.no-results', closeChosen);

					ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
						$(document).off('click', '.no-results', closeChosen);
					});
				}
			},
			update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {}
		};

		ko.bindingHandlers.hotelsFormGeoAC = {
			init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
				var $element = $(element);

				$element.HotelsFormGeoAC(
					{
						appendTo: '.js-nemo-hotels-autocomplete',
						minLength: 2,
						source: function (request, callback) {
							var url = '/guide/autocomplete/cities/';
							
							url = viewModel.$$controller.options.dataURL + url + encodeURIComponent(request.term);
							url += '?user_language_get_change=' + viewModel.$$controller.options.i18nLanguage;

							$.getJSON(
								url,
								function (data) {
									var result = [];
									for (var i = 0; i < data.guide.autocomplete.cities.length; i++) {
										result.push(viewModel.$$controller.getModel(
											'Hotels/Common/Geo',
											{
												data: data.guide.autocomplete.cities[i],
												guide: data.guide
											}
											)
										);
									}

									callback(result);
								});
						},
						open: function (event, ui) {
							var $children = $(this).data('nemo-HotelsFormGeoAC').menu.element.children('[data-value="true"]');

							if ($children.length == 1) {
								$children.eq(0).mouseenter().click();
							}
							else {
								$(event.target).data('nemo-HotelsFormGeoAC').menu.activeMenu.addClass('nemo-ui-autocomplete_open');
							}
						},
						response: function (event, ui) {
							$(event.target).data('nemo-HotelsFormGeoAC').menu.activeMenu.removeClass('nemo-ui-autocomplete_open');
						},
						select: function (event, ui) {
							$element.blur();
							// If item has label - it's something other than geo point that
							// should be in AC So we set corresponding stuff only if it's valid
							if (typeof ui.item.label == 'undefined') {
								valueAccessor()(ui.item);
								// Autofocus stuff
								$element.trigger('nemo.fsf.segmentPropChanged');
							}

							return false;
						},
						focus: function (event, ui) {
							event.preventDefault();

							if (ui.item != undefined) {
								$(this).val(ui.item.name);
							}
							else {
								$(this).val('');
							}
						},
						close: function () {
							$(this).val('');
						}
					}
				);
				$element.on('blur',
					function (e) {
						$element.val('');
					}
				);
				$element.on('keyup',
					function (e) {
						if (e.keyCode == 13) {
							$('.ui-menu-item').each(function () {
								if ($(this).is(':visible')) {
									$(this).click();
									return false;
								}
							});
						}
					}
				);
				ko.utils.domNodeDisposal.addDisposeCallback(element,
					function () {
						$element.off('blur');
						$element.off('keyup');

						try {
							$element.autocomplete('destroy');
						}
						catch (e) {/* Do nothing */
						}
					}
				);
			},
			update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
			}
		};

		ko.bindingHandlers.hotelsFormAutoFocus = {
			init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var $element = $(element);
				$element.on('nemo.fsf.segmentPropChanged',
					function (event, data) {
						var $target     = $(event.target),
							$segment    = $target.parents('.js-autofocus-segment'),
							segment     = ko.dataFor(event.target),//data.segment,
							$focusField = null;

						if ($target.hasClass('js-autofocus-field_arrival')) {
							$focusField = $segment
							.parents('.js-autofocus-form')
							.find('.js-autofocus-field_date_arrival');
						}
						else if ($target.hasClass('js-autofocus-field_date_arrival')) {
							$focusField = $segment
							.parents('.js-autofocus-form')
							.find('.js-autofocus-field_date_departure');
						}
						else if ($target.hasClass('js-autofocus-field_date_departure')) {
							$focusField = $segment
							.parents('.js-autofocus-form')
							.find('.js-hotels-searchForm-passSelect')
							.eq(0);
						}

						if ($focusField) {
							$focusField.focus();
						}
					}
				);
				ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
					$element.off('nemo.fsf.segmentPropChanged');
				});
			},
			update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
			}
		};
		var PMULocale;
		ko.bindingHandlers.hotelsFormDatepicker = {
			init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var $element = $(element);
				$element.on('blur', function () {
					$(this).val('');
				});

				// Do not forget to add destroy callbacks
				ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
					$element.pickmeup('destroy');
					$element.off('blur');
				});

				if (mobileDetect().deviceType != 'desktop') {
					$element.attr('readonly', 'true');
				}
			}, update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var $element = $(element);
				if (!PMULocale) {
					PMULocale = {
						days: [], // ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday',
								  // 'Saturday', 'Sunday'],
						daysShort: [], // ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
						daysMin: [], // ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
						months: [], // ['January', 'February', 'March', 'April', 'May', 'June', 'July',
									// 'August', 'September', 'October', 'November', 'December'],
						monthsShort: []  // ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct',
										 // 'Nov', 'Dec']
					};
					for (var i = 1; i <= 12; i++) {
						PMULocale.months.push(bindingContext.$root.i18n('dates', 'month_' + i + '_f_n'));
						PMULocale.monthsShort.push(bindingContext.$root.i18n('dates', 'month_' + i + '_s_n'));
						if (i == 1) {
							PMULocale.days.push(bindingContext.$root.i18n('dates', 'dow_7_f'));
							PMULocale.daysShort.push(bindingContext.$root.i18n('dates', 'dow_7_s'));
							PMULocale.daysMin.push(bindingContext.$root.i18n('dates', 'dow_7_s'));
						}
						if (i <= 7) {
							PMULocale.days.push(bindingContext.$root.i18n('dates', 'dow_' + i + '_f'));
							PMULocale.daysShort.push(bindingContext.$root.i18n('dates', 'dow_' + i + '_s'));
							PMULocale.daysMin.push(bindingContext.$root.i18n('dates', 'dow_' + i + '_s'));
						}
					}
				}
				var calendarsToShow = mobileDetect().deviceType != 'desktop' ? 1 : 2;

				$element.pickmeup("destroy"); // удалить текущий календарь

				var maxDate = new Date(bindingContext.$parent.options.dateOptions.maxDate.getTime());

				// для случая, когда юзер выбрал дату заезда, но еще не выбрал дату выезда
				var selectDepartureDateCalendar = false;
				if (viewModel.form.segments()[0].items) {
					if(viewModel.form.segments()[0].items.arrivalDate.value() !== null) {
						if (valueAccessor()() === null) {
							// дата заезда есть, но текущий valueAccessor пустой, значит юзер выбирает дату выезда
							selectDepartureDateCalendar = true;
						}

						if ($element.hasClass('js-autofocus-field_date_departure')) {
							// устанавливаем максимально возможную дату выезда
							var dateArrival = viewModel.form.segments()[0].items.arrivalDate.value().dateObject().getTime();
							maxDate.setTime(dateArrival);
							maxDate.setDate(maxDate.getDate() + bindingContext.$parent.options.dateOptions.maxStayDays);
						}
					}
				}

				$element.pickmeup( // создать новый с обновленным defaultDate
					{
						className: 'nemo-flights-form__datePicker nemo-hotels',
						locale: PMULocale,
						calendars: calendarsToShow,
						min: bindingContext.$parent.options.dateOptions.minDate,
						max: maxDate, // bindingContext.$parent.options.dateOptions.maxDate,
						format: 'd.m.Y',
						hideOnSelect: true,
						monthHeaderFormat: bindingContext.$root.controller.options.i18nLanguage === "zh" ? 'Y B' : 'B, Y',
						defaultDate: valueAccessor()() ?
							valueAccessor()().dateObject() :
							viewModel.form.segments()[0].items && viewModel.form.segments()[0].items.arrivalDate.value() ?
								viewModel.form.segments()[0].items.arrivalDate.value().dateObject() :
								viewModel.form.dateRestrictions[viewModel.index][0],
						render: function (dateObj) {
							var ret = viewModel.form.getSegmentDateParameters(
								dateObj,
								viewModel.index,
								$(this).hasClass('js-autofocus-field_date_arrival'),
								selectDepartureDateCalendar
							);

							ret.className = '';

							var $this = viewModel.form.segments()[0];

							var arrivalTime = $this.items ? helpers.getTimeFromCommonDate($this.items.arrivalDate.value()) : null;
							var departureTime = $this.items ? helpers.getTimeFromCommonDate($this.items.departureDate.value()) : null;

							var dateObjectTime = dateObj.getTime();

							if (arrivalTime == null) {
								var today = new Date();
								today.addDays(bindingContext.$parent.options.dateOptions.minOffset);
								today.setHours(0, 0, 0, 0);
								arrivalTime = (new Date(today)).getTime();

							}

							if (dateObjectTime == departureTime) {
								ret.className = ' nemo-pmu-stop';
							}

							if (dateObjectTime == arrivalTime) {
								ret.className = ' nemo-pmu-start';
							}

							if (dateObjectTime > arrivalTime && dateObjectTime < departureTime) {
								ret.className = ' nemo-pmu-interval';
							}

							delete ret.segments;
							delete ret.period;

							return ret;
						},
						onSetDate: function () {
							$element.blur();

							if (viewModel.form.segments()[0].items.arrivalDate.value()) {
								var d1 = new Date(this.current);
								var d2 = new Date(viewModel.form.segments()[0].items.arrivalDate.value().$$originalData);

								if (d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getYear() === d2.getYear()) {
									return false;
								}
							}

							valueAccessor()(viewModel.$$controller.getModel('Common/Date', this.current));

							// Autofocus stuff
							$element.trigger('nemo.fsf.segmentPropChanged');
						}
					}
				);
			}
		};
		ko.bindingHandlers.hotelsFormGuestsSelector = {
			init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var closeSelector = function (e) {
						var $target = $(e.target);

						if (!$target.is('.js-hotels-searchForm-passSelect') &&
							!$target.parents().is('.js-hotels-searchForm-passSelect')) {
							viewModel.roomsFastSelectorOpen(false);

							if (fullScreen) {
								$('body').css('overflow', 'auto');
							}
						}
					},
					$document     = $(document),
					$close        = $('.js-common-pseudoSelect__close'),
					fullScreen    = valueAccessor() ? valueAccessor().fullScreen : false;

				$(element).on('click', function () {
					if (fullScreen) {
						$('body').css('overflow', 'hidden');
					}

					viewModel.openRoomsSelector();
				});

				$document.on('click', closeSelector);

				$close.on('click', closeSelector);

				ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
					$document.off('click', closeSelector);
				});
			}
		};
		ko.bindingHandlers.spinnerAdults = {
			watch: function ($element, $wrapper, initialValue) {
				var min = $element.spinner('option', 'min'),
					max = $element.spinner('option', 'max'),
					value = initialValue ? initialValue : $element.spinner('value');

				if (value <= min) {
					$wrapper.addClass('nemo-hotels-form__spinner_disabledDown');
				}
				else {
					$wrapper.removeClass('nemo-hotels-form__spinner_disabledDown');

					if (value >= max) {
						$wrapper.addClass('nemo-hotels-form__spinner_disabledUp');
					}
					else {
						$wrapper.removeClass('nemo-hotels-form__spinner_disabledUp');
					}
				}
			},
			init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				//initialize datepicker with some optional options
				var options = allBindingsAccessor().spinnerOptions || {},
					$wrapper = $(element).parent('.nemo-hotels-form__spinner');

				$(element).spinner(options);

				ko.bindingHandlers.spinnerAdults.watch($(element), $wrapper, valueAccessor()());

				var context = bindingContext;

				ko.utils.registerEventHandler(element, 'spin', function (event, ui) {
					var maxAdultsCount     = context.$parent.maxAdultsFromFS,  // сколько всего может быть взрослых из Fast Search
						currentAdultsCount = context.$parent.guestsSummaryByType().adults, // сколько уже есть во всех комнатах
						delta              = ui.value - context.$parent.rooms()[$(element).attr('room')].adults();

					if (maxAdultsCount && delta + currentAdultsCount > maxAdultsCount) {
						return false; // отменить увеличение спина
					}
				});

				//handle the field changing
				ko.utils.registerEventHandler(element, 'spinstop', function () {
					context.$parent.rooms()[$(element).attr('room')].adults($(element).spinner('value'));

					ko.bindingHandlers.spinnerAdults.watch($(element), $wrapper);
				});

				//handle disposal (if KO removes by the template binding)
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
		
		ko.bindingHandlers.spinnerInfants = {
			init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				//initialize datepicker with some optional options
				var options = allBindingsAccessor().spinnerOptions || {},
					$wrapper = $(element).parent('.nemo-hotels-form__spinner');

				$(element).spinner(options);

				ko.bindingHandlers.spinnerAdults.watch($(element), $wrapper, valueAccessor());

				var context = bindingContext;

				ko.utils.registerEventHandler(element, 'spin', function (event, ui) {
					var maxInfantsCount     = context.$parent.maxInfantsFromFS,  // сколько всего может быть детей из Fast Search
						currentInfantsCount = context.$parent.guestsSummaryByType().infants, // сколько уже есть во всех комнатах
						delta               = ui.value - context.$parent.rooms()[$(element).attr('room')].infants().length;

					if (maxInfantsCount && delta + currentInfantsCount > maxInfantsCount) {
						return false; // отменить увеличение спина
					}

					if (delta < 0) { // спин был уменьшен
						context.$parent.rooms()[$(element).attr('room')].infants.splice(-1, 1);
					}
				});

				//handle the field changing
				ko.utils.registerEventHandler(
					element,
					'spinstop',
					function (event) {
						if (event.keyCode !== undefined) {
							return;
						}

						var countInfants = parseInt($(element).spinner('value'));

						if (countInfants === 0) {
							context.$parent.rooms()[$(element).attr('room')].infants([]);
						}
						else {
							if (context.$parent.rooms()[$(element).attr('room')].infants().length < countInfants) {
								context.$parent.rooms()[$(element).attr('room')].infants.push(0);
							}
						}

						ko.bindingHandlers.spinnerAdults.watch($(element), $wrapper);
					}
				);

				//handle disposal (if KO removes by the template binding)
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

		ko.bindingHandlers.snipperAge = {
			init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				// initialize datepicker with some optional options
				var options = allBindingsAccessor().spinnerOptions || {},
					$wrapper = $(element).parent('.nemo-hotels-form__spinner');

				$(element).spinner(options);

				ko.bindingHandlers.spinnerAdults.watch($(element), $wrapper, valueAccessor());

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
							infant = $self.attr('infant'),
							age = $(element).spinner('value');

						bindingContext.$parentContext.$parent.selectInfantAge(room, infant, age);
						ko.bindingHandlers.spinnerAdults.watch($(element), $wrapper);
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
	});