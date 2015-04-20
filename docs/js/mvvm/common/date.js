'use strict';
define(
	['knockout','/kocontroller/js/mvvm/common/dictionaryModel'],
	function (ko, dictionaryModel) {
		function Date (initialData) {
			dictionaryModel.apply(this, arguments);

			this.date = ko.computed(function () {
				return this.day()+'.'+this.month()+'.'+this.year();
			}, this);
		}

		// Extending from dictionaryModel
		Date.prototype = new dictionaryModel();
		Date.prototype.constructor = Date;

		return Date;
	}
);