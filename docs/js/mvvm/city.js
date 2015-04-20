'use strict';
define(
	['knockout','/kocontroller/js/mvvm/common/dictionaryModel'],
	function (ko, dictionaryModel) {
		function City (initialData) {
			dictionaryModel.apply(this, arguments);
		}

		// Extending from dictionaryModel
		City.prototype = new dictionaryModel();
		City.prototype.constructor = City;

		return City;
	}
);