'use strict';
define(['knockout', 'js/vm/helpers', 'js/vm/BaseStaticModel'], function (ko, helpers, BaseModel) {
	function HotelsSearchFormGeo(initialData, controller) {
		// Processing initialData: a pair of guide data and an object telling us what to take
		// Processing data
		BaseModel.apply(this, [initialData.data, controller]);

		// Processing guide
		this.processGuide(initialData.guide);

		var countryCode = this.country_code;

		if (!countryCode && this.pool.cities[this.id].countryCode) {
			countryCode = this.pool.cities[this.id].countryCode;
		}

		this.name = this.pool.cities[this.id].name.trim() || this.name || ''; // city name
		this.country = this.pool.countries[countryCode] ? this.pool.countries[countryCode].name : '';
	}

	// Extending from dictionaryModel
	helpers.extendModel(HotelsSearchFormGeo, [BaseModel]);

	HotelsSearchFormGeo.prototype.pool = {
		countries: {},
		cities: {}
	};

	/**
	 *
	 * @param {Object} guide
	 * @param {Object} guide.cities
	 * @param {Object} guide.countries
	 * @param {Object} guide.hotels
	 */
	HotelsSearchFormGeo.prototype.processGuide = function (guide) {
		var self = this;

		if (typeof guide === 'object') {

			helpers.iterateObject(guide, function (guideItem, guideItemKey) {

				if (self.pool.hasOwnProperty(guideItemKey)) {

					helpers.iterateObject(guideItem, function (guideItemValue, guideItemValueKey) {
						if (!self.pool[guideItemKey][guideItemValueKey]) {
							self.pool[guideItemKey][guideItemValueKey] = self.$$controller.getModel(
								'BaseStaticModel',
								guideItemValue
							);
						}
					});

				}
			});
		}
	};

	return HotelsSearchFormGeo;
});
