'use strict';
define(
	['knockout'],
	function (ko) {
		/**
		 * Dictionary model - model that takes arbitrary data and converts it into observables.
		 * It also manages stuff like obligatory system fields and the like
		 */
		function BaseControllerModel (initialData, controllerObject) {
			this.$$originalData = initialData;
			this.$$controller = controllerObject;
		}

		BaseControllerModel.prototype.$$usedModels = [];

		return BaseControllerModel;
	}
);