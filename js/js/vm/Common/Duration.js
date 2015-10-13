'use strict';
define(
	['knockout','js/vm/helpers','js/vm/BaseDynamicModel','js/vm/BaseI18nizedModel'],
	function (ko, helpers, BaseModel, BaseI18nizedModel) {
		function Duration (initialData) {
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

			this.readableString = ko.computed(function(){
				var res = [];

				if(this.years() > 0) {
					res.push(this.years()+ ' ' +this.$$controller.i18n('duration', 'year_' + helpers.getNumeral(this.years(),"one","twoToFour","fourPlus")));
				}
				if(this.months() > 0) {
					res.push(this.months()+ ' ' +this.$$controller.i18n('duration', 'month_' + helpers.getNumeral(this.months(),"one","twoToFour","fourPlus")));
				}
				if(this.days() > 0) {
					res.push(this.days()+ ' ' +this.$$controller.i18n('duration', 'day_' + helpers.getNumeral(this.days(),"one","twoToFour","fourPlus")));
				}
				if(this.hours() > 0) {
					res.push(this.hours()+ ' ' +this.$$controller.i18n('duration',  'hour_' + helpers.getNumeral(this.hours(),"one","twoToFour","fourPlus")));
				}
				if(this.minutes() > 0) {
					res.push(this.minutes()+ ' ' +this.$$controller.i18n('duration', 'minute_' + helpers.getNumeral(this.minutes(),"one","twoToFour","fourPlus")));
				}
				if(this.seconds() > 0) {
					res.push(this.seconds()+ ' ' +this.$$controller.i18n('duration', 'second_' + helpers.getNumeral(this.seconds(),"one","twoToFour","fourPlus")));
				}

				return res.join(' ');
			}, this);

			this.readableStringShort = ko.computed(function(){
				var res = [];

				if(this.years() > 0) {
					res.push(this.years() + ' ' + this.$$controller.i18n('duration', "year_short"));
				}
				if(this.months() > 0) {
					res.push(this.months()+ ' ' +this.$$controller.i18n('duration', "month_short"));
				}
				if(this.days() > 0) {
					res.push(this.days()+ ' ' +this.$$controller.i18n('duration', "day_short"));
				}
				if(this.hours() > 0) {
					res.push(this.hours()+ ' ' +this.$$controller.i18n('duration',  "hour_short"));
				}
				if(this.minutes() > 0) {
					res.push(this.minutes()+ ' ' +this.$$controller.i18n('duration', "minute_short"));
				}
				if(this.seconds() > 0) {
					res.push(this.seconds()+ ' ' +this.$$controller.i18n('duration', "second_short"));
				}

				return res.join(' ');
			}, this);

			this.readableStringShortest = ko.computed(function(){
				var res = [];

				if(this.years() > 0){
					res.push(this.years());
				}
				if(this.months() > 0 || res.length){
					res.push(this.months());
				}
				if(this.days() > 0 || res.length){
					res.push(this.days());
				}
				if(this.hours() > 0 || res.length){
					res.push(this.hours());
				}
				if(this.minutes() > 0 || res.length){
					res.push(this.minutes());
				}

				res.push(this.seconds());

				res = res.map(this.prependZero);

				return res.join(':');
			}, this);

			this.readableStringShortNoSeconds = ko.computed(function(){
				var res = [];

				if(this.years() > 0) {
					res.push(this.years() + ' ' + this.$$controller.i18n('duration', "year_short"));
				}
				if(this.months() > 0) {
					res.push(this.months()+ ' ' +this.$$controller.i18n('duration', "month_short"));
				}
				if(this.days() > 0) {
					res.push(this.days()+ ' ' +this.$$controller.i18n('duration', "day_short"));
				}
				if(this.hours() > 0) {
					res.push(this.hours()+ ' ' +this.$$controller.i18n('duration',  "hour_short"));
				}
				if(this.minutes() > 0) {
					res.push(this.minutes()+ ' ' +this.$$controller.i18n('duration', "minute_short"));
				}

				return res.join(' ');
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

		Duration.prototype.decrement = function (num) {
			this.length(this.length() - 1);
		};

		Duration.prototype.increment = function (num) {
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