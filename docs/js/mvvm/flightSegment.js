'use strict';
define(
	['knockout','/kocontroller/js/mvvm/common/dictionaryModel'],
	function (ko, dictionaryModel) {
		/**
		 * If a model adds nothing to basic dictionaryModel functionality you can just return it
		 */
		return dictionaryModel;

		/*function FlightSegment (initialData) {
			dictionaryModel.apply(this, arguments);
		}

		// Extending from dictionaryModel
		FlightSegment.prototype = new dictionaryModel();
		FlightSegment.prototype.constructor = FlightSegment;

		return FlightSegment;*/
	}
);