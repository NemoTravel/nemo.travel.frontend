'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseControllerModel'],
	function (ko, helpers, BaseControllerModel) {
		function FlightsSearchFormController (componentParameters) {
			BaseControllerModel.apply(this, arguments);

			this.serviceClasses = ['All', 'Economy', 'Business', 'First'];

			this.segments = ko.observableArray([]);
			this.passengers = {};
			this.options = {};

			this.tripType = ko.observable('OW');
			this.directFlights = ko.observable(false);
			this.vicinityDates = ko.observable(0);
			this.serviceClass = ko.observable(this.serviceClasses[0]);

			this.tripType.subscribe(function (newValue) {

			}, this);

			this.typeSelectorOpen       = ko.observable(false);
			this.classSelectorOpen      = ko.observable(false);
			this.passengersSelectorOpen = ko.observable(false);

			this.toggleTypeSelector       = function () {this.typeSelectorOpen(!this.typeSelectorOpen());};
			this.toggleClassSelector      = function () {this.classSelectorOpen(!this.classSelectorOpen());};
			this.togglePassengersSelector = function () {this.passengersSelectorOpen(!this.passengersSelectorOpen());};
		}

		// Extending from dictionaryModel
		helpers.extendModel(FlightsSearchFormController, [BaseControllerModel]);

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

			// Date options
			this.options.dateOptions = this.$$rawdata.flights.search.formData.dateOptions;

			// Processing geo data
			// Countries (not dynamic data)
			for (var i in this.$$rawdata.geoData.countries) {
				if (this.$$rawdata.geoData.countries.hasOwnProperty(i)) {
					geo.countries[i] = this.$$controller.getModel('BaseStaticModel', {
						name: this.$$rawdata.geoData.countries[i].name,
						IATA: i
					});
				}
			}

			// Cities + Countries (not dynamic data)
			for (var i in this.$$rawdata.geoData.cities) {
				if (this.$$rawdata.geoData.cities.hasOwnProperty(i)) {
					var data = this.$$rawdata.geoData.cities[i];

					data.id = i;
					data.country = geo.countries[data.countryCode];

					geo.cities[i] = this.$$controller.getModel('BaseStaticModel', data);
				}
			}

			// Airports + Cities + Countries
			for (var i in this.$$rawdata.geoData.airports) {
				if (this.$$rawdata.geoData.airports.hasOwnProperty(i)) {
					var data = this.$$rawdata.geoData.airports[i];

					data.IATA = i;
					data.country = geo.countries[data.countryCode];
					data.city = geo.cities[data.cityId];

					geo.airports[i] = this.$$controller.getModel('BaseStaticModel', data);
				}
			}

			// Processing segments
			for (var i = 0; i < this.$$rawdata.flights.search.request.segments.length; i++) {
				var data = this.$$rawdata.flights.search.request.segments[i],
					segment;

				// data.departureDate = 2015-04-11T00:00:00
				data.departureDate = data.departureDate ? this.$$controller.getModel('FlightsSearchForm/FlightsSearchFormDate', data.departureDate) : null;
				data.departure     = geo.airports[data.departureIATA] ? geo.airports[data.departureIATA] : null;
				data.arrival       = geo.airports[data.arrivalIATA] ? geo.airports[data.arrivalIATA] : null;
				data.index         = i;

				segment = this.$$controller.getModel('FlightsSearchForm/FlightsSearchFormSegment', data);
				this.segments.push(segment);
			}
			console.log(
				this.segments()[1].departureDate().getMonthNameShort(),
				this.segments()[1].departureDate().getMonthName(),
				this.segments()[1].departureDate().getDOWName(),
				this.segments()[1].departureDate().getDOWNameShort(),
				this.segments()[1].departureDate().dateObject()
			);

			// Processing passengers counts
			for (var i = 0; i < this.$$rawdata.flights.search.request.passengers.length; i++) {
				tmpass[this.$$rawdata.flights.search.request.passengers[i].type] = this.$$rawdata.flights.search.request.passengers[i].count;
			}

			for (var i in this.options.passengerCount) {
				if (this.options.passengerCount.hasOwnProperty(i)) {
					this.passengers[i] = ko.observable(tmpass[i] ? tmpass[i] : 0);
				}
			}

			// Processing other options
			this.tripType(this.$$rawdata.flights.search.request.parameters.searchType);
			this.directFlights(this.$$rawdata.flights.search.request.parameters.direct);
			this.vicinityDates(this.$$rawdata.flights.search.request.parameters.aroundDates);

			if (this.serviceClasses.indexOf(this.$$rawdata.flights.search.request.parameters.serviceClass) >= 0) {
				this.serviceClass(this.$$rawdata.flights.search.request.parameters.serviceClass);
			}
		};

		FlightsSearchFormController.prototype.passengerTypesOrder = ['ADT', 'CLD', 'INF', 'INS', 'YTH', 'SRC'];

		FlightsSearchFormController.prototype.$$usedModels = [
			'FlightsSearchForm/FlightsSearchFormSegment',
			'FlightsSearchForm/FlightsSearchFormDate'/*,
			'FlightsSearchForm/FlightsSearchFormGeo'*/
		];

		FlightsSearchFormController.prototype.dataURL = function () {
			return '/JSONdummies/FlightsSearchForm.json';
		};

		FlightsSearchFormController.prototype.$$i18nSegments = ['FlightsSearchForm'];

		FlightsSearchFormController.prototype.$$KOBindings = ['FlightsSearchForm'];

		return FlightsSearchFormController;
	}
);