'use strict';
define(
	['knockout','js/vm/BaseStaticModel'],
	function (ko, BaseModel) {
		function FlightsSearchFormGeo (initialData) {
			BaseModel.apply(this, arguments);
		}

		// Extending from dictionaryModel
		FlightsSearchFormGeo.prototype = BaseModel.prototype;
		FlightsSearchFormGeo.prototype.constructor = FlightsSearchFormGeo;

		return FlightsSearchFormGeo;
	}
);