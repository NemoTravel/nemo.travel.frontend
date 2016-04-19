'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseStaticModel'],
	function (ko, helpers, BaseModel) {
		function FlightsSearchFormGeo (initialData, controller) {
			// Processing initialData: a pair of guide data and an object telling us what to take
			// Processing data
			BaseModel.apply(this, [initialData.data, controller]);

			// Processing guide
			this.processGuide(initialData.guide);

			this.city = this.pool.cities[this.cityId] ? this.pool.cities[this.cityId] : null;
			this.airport = this.pool.airports[this.IATA] ? this.pool.airports[this.IATA] : null;

			// Fixing data inconsistencies
			if (this.isCity && !this.city && this.IATA) {
				// Looking for a city with this IATA
				for (var i in this.pool.cities) {
					if (this.pool.cities.hasOwnProperty(i) && this.pool.cities[i].IATA == this.IATA) {
						this.city = this.pool.cities[i];
					}
				}

				// If still no city - it's an airport
				if (!this.city) {
					this.isCity = false;
					this.airport = this.pool.airports[this.IATA] ? this.pool.airports[this.IATA] : null;
					this.city = this.pool.cities[this.airport.cityId] ? this.pool.cities[this.airport.cityId] : null;
				}
			}
			else if (!this.isCity && !this.city && this.airport) {
				this.city = this.pool.cities[this.airport.cityId] ? this.pool.cities[this.airport.cityId] : null;
			}

			this.countryCode = '';
			if (this.isCity && this.city) {
				this.countryCode = this.city.countryCode;
			}
			else if (!this.isCity && this.airport) {
				this.countryCode = this.airport.countryCode;
			}

			this.country = this.pool.countries[this.countryCode] ? this.pool.countries[this.countryCode] : null;

			this.name = '';
			this.properName = '';
			if (this.isCity && this.city) {
				this.name = this.city.name;
			}
			else if (!this.isCity && this.airport) {
				this.name = this.airport.name;
				this.properName = this.airport.properName || this.airport.name;
			}

			this.identifier = '';
			if (this.isCity && this.city) {
				this.identifier = this.city.id;
			}
			else if (!this.isCity && this.airport) {
				this.identifier = this.airport.IATA;
			}

			if (!this.city) {
				this.city = {
					name: this.name
				};
			}

			if (!this.country) {
				this.country = {
					name: this.countryCode || ''
				};
			}
		}

		// Extending from dictionaryModel
		helpers.extendModel(FlightsSearchFormGeo, [BaseModel]);

		FlightsSearchFormGeo.prototype.pool = {
			countries: {},
			cities: {},
			airports: {}
		};

		FlightsSearchFormGeo.prototype.processGuide = function (guide) {
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

		return FlightsSearchFormGeo;
	}
);