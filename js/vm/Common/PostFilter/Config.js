'use strict';
define(
	['knockout','js/vm/helpers','js/vm/BaseStaticModel'],
	function (ko, helpers, BaseModel) {
		function Config(initialData) {

			var self = this;

			var config = {
				name: '',
				type: 'String',
				isLegged: false,
				legNumber: 0,
				getter: null,
				options: null
			};
			// Own prototype stuff
			this.PFTimeTypes = [
				{
					type: 'n',
					seconds: 18000
				},
				{
					type: 'm',
					seconds: 43200
				},
				{
					type: 'd',
					seconds: 64800
				},
				{
					type: 'e',
					seconds: 79200
				},
				{
					type: 'n',
					seconds: 86400
				}
			];

			this.getTimeType = function (d) {
				var dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0),
					timeFromDayStart = 0,
					timeType = 'n';

				// Defining time type
				timeFromDayStart = Math.floor((d.getTime() - dayStart.getTime()) / 1000);

				for (var i = 0; i < this.PFTimeTypes.length; i++) {
					if (timeFromDayStart < this.PFTimeTypes[i].seconds) {
						timeType = this.PFTimeTypes[i].type;
						break;
					}
				}

				return timeType;
			};

			/**
			 * Checks minimal value
			 * @param current value
			 * @param candidate object from whick a new or old value should be returned
			 * @returns {*}
			 */
			this.stringPFMinPrice = function (current, candidate) {
				if (!current || candidate.getTotalPrice().amount() < current.amount()) {
					return candidate.getTotalPrice();
				}

				return current;
			};
			
			this.getFilterConfig = function (params) {
				config.name = params.name;

				if (params.name === 'transfersCount') {
					config.name = 'transfersCount';
					config.getter = function (obj) {
						var tmp = Math.max.apply(Math, obj.legs.map(function (item, i) {
							return item.transfersCount;
						}));

						return [[tmp, tmp]];
					};
					config.options = {
						// Filter-specific options here
						valuesSorter: function (a, b) {
							return a.value - b.value;
						},
						additionalValueChooser: this.stringPFMinPrice
					};
				}
				else if (params.name === 'flightID') {
					config.name = 'flightID';
					config.getter = function (obj) {
						return obj.searchInfoKey;
					};
					config.type = 'Text';
				}
				else if (params.name === 'price') {
					config.type = 'Number';
					config.getter = function (obj) {
						// We are forced to use Math.ceil here due to a bug in jQueryUI.slider
						// which is used for Number postFilters' view
						return Math.ceil(obj.getTotalPrice().amount());
					};
					config.options = {
						onInit: function (initParams) {
							var currency = '',
								keys = Object.keys(initParams.items);

							if (keys.length) {
								currency = initParams.items[keys[0]].getTotalPrice().currency();
							}

							this.displayValues.min = this.$$controller.getModel('Common/Money', {
								amount: 0,
								currency: currency
							});
							this.displayValues.max = this.$$controller.getModel('Common/Money', {
								amount: 0,
								currency: currency
							});
						},
						onValuesUpdate: function (newValue) {
							this.displayValues.min.amount(newValue.min);
							this.displayValues.max.amount(newValue.max);
						}
					};

				}
				else if (params.name === 'carrier') {
					config.getter = function (item) {
						var ret = [];

						ret.push([
							item.getFirstSegmentMarketingCompany().IATA,
							item.getFirstSegmentMarketingCompany()
						]);

						return ret;
					};
					config.options = {
						// Filter-specific options here
						valuesSorter: function (a, b) {
							return a.value.name.localeCompare(b.value.name);
						},
						additionalValueChooser: this.stringPFMinPrice,
						type: 'multiChoice'
					};

				}
				else if (params.name === 'freeBaggage') {
					config.getter = function (item) {
						var ret = [];
						var tmp = item.getBaggageForFilter();

						if (tmp.value > 0) {
							tmp.name = 'exist';
						}
						else if (tmp.value === 0) {
							tmp.name = 'no-exist';
						}
						else {
							tmp.name = 'no-info';
						}

						ret.push([
							tmp.name,
							tmp.name
						]);

						return ret;
					};
					config.options = {
						// Filter-specific options here
						valuesSorter: function (a, b) {
							return b.count() > a.count();
						},
						//additionalValueChooser: stringPFMinPrice,
						type: 'multiChoice'
					}
				}
				else if (params.name === 'transfersDuration') {
					config.type = 'Number';
					config.getter = function (obj) {
						if (obj.totalTimeTransfers > 0) {
							return obj.totalTimeTransfers;
						}
					};
					config.options = {
						/* Filter-specific options here */
						onInit: function (initParams) {
							this.displayValues.min = this.$$controller.getModel('Common/Duration', {length: 0});
							this.displayValues.max = this.$$controller.getModel('Common/Duration', {length: 0});
						},
						onValuesUpdate: function (newValue) {
							this.displayValues.min.length(newValue.min);
							this.displayValues.max.length(newValue.max);
						}
					}
				}
				else if (params.name === 'departureTime' || params.name === 'arrivalTime') {
					config.isLegged = true;
					config.getter = function (obj) {
						var d = params.name === 'departureTime' ? obj.legs[this.legNumber].depDateTime.dateObject() :
									obj.legs[this.legNumber].arrDateTime.dateObject(),
							timeType = self.getTimeType(d);

						return [[timeType, timeType]];
					};
					config.options = {
						// Filter-specific options here
						valuesSorter: function (a, b) {
							var sort = {
								n: 0,
								m: 1,
								d: 2,
								e: 3
							};

							return sort[a.key] - sort[b.key];
						},
						additionalValueChooser: this.stringPFMinPrice
					};
				}
				else if (params.name === 'departureAirport' || params.name === 'arrivalAirport') {
					config.isLegged = true;
					config.getter = function (obj) {
						return params.name === 'departureAirport' ?  [[obj.legs[this.legNumber].depAirp.IATA, obj.legs[this.legNumber].depAirp]] :
							[[obj.legs[this.legNumber].arrAirp.IATA, obj.legs[this.legNumber].arrAirp]];
					};
					config.options = {
						// Filter-specific options here
						valuesSorter: function (a, b) {
							return a.value.name.localeCompare(b.value.name);
						},
						additionalValueChooser: this.stringPFMinPrice
					}
				}
				else if (params.name === 'timeEnRoute') {
					config.getter = function (obj) {
						return obj.totalTimeEnRoute.length();
					};
					config.options = {
						/* Filter-specific options here */
						onInit: function (initParams) {
							this.displayValues.min = this.$$controller.getModel('Common/Duration', {length: 0});
							this.displayValues.max = this.$$controller.getModel('Common/Duration', {length: 0});
						},
						onValuesUpdate: function (newValue) {
							this.displayValues.min.length(newValue.min);
							this.displayValues.max.length(newValue.max);
						}
					}
				}
				else if (params.name === 'travelPolicies') {
					config.getter = function (obj) {
						var ret = [];

						for (var i = 0; i < obj.travelPolicies.length; i++) {
							if(obj.travelPolicies[i].value) {
								ret.push([
									obj.travelPolicies[i].id,
									obj.travelPolicies[i]
								]);
							}
						}

						return ret;
					};
					config.options = {
						// Filter-specific options here
						valuesSorter: function (a, b) {
							return a.value.name.localeCompare(b.value.name) && a.value.value === b.value.value;
						},
						additionalValueChooser: this.stringPFMinPrice,
						type: 'multiChoice'
					}
				}
				else if (params.name === 'subsidyInfo') {
					config.getter = function (obj) {
						var ret = [],
							subsidy = {name: self.$$controller.i18n('FlightsSearchResults', 'PF__value_noSubsidy'), priority: -1};

						if (obj.price.canHaveSubsidizedTariffs) {
							subsidy.name = obj.price.subsidyInfo.shortDescription;
							subsidy.priority = 1;
						}

						ret.push([
							subsidy.name,
							subsidy
						]);

						return ret;
					},
					config.options = {
						valuesSorter: function (a, b) {
							if (a.value.priority === b.value.priority) {
								return b.value.count() > a.value.count();
							}
							else {
								return b.value.priority > a.value.priority;
							}
						},
						type: 'multiChoice'
					}
				}

				return config;
			};

			if (initialData && initialData.name != '') {
				return this.getFilterConfig(initialData);
			}

		}

		helpers.extendModel(Config, [BaseModel]);

		return Config;

	}
);