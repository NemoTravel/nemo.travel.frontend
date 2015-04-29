'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseDynamicModel'],
	function (ko, helpers, BaseModel) {
		function FlightsSearchFormSegment (initialData) {
			BaseModel.apply(this, arguments);
		}

		// Extending from dictionaryModel
		helpers.extendModel(FlightsSearchFormSegment, [BaseModel]);

		return FlightsSearchFormSegment;
	}
);