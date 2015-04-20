'use strict';
define(
	['knockout','js/vm/BaseDynamicModel'],
	function (ko, BaseModel) {
		function FlightsSearchFormDate (initialData) {
			BaseModel.apply(this, arguments);
		}

		// Extending from dictionaryModel
		FlightsSearchFormDate.prototype = BaseModel.prototype;
		FlightsSearchFormDate.prototype.constructor = FlightsSearchFormDate;

		return FlightsSearchFormDate;
	}
);