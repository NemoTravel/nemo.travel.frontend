'use strict';
define(
	['knockout','js/vm/BaseControllerModel'],
	function (ko, BaseControllerModel) {
		function FlightsSearchFormController (componentParameters) {
			BaseControllerModel.apply(this, arguments);
		}

		// Extending from dictionaryModel
		FlightsSearchFormController.prototype = BaseControllerModel.prototype;
		FlightsSearchFormController.prototype.constructor = FlightsSearchFormController;

		FlightsSearchFormController.prototype.$$usedModels = [
			'FlightsSearchForm/FlightsSearchFormSegment',
			'FlightsSearchForm/FlightsSearchFormDate',
			'FlightsSearchForm/FlightsSearchFormGeo'
		];

		FlightsSearchFormController.prototype.dataURL = function () {
			return '/JSONdummies/FlightsSearchForm.json';
		};

		FlightsSearchFormController.prototype.$$i18nSegments = ['FlightsSearchForm'];

		FlightsSearchFormController.prototype.$$KOBindings = ['FlightsSearchForm'];

		return FlightsSearchFormController;
	}
);