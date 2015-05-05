'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseControllerModel'],
	function (ko, helpers, BaseControllerModel) {
		function FlightsLastSearchesController (componentParameters) {
			BaseControllerModel.apply(this, arguments);
		}

		// Extending from dictionaryModel
		helpers.extendModel(FlightsLastSearchesController, [BaseControllerModel]);

		FlightsLastSearchesController.prototype.buildModels = function () {};

		FlightsLastSearchesController.prototype.dataURL = function () {
			return null;
		};

//		FlightsLastSearchesController.prototype.$$usedModels = [];

//		FlightsLastSearchesController.prototype.$$i18nSegments = [];

//		FlightsLastSearchesController.prototype.$$KOBindings = [];

		return FlightsLastSearchesController;
	}
);