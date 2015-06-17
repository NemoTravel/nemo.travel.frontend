'use strict';
define(
	['knockout','js/vm/helpers','js/vm/BaseDynamicModel','js/vm/BaseI18nizedModel'],
	function (ko, helpers, BaseModel, BaseI18nizedModel) {
		function length (initialData) {
			BaseModel.apply(this, arguments);

			initialData = parseInt(initialData);

			this.length = ko.observable(!isNaN(initialData) ? initialData : 0);

			this.seconds = ko.observable(0);
			this.minutes = ko.observable(0);
			this.hours   = ko.observable(0);
			this.days    = ko.observable(0);
			this.months  = ko.observable(0);
			this.years   = ko.observable(0);

			this.length.subscribe(this.setBaseParts, this);

			this.setBaseParts();
		}

		// Extending from base and i18nized model
		helpers.extendModel(length, [BaseModel, BaseI18nizedModel]);

		length.prototype.$$i18nSegments = ['duration'];

		length.prototype.prependZero = function (num) {
			if (num >= 0 && num < 10) {
				num = '0' + num.toString();
			}

			return num;
		};

		length.prototype.setBaseParts = function () {
			var left = this.length();

			// Years
			this.years(Math.floor(left / 31556926));
			left = left % 31556926;

			// Months
			this.months(Math.floor(left / 2629744));
			left = left % 2629744;

			// Days
			this.days(Math.floor(left / 86400));
			left = left % 86400;

			// Hours
			this.hours(Math.floor(left / 3600));
			left = left % 3600;

			// Minutes
			this.minutes(Math.floor(left / 60));

			// Seconds
			this.seconds(left % 60);
		};

		return length;
	}
);