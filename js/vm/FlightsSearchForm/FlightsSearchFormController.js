'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseControllerModel'],
	function (ko, helpers, BaseControllerModel) {
		function FlightsSearchFormController (componentParameters) {
			BaseControllerModel.apply(this, arguments);

			this.serviceClasses = ['All', 'Economy', 'Business', 'First'];
			this.tripTypes = ['OW','RT','CR'];

			this.segments = ko.observableArray([]);
			this.passengers = ko.observable({});
			this.options = {};

			this.tripType = ko.observable('OW');
			this.directFlights = ko.observable(false);
			this.vicinityDates = ko.observable(false);
			this.serviceClass = ko.observable(this.serviceClasses[0]);

			this.validaTERROR = ko.observable(false);

			this.tripType.subscribe(function (newValue) {
				var segments = this.segments();

				this.$$controller.log('TripType set to', newValue);

				switch (newValue) {
					case 'OW':
						this.segments.splice(1);
						break;

					case 'RT':
						var tmpdate = null;

						if (segments.length >= 2) {
							tmpdate = segments[1].items.departureDate.value();
						}

						this.segments.splice(1);

						this.addSegment(this.segments()[0].items.arrival.value(), this.segments()[0].items.departure.value(), tmpdate);

						break;

					case 'CR':
						break;
				}
			}, this);

			this.typeSelectorOpen       = ko.observable(false);
			this.classSelectorOpen      = ko.observable(false);
			this.passengersSelectorOpen = ko.observable(false);

			this.toggleTypeSelector       = function () {this.typeSelectorOpen(!this.typeSelectorOpen());};
			this.toggleClassSelector      = function () {this.classSelectorOpen(!this.classSelectorOpen());};
			this.togglePassengersSelector = function () {this.passengersSelectorOpen(!this.passengersSelectorOpen());};

			this.passengersSummary = ko.computed(function () {
				var ret = '',
					total = 0,
					passengers = this.passengers(),
					passTypes = [];

				for (var i in passengers) {
					if (passengers.hasOwnProperty(i)) {
						var t = passengers[i]();
						if (t > 0) {
							total += t;
							passTypes.push(i);
						}
					}
				}

				if (passTypes.length == 0) {
					ret = this.$$controller.i18n('FlightsSearchForm','passSummary_numeral_noPassengers');
				}
				else if (passTypes.length == 1) {
					ret = total + ' ' + this.$$controller.i18n('FlightsSearchForm','passSummary_numeral_' + passTypes.pop() + '_' + helpers.getNumeral(total, 'one', 'twoToFour', 'fourPlus'));
				}
				else {
					ret = total + ' ' + this.$$controller.i18n('FlightsSearchForm','passSummary_numeral_mixed_' + helpers.getNumeral(total, 'one', 'twoToFour', 'fourPlus'));
				}

				return ret;
			}, this);

			this.passengersRestrictions = ko.computed(function () {
				var ret = {},
					passengers = this.passengers(),
					adtSum = 0,
					infSum = 0,
					total = 0,
					adultTypes = ['ADT', 'SRC', 'YTH'],
					infantTypes = ['INF', 'INS'];

				for (var i in passengers) {
					if (passengers.hasOwnProperty(i)) {
						ret[i] = {min: 0, max: 0};

						total += passengers[i]();

						if (adultTypes.indexOf(i) >= 0) {
							adtSum += passengers[i]();
						}

						if (infantTypes.indexOf(i) >= 0) {
							infSum += passengers[i]();
						}
					}
				}

				// Setting maximums regarding maximum passenger count
				for (var i in ret) {
					if (ret.hasOwnProperty(i)) {
						ret[i].max = Math.min(passengers[i]() + this.options.totalPassengers - total, parseInt(this.options.passengerCount[i]));
					}
				}

				// ADT+YTH+SRC >= INF+INS
				// Infants: not more than adtSum
				for (var i = 0; i < infantTypes.length; i++) {
					if (ret.hasOwnProperty(infantTypes[i])) {
						ret[infantTypes[i]].max = Math.min(adtSum, ret[infantTypes[i]].max);
					}
				}

				// Adults: not less than infSum
				for (var i = 0; i < adultTypes.length; i++) {
					if (ret.hasOwnProperty(adultTypes[i])) {
						ret[adultTypes[i]].min = Math.max(
							0,
							passengers[adultTypes[i]]() - adtSum + infSum,
							ret[adultTypes[i]].min
						);
					}
				}

				return ret;
			}, this);

			this.isValid = ko.computed(function () {
				var segments = this.segments(),
					ret = true;

				for (var i = 0; i < segments.length; i++) {
					if (!segments[i].isValid()) {
						ret = false;
					}
				}

				return ret;
			}, this);
		}

		// Extending from dictionaryModel
		helpers.extendModel(FlightsSearchFormController, [BaseControllerModel]);

		FlightsSearchFormController.prototype.processValidation = function () {
			var segments;
			if (this.validaTERROR()) {
				segments = this.segments();

				for (var i = 0; i < segments.length; i++) {
					for (var j in segments[i].items) {
						if (segments[i].items.hasOwnProperty(j) && segments[i].items[j].error()) {
							segments[i].items[j].focus(true);
							return;
						}
					}
				}

				// TODO - check dates validity
			}
		};

		FlightsSearchFormController.prototype.startSearch = function () {
			if (!this.isValid()) {
				this.validaTERROR(true);
				this.processValidation();
			}
			else {
				console.log('STARTING SEARCH');
			}
		};

		FlightsSearchFormController.prototype.setPassengers = function (type, count) {
			var restrictions = this.passengersRestrictions();

			if (restrictions[type] && count >= restrictions[type].min && count <= restrictions[type].max) {
				this.passengers()[type](count);
			}
		};

		FlightsSearchFormController.prototype.getPassengersCounts = function (passType) {
			var ret = [];

			// From 0 to maximum count including
			for (var i = 0; i <= this.options.passengerCount[passType]; i++) {
				ret.push(i);
			}

			if (passType == 'ADT') {
				ret.shift();
			}

			return ret;
		};

		FlightsSearchFormController.prototype.buildModels = function () {
			var geo = {
					cities: {},
					countries: {},
					airports: {}
				},
				tmpass = {};

			// Processing options
			// Passengers maximums
			this.options = this.$$rawdata.flights.search.formData.maxLimits;
			this.options.totalPassengers = parseInt(this.options.totalPassengers);

			// Date options
			this.options.dateOptions = this.$$rawdata.flights.search.formData.dateOptions;

			// Processing geo data
			// Countries (not dynamic data)
			for (var i in this.$$rawdata.guide.countries) {
				if (this.$$rawdata.guide.countries.hasOwnProperty(i)) {
					geo.countries[i] = this.$$controller.getModel('BaseStaticModel', {
						name: this.$$rawdata.guide.countries[i].name,
						IATA: i
					});
				}
			}

			// Cities + Countries (not dynamic data)
			for (var i in this.$$rawdata.guide.cities) {
				if (this.$$rawdata.guide.cities.hasOwnProperty(i)) {
					var data = this.$$rawdata.guide.cities[i];

					data.id = i;
					data.country = geo.countries[data.countryCode];

					geo.cities[i] = this.$$controller.getModel('BaseStaticModel', data);
				}
			}

			// Airports + Cities + Countries
			// Airports can be cities but we need a common "geo" model. So we store common data
			for (var i in this.$$rawdata.guide.airports) {
				if (this.$$rawdata.guide.airports.hasOwnProperty(i)) {
					var data = this.$$rawdata.guide.airports[i];

					data.IATA = i;
					data.country = geo.countries[data.countryCode];
					data.city = geo.cities[data.cityId];

					geo.airports[i] = data;
				}
			}

			// Processing segments
			for (var i = 0; i < this.$$rawdata.flights.search.request.segments.length; i++) {
				var data = this.$$rawdata.flights.search.request.segments[i],
					departure = null,
					arrival = null,
					tmp;

				if (data.departure && data.departure.IATA && geo.airports[data.departure.IATA]) {
					tmp = geo.airports[data.departure.IATA];
					tmp.isCity = data.departure.isCity;

					departure = this.$$controller.getModel('BaseStaticModel', tmp);
				}

				if (data.arrival && data.arrival.IATA && geo.airports[data.arrival.IATA]) {
					tmp = geo.airports[data.arrival.IATA];
					tmp.isCity = data.arrival.isCity;

					arrival = this.$$controller.getModel('BaseStaticModel', tmp);
				}

				// departureDate = 2015-04-11T00:00:00
				this.addSegment(
					departure,
					arrival,
					data.departureDate ? this.$$controller.getModel('FlightsSearchForm/FlightsSearchFormDate', data.departureDate) : null
				);
			}

			// Processing passengers counts
			for (var i = 0; i < this.$$rawdata.flights.search.request.passengers.length; i++) {
				tmpass[this.$$rawdata.flights.search.request.passengers[i].type] = this.$$rawdata.flights.search.request.passengers[i].count;
			}

			for (var i in this.options.passengerCount) {
				if (this.options.passengerCount.hasOwnProperty(i)) {
					tmpass[i] = ko.observable(tmpass[i] ? tmpass[i] : 0);
				}
			}

			this.passengers(tmpass);

			// Processing other options
			this.tripType(this.$$rawdata.flights.search.request.parameters.searchType);
			this.directFlights(this.$$rawdata.flights.search.request.parameters.direct);
			this.vicinityDates(this.$$rawdata.flights.search.request.parameters.aroundDates != 0);

			if (this.serviceClasses.indexOf(this.$$rawdata.flights.search.request.parameters.serviceClass) >= 0) {
				this.serviceClass(this.$$rawdata.flights.search.request.parameters.serviceClass);
			}
		};

		FlightsSearchFormController.prototype.addSegment = function (departure, arrival, departureDate) {
			this.segments.push(
				this.$$controller.getModel(
					'FlightsSearchForm/FlightsSearchFormSegment',
					{
						departure: departure,
						arrival: arrival,
						departureDate: departureDate,
						index: this.segments().length,
						form: this
					}
				)
			);
		};

		FlightsSearchFormController.prototype.continueCR = function () {
			var segsCount = this.segments().length;

			if (this.tripType() == 'CR' && segsCount < this.options.flightSegments) {
				this.addSegment(this.segments()[segsCount - 1].items.arrival.value(), null, null);
			}
		};

		FlightsSearchFormController.prototype.removeLastCRSegment = function () {
			var segsCount = this.segments().length;

			if (this.tripType() == 'CR' && segsCount > 1) {
				this.segments.pop();
			}
		};

		FlightsSearchFormController.prototype.passengerTypesOrder = ['ADT', 'CLD', 'INF', 'INS', 'YTH', 'SRC'];

		FlightsSearchFormController.prototype.$$usedModels = [
			'FlightsSearchForm/FlightsSearchFormSegment',
			'FlightsSearchForm/FlightsSearchFormDate'/*,
			'FlightsSearchForm/FlightsSearchFormGeo'*/
		];

		FlightsSearchFormController.prototype.dataURL = function () {
			return '/flights/search/formData';
//			return '/JSONdummies/FlightsSearchForm.json?bust=' + (new Date()).getTime();
		};

		FlightsSearchFormController.prototype.$$i18nSegments = ['FlightsSearchForm'];

		FlightsSearchFormController.prototype.$$KOBindings = ['FlightsSearchForm'];

		return FlightsSearchFormController;
	}
);