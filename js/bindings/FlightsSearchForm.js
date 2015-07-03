'use strict';
define(
	['knockout', 'js/vm/mobileDetect','jquery', 'jqueryUI', 'js/lib/jquery.pickmeup/jquery.pickmeup' ],
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
		ko.bindingHandlers.positionPassengersPopup = {
			init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				// Timeout is needed because we don't have needed HTML at the time we call this binding.
				// Thus - we delay actual binding execution for knockout to construct needed HTML
				setTimeout(function () {
					var parent = element.parentNode,
						offset = (parent.clientHeight - Math.min(element.clientHeight, parent.clientHeight)) / 2;

					element.style.marginTop = offset+'px';
				}, 1);
			}
		};

		// Extending jQueryUI.autocomplete for Flights Search Form geo autocomplete
		$.widget( "nemo.FlightsFormGeoAC", $.ui.autocomplete, {
			_renderItem: function( ul, item ) {
				// If item has label - it's something other than geo point that should be in AC
				var text;

				if (typeof item.label == 'undefined') {
					text = item.name.replace(new RegExp('('+this.term+')', 'i'), '<span class="new-ui-autocomplete__match">$1</span>') + ', ' + item.country.name;
				}
				else {
					text = item.label;
				}

				return $("<li>")
					.append(text)
					.attr('data-value', typeof item.label == 'undefined')
					.appendTo(ul);
			},
			_renderMenu: function( ul, items ) {
				var that = this;

				$.each(items, function(index, item) {
					that._renderItemData(ul, item);
				});

				$(ul).addClass('new-ui-autocomplete');
			}
		});

		ko.bindingHandlers.flightsFormGeoAC = {
			init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var $element = $(element),
					noResultsResults = [{value: '', label: viewModel.$$controller.i18n('FlightsSearchForm', 'autocomplete_noResults')}];

				$element.FlightsFormGeoAC({
					minLength: 2,
					source: function (request, callback) {
						$.get(
							viewModel.$$controller.options.dataURL + '/guide/autocomplete/iata/' + encodeURIComponent(request.term) + '?user_language_get_change=' + viewModel.$$controller.options.i18nLanguage,
							function (data) {
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
							'json'
						).error(function () {
							callback(noResultsResults);
						});
					},
					// We juggle "new-ui-autocomplete_open" class due to jQueryUI autocomplete kind ignoring of
					// all attempts to shift its menu down with CSS only
					// (position can not be used due to a need to change visuals using CSS only)
					open: function (event, ui) {
						var $children = $(this).data('nemo-FlightsFormGeoAC').menu.element.children('[data-value="true"]');

						if ($children.length == 1) {
							$children.eq(0).mouseenter().click();
						}
						else {
							$(event.target).data('nemo-FlightsFormGeoAC').menu.activeMenu.addClass('new-ui-autocomplete_open');
						}
					},
					response: function (event, ui) {
						$(event.target).data('nemo-FlightsFormGeoAC').menu.activeMenu.removeClass('new-ui-autocomplete_open');
					},
					select: function( event, ui ) {
						$element.blur();

						// If item has label - it's something other than geo point that should be in AC
						// So we set corresponding stuff only if it's valid
						if (typeof ui.item.label == 'undefined') {
							valueAccessor()(ui.item);

							// Autofocus stuff
							$element.trigger('nemo.fsf.segmentPropChanged');
						}

						return false;
					}
				});

				$element.on('blur', function (e) {
					$element.val('');
				});

				ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
					$element.off('blur');

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
						if (!segment.items.arrival.value()) {
							$focusField = $segment.find('.js-autofocus-field_arrival');
						}
						else if (!segment.items.departureDate.value()) {
							$focusField = $segment.find('.js-autofocus-field_date');
						}
					}
					else if ($target.hasClass('js-autofocus-field_arrival')) {
						if (!segment.items.departureDate.value()) {
							$focusField = $segment.find('.js-autofocus-field_date');
						}
					}
					else if (
						bindingContext.$data.tripType() == 'RT' &&
						segment.index == 0 &&
						!bindingContext.$data.segments()[1].items.departureDate.value()
					) {
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

		var PMULocale;
		ko.bindingHandlers.flightsFormDatepicker = {
			init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var $element = $(element);

				$element.on('blur', function () {
					$(this).val('');
				});

				// Do not forget to add destroy callbacks
				ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
					$element.pickmeup('destroy');
					$element.off('blur');
				});

				if(mobileDetect().deviceType != 'desktop'){
					$element.attr('readonly', 'true')
				}

			},
			update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var $element = $(element);

				if (!PMULocale) {
					PMULocale = {
						days:        [], // ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
						daysShort:   [], // ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
						daysMin:     [], // ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
						months:      [], // ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
						monthsShort: []  // ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
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

				$element.pickmeup({
					locale: PMULocale,
					calendars: calendarsToShow,
					min: bindingContext.$parent.options.dateOptions.minDate,
					max: bindingContext.$parent.options.dateOptions.maxDate,
					format: 'd.m.Y',
					hideOnSelect: true,
					defaultDate: valueAccessor()() ? valueAccessor()().dateObject() : viewModel.form.dateRestrictions[viewModel.index][0],
					render: function (dateObj) {
						var ret = viewModel.form.getSegmentDateParameters(dateObj, viewModel.index);

						if (ret.segments.length > 0) {
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
					onSetDate: function () {
						$element.blur();

						valueAccessor()(viewModel.$$controller.getModel('Common/Date', this.current));

						// Autofocus stuff
						$element.trigger('nemo.fsf.segmentPropChanged');
					}
				});
			}

		};
	}
);