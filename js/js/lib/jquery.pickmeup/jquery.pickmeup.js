/**
 * @package        PickMeUp - jQuery datepicker plugin
 * @author        Nazar Mokrynskyi <nazar@mokrynskyi.com>
 * @author        Stefan Petre <www.eyecon.ro>
 * @author_with_rasp Boris Sobolevskiy <unclesheogorat@gmail.com>
 * @copyright    Copyright (c) 2013-2015, Nazar Mokrynskyi
 * @copyright    Copyright (c) 2008-2009, Stefan Petre
 * @copyleft    Copyleft (c) 2015, Boris Sobolevskiy
 * @license        MIT License, see license.txt if present.
*/
'use strict';
(function (d) {
	function getMaxDays() {
		var tmpDate = new Date(this.toString()),
			d = 28,
			m = tmpDate.getMonth();
		while (tmpDate.getMonth() == m) {
			++d;
			tmpDate.setDate(d);
		}
		return d - 1;
	}

	d.addDays = function (n) {
		this.setDate(this.getDate() + n);
	};
	d.addMonths = function (n) {
		var day = this.getDate();
		this.setDate(1);
		this.setMonth(this.getMonth() + n);
		this.setDate(Math.min(day, getMaxDays.apply(this)));
	};
	d.addYears = function (n) {
		var day = this.getDate();
		this.setDate(1);
		this.setFullYear(this.getFullYear() + n);
		this.setDate(Math.min(day, getMaxDays.apply(this)));
	};
	d.getDayOfYear = function () {
		var now = new Date(this.getFullYear(), this.getMonth(), this.getDate(), 0, 0, 0);
		var then = new Date(this.getFullYear(), 0, 0, 0, 0, 0);
		var time = now - then;
		return ~~(time / 24 * 60 * 60 * 1000);
	};
})(Date.prototype);

(function (factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD
		define(['jquery'], factory);
	} else if (typeof exports === 'object') {
		// CommonJS
		factory(require('jquery'));
	} else {
		// Browser globals
		factory(jQuery);
	}
}(function ($) {

	var instances_count = 0;
	$.pickmeup = $.extend($.pickmeup || {}, {
		date: new Date,
		defaultDate: new Date,
		flat: false,
		firstDay: 1,
		prev: '&#10094;',
		next: '&#10095;',
		mode: 'single',
		selectYear: true,
		selectMonth: true,
		selectDay: true,
		view: 'days',
		calendars: 1,
		format: 'd-m-Y',
		position: 'bottom',
		triggerEvent: 'click focus',
		className: '',
		separator: ' - ',
		hideOnSelect: true,
		min: null,
		max: null,
		lastState:null,
		render: function () {
		},
		change: function () {
			return true;
		},
		beforeShow: function () {
			return true;
		},
		show: function () {
			return true;
		},
		hide: function () {
			return true;
		},
		fill: function () {
			return true;
		},
		onSetDate: function () {
			return true;
		},
		onSetMonth: function () {
			return true;
		},
		onSetYear: function () {
			return true;
		},
		locale: {
			days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
			daysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
			daysMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
			months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
			monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
		},
		views: {
			years: 'js-nemo-pmu-viewYears nemo-pmu-viewYears',
			months: 'js-nemo-pmu-viewMonths nemo-pmu-viewMonths',
			days: 'js-nemo-pmu-viewDays nemo-pmu-viewDays'
		},
		tpl: {
			wrapper: '<div class="nemo-pmu-wrapper js-nemo-pmu" />',
			head: function (d) {
				var result = '';
				for (var i = 0; i < 7; ++i) {
					result += '<div class="nemo-pmu-dayOfWeek nemo-pmu-dayOfWeek_'+ i +'">' + d.day[i] + '</div>'
				}
				return '<div class="js-nemo-pmu-instance nemo-pmu-instance">' +
					'<nav class="nemo-pmu-monthHeader">' +
					'<div class="js-nemo-pmu-prev nemo-pmu-prev js-nemo-pmu-button nemo-pmu-button">' + d.prev + '</div>' +
					'<div class="js-nemo-pmu-month nemo-pmu-month js-nemo-pmu-button nemo-pmu-button" />' +
					'<div class="js-nemo-pmu-next nemo-pmu-next js-nemo-pmu-button nemo-pmu-button">' + d.next + '</div>' +
					'</nav>' +
					'<nav class="nemo-pmu-daysOfWeek">' + result + '</nav>' +
					'</div>';
			},
			body: function (elements, container_className) {
				var result = '';
				for (var i = 0; i < elements.length; ++i) {
					result += '<div ';
					if (typeof elements[i].val != 'undefined') {
						result += 'data-day="' + elements[i].date[0] + '"' +
						'data-month="' + elements[i].date[1] + '"' +
						'data-year="' + elements[i].date[2] + '"' +
						'data-date="' + elements[i].val + '" '
					}
					result += 'class="' + elements[i].className + ' js-nemo-pmu-button nemo-pmu-button">' + elements[i].text + '</div>'

				}
				return '<div class="' + container_className + 'Wrap"><div class="' + container_className + ' js-'+container_className+'">' + result + '</div></div>';
			}
		}
	});
	function currentCalendar(){
		//@DIRTY HACK: in case of 2 calendars left one will be active, not right one
		var options = $(this).data('pickmeup-options');
		if (options.calendars == 2) {
			return ~~((options.calendars / 2) - 1)
		} else {
			return ~~((options.calendars / 2))
		}
	}

	function fill() {
		var options = $(this).data('pickmeup-options'),
			pickmeup = this.pickmeup,
			actualDate = options.date,
			currentDate = options.current,
			minDate = options.min ? new Date(options.min) : null,
			maxDate = options.max ? new Date(options.max) : null,
			localDate,
			header,
			html,
			instance,
			today = (new Date).setHours(0, 0, 0, 0).valueOf(),
			shownDateFrom,
			shownDateTo,
			tmp_date,
			currentCal = options.binded.currentCalendar()
		if (minDate) {
			minDate.setDate(1);
			minDate.addMonths(1);
			minDate.addDays(-1);
		}
		if (maxDate) {
			maxDate.setDate(1);
			maxDate.addMonths(1);
			maxDate.addDays(-1);
		}
		if(options.lastState != null){
			options.current = options.lastState;
			currentDate = options.current
		}
		/**
		 * Remove old content except header navigation
		 */
		pickmeup.find('.js-nemo-pmu-instance > :not(nav)').remove();
		/**
		 * If several calendars should be shown
		 */
		for (var i = 0; i < options.calendars; i++) {
			localDate = new Date(currentDate);
			instance = pickmeup.find('.js-nemo-pmu-instance').eq(i);
			if (pickmeup.hasClass('js-nemo-pmu-viewYears')) {
				localDate.addYears((i - currentCal) * 12);
				header = (localDate.getFullYear() - 6) + ' - ' + (localDate.getFullYear() + 5);
			} else if (pickmeup.hasClass('js-nemo-pmu-viewMonths')) {
				localDate.addYears(i - currentCal);
				header = localDate.getFullYear();
			} else if (pickmeup.hasClass('js-nemo-pmu-viewDays')) {
				localDate.addMonths(i - currentCal);
				header = formatDate(localDate, 'B, Y', options.locale);
			}
			if (!shownDateTo) {
				if (maxDate) {
					// If all dates in this month (months in year or years in years block) are after max option - set next month as current
					// in order not to show calendar with all disabled dates
					tmp_date = new Date(localDate);
					if (options.selectDay) {
						tmp_date.addMonths(options.calendars - 1);
					} else if (options.selectMonth) {
						tmp_date.addYears(options.calendars - 1);
					} else {
						tmp_date.addYears((options.calendars - 1) * 12);
					}
					if (tmp_date > maxDate) {
						--i;
						currentDate.addMonths(-1);
						shownDateTo = undefined;
						continue;
					}
				}
			}
			shownDateTo = new Date(localDate);
			if (!shownDateFrom) {
				shownDateFrom = new Date(localDate);
				// If all dates in this month are before min option - set next month as current in order not to show calendar with all disabled dates
				shownDateFrom.setDate(1);
				shownDateFrom.addMonths(1);
				shownDateFrom.addDays(-1);
				if (minDate && minDate > shownDateFrom) {
					--i;
					currentDate.addMonths(1);
					shownDateFrom = undefined;
					continue;
				}
			}
			instance
				.find('.js-nemo-pmu-month')
				.text(header);
			html = '';
			var is_year_selected = function (year) {
				return (
					options.mode == 'range' &&
					year >= new Date(actualDate[0]).getFullYear() &&
					year <= new Date(actualDate[1]).getFullYear()
					) ||
					(
					options.mode == 'multiple' &&
					actualDate.reduce(function (prev, current) {
						prev.push(new Date(current).getFullYear());
						return prev;
					}, []).indexOf(year) !== -1
					) ||
					new Date(actualDate).getFullYear() == year;
			};
			var is_months_selected = function (year, month) {
				var first_year = new Date(actualDate[0]).getFullYear(),
					lastyear = new Date(actualDate[1]).getFullYear(),
					first_month = new Date(actualDate[0]).getMonth(),
					last_month = new Date(actualDate[1]).getMonth();
				return (
					options.mode == 'range' &&
					year > first_year &&
					year < lastyear
					) ||
					(
					options.mode == 'range' &&
					year == first_year &&
					year < lastyear &&
					month >= first_month
					) ||
					(
					options.mode == 'range' &&
					year > first_year &&
					year == lastyear &&
					month <= last_month
					) ||
					(
					options.mode == 'range' &&
					year == first_year &&
					year == lastyear &&
					month >= first_month &&
					month <= last_month
					) ||
					(
					options.mode == 'multiple' &&
					actualDate.reduce(function (prev, current) {
						current = new Date(current);
						prev.push(current.getFullYear() + '-' + current.getMonth());
						return prev;
					}, []).indexOf(year + '-' + month) !== -1
					) ||
					(
					new Date(actualDate).getFullYear() == year &&
					new Date(actualDate).getMonth() == month
					)
			};
			(function () {
				var years = [],
					start_from_year = localDate.getFullYear() - 6,
					min_year = new Date(options.min).getFullYear(),
					max_year = new Date(options.max).getFullYear(),
					disabledYearsCounter = 0,
					year;
				for (var j = 0; j < 12; ++j) {
					year = {
						text: start_from_year + j,
						className: ['nemo-pmu-years_year']
					};
					if (
						(
						options.min && year.text < min_year
						) ||
						(
						options.max && year.text > max_year
						)
					) {
						year.className.push('nemo-pmu-disabled', 'js-nemo-pmu-disabled');
						disabledYearsCounter++
					} else if (is_year_selected(year.text)) {
						year.className.push('nemo-pmu-selected');
					}
					year.className = year.className.join(' ');
					years.push(year);
				}
				//we have 12 years in grid, if 11 of 'em are disabled - disable year selection
				if(instance.index() == pickmeup.find('.js-nemo-pmu-instance:eq('+currentCal+')').index() && disabledYearsCounter >= 11){
					options.selectYear = false;
				}
				html += options.tpl.body(years, 'nemo-pmu-years');
			})();
			(function () {
				var months = [],
					current_year = localDate.getFullYear(),
					min_year = new Date(options.min).getFullYear(),
					min_month = new Date(options.min).getMonth(),
					max_year = new Date(options.max).getFullYear(),
					max_month = new Date(options.max).getMonth(),
					disabledMonthsCounter = 0,
					month;
				for (var j = 0; j < 12; ++j) {
					month = {
						text: options.locale.monthsShort[j],
						className: ['nemo-pmu-months_month']
					};
					if (
						(
						options.min &&
						(
						current_year < min_year ||
						(
						j < min_month && current_year == min_year
						)
						)
						) ||
						(
						options.max &&
						(
						current_year > max_year ||
						(
						j > max_month && current_year >= max_year
						)
						)
						)
					) {
						month.className.push('nemo-pmu-disabled', 'js-nemo-pmu-disabled');
						disabledMonthsCounter++
					} else if (is_months_selected(current_year, j)) {
						month.className.push('nemo-pmu-selected');
					}
					month.className = month.className.join(' ');
					months.push(month);
				}
				//we have 12 month in grid, if 11 of 'em are disabled - disable month selection

				if(instance.index() == pickmeup.find('.js-nemo-pmu-instance:eq('+currentCal+')').index() && disabledMonthsCounter >= 11){
					options.selectMonth = false;
				}
				html += options.tpl.body(months, 'nemo-pmu-months');
			})();
			(function () {
				var days = [],
					current_month = localDate.getMonth(),
					day;
				// Correct first day in calendar taking into account first day of week (Sunday or Monday)
				(function () {
					localDate.setDate(1);
					var day = (localDate.getDay() - options.firstDay) % 7;
					localDate.addDays(-(day + (day < 0 ? 7 : 0)));
				})();
				for (var j = 0; j < 42; ++j) {
					day = {
						text: localDate.getDate(),
						className: ['nemo-pmu-days_day'],
						val: '',
						date: []
					};

					if (localDate.getDay() == 0) {
						day.className.push('nemo-pmu-sunday');
					} else if (localDate.getDay() == 6) {
						day.className.push('nemo-pmu-saturday');
					}
					var today = new Date().setHours(0,0,0,0);
					var from_user = options.render(new Date(localDate)) || {},
						val = localDate.valueOf(),
						disabled = (options.min && options.min > localDate) || (options.max && options.max < localDate);
					//collecting data for data-attributes
					day.val = val;
					day.date.push(localDate.getDate());
					day.date.push(new Date(val).getMonth());
					day.date.push(new Date(val).getFullYear());
					if (from_user.disabled || disabled) {
						day.className.push('nemo-pmu-disabled', 'js-nemo-pmu-disabled');
					} else if (
						from_user.selected ||
						options.date == val ||
						$.inArray(val, options.date) !== -1 ||
						(
						options.mode == 'range' && val >= options.date[0] && val <= options.date[1]
						)
					) {
						day.className.push('nemo-pmu-selected');
					}
					if (current_month != localDate.getMonth()) {
						day.className.push('nemo-pmu-notInMonth');
						if (day.className.indexOf('nemo-pmu-selected')>=0){
							for (var k=day.className.length-1; k>=0; k--) {
								if (day.className[k] === "nemo-pmu-selected") {
									day.className.splice(k, 1);
								}
							}
						}
					}
					if (val == today) {
						day.className.push('nemo-pmu-today');
					}
					if (from_user.className) {
						day.className.push(from_user.className);
					}
					day.className = day.className.join(' ');
					days.push(day);
					// Move to next day
					localDate.addDays(1);
				}

				html += options.tpl.body(days, 'nemo-pmu-days');
			})();
			instance.append(html);
		}
		shownDateFrom.setDate(1);
		shownDateTo.setDate(1);
		shownDateTo.addMonths(1);
		shownDateTo.addDays(-1);
		if(options.min && options.min >= shownDateFrom){
			pickmeup.find('.js-nemo-pmu-prev').addClass('nemo-pmu-prev_hidden js-pmu-prev_hidden');
		}else{
			pickmeup.find('.js-nemo-pmu-prev').removeClass('nemo-pmu-prev_hidden js-pmu-prev_hidden');
		}
		if(options.max && options.max <= shownDateTo){
			pickmeup.find('.js-nemo-pmu-next').addClass('nemo-pmu-next_hidden js-pmu-next_hidden');
		}else{
			pickmeup.find('.js-nemo-pmu-next').removeClass('nemo-pmu-next_hidden js-pmu-next_hidden');
		}
		options.fill.apply(this);
	}

	function parseDate(date, format, separator, locale) {
		if (date.constructor == Date) {
			return date;
		} else if (!date) {
			return new Date;
		}
		var splitted_date = date.split(separator);
		if (splitted_date.length > 1) {
			splitted_date.forEach(function (element, index, array) {
				array[index] = parseDate($.trim(element), format, separator, locale);
			});
			return splitted_date;
		}
		var months_text = locale.monthsShort.join(')(') + ')(' + locale.months.join(')('),
			separator = new RegExp('[^0-9a-zA-Z(' + months_text + ')]+'),
			parts = date.split(separator),
			against = format.split(separator),
			d,
			m,
			y,
			h,
			min,
			now = new Date();
		for (var i = 0; i < parts.length; i++) {
			switch (against[i]) {
				case 'b':
					m = locale.monthsShort.indexOf(parts[i]);
					break;
				case 'B':
					m = locale.months.indexOf(parts[i]);
					break;
				case 'd':
				case 'e':
					d = parseInt(parts[i], 10);
					break;
				case 'm':
					m = parseInt(parts[i], 10) - 1;
					break;
				case 'Y':
				case 'y':
					y = parseInt(parts[i], 10);
					y += y > 100 ? 0 : (y < 29 ? 2000 : 1900);
					break;
				case 'H':
				case 'I':
				case 'k':
				case 'l':
					h = parseInt(parts[i], 10);
					break;
				case 'P':
				case 'p':
					if (/pm/i.test(parts[i]) && h < 12) {
						h += 12;
					} else if (/am/i.test(parts[i]) && h >= 12) {
						h -= 12;
					}
					break;
				case 'M':
					min = parseInt(parts[i], 10);
					break;
			}
		}
		var parsed_date = new Date(
			y === undefined ? now.getFullYear() : y,
			m === undefined ? now.getMonth() : m,
			d === undefined ? now.getDate() : d,
			h === undefined ? now.getHours() : h,
			min === undefined ? now.getMinutes() : min,
			0
		);
		if (isNaN(parsed_date * 1)) {
			parsed_date = new Date;
		}
		return parsed_date;
	}

	function formatDate(date, format, locale) {
		var m = date.getMonth();
		var d = date.getDate();
		var y = date.getFullYear();
		var w = date.getDay();
		var s = {};
		var hr = date.getHours();
		var pm = (hr >= 12);
		var ir = (pm) ? (hr - 12) : hr;
		var dy = date.getDayOfYear();
		if (ir == 0) {
			ir = 12;
		}
		var min = date.getMinutes();
		var sec = date.getSeconds();
		var parts = format.split(''), part;
		for (var i = 0; i < parts.length; i++) {
			part = parts[i];
			switch (part) {
				case 'a':
					part = locale.daysShort[w];
					break;
				case 'A':
					part = locale.days[w];
					break;
				case 'b':
					part = locale.monthsShort[m];
					break;
				case 'B':
					part = locale.months[m];
					break;
				case 'C':
					part = 1 + ~~(y / 100);
					break;
				case 'd':
					part = (d < 10) ? ("0" + d) : d;
					break;
				case 'e':
					part = d;
					break;
				case 'H':
					part = (hr < 10) ? ("0" + hr) : hr;
					break;
				case 'I':
					part = (ir < 10) ? ("0" + ir) : ir;
					break;
				case 'j':
					part = (dy < 100) ? ((dy < 10) ? ("00" + dy) : ("0" + dy)) : dy;
					break;
				case 'k':
					part = hr;
					break;
				case 'l':
					part = ir;
					break;
				case 'm':
					part = (m < 9) ? ("0" + (1 + m)) : (1 + m);
					break;
				case 'M':
					part = (min < 10) ? ("0" + min) : min;
					break;
				case 'p':
				case 'P':
					part = pm ? "PM" : "AM";
					break;
				case 's':
					part = ~~(date.getTime() / 1000);
					break;
				case 'S':
					part = (sec < 10) ? ("0" + sec) : sec;
					break;
				case 'u':
					part = w + 1;
					break;
				case 'w':
					part = w;
					break;
				case 'y':
					part = ('' + y).substr(2, 2);
					break;
				case 'Y':
					part = y;
					break;
			}
			parts[i] = part;
		}
		return parts.join('');
	}

	function update_date() {
		var $this = $(this),
			options = $this.data('pickmeup-options'),
			currentDate = options.current,
			new_value;
		switch (options.mode) {
			case 'multiple':
				new_value = currentDate.setHours(0, 0, 0, 0).valueOf();
				if ($.inArray(new_value, options.date) !== -1) {
					$.each(options.date, function (index, value) {
						if (value == new_value) {
							options.date.splice(index, 1);
							return false;
						}
						return true;
					});
				} else {
					options.date.push(new_value);
				}
				break;
			case 'range':
				if (!options.lastSel) {
					options.date[0] = currentDate.setHours(0, 0, 0, 0).valueOf();
				}
				new_value = currentDate.setHours(0, 0, 0, 0).valueOf();
				if (new_value <= options.date[0]) {
					options.date[1] = options.date[0];
					options.date[0] = new_value;
				} else {
					options.date[1] = new_value;
				}
				options.lastSel = !options.lastSel;
				break;
			default:
				options.date = currentDate.valueOf();
				break;
		}
		var prepared_date = prepareDate(options);
		if ($this.is('input')) {
			if (prepared_date[0].length > 0 && prepared_date[0][0] == prepared_date[0][1] && options.mode == 'range') {
				var sameDatesInRange = prepared_date[0][0];
				$this.val(sameDatesInRange);
			} else {
				$this.val(options.mode == 'single' ? prepared_date[0] : prepared_date[0].join(options.separator));
			}
		}
		options.change.apply(this, prepared_date);
		if (
			!options.flat &&
			options.hideOnSelect &&
			(
			options.mode != 'range' || !options.lastSel
			)
		) {
			options.binded.hide();
			return false;
		}
	}

	function click(e) {
		var el = $(e.target);
		if (!el.hasClass('js-nemo-pmu-button')) {
			el = el.closest('.js-nemo-pmu-button');
		}
		if (el.length) {
			if (el.hasClass('js-nemo-pmu-disabled')) {
				return false;
			}
			var $this = $(this),
				options = $this.data('pickmeup-options'),
				instance = el.parents('.js-nemo-pmu-instance').eq(0),
				root = instance.parent(),
				instance_index = $('.js-nemo-pmu-instance', root).index(instance),
				pickmeup = this.pickmeup;
			if (el.parent().is('nav')) {
				if (el.hasClass('js-nemo-pmu-month')) {
					options.current.addMonths(instance_index - options.binded.currentCalendar());
					if (root.hasClass('js-nemo-pmu-viewYears')) {
						// Shift back to current date, otherwise with min value specified may jump on few (tens) years forward
						if (options.mode != 'single') {
							options.current = new Date(options.date[options.date.length - 1]);
						} else {
							options.current = new Date(options.date);
						}
						if (options.selectDay) {
							root.removeClass('js-nemo-pmu-viewYears').addClass('js-nemo-pmu-viewDays');
							root.removeClass('nemo-pmu-viewYears').addClass('nemo-pmu-viewDays');
						} else if (options.selectMonth) {
							root.removeClass('js-nemo-pmu-viewYears').addClass('js-nemo-pmu-viewMonths');
							root.removeClass('nemo-pmu-viewYears').addClass('nemo-pmu-viewMonths');
						}
					}
					else if (root.hasClass('js-nemo-pmu-viewMonths')) {
						if (options.selectYear) {
							root.removeClass('js-nemo-pmu-viewMonths').addClass('js-nemo-pmu-viewYears');
							root.removeClass('nemo-pmu-viewMonths').addClass('nemo-pmu-viewYears');
						} else if (options.selectDay) {
							root.removeClass('js-nemo-pmu-viewMonths').addClass('js-nemo-pmu-viewDays');
							root.removeClass('nemo-pmu-viewMonths').addClass('nemo-pmu-viewDays');
						}
					}
					else if (root.hasClass('js-nemo-pmu-viewDays')) {
						if (options.selectMonth) {
							root.removeClass('js-nemo-pmu-viewDays').addClass('js-nemo-pmu-viewMonths');
							root.removeClass('nemo-pmu-viewDays').addClass('nemo-pmu-viewMonths');
						} else if (options.selectYear) {
							root.removeClass('js-nemo-pmu-viewDays').addClass('js-nemo-pmu-viewYears');
							root.removeClass('nemo-pmu-viewDays').addClass('nemo-pmu-viewYears');
						}
					}
				}
				else {
					if (el.hasClass('js-nemo-pmu-prev')) {
						options.binded.prev(false);
					} else {
						options.binded.next(false);
					}
				}
			}
			else if (!el.hasClass('nemo-pmu-disabled')) {
				if (root.hasClass('js-nemo-pmu-viewYears')) {
					options.current.setFullYear(parseInt(el.text(), 10));
					if (options.selectMonth) {
						root.removeClass('js-nemo-pmu-viewYears').addClass('js-nemo-pmu-viewMonths');
						root.removeClass('nemo-pmu-viewYears').addClass('nemo-pmu-viewMonths');
					} else if (options.selectDay) {
						root.removeClass('js-nemo-pmu-viewYears').addClass('js-nemo-pmu-viewDays');
						root.removeClass('nemo-pmu-viewYears').addClass('nemo-pmu-viewDays');
					} else {
						options.binded.update_date();
					}
					options.onSetYear();
				} else if (root.hasClass('js-nemo-pmu-viewMonths')) {
					options.current.setMonth(instance.find('.js-nemo-pmu-months .js-nemo-pmu-button').index(el));
					options.current.setFullYear(parseInt(instance.find('.js-nemo-pmu-month').text(), 10));
					if (options.selectDay) {
						root.removeClass('js-nemo-pmu-viewMonths').addClass('js-nemo-pmu-viewDays');
						root.removeClass('nemo-pmu-viewMonths').addClass('nemo-pmu-viewDays');
					} else {
						options.binded.update_date();
					}
					// Move current month to the first place
					options.current.addMonths(options.binded.currentCalendar() - instance_index);
					options.onSetMonth();
				} else {
					var val = parseInt(el.text(), 10);
					options.current.addMonths(instance_index - options.binded.currentCalendar());
					if (el.hasClass('nemo-pmu-notInMonth')) {
						options.current.addMonths(val > 15 ? -1 : 1);
					}
					var dateToSet = new Date(el.data('year'), el.data('month'), el.data('day'));
					if(options.mode == 'single'){
						options.current = dateToSet;
					}else{
						options.current.setDate(val);
						options.binded.update_date();
					}
					var elDummy = pickmeup.find('.nemo-pmu-days_day').eq(15);
					var lastStateToSet = new Date(elDummy.data('year'), elDummy.data('month'), elDummy.data('day'));
					if(options.mode == 'single'){
						options.lastState = lastStateToSet;
						options.current = dateToSet;
					}
					options.onSetDate();
				}
			}
			options.binded.fill();
		}
		return el;
	}

	function prepareDate(options) {
		var result;
		if (options.mode == 'single') {
			result = new Date(options.date);
			return [formatDate(result, options.format, options.locale), result];
		} else {
			result = [[], []];
			$.each(options.date, function (nr, val) {
				var date = new Date(val);
				result[0].push(formatDate(date, options.format, options.locale));
				result[1].push(date);
			});
			return result;
		}
	}

	function show(force) {
		var pickmeup = this.pickmeup;
		if (force || !pickmeup.is(':visible')) {
			var $this = $(this),
				options = $this.data('pickmeup-options'),
				pos = $this.offset(),
				viewport = {
					l: document.documentElement.scrollLeft,
					t: document.documentElement.scrollTop,
					w: document.documentElement.clientWidth,
					h: document.documentElement.clientHeight
				},
				top = pos.top,
				left = pos.left;
			var inputWidth;
			options.binded.fill();

			var format = $this.pickmeup().format;
			format = format.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&").replace(/[dD]+/, '[0-9]{1,2}').replace(/[mM]+/, '[0-9]{1,2}').replace(/[yY]+/, '[0-9]{4}');
			if ($this.is('input')) {
				//crutch! saving input value for blur event trigger.
				var inputDate, inputValue;
				inputWidth = $this.outerWidth();
				var testDate = new RegExp(format , 'i');
				$this
					.pickmeup('set_date', parseDate($this.val() ? $this.val() : options.defaultDate, options.format, options.separator, options.locale))
					.on('click', function(){
						inputDate = options.current;
					})
					.on('keyup', function (e) {
						inputValue = $this.val();
						var parsedDate = parseDate($this.val(), options.format, options.separator, options.locale);
						if(e.keyCode == 13){
							if(parsedDate.getTime() >= options.min.getTime()
								&& parsedDate.getTime() <= options.max.getTime()){
								options.current = parsedDate;
								$this.pickmeup('set_date', parsedDate);
								options.onSetDate();
								return false;
							}
						}
						else if (e.keyCode == 27) {
							$this.pickmeup('hide');
							$this.pickmeup('set_date', options.current)
						}
						else if($this.val().match(testDate)!=null
							&& options.mode != 'range'
							&& options.mode != 'multiple'
							){
							if(options.min != 'null' && parsedDate.getTime() >=options.min.getTime()
								|| options.max != 'null'&& parsedDate.getTime() <= options.max.getTime()){
								$this.pickmeup('set_date', parsedDate);
							}
						return false;
						}
					})
					.on('blur', function(){
						$this.pickmeup('hide')
					});
				options.lastSel = false;
			}
			options.beforeShow();
			if (options.show() == false) {
				return;
			}
			var instanceWidth = pickmeup.find('.js-nemo-pmu-instance:eq(0)').width();
			var instancesWidth = instanceWidth*options.calendars;
			var instanceCenter = instancesWidth/2 - inputWidth/2;
			if (!options.flat) {
				switch (options.position) {
					case 'top':
						top -= pickmeup.outerHeight();
						break;
					case 'left':
						left -= pickmeup.outerWidth();
						break;
					case 'right':
						left += this.offsetWidth;
						break;
					case 'bottom':
						top += this.offsetHeight;
						break;
				}
				if (top + pickmeup.offsetHeight > viewport.t + viewport.h) {
					top = pos.top - pickmeup.offsetHeight;
				}
				if (top < viewport.t) {
					top = pos.top + this.offsetHeight + pickmeup.offsetHeight;
				}
				if (left + pickmeup.offsetWidth > viewport.l + viewport.w) {
					left = pos.left - pickmeup.offsetWidth;
				}
				if (left < viewport.l) {
					left = pos.left + this.offsetWidth
				}
				if(instancesWidth + left + instanceCenter >= viewport.w || instanceCenter > left){
					instanceCenter = 0;
				}
				if (instancesWidth < viewport.w && instancesWidth+left-instanceCenter >= viewport.w + 20) {
					pickmeup.removeClass('nemo-pmu-thinView');
					pickmeup.css({
						display: 'inline-block',
						top: top + 'px',
						right:20 + 'px'
					});
				}else if(instancesWidth >= viewport.w && instanceWidth+left-instanceCenter <= viewport.w){
					pickmeup.addClass('nemo-pmu-thinView');
					pickmeup.css({
						display: 'inline-block',
						top: top + 'px',
						right:'auto',
						left:left
					});
				}else if(instancesWidth >= viewport.w && instanceWidth+left-instanceCenter >= viewport.w){
					pickmeup.addClass('nemo-pmu-thinView');
					pickmeup.css({
						display: 'inline-block',
						top: top + 'px',
						right:0
					});
				}else{
					pickmeup.removeClass('nemo-pmu-thinView');
					pickmeup.css({
						display: 'inline-block',
						top: top + 'px',
						left: left-instanceCenter  + 'px',
						right:'auto'
					});
				}
				$(document)
					.on(
					'mousedown' + options.events_namespace + 'touch' + options.events_namespace + 'blur' + options.events_namespace,
					options.binded.hide
				)
					.on(
					'resize' + options.events_namespace,
					[
						true
					],
					options.binded.forced_show
				);
			}
		}
	}

	function forced_show() {
		show.call(this, true);
	}

	function hide(e) {
		if (
			!e || !e.target ||														//Called directly
			(
			e.target != this &&												//Clicked not on element itself
			!(this.pickmeup.get(0).compareDocumentPosition(e.target) & 16)	//And not o its children
			)
		) {
			var pickmeup = this.pickmeup,
				options = $(this).data('pickmeup-options'),
				$this = $(this);
			if (options.hide() != false) {
				pickmeup.hide();
				$(document)
					.off('mousedown touchstart focus', options.binded.hide)
					.off('resize', options.binded.forced_show);
				options.lastSel = false;
			}

			if ($(this).is('input')){
				if ($(this).val().length>0){
					var parsedDate = parseDate($(this).val(), options.format, options.separator, options.locale);
					if(parsedDate.getTime() >= options.min.getTime()
						&& parsedDate.getTime() <= options.max.getTime()){
						$(this).pickmeup('set_date',options.current);
						options.onSetDate();
						return false;
					}
				}
			}
		}
	}

	function update(newOptions) {
		var options = $(this).data('pickmeup-options');
		if (newOptions && Object == typeof newOptions) {
			$.extend(options, newOptions);
		}
		$(document)
			.off('mousedown', options.binded.hide)
			.off('resize', options.binded.forced_show);
		options.binded.forced_show();
	}

	function clear() {
		var options = $(this).data('pickmeup-options');
		if (options.mode != 'single') {
			options.date = [];
			options.lastSel = false;
		}
	}

	function prev(fill) {
		if (typeof fill == 'undefined') {
			fill = true;
		}
		var root = this.pickmeup;
		var options = $(this).data('pickmeup-options');
		if (root.hasClass('nemo-pmu-viewYears')) {
			options.current.addYears(-12);
		} else if (root.hasClass('nemo-pmu-viewMonths')) {
			options.current.addYears(-1);
		} else if (root.hasClass('nemo-pmu-viewDays')) {
			options.current.addMonths(-1);
		}
		if (fill) {
			options.binded.fill();
		}
	}

	function next(fill) {
		if (typeof fill == 'undefined') {
			fill = true;
		}
		var root = this.pickmeup;
		var options = $(this).data('pickmeup-options');
		if (root.hasClass('nemo-pmu-viewYears')) {
			options.current.addYears(12);
		} else if (root.hasClass('nemo-pmu-viewMonths')) {
			options.current.addYears(1);
		} else if (root.hasClass('nemo-pmu-viewDays')) {
			options.current.addMonths(1);
		}
		if (fill) {
			options.binded.fill();
		}
	}

	function get_date(formatted) {
		var options = $(this).data('pickmeup-options'),
			prepared_date = prepareDate(options);
		if (typeof formatted === 'string' && formatted != 'element') {
			var date = prepared_date[1];
			if (date.constructor == Date) {
				return formatDate(date, formatted, options.locale)
			} else {
				return date.map(function (value) {
					return formatDate(value, formatted, options.locale);
				});
			}
		}
		else {
			return prepared_date[formatted ? 0 : 1];
		}
	}
	function set_date(date) {
		var $this = $(this),
			options = $this.data('pickmeup-options'),
			pickmeup = this.pickmeup;
		options.date = date;

		if (typeof options.date === 'string') {
			options.date = parseDate(options.date, options.format, options.separator, options.locale).setHours(0, 0, 0, 0);
		} else if (options.date.constructor == Date) {
			options.date.setHours(0, 0, 0, 0);
		}
		if (!options.date) {
			options.date = new Date;
			options.date.setHours(0, 0, 0, 0);
		}
		if (options.mode != 'single') {
			if (options.date.constructor != Array) {
				options.date = [options.date.valueOf()];
				if (options.mode == 'range') {
					options.date.push(((new Date(options.date[0])).setHours(0, 0, 0, 0)).valueOf());
				}
			} else {
				for (var i = 0; i < options.date.length; i++) {
					options.date[i] = (parseDate(options.date[i], options.format, options.separator, options.locale).setHours(0, 0, 0, 0)).valueOf();
				}
				if (options.mode == 'range') {
					options.date[1] = ((new Date(options.date[1])).setHours(0, 0, 0, 0)).valueOf();
				}
			}
		} else {
			if ($this.val() || options.defaultDate !== false) {
				options.date = options.date.constructor == Array ? options.date[0].valueOf() : options.date.valueOf();
			}
		}
		options.current = new Date(options.mode != 'single' ? options.date[0] : options.date);
		options.binded.fill();
	}
	function destroy() {
		var $this = $(this),
			options = $this.data('pickmeup-options');
		$this.removeData('pickmeup-options');
		$this.off(options.events_namespace);
		$(document).off(options.events_namespace);
		$(this.pickmeup).remove();
	}

	function getDateElementSelected() {
		//returns collection of selected dates, if visible
		return $(this.pickmeup).find('.nemo-pmu-days_day.nemo-pmu-selected');
	}

	function getDateElementCustom(dates) {
		//returns elementts by custom dates, accept epoch, formatted date (!format must same as in picker!) and array
		var options = $(this).data('pickmeup-options');
		if ('number' === typeof dates) {
			return $(this.pickmeup).find('.nemo-pmu-days_day[data-date="' + dates + '"]');
		}
		else if ('string' === typeof dates) {
			var parsedDate = parseDate(dates, options.format, options.separator, options.locale).setHours(0, 0, 0, 0);
			return $(this.pickmeup).find('.nemo-pmu-days_day[data-date="' + parsedDate + '"]')
		}
		else if (dates.constructor != Array()) {
			var result = [];
			for (var date in dates) {
				result.push($(this.pickmeup).find('.nemo-pmu-days_day[data-date="' + dates[date] + '"]'));
			}
			return result
		}
		else {
			return false;
		}
	}

	$.fn.pickmeup = function (initial_options) {
		var passedArguments = {};
		if (typeof initial_options === 'string') {
			var data,
				parameters = Array.prototype.slice.call(arguments, 1);
			switch (initial_options) {
				case 'getDateElementSelected':
					data = $(this).data('pickmeup-options');
					if (data) {
						var ret = data.binded[initial_options]();
					}
					return ret;
					break;
				case 'getDateElementCustom':
					data = $(this).data('pickmeup-options');
					if (data) {
						var ret = data.binded[initial_options](parameters[0]);
					}
					return ret;
					break;
				case 'hide':
				case 'show':
				case 'clear':
				case 'update':
				case 'prev':
				case 'next':
				case 'destroy':
					this.each(function () {
						data = $(this).data('pickmeup-options');
						if (data) {
							data.binded[initial_options]();
						}
					});
					break;
				case 'get_date':
					data = this.data('pickmeup-options');
					if (data) {
						return data.binded.get_date(parameters[0]);
					} else {
						return null;
					}
					break;
				case 'set_date':
					this.each(function () {
						data = $(this).data('pickmeup-options');
						if (data) {
							data.binded[initial_options].apply(this, parameters);
						}
					});
					break;
			}
			return this;
		} else if (typeof initial_options === "object") {
			passedArguments = initial_options;
		} else if (typeof initial_options === "undefined") {
			return this.data('pickmeup-options');
		}
		return this.each(function () {
			var $this = $(this);
			var options;
			if ($this.data('pickmeup-options') && typeof initial_options === "object") {
				options = $.extend({}, $this.data('pickmeup-options'), passedArguments);
			}else{
				options = $.extend({}, $.pickmeup, passedArguments);
			}
			jQuery(this).pickmeup('destroy');

			var i,
				option;
			for (i in options) {
				option = $this.data('nemo-pmu-' + i);
				if (typeof option !== 'undefined') {
					options[i] = option;
				}
			}
			// 4 conditional statements in order to account all cases
			if (options.view == 'days' && !options.selectDay) {
				options.view = 'months';
			}
			if (options.view == 'months' && !options.selectMonth) {
				options.view = 'years';
			}
			if (options.view == 'years' && !options.selectYear) {
				options.view = 'days';
			}
			if (options.view == 'days' && !options.selectDay) {
				options.view = 'months';
			}
			options.calendars = Math.max(1, parseInt(options.calendars, 10) || 1);
			options.mode = /single|multiple|range/.test(options.mode) ? options.mode : 'single';
			if (typeof options.min === 'string') {
				options.min = parseDate(options.min, options.format, options.separator, options.locale).setHours(0, 0, 0, 0);
			} else if (options.min && options.min.constructor == Date) {
				options.min.setHours(0, 0, 0, 0);
			}
			if (typeof options.max === 'string') {
				options.max = parseDate(options.max, options.format, options.separator, options.locale).setHours(0, 0, 0, 0);
			} else if (options.max && options.max.constructor == Date) {
				options.max.setHours(0, 0, 0, 0);
			}
			if (!options.selectDay) {
				if (options.min) {
					options.min = new Date(options.min);
					options.min.setDate(1);
					options.min = options.min.valueOf();
				}
				if (options.max) {
					options.max = new Date(options.max);
					options.max.setDate(1);
					options.max = options.max.valueOf();
				}
			}
			if (typeof options.date === 'string') {
				options.date = parseDate(options.date, options.format, options.separator, options.locale).setHours(0, 0, 0, 0);
			} else if (options.date.constructor == Date) {
				options.date.setHours(0, 0, 0, 0);
			}
			if (!options.date) {
				options.date = new Date;
				options.date.setHours(0, 0, 0, 0);
			}
			if (options.mode != 'single') {
				if (options.date.constructor != Array) {
					options.date = [options.date.valueOf()];
					if (options.mode == 'range') {
						options.date.push(((new Date(options.date[0])).setHours(0, 0, 0, 0)).valueOf());
					}
				} else {
					for (i = 0; i < options.date.length; i++) {
						options.date[i] = (parseDate(options.date[i], options.format, options.separator, options.locale).setHours(0, 0, 0, 0)).valueOf();
					}
					if (options.mode == 'range') {
						options.date[1] = ((new Date(options.date[1])).setHours(0, 0, 0, 0)).valueOf();
					}
				}
				options.current = new Date(options.date[0]);
				// Set days to 1 in order to handle them consistently
				if (!options.selectDay) {
					for (i = 0; i < options.date.length; ++i) {
						options.date[i] = new Date(options.date[i]);
						options.date[i].setDate(1);
						options.date[i] = options.date[i].valueOf();
						// Remove duplicates
						if (
							options.mode != 'range' &&
							options.date.indexOf(options.date[i]) !== i
						) {
							delete options.date.splice(i, 1);
							--i;
						}
					}
				}
			} else {
				options.date = options.date.valueOf();
				options.current = new Date(options.date);
				if (!options.selectDay) {
					options.date = new Date(options.date);
					options.date.setDate(1);
					options.date = options.date.valueOf();
				}
			}
			options.current.setDate(1);
			options.current.setHours(0, 0, 0, 0);
			var cnt,
				pickmeup = $(options.tpl.wrapper);
			pickmeup.addClass('nemo-pmu-wrapper_calendars_'+options.calendars);
			if(options.flat == true){
				pickmeup.addClass('nemo-pmu-wrapper_flat')
			}
			this.pickmeup = pickmeup;
			if (options.className) {
				pickmeup.addClass(options.className);
			}
			var html = '';
			for (i = 0; i < options.calendars; i++) {
				cnt = options.firstDay;
				html += options.tpl.head({
					prev: options.prev,
					next: options.next,
					day: [
						options.locale.daysMin[(cnt++) % 7],
						options.locale.daysMin[(cnt++) % 7],
						options.locale.daysMin[(cnt++) % 7],
						options.locale.daysMin[(cnt++) % 7],
						options.locale.daysMin[(cnt++) % 7],
						options.locale.daysMin[(cnt++) % 7],
						options.locale.daysMin[(cnt++) % 7]
					]
				});
			}
			$this.data('pickmeup-options', options);
			for (i in options) {
				if ([
						'render',
						'change',
						'beforeShow',
						'show',
						'hide',
						'setDate',
						'setMonth',
						'setYear'
					].indexOf(i) != -1) {
					options[i] = options[i].bind(this);
				}
			}
			options.binded = {
				fill: fill.bind(this),
				update_date: update_date.bind(this),
				click: click.bind(this),
				show: show.bind(this),
				forced_show: forced_show.bind(this),
				hide: hide.bind(this),
				update: update.bind(this),
				clear: clear.bind(this),
				prev: prev.bind(this),
				next: next.bind(this),
				get_date: get_date.bind(this),
				getDateElementSelected: getDateElementSelected.bind(this),
				getDateElementCustom: getDateElementCustom.bind(this),
				set_date: set_date.bind(this),
				destroy: destroy.bind(this),
				currentCalendar:currentCalendar.bind(this)
			};
			options.events_namespace = '.pickmeup-' + (++instances_count);
			pickmeup
				.on('click focus', options.binded.click)
				.addClass(options.views[options.view])
				.append(html)
				.on(
				$.support.selectstart ? 'selectstart' : 'mousedown',
				function (e) {
					e.preventDefault();
				}
			);
			if (options.flat) {
				pickmeup
					.appendTo(this).css({
						position: 'relative'
					});
				options.binded.fill();
				options.binded.show();
			} else {
				pickmeup.appendTo(document.body);
				// Multiple events support
				var triggerEvent = options.triggerEvent.split(' ');
				for (i = 0; i < triggerEvent.length; ++i) {
					triggerEvent[i] += options.events_namespace;
				}
				triggerEvent = triggerEvent.join(' ');
				$this.on(triggerEvent, options.binded.show);
			}
		});
	};
}));
