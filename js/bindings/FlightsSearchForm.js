'use strict';
define(
	[
		'knockout',
		'js/vm/mobileDetect',
		'jquery',
		'jqueryUI',
		'js/lib/jquery.pickmeup/jquery.pickmeup',
		'js/lib/nemo.jquery.chosen/chosen.jquery'
	],
	function (ko, mobileDetect, $) {
		// FlightsSearchForm Knockout bindings are defined here
		/*
		 ko.bindingHandlers.testBinding = {
		 init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {},
		 update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {}
		 };

		 // Do not forget to add destroy callbacks
		 ko.utils.domNodeDisposal.addDisposeCallback(element, function() {});
		 */

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

		// Extending jQueryUI.autocomplete for Flights Search Form geo autocomplete
		$.widget( "nemo.FlightsFormGeoAC", $.ui.autocomplete, {
			_renderItem: function( ul, item ) {
				// If item has label - it's something other than geo point that should be in AC
				var text;

				if (typeof item.label == 'undefined') {
					text = item.name
							.replace(
								new RegExp(
									'(' + (this.term.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '')) + ')',
									''
								),
								'<span class="nemo-ui-autocomplete__match">$1</span>'
							) +
						(item.country ? '<span class="nemo-flights-form__geoAC__item__country">, ' + item.country.name + '</span>' : '');
				}
				else {
					text = item.label;
				}
				
				var liClass = 'nemo-flights-form__geoAC__item';
				
				if('noRoute' in item && item.noRoute){ 
					liClass += ' nemo-flights-form__geoAC__item_noRoute';
				}
				if('directFlight' in item && item.directFlight){ 
					liClass += ' nemo-flights-form__geoAC__item_directFlight';
				}

				return $("<li>")
					.addClass(liClass)
					.append(text)
					.attr('data-value', typeof item.label == 'undefined')
					.appendTo(ul);
			},
			_renderMenu: function( ul, items ) {
				var that = this;

				$.each(items, function(index, item) {
					that._renderItemData(ul, item);
				});

				$(ul).addClass('nemo-ui-autocomplete nemo-flights-form__geoAC');
				if(items.length > 10){
					$(ul).addClass('nemo-flights-form__geoAC_withScroll');
				}
				else{
					$(ul).removeClass('nemo-flights-form__geoAC_withScroll');
				}
			}
		});

		ko.bindingHandlers.flightsFormGeoAC = {
			init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var $element = $(element),
					noResultsResults = [{value: '', label: viewModel.$$controller.i18n('FlightsSearchForm', 'autocomplete_noResults')}];

				$element.on('focus', function (e) {$(this).val('');});
				
				var isDepartureInput = viewModel.items.departure.value === valueAccessor(),
					onFocusAutocomplete = viewModel.form.onFocusAutocomplete,
					forceAggregationAirports = viewModel.form.forceAggregationAirports;
				
				$element.on('focus', function (e) {
					$element.val('');

					if ($(window).width() <= 450) {
						$('html,body').animate({scrollTop: $element.offset().top}, 800);
					}

					if(onFocusAutocomplete){
						$element.FlightsFormGeoAC({minLength: 0});
					}
					$element.FlightsFormGeoAC('search', '');
				});

				$element.FlightsFormGeoAC({
					minLength: 2,
					source:function(request, callback){
						var requestUrl = viewModel.$$controller.options.dataURL + '/guide/autocomplete/iata/' + encodeURIComponent(request.term);
						if(isDepartureInput && viewModel.items.arrival.value() && viewModel.items.arrival.value().IATA){
							requestUrl += '/arr/' + encodeURIComponent(viewModel.items.arrival.value().IATA);
						}
						if(!isDepartureInput && viewModel.items.departure.value() && viewModel.items.departure.value().IATA){
							requestUrl += '/dep/' + encodeURIComponent(viewModel.items.departure.value().IATA);
						}
						requestUrl += '?apilang=' + viewModel.$$controller.options.i18nLanguage;
						viewModel.$$controller.makeRequest(
							requestUrl,
							'',
							function (data) {
								data = JSON.parse(data);
								var result = [],
									tmp;

								if (data.system && data.system.error) {
									callback(noResultsResults);
									return;
								}

								// Converting autocomplete data into an array of possibilities
								for (var i = 0; i < data.guide.autocomplete.iata.length; i++) {
									result.push(
										viewModel.$$controller.getModel('Flights/Common/Geo', {data: data.guide.autocomplete.iata[i], guide: data.guide})
									);
								}

								if (result.length == 0) {
									result = noResultsResults;
								}

								callback(result);
							},
							function(){
								callback(noResultsResults);
							})
					},
					open: function (event, ui) {
						var $children = $(this).data('nemo-FlightsFormGeoAC').menu.element.children('[data-value="true"]');

						if ($children.length == 1 && $(this).data('nemo-FlightsFormGeoAC').term.length > 2) {
							if(!onFocusAutocomplete){
								//когда автокомплит с маршрутами - пользователь должен подтвердить недопустимую комбинацию
								$children.eq(0).mouseenter().click();
							}
						}
						else {
							$(event.target).data('nemo-FlightsFormGeoAC').menu.activeMenu.addClass('nemo-ui-autocomplete_open');
						}
					},
					response: function (event, ui) {
						$(event.target).data('nemo-FlightsFormGeoAC').menu.activeMenu.removeClass('nemo-ui-autocomplete_open');
					},
					select: function( event, ui ) {
						$element.blur();
						if(typeof ui.item.noRoute  !== 'undefined' && ui.item.noRoute){

							// тут происходит сброс недопустимых маршрутов
							
							valueAccessor()(ui.item);

							var $row = $element.parents('.js-autofocus-segment');
							if(isDepartureInput){
								viewModel.items.arrival.value(null);
								setTimeout(function(){
									$row.find('.js-autofocus-field_arrival').focus();
								}, 100);
							}
							else{
								viewModel.items.departure.value(null);
								setTimeout(function(){
									$row.find('.js-autofocus-field_departure').focus();
								}, 100);
							}
						}
						// If a wanted airport has an aggregation airport (example: MOW owns DME) 
						// and the corresponding setting is set, replace wanted airport with aggregation one.
						else if (forceAggregationAirports && ui.item.aggregationIATA) {
							var aggregationIATA = ui.item.aggregationIATA;

							if (
								ui.item.pool.airports &&
								ui.item.pool.airports[aggregationIATA] &&
								ui.item.pool.airports[aggregationIATA].isAggregation === true
							) {
								// Aggregation exists, create corresponding search form model.
								var aggregationItem = viewModel.$$controller.getModel('Flights/Common/Geo', {
									data: ui.item.pool.airports[aggregationIATA],
									guide: ui.item.pool
								});

								valueAccessor()(aggregationItem);
							}
						}
						// If item has label - it's something other than geo point that should be in AC
						// So we set corresponding stuff only if it's valid
						else if (typeof ui.item.label == 'undefined') {
							valueAccessor()(ui.item);

							if(onFocusAutocomplete){
								//автофокус тут тупит, переписал на более хардкодный вариант
								var $row = $element.parents('.js-autofocus-segment');
								if(isDepartureInput){
									if(viewModel.items.arrival.value()){
										$row.find('.js-autofocus-field_date').focus();
									}
									else{
										setTimeout(function(){
											$row.find('.js-autofocus-field_arrival').focus();
										}, 100);
									}
								}
								else{
									$row.find('.js-autofocus-field_date').focus();
								}
							}
							else{
								// Autofocus stuff
								$element.trigger('nemo.fsf.segmentPropChanged');
							}
						}

						return false;
					},
					focus: function( event, ui ) {
						event.preventDefault();
						if(!onFocusAutocomplete){
							$element.val(ui.item.name)
						}
					},
					close:function(){
						$element.val('')
					}

				});

				$element.on('blur', function (e) {
					$element.val('');
				});

				$element.on('keyup',function(e){
					if(
						e.keyCode == 13
					){
						$('.ui-menu-item').each(function(){
							if($(this).is(':visible')){
								$(this).click();
								return false;
							}
						})
					}
				});
				ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
					$element.off('blur');
					$element.off('keyup');
					try {
						$element.autocomplete('destroy');
					}
					catch (e) {/* Do nothing */}
				});
			},
			update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {}
		};

		ko.bindingHandlers.flightsFormAutoFocus = {
			init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var $element = $(element);

				$element.on('nemo.fsf.segmentPropChanged', function (event, data) {
					var $target = $(event.target),
						$segment = $target.parents('.js-autofocus-segment'),
						segment = ko.dataFor(event.target),//data.segment,
						$focusField = null;

					if ($target.hasClass('js-autofocus-field_departure')) {
						$focusField = $segment.find('.js-autofocus-field_arrival');
					}
					else if ($target.hasClass('js-autofocus-field_arrival')) {
						$focusField = $segment.find('.js-autofocus-field_date');
					}
					else if (
						viewModel.tripType() == 'CR' &&
						segment.index < viewModel.segments().length-1
					) {
						$focusField = $segment.next().find('.js-autofocus-field').eq(0);
					}
					else if(
						viewModel.tripType() == 'RT' &&
						segment.index == 0 &&
						!viewModel.segments()[1].items.departureDate.value()
					){
						$focusField = $segment.parents('.js-autofocus-form').find('.js-autofocus-field_date').eq(1);
					}

					if ($focusField) {
						$focusField.focus();
					}
				});

				ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
					$element.off('nemo.fsf.segmentPropChanged');
				});
			},
			update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {}
		};

		ko.bindingHandlers.flightsFormDatepicker = {
			// Auxiliary stuff/extension points
			_PMULocale: null,
			_getPMULocale: function (bindingContext) {
				if (!ko.bindingHandlers.flightsFormDatepicker._PMULocale) {
					ko.bindingHandlers.flightsFormDatepicker._PMULocale = {
						days:        [], // ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
						daysShort:   [], // ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
						daysMin:     [], // ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
						months:      [], // ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
						monthsShort: []  // ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
					};

					for (var i = 1; i <= 12; i++) {
						ko.bindingHandlers.flightsFormDatepicker._PMULocale.months.push(bindingContext.$root.i18n('dates', 'month_' + i + '_f_n'));
						ko.bindingHandlers.flightsFormDatepicker._PMULocale.monthsShort.push(bindingContext.$root.i18n('dates', 'month_' + i + '_s_n'));

						if (i == 1) {
							ko.bindingHandlers.flightsFormDatepicker._PMULocale.days.push(bindingContext.$root.i18n('dates', 'dow_7_f'));
							ko.bindingHandlers.flightsFormDatepicker._PMULocale.daysShort.push(bindingContext.$root.i18n('dates', 'dow_7_s'));
							ko.bindingHandlers.flightsFormDatepicker._PMULocale.daysMin.push(bindingContext.$root.i18n('dates', 'dow_7_s'));
						}

						if (i <= 7) {
							ko.bindingHandlers.flightsFormDatepicker._PMULocale.days.push(bindingContext.$root.i18n('dates', 'dow_' + i + '_f'));
							ko.bindingHandlers.flightsFormDatepicker._PMULocale.daysShort.push(bindingContext.$root.i18n('dates', 'dow_' + i + '_s'));
							ko.bindingHandlers.flightsFormDatepicker._PMULocale.daysMin.push(bindingContext.$root.i18n('dates', 'dow_' + i + '_s'));
						}
					}
				}

				return ko.bindingHandlers.flightsFormDatepicker._PMULocale;
			},
			_PMUbeforeShow: function(bindingContext, viewModel){
				var minDate = viewModel.form.options.dateOptions.minDate,
					maxDate = viewModel.form.options.dateOptions.maxDate,
					$elt = $(this),
					segments = viewModel.form.segments();

				for (var i = 0, c = segments.length; i < c; i++) {
					var segment = segments[i];

					if(
						segment.index < viewModel.index
						&&
						segment.items.departureDate.value() != null
					) {
						minDate = segment.items.departureDate.value().dateObject();
					}

					if(
						segment.index > viewModel.index
						&&
						segment.items.departureDate.value() != null
					) {
						maxDate = segment.items.departureDate.value().dateObject();
						break;
					}
				}

				// Setting shown date (current segment selected or minimal valid)
				$elt.data('pickmeup-options').defaultDate = viewModel.items.departureDate.value() ? viewModel.items.departureDate.value().dateObject() : minDate;

				if (viewModel.form.options.dateOptions.incorrectDatesBlock) {
					$elt.data('pickmeup-options').max = maxDate;
					$elt.data('pickmeup-options').min = minDate;
				}
			},
			_PMUonSetDate: function ($element, valueAccessor, viewModel) {
				$element.blur();

				valueAccessor()(viewModel.$$controller.getModel('Common/Date', this.current));

				// Autofocus stuff
				$element.trigger('nemo.fsf.segmentPropChanged');
			},
			_PMUrender: function (dateObj, viewModel, month) {
				var ret = viewModel.form.getSegmentDateParameters(dateObj, viewModel.index);

				ret.className = '';

				if (ret.segments.length > 0 && dateObj.getMonth() == month) {
					ret.className = 'nemo-pmu-date_hilighted';
					for (var i = 0; i < ret.segments.length; i++) {
						ret.className += ' nemo-pmu-date_hilighted_' + ret.segments[i];
					}
				}

				ret.className += ret.period ? ' nemo-pmu-date_period' : '';

				delete ret.segments;
				delete ret.period;

				return ret;
			},
			_getPMUOptions: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var date = viewModel.form.options.dateOptions.minDate,
					segments = viewModel.form.segments();

				for (var i = 0, c = segments.length; i < c; i++) {
					var segment = segments[i];

					if(
						segment.index < viewModel.index
						&&
						segment.items.departureDate.value() != null
					) {
						date = segment.items.departureDate.value().dateObject();
					}
				}

				return {
					className: 'nemo-flights-form__datePicker',
					locale: ko.bindingHandlers.flightsFormDatepicker._getPMULocale(bindingContext),
					calendars: mobileDetect().deviceType != 'desktop' ? 1 : 2,
					min: viewModel.form.options.dateOptions.minDate,
					max: viewModel.form.options.dateOptions.maxDate,
					format: 'd.m.Y',
					hideOnSelect: true,
					defaultDate: date,
					render: function (dateObj, month) {
						return ko.bindingHandlers.flightsFormDatepicker._PMUrender.call(this, dateObj, viewModel, month);
					},
					onSetDate: function () {
						return ko.bindingHandlers.flightsFormDatepicker._PMUonSetDate.call(this, $(element), valueAccessor, viewModel);
					},
					beforeShow: function () {
						return ko.bindingHandlers.flightsFormDatepicker._PMUbeforeShow.call(this, bindingContext, viewModel);
					}
				};
			},
			// Methods needed by knockout
			init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var $element = $(element);

				$element.on('blur', function () {
					$(this).val('');
				});

				$element.on('focus', function () {
					if ($(window).width() <= 450) {
						$('html,body').animate({scrollTop: $element.offset().top}, 800);
					}
				});

				// Do not forget to add destroy callbacks
				ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
					$element.pickmeup('destroy');
					$element.off('blur');
				});

				if(mobileDetect().deviceType != 'desktop'){
					$element.attr('readonly', 'true');
				}
			},
			update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				$(element).pickmeup(ko.bindingHandlers.flightsFormDatepicker._getPMUOptions(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext));
			}
		};

		ko.bindingHandlers.flightsFormRTAutoFocus = {
			init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var setFocus = function(){
					setTimeout(function () {bindingContext.$parent.segments()[1].items.departureDate.focus(true);}, 10);
				};
				$(element).on('click', setFocus);
				ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
					$(element).off('click', setFocus);
				})
			}
		};

		ko.bindingHandlers.flightsFormPassengersSelector = {
			init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var closeSelector = function (e) {
						var $target = $(e.target);

						if (!$target.is('.js-flights-searchForm-passSelect') && !$target.parents().is('.js-flights-searchForm-passSelect')) {
							viewModel.passengersFastSelectorOpen(false);
						}
					},
					$document = $(document);

				$(element).on('click', function () {

					if ($(window).width() <= 450) {
						$('html,body').animate({scrollTop: $(element).offset().top}, 800);
					}

					viewModel.openPassengersSelector();
				});

				$document.on('click', closeSelector);

				ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
					$document.off('click', closeSelector);
				});
			}
		};
	}
);