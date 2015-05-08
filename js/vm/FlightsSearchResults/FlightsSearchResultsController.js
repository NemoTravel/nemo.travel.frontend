'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseControllerModel'],
	function (ko, helpers, BaseControllerModel) {
		function FlightsSearchResultsController (componentParameters) {
			BaseControllerModel.apply(this, arguments);
		}

		// Extending from dictionaryModel
		helpers.extendModel(FlightsSearchResultsController, [BaseControllerModel]);

		// Own prototype stuff
		FlightsSearchResultsController.prototype.$$usedModels = [];

		return FlightsSearchResultsController;
	}
);