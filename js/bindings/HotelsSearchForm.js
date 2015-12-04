'use strict';
define(
	[
		'knockout',
		'js/vm/mobileDetect',
        'js/vm/helpers',
		'jquery',
		'jqueryUI',
		'js/lib/jquery.pickmeup/jquery.pickmeup',
		'js/lib/jquery.chosen/v.1.4.2/chosen.jquery.min',
	],
	function (ko, mobileDetect, helpers, $) {
		// Extending jQueryUI.autocomplete for Flights Search Form geo autocomplete
		$.widget( "nemo.HotelsFormGeoAC", $.ui.autocomplete, {
            _create: function() {
                this._super();
                this.widget().menu( "option", "items", "> :not(.ui-autocomplete-category)" );
            },
			_renderItem: function( ul, item ) {
                var text;

                text = '<span class="nemo-hotels-form__route__segment_autocomplete_item__first">'
                        + helpers.highlight(item.name, this.term)
                        + '</span>'
                        + '<span class="nemo-hotels-form__route__segment_autocomplete_item__second">' + item.country + '</span>';

				return $("<li>")
					.addClass('nemo-hotels-form__route__segment_autocomplete_item')
					.append(text)
					.attr('data-value', typeof item.label == 'undefined')
					.appendTo(ul);
			},
			_renderMenu: function( ul, items ) {
                var that = this,
                    currentCategory = "";

				$.each(items, function(index, item) {
                    var li;

                    if ( item.category != currentCategory ) {
                        $(ul).append( "<li class='nemo-hotels-form__route__segment_autocomplete_title ui-autocomplete-category'>" + item.category + "</li>" );
                        currentCategory = item.category;
                    }
                    li = that._renderItemData( ul, item );
				});

				$(ul).addClass('nemo-hotels-form__route__segment_autocomplete_container');
			}
		});

		ko.bindingHandlers.hotelsFormGeoAC = {
			init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var $element = $(element),
					noResultsResults = [{value: '', label: viewModel.$$controller.i18n('HotelsSearchForm', 'autocomplete_noResults')}];

				$element.HotelsFormGeoAC({
                    appendTo: '.js-nemo-hotels-autocomplete',
					minLength: 2,
					source:function(request, callback){
                        // TODO: Remove when will be ready api
                        viewModel.$$controller.options.dataURL = 'http://www.booked.net/?page=search_json&langID=20&kw=';
                        $.getJSON(viewModel.$$controller.options.dataURL + encodeURIComponent(request.term), function(data) {
                            var result = [];
                            for (var i = 0; i < data.results.length; i++) {
                                result.push(
                                    viewModel.$$controller.getModel('Hotels/Common/Geo', {data: data.results[i], guide: data.results})
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
					},
					focus: function( event, ui ) {
						event.preventDefault();

                        if (ui.item != undefined) {
                            $(this).val(ui.item.name);
                        } else {
                            $(this).val(' ');
                        }
					},
					close:function(){
						$(this).val(' ')
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

		ko.bindingHandlers.hotelsFormAutoFocus = {
			init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var $element = $(element);

				$element.on('nemo.fsf.segmentPropChanged', function (event, data) {
					var $target = $(event.target),
						$segment = $target.parents('.js-autofocus-segment'),
						segment = ko.dataFor(event.target),//data.segment,
						$focusField = null;

					if ($target.hasClass('js-autofocus-field_arrival')) {
						$focusField = $segment.parents('.js-autofocus-form').find('.js-autofocus-field_date_arrival');
					}
					else if ($target.hasClass('js-autofocus-field_date_arrival')) {
                        $focusField = $segment.parents('.js-autofocus-form').find('.js-autofocus-field_date_departure').eq(0);
					}
					else if ($target.hasClass('js-autofocus-field_date_departure')) {
                        $focusField = $segment.parents('.js-autofocus-form').find('.js-hotels-searchForm-passSelect').eq(0);
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
		ko.bindingHandlers.hotelsFormDatepicker = {
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
					className: 'nemo-flights-form__datePicker nemo-hotels',
					locale: PMULocale,
					calendars: calendarsToShow,
					min: bindingContext.$parent.options.dateOptions.minDate,
					max: bindingContext.$parent.options.dateOptions.maxDate,
					format: 'd.m.Y',
					hideOnSelect: true,
					defaultDate: valueAccessor()() ? valueAccessor()().dateObject() : viewModel.form.dateRestrictions[viewModel.index][0],
					render: function (dateObj) {
						var ret = viewModel.form.getSegmentDateParameters(dateObj, viewModel.index, $(this).hasClass('js-autofocus-field_date_arrival'));
                        ret.className = '';

                        var $this = viewModel.form.segments()[0];

                        var arrivalTime = $this.items ? helpers.getTimeFromCommonDate($this.items.arrivalDate.value()) : null;
                        var departureTime = $this.items ? helpers.getTimeFromCommonDate($this.items.departureDate.value()) : null;

                        var dateObjectTime = dateObj.getTime();

                        if (arrivalTime == null) {
                            var today = new Date();
                            today.addDays(bindingContext.$parent.options.dateOptions.minOffset);
                            today.setHours(0,0,0,0);

                            arrivalTime = (new Date(today)).getTime();
                        }

                        if (dateObjectTime == arrivalTime) {
                            ret.className = ' nemo-pmu-start';
                        }

                        if (dateObjectTime == departureTime) {
                            ret.className = ' nemo-pmu-stop';
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

						valueAccessor()(viewModel.$$controller.getModel('Common/Date', this.current));

						// Autofocus stuff
						$element.trigger('nemo.fsf.segmentPropChanged');
					},
					beforeShow:function(){
						var minDate =  bindingContext.$parent.options.dateOptions.minDate,
							maxDate =  bindingContext.$parent.options.dateOptions.maxDate;
						for(var segment in viewModel.form.segments()){
							var $this = viewModel.form.segments()[segment];
                            minDate = $this.items.arrivalDate.value() ? $this.items.arrivalDate.value().dateObject() : null;
                            maxDate = $this.items.departureDate.value() ? $this.items.departureDate.value().dateObject() : null;
						}
						$(this).data('pickmeup-options').max = null;
						$(this).data('pickmeup-options').min = null;
					}
				});
			}
		};

		ko.bindingHandlers.hotelsFormGuestsSelector = {
			init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var closeSelector = function (e) {
						var $target = $(e.target);

						if (!$target.is('.js-hotels-searchForm-passSelect') && !$target.parents().is('.js-hotels-searchForm-passSelect')) {
							viewModel.roomsFastSelectorOpen(false);
						}
					},
					$document = $(document);

				$(element).on('click', function () {
					viewModel.openRoomsSelector();
				});

				$document.on('click', closeSelector);

				ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
					$document.off('click', closeSelector);
				});
			}
		};

		ko.bindingHandlers.spinnerAdults = {

			init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				//initialize datepicker with some optional options
				var options = allBindingsAccessor().spinnerOptions || {};
				$(element).spinner(options);

                var context = bindingContext;

				//handle the field changing
				ko.utils.registerEventHandler(element, 'spinstop', function() {
                    context.$parent.rooms()[$(element).attr('room')].adults($(element).spinner('value'));
				});

				//handle disposal (if KO removes by the template binding)
				ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
					$(element).spinner('destroy');
				});

			},

			update: function(element, valueAccessor) {
				var value = ko.utils.unwrapObservable(valueAccessor()),
					current = $(element).spinner('value'),
					msg = 'You have entered an Invalid Quantity. \n Please enter at least 1 or remove this item if you do not want to include it in the shopping cart.';

				if (isNaN(parseInt(value))) {
					alert(msg);
				}

				if (value !== current && !isNaN(parseInt(value))) {
					$(element).spinner("value", value);
				}
			}
		};

        ko.bindingHandlers.spinnerInfants = {

            init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

                //initialize datepicker with some optional options
                var options = allBindingsAccessor().spinnerOptions || {};
                $(element).spinner(options);

                var context = bindingContext;

                //handle the field changing
                ko.utils.registerEventHandler(element, 'spinstop', function() {
                    var countInfants = $(element).spinner('value'),
                        isDesktop = mobileDetect() == 'desktop';

                    if (countInfants == 0) {
                        context.$parent.rooms()[$(element).attr('room')].infants([]);

                    } else {
                        if (context.$parent.rooms()[$(element).attr('room')].infants().length < countInfants) {
                            context.$parent.rooms()[$(element).attr('room')].infants.push(0);
                        } else {
                            context.$parent.rooms()[$(element).attr('room')].infants.splice(-1, 1);
                        }
                    }
                });

                //handle disposal (if KO removes by the template binding)
                ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
                    $(element).spinner('destroy');
                });

            },

            update: function(element, valueAccessor) {
                var value = ko.utils.unwrapObservable(valueAccessor()),
                    current = $(element).spinner('value'),
                    msg = 'You have entered an Invalid Quantity. \n Please enter at least 1 or remove this item if you do not want to include it in the shopping cart.';

                if (isNaN(parseInt(value))) {
                    alert(msg);
                }

                if (value !== current && !isNaN(parseInt(value))) {
                    $(element).spinner("value", value);
                }
            }
        };

        ko.bindingHandlers.infantsAgesSelector = {
            init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var context = bindingContext;

                if (mobileDetect().deviceType != 'phone') {
                    $('.nemo-hotels-form__yearsPicker_mobile').attr('disabled', 'disabled')
                } else {
                    var $selectCurrent = $('.nemo-hotels-form__yearsPicker_mobile', element);
                    $selectCurrent.on('change', function(e) {
                        e.preventDefault();
                        //debugger;
                        var $self = $(element);
                        var room = $self.attr('room');
                        var infant = $self.attr('infant');
                        var age = $(this).val();

                        context.$parentContext.$parent.selectInfantAge(room, infant, age)
                    });
                }

                $(element).on('click', function () {
                    if (mobileDetect().deviceType == 'phone') {
                        $('.nemo-hotels-form__yearsPicker_drop').remove();
                    }

                    if ($(this).hasClass('opened')) {
                        $('.nemo-hotels-form__yearsPicker_container').removeClass('opened');
                    } else {
                        $('.nemo-hotels-form__yearsPicker_container').removeClass('opened');
                        $(this).addClass('opened');
                    }
                });
            }
        };

	}
);