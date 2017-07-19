'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseStaticModel'],
	function (ko, helpers, BaseModel) {
		function Transfer(initialData) {
			BaseModel.apply(this, arguments);
			
			this.placeName = this.place.city ? this.place.city.name : this.place.name;
		}

		helpers.extendModel(Transfer, [BaseModel]);
		
		return Transfer;
	}
);