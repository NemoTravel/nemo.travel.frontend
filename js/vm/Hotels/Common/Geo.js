'use strict';
define(['knockout', 'js/vm/helpers', 'js/vm/BaseStaticModel'], function (ko, helpers, BaseModel) {
	       function HotelsSearchFormGeo (initialData, controller) {
		       // Processing initialData: a pair of guide data and an object telling us what to take
		       // Processing data
		       BaseModel.apply(this, [initialData.data, controller]);

		       // Processing guide
		       this.processGuide(initialData.guide);

		       var countryCode = this.country_code;
		       if (countryCode == undefined && this.pool.cities[this.id].countryCode != undefined) {
			       countryCode = this.pool.cities[this.id].countryCode;
		       }

		       this.name = this.pool.cities[this.id].name.trim();
		       this.country = this.pool.countries[countryCode].name;
	       }

	       // Extending from dictionaryModel
	       helpers.extendModel(HotelsSearchFormGeo, [BaseModel]);

	       HotelsSearchFormGeo.prototype.pool = {
		       countries: {},
		       cities: {}
	       };

	       HotelsSearchFormGeo.prototype.processGuide = function (guide) {
		       if (typeof guide == 'object') {
			       for (var i in guide) {
				       if (guide.hasOwnProperty(i) && this.pool.hasOwnProperty(i)) {
					       for (var j in guide[i]) {
						       if (guide[i].hasOwnProperty(j) && !this.pool[i][j]) {
							       this.pool[i][j] = this.$$controller.getModel('BaseStaticModel', guide[i][j]);
						       }
					       }
				       }
			       }
		       }
	       };

	       return HotelsSearchFormGeo;
       });
