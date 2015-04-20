'use strict';
define(
	['knockout','/kocontroller/js/mvvm/common/dictionaryModel'],
	function (ko, dictionaryModel) {
		function Airport (initialData) {
			dictionaryModel.apply(this, arguments);
		}

		// Extending from dictionaryModel
		Airport.prototype = new dictionaryModel();
		Airport.prototype.constructor = Airport;

		return Airport;
	}
);