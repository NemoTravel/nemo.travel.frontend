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
			
			this.readableString = ko.computed(function(){
				var res = '';
				if(this.years() > 0 ){
					res += this.years()+' '+this.$$controller.i18n('duration', helpers.getNumeral(this.years(),"year_one","year_twoToFour","year_fourPlus")) +' ';
				}
				if(this.months() > 0 ){
					res += this.months()+' '+this.$$controller.i18n('duration', helpers.getNumeral(this.months(),"month_one","month_twoToFour","month_fourPlus"))+' ';
				}
				if(this.days() > 0 ){
					res += this.days()+' '+this.$$controller.i18n('duration', helpers.getNumeral(this.days(),"day_one","day_twoToFour","day_fourPlus"))+' ';
				}
				if(this.hours() > 0 ){
					res += this.hours()+' '+this.$$controller.i18n('duration',  helpers.getNumeral(this.hours(),"hour_one","hour_twoToFour","hour_fourPlus"))+' ';
				}
				if(this.minutes() > 0 ){
					res += this.minutes()+' '+this.$$controller.i18n('duration', helpers.getNumeral(this.minutes(),"minute_one","minute_twoToFour","minute_fourPlus"))+' ';
				}
				if(this.seconds() > 0 ){
					res +=  this.seconds()+' '+this.$$controller.i18n('duration', helpers.getNumeral(this.seconds(),"second_one","second_twoToFour","second_fourPlus"))+' ';
				}
				return res;
			}, this);
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