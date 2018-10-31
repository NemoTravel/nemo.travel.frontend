'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseStaticModel', 'js/vm/Models/LocalStorage'],
	function (ko, helpers, BaseModel, LocalStorage) {
		function FlightsSearchFormGeo (initialData, controller) {
			// Processing initialData: a pair of guide data and an object telling us what to take
			// Processing data
			BaseModel.apply(this, [initialData.data, controller]);
			// Processing guide
			this.processGuide(initialData.guide);

			this.IATA = this.IATA ? this.IATA : '';
			this.city = this.getData('cities', this.cityId || this.IATA);
			this.airport = this.getData('airports', this.IATA);

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
					this.city = this.airport && this.pool.cities[this.airport.cityId] ? this.pool.cities[this.airport.cityId] : null;
				}
			}
			else if (!this.isCity && !this.city && this.airport) {
				this.city = this.getData('cities', this.airport.cityId);
			}

			this.countryCode = '';
			if (this.isCity && this.city) {
				this.countryCode = this.city.countryCode;
			}
			else if (!this.isCity && this.airport) {
				this.countryCode = this.airport.countryCode;
			}

			this.country = this.getData('countries', this.countryCode);

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

		FlightsSearchFormGeo.prototype.getData = function (type, id) {
			if (!this.pool[type][id]) {
				var fromLocalStorage =  LocalStorage.get(type+'_'+id+'_'+this.$$controller.options.i18nLanguage, null);

				if (fromLocalStorage) {
					this.pool[type][id] = fromLocalStorage;
				}

				return fromLocalStorage;
			}

			return this.pool[type][id];
		};

		FlightsSearchFormGeo.prototype.processGuide = function (guide) {
			if (typeof guide === 'object') {
				for (var type in guide) { // type => { airports, cities, countries, ... }
					if (guide.hasOwnProperty(type) && this.pool.hasOwnProperty(type)) {
						for (var id in guide[type]) {
							if (guide[type].hasOwnProperty(id) && !this.pool[type][id]) {
								this.pool[type][id] = this.$$controller.getModel('BaseStaticModel', guide[type][id]);
								this.putToLocalStorage(id, type, guide[type][id]);
							}
						}
					}
				}
			}
		};

		FlightsSearchFormGeo.prototype.putToLocalStorage = function (id, type, object) {
			var code = object.IATA ? object.IATA : id;

			LocalStorage.set(type+'_'+code+'_'+this.$$controller.options.i18nLanguage, object);
		};

		return FlightsSearchFormGeo;
	}
);
