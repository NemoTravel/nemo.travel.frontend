'use strict';
define(
	['knockout','js/vm/helpers','js/vm/BaseDynamicModel','js/vm/BaseI18nizedModel'],
	function (ko, helpers, BaseModel, BaseI18nizedModel) {
		function CommonDate (initialData) {
			this.dateObject = ko.observable();

			this.update(initialData);
			BaseModel.apply(this, arguments);

			this.getDate       = ko.pureComputed(function () { return this.dateObject().getDate();                                      }, this);
			this.getZeroedDate = ko.pureComputed(function () { return this.prependZero(this.dateObject().getDate());                    }, this);
			this.getMonth      = ko.pureComputed(function () { return this.prependZero(this.dateObject().getMonth() + 1);               }, this);
			this.getYear       = ko.pureComputed(function () { return this.dateObject().getFullYear();                                  }, this);
			this.getHours      = ko.pureComputed(function () { return this.prependZero(this.dateObject().getHours());                   }, this);
			this.getMinutes    = ko.pureComputed(function () { return this.prependZero(this.dateObject().getMinutes());                 }, this);
			this.getSeconds    = ko.pureComputed(function () { return this.prependZero(this.dateObject().getSeconds());                 }, this);
			this.getDOW        = ko.pureComputed(function () { return this.dateObject().getDay() == 0 ? 7 : this.dateObject().getDay(); }, this);

			this.getMonthName      = ko.pureComputed(function () { return this.$$controller.i18n('dates', 'month_' + (this.dateObject().getMonth() + 1) + '_f'); }, this);
			this.getMonthNameShort = ko.pureComputed(function () { return this.$$controller.i18n('dates', 'month_' + (this.dateObject().getMonth() + 1) + '_s'); }, this);
			this.getDOWName        = ko.pureComputed(function () { return this.$$controller.i18n('dates', 'dow_' + this.getDOW() + '_f'); }, this);
			this.getDOWNameShort   = ko.pureComputed(function () { return this.$$controller.i18n('dates', 'dow_' + this.getDOW() + '_s'); }, this);

			this.getTime       = ko.pureComputed(function () { return this.getHours() + ':' + this.getMinutes() }, this);

			this.getShortDate        = ko.pureComputed(function () { return this.getDate() + ' ' + this.getMonthName(); }, this);
			this.getShortDateWithDOW = ko.pureComputed(function () { return this.getDate() + ' ' + this.getMonthName() + ', ' + this.getDOWNameShort() + '.'; }, this);
			this.getFullDate         = ko.pureComputed(function () { return this.getDate() + ' ' + this.getMonthName() + ' ' + this.getYear() + ', ' + this.getHours() + ':' + this.getMinutes(); }, this);

			this.getISODate     = ko.pureComputed(function () { return this.getYear() + '-' + this.getMonth() + '-' + this.getZeroedDate() }, this);
			this.getISOTime     = ko.pureComputed(function () { return this.getTime() + ':' + this.getSeconds() }, this);
			this.getISODateTime = ko.pureComputed(function () { return this.getISODate() + 'T' + this.getISOTime() }, this);
			
			this.getHumanFullDate = ko.pureComputed(function () { return this.getHours() + ':' + this.getMinutes() + ' ' + this.getDate() + ' ' + this.getMonthName() + ' ' + this.getYear() }, this);

			this.getTimestamp = ko.pureComputed(function () { return Math.floor(this.dateObject().getTime()/1000) }, this);
		}

		// Extending from base and i18nized model
		helpers.extendModel(CommonDate, [BaseModel, BaseI18nizedModel]);

		CommonDate.prototype.$$i18nSegments = ['dates'];

		CommonDate.prototype.update = function (initialData) {
			var newDate = null;

			// Parsing String from ISO format (YYYY-MM-DDTHH:II:SS),
			// we consider all dates passed as dates in current timezone
			if (typeof initialData == 'string') {
				var fulltime = this.regexes.fulltime.test(initialData),
					dateonly = this.regexes.date.test(initialData);

				if (dateonly) {
					initialData += 'T00:00:00';
				}

				if (fulltime || dateonly) {
					newDate = new Date(initialData);
					newDate.setFullYear(
						parseInt(initialData.substr(0, 4), 10),
						parseInt(initialData.substr(5, 2), 10) - 1,
						parseInt(initialData.substr(8, 2), 10)
					);
					newDate.setHours(parseInt(initialData.substr(11, 2), 10));
					newDate.setMinutes(parseInt(initialData.substr(14, 2), 10));
					newDate.setSeconds(parseInt(initialData.substr(17, 2), 10));
				}
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

		CommonDate.prototype.offsetDate = function (days) {
			var dobj = new Date(this.dateObject());

			dobj.setDate(dobj.getDate() + days);

			return this.$$controller.getModel('Common/Date', dobj);
		};

		CommonDate.prototype.setHours = function (h, m, s) {
			this.dateObject().setHours(h, m, s);
			this.dateObject.valueHasMutated();
		};

		// возвращает разницу между датами в днях
		CommonDate.prototype.dateDiffInDays = function (date) {
			var offsetDate  = date.getTimestamp(),
				currentDate = this.getTimestamp(),
				diff        = (offsetDate - currentDate);

			return Math.round(diff / (60*60*24));
		};

		return CommonDate;
	}
);