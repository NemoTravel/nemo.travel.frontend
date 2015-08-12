'use strict';
define(
	['knockout','js/vm/helpers','js/vm/BaseDynamicModel','js/vm/BaseI18nizedModel'],
	function (ko, helpers, BaseModel, BaseI18nizedModel) {
		function CommonDate (initialData) {
			this.dateObject = ko.observable();

			this.update(initialData);
			BaseModel.apply(this, arguments);

			this.getDate       = ko.computed(function () { return this.dateObject().getDate();                        }, this);
			this.getZeroedDate = ko.computed(function () { return this.prependZero(this.dateObject().getDate());      }, this);
			this.getMonth      = ko.computed(function () { return this.prependZero(this.dateObject().getMonth() + 1); }, this);
			this.getYear       = ko.computed(function () { return this.dateObject().getFullYear();                    }, this);
			this.getHours      = ko.computed(function () { return this.prependZero(this.dateObject().getHours());     }, this);
			this.getMinutes    = ko.computed(function () { return this.prependZero(this.dateObject().getMinutes());   }, this);
			this.getSeconds    = ko.computed(function () { return this.prependZero(this.dateObject().getSeconds());   }, this);

			this.getMonthName      = ko.computed(function () { return this.$$controller.i18n('dates', 'month_'+(this.dateObject().getMonth() + 1) + '_f'); }, this);
			this.getMonthNameShort = ko.computed(function () { return this.$$controller.i18n('dates', 'month_'+(this.dateObject().getMonth() + 1) + '_s'); }, this);
			this.getDOWName        = ko.computed(function () { return this.$$controller.i18n('dates', 'dow_'+(this.dateObject().getDay() == 0 ? 7 : this.dateObject().getDay()) + '_f'); }, this);
			this.getDOWNameShort   = ko.computed(function () { return this.$$controller.i18n('dates', 'dow_'+(this.dateObject().getDay() == 0 ? 7 : this.dateObject().getDay()) + '_s'); }, this);

			this.getISODate     = ko.computed(function () { return this.getYear() + '-' + this.getMonth() + '-' + this.getZeroedDate() }, this);
			this.getISOTime     = ko.computed(function () { return this.getHours() + ':' + this.getMinutes() + ':' + this.getSeconds() }, this);
			this.getISODateTime = ko.computed(function () { return this.getISODate() + 'T' + this.getISOTime() }, this);

			this.getTimestamp = ko.computed(function () { return Math.floor(this.dateObject().getTime()/1000) }, this);
		}

		// Extending from base and i18nized model
		helpers.extendModel(CommonDate, [BaseModel, BaseI18nizedModel]);

		CommonDate.prototype.$$i18nSegments = ['dates'];

		CommonDate.prototype.update = function (initialData) {
			var newDate = null;

			// Parsing String from ISO format (YYYY-MM-DDTHH:II:SS)
			// '2015-00-11T00:00:00'
			if (typeof initialData == 'string' && this.regexes.fulltime.test(initialData)) {
				newDate = new Date(initialData);
			}
			else if (typeof initialData == 'string' && this.regexes.date.test(initialData)) {
				newDate = new Date(initialData+'T00:00:00');
			}
			else if (typeof initialData == 'object' && initialData instanceof Date) {
				newDate = initialData;
			}

			// Checking validity
			if (!newDate || isNaN(newDate.getDate())) {
				newDate = new Date(0);
			}

			this.dateObject(newDate);
		};

		CommonDate.prototype.regexes = {
			fulltime: /^\d{4}-\d{1,2}-\d{1,2}T\d{1,2}:\d{1,2}:\d{1,2}$/i,
			date: /^\d{4}-\d{1,2}-\d{1,2}$/
		};

		CommonDate.prototype.prependZero = function (num) {
			if (num >= 0 && num < 10) {
				num = '0' + num.toString();
			}

			return num;
		};

		CommonDate.prototype.dropTime = function (num) {
			var dobj = this.dateObject();

			dobj.setHours(0,0,0,0);

			this.dateObject(dobj);

			return this;
		};

		CommonDate.prototype.offsetDate = function (num) {
			var dobj = new Date(this.dateObject());

			dobj.setDate(dobj.getDate()+num);

			return this.$$controller.getModel('Common/Date', dobj);
		};

		return CommonDate;
	}
);