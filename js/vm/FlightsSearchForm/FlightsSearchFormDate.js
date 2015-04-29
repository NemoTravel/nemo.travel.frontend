'use strict';
define(
	['knockout','js/vm/helpers','js/vm/BaseDynamicModel','js/vm/BaseI18nizedModel'],
	function (ko, helpers, BaseModel, BaseI18nizedModel) {
		function FlightsSearchFormDate (initialData) {
			this.dateObject = ko.observable();

			this.update(initialData);
			BaseModel.apply(this, arguments);

			this.getDate  = ko.computed(function () { return this.prependZero(this.dateObject().getDate());      }, this);
			this.getMonth = ko.computed(function () { return this.prependZero(this.dateObject().getMonth() + 1); }, this);
			this.getYear  = ko.computed(function () { return this.dateObject().getMonth();                       }, this);

			this.getMonthName      = ko.computed(function () { return this.$$controller.i18n('dates', 'month_'+(this.dateObject().getMonth() + 1) + '_f'); }, this);
			this.getMonthNameShort = ko.computed(function () { return this.$$controller.i18n('dates', 'month_'+(this.dateObject().getMonth() + 1) + '_s'); }, this);
			this.getDOWName        = ko.computed(function () { return this.$$controller.i18n('dates', 'dow_'+(this.dateObject().getDay() == 0 ? 7 : this.dateObject().getDay()) + '_f'); }, this);
			this.getDOWNameShort   = ko.computed(function () { return this.$$controller.i18n('dates', 'dow_'+(this.dateObject().getDay() == 0 ? 7 : this.dateObject().getDay()) + '_s'); }, this);
		}

		// Extending from base and i18nized model
		helpers.extendModel(FlightsSearchFormDate, [BaseModel, BaseI18nizedModel]);

		FlightsSearchFormDate.prototype.$$i18nSegments = ['dates'];

		FlightsSearchFormDate.prototype.update = function (initialData) {
			var newDate = null;

			// Parsing String from ISO format (YYYY-MM-DDTHH:II:SS)
			// '2015-00-11T00:00:00'
			if (typeof initialData == 'string' && this.regexes.fulltime.test(initialData)) {
				newDate = new Date(initialData);
			}

			// Checking validity
			if (!newDate || isNaN(newDate.getDate())) {
				newDate = new Date(0);
			}

			this.dateObject(newDate);
		};

		FlightsSearchFormDate.prototype.regexes = {
			fulltime: /^\d{4}-\d{1,2}-\d{1,2}(?:T\d{1,2}:\d{1,2}:\d{1,2})$/i
		};

		FlightsSearchFormDate.prototype.prependZero = function (num) {
			if (num > 0 && num < 10) {
				num = '0' + num.toString();
			}

			return num;
		};

		return FlightsSearchFormDate;
	}
);