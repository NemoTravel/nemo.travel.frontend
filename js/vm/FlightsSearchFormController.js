'use strict';
define(
	['knockout','vm/BaseControllerModel'],
	function (ko, BaseControllerModel) {
		function FlightsSearchFormController (initialData) {
			BaseControllerModel.apply(this, arguments);
		}

		// Extending from dictionaryModel
		FlightsSearchFormController.prototype = new BaseControllerModel();
		FlightsSearchFormController.prototype.constructor = FlightsSearchFormController;

		return FlightsSearchFormController;
	}
);