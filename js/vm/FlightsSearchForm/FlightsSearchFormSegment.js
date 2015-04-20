'use strict';
define(
	['knockout','js/vm/BaseDynamicModel'],
	function (ko, BaseModel) {
		function FlightsSearchFormSegment (initialData) {
			BaseModel.apply(this, arguments);
		}

		// Extending from dictionaryModel
		FlightsSearchFormSegment.prototype = BaseModel.prototype;
		FlightsSearchFormSegment.prototype.constructor = FlightsSearchFormSegment;

		return FlightsSearchFormSegment;
	}
);