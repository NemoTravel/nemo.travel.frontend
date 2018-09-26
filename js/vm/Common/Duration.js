'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseDynamicModel', 'js/vm/BaseI18nizedModel'],
	function (ko, helpers, BaseModel, BaseI18nizedModel) {
		function Duration(initialData) {
			BaseModel.apply(this, arguments);

			initialData = parseInt(initialData, 10);

			this.length = ko.observable(!isNaN(initialData) ? initialData : 0);

			this.seconds = ko.observable(0);
			this.minutes = ko.observable(0);
			this.hours = ko.observable(0);
			this.days = ko.observable(0);
			this.months = ko.observable(0);
			this.years = ko.observable(0);

			this.length.subscribe(this.setBaseParts, this);

			var self = this;

			this.readableString = ko.pureComputed(function () {
				var res = [];

				if (this.years() > 0) {
					res.push(this.years() + ' ' + this.$$controller.i18n('duration', 'year_' + helpers.getNumeral(this.years(), 'one', 'twoToFour', 'fourPlus')));
				}

				if (this.months() > 0) {
					res.push(this.months() + ' ' + this.$$controller.i18n('duration', 'month_' + helpers.getNumeral(this.months(), 'one', 'twoToFour', 'fourPlus')));
				}

				if (this.days() > 0) {
					res.push(this.days() + ' ' + this.$$controller.i18n('duration', 'day_' + helpers.getNumeral(this.days(), 'one', 'twoToFour', 'fourPlus')));
				}

				if (this.hours() > 0) {
					res.push(this.hours() + ' ' + this.$$controller.i18n('duration', 'hour_' + helpers.getNumeral(this.hours(), 'one', 'twoToFour', 'fourPlus')));
				}

				if (this.minutes() > 0) {
					res.push(this.minutes() + ' ' + this.$$controller.i18n('duration', 'minute_' + helpers.getNumeral(this.minutes(), 'one', 'twoToFour', 'fourPlus')));
				}

				if (this.seconds() > 0) {
					res.push(this.seconds() + ' ' + this.$$controller.i18n('duration', 'second_' + helpers.getNumeral(this.seconds(), 'one', 'twoToFour', 'fourPlus')));
				}

				return res.join(' ');
			}, this);

			/**
			 *
			 * @param includeSeconds
			 * @returns {String}
			 */
			this.dateAsString = function (includeSeconds) {
				includeSeconds = typeof includeSeconds === 'undefined' ? false : includeSeconds;

				var dateParts = [];

				if (self.years() > 0) {
					dateParts.push(self.years() + ' ' + self.$$controller.i18n('duration', 'year_short'));
				}

				if (self.months() > 0) {
					dateParts.push(self.months() + ' ' + self.$$controller.i18n('duration', 'month_short'));
				}

				if (self.days() > 0) {
					dateParts.push(self.days() + ' ' + self.$$controller.i18n('duration', 'day_short'));
				}

				if (self.hours() > 0) {
					dateParts.push(self.hours() + ' ' + self.$$controller.i18n('duration', 'hour_short'));
				}

				if (self.minutes() > 0) {
					dateParts.push(self.minutes() + ' ' + self.$$controller.i18n('duration', 'minute_short'));
				}

				if (includeSeconds && self.seconds() > 0) {
					dateParts.push(self.seconds() + ' ' + self.$$controller.i18n('duration', 'second_short'));
				}

				return dateParts.join(' ');
			};

			this.readableStringShort = ko.pureComputed(function () {
				return this.dateAsString(true);
			}, this);

			this.readableStringShortNoSeconds = ko.pureComputed(function () {
				return this.dateAsString();
			}, this);

			this.readableStringAsTime = ko.pureComputed(function () {
				var res = [];

				if (this.years() > 0) {
					res.push(this.years());
				}
				if (this.months() > 0 || res.length) {
					res.push(this.months());
				}
				if (this.days() > 0 || res.length) {
					res.push(this.days());
				}

				res.push(this.hours());
				res.push(this.minutes());

				res = res.map(this.prependZero);

				return res.join(':');
			}, this);

			this.readableStringShortest = ko.pureComputed(function () {
				var res = [];

				if (this.years() > 0) {
					res.push(this.years());
				}

				if (this.months() > 0 || res.length) {
					res.push(this.months());
				}

				if (this.days() > 0 || res.length) {
					res.push(this.days());
				}

				if (this.hours() > 0 || res.length) {
					res.push(this.hours());
				}

				if (this.minutes() > 0 || res.length) {
					res.push(this.minutes());
				}

				res.push(this.seconds());

				res = res.map(this.prependZero);

				return res.join(':');
			}, this);

			this.setBaseParts();
		}

		// Extending from base and i18nized model
		helpers.extendModel(Duration, [BaseModel, BaseI18nizedModel]);

		Duration.prototype.$$i18nSegments = ['duration'];

		Duration.prototype.prependZero = function (num) {
			if (num >= 0 && num < 10) {
				num = '0' + num.toString();
			}

			return num;
		};

		Duration.prototype.decrement = function () {
			this.length(this.length() - 1);
		};

		Duration.prototype.increment = function () {
			this.length(this.length() + 1);
		};

		Duration.prototype.setBaseParts = function () {
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

		return Duration;
	}
);
