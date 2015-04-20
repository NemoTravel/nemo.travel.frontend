'use strict';
define(
	['knockout','/kocontroller/js/mvvm/common/dictionaryModel'],
	function (ko, dictionaryModel) {
		// It's extended from dictionaryModel
		function Country (initialData) {
			dictionaryModel.apply(this, arguments);

			// This is place for custom stuff and computeds
		}

		// Extending from dictionaryModel
		Country.prototype = new dictionaryModel();
		Country.prototype.constructor = Country;

		return Country;
	}
);