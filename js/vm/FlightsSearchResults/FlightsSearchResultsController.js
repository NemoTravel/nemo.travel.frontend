'use strict';
define(
	['knockout','vm/BaseControllerModel'],
	function (ko, BaseControllerModel) {
		function FlightsSearchResultsController (componentParameters) {
			BaseControllerModel.apply(this, arguments);
		}

		// Extending from dictionaryModel
		FlightsSearchResultsController.prototype = BaseControllerModel.prototype;
		FlightsSearchResultsController.prototype.constructor = FlightsSearchResultsController;

		// Own prototype stuff
		FlightsSearchResultsController.prototype.$$usedModels = ['a','b'];

		return FlightsSearchResultsController;
	}
);