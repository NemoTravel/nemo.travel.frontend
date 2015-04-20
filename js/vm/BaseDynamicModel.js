'use strict';
define(
	['knockout'],
	function (ko) {
		/**
		 * Dictionary model - model that takes arbitrary data and converts it into observables.
		 * It also manages stuff like obligatory system fields and the like
		 */
		function BaseDynamicModel (initialData, controllerObject) {
			for (var i in initialData) {
				if (initialData.hasOwnProperty(i) && !this.hasOwnProperty(i)) {
					if (initialData[i] instanceof Array) {
						this[i] = ko.observableArray(initialData[i]);
					}
					else {
						this[i] = ko.observable(initialData[i]);
					}
				}
			}

			this.$$originalData = initialData;
			this.$$controller = controllerObject;
		}

		return BaseDynamicModel;
	}
);