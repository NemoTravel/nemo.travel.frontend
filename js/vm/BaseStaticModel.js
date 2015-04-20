'use strict';
define(
	['knockout'],
	function (ko) {
		/**
		 * Dictionary model - model that takes arbitrary data and converts it into observables.
		 * It also manages stuff like obligatory system fields and the like
		 */
		function BaseStaticModel (initialData, controllerObject) {
			for (var i in initialData) {
				if (initialData.hasOwnProperty(i) && !this.hasOwnProperty(i)) {
					this[i] = initialData[i];
				}
			}

			this.$$originalData = initialData;
			this.$$controller = controllerObject;
		}

		return BaseStaticModel;
	}
);