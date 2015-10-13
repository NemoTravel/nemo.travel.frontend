'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseControllerModel', 'jsCookie'],
	function (ko, helpers, BaseControllerModel, Cookie) {
		function FlightsSearchFormController (componentParameters) {
			BaseControllerModel.apply(this, arguments);

			this.name = 'FlightsSearchFormController';

			this.delayedSearch = true;

			this.serviceClasses = ['Economy', 'Business', 'First']; //'All' class removed
			this.tripTypes = ['OW','RT','CR'];

			this.segments = ko.observableArray([]);
			this.dateRestrictions = [];

			this.passengers = ko.observable({});
			this.passengersError = ko.observable(false);
			this.passengersUseExtendedSelect = true;
			this.passengersFastSelectOptions = [];

			this.options = {};
			this.carriersLoaded = ko.observable(this.carriers !== null);
			this.additionalParameters = {
				carriers: ko.observableArray([]),
				maxPrice: ko.observable(),
				maxTransfersLength: ko.observable(false),
				maxTimeEnRoute: ko.observable(null),
				maxTimeEnRouteOptions: [null, 6, 12, 24]
			};

			this.tripType = ko.observable('OW');
			this.directFlights = ko.observable(false);
			this.vicinityDates = ko.observable(false);
			this.serviceClass = ko.observable(this.serviceClasses[0]);

			this.validaTERROR = ko.observable(false);

			// Set cookies is not an observable for when it changes it won't trigger cookie setting via this.cookieData
			this.setCookies = false;
			this.useCookies = true;
			this.mode = 'normal'; // tunesearch preinitted cookied
			this.tuneSearch = 0;
			this.preinittedData = {
				segments: [],
				passengers: {},
				serviceClass: this.serviceClass(),
				direct: this.directFlights(),
				vicinityDates: this.vicinityDates(),
				immediateSearch: false
			};

			// Search process type - popupped or immediate transition to results
			// TODO unpopupped processing - when we don't need results immediately, we just need a search id for redirection
			this.searchMode = 'popup';
			this.isSearching = ko.observable(false);
			this.searchRequest = ko.observable(false);
			this.searchError = ko.observable(false);

			this.passengersFastSelectorOpen = ko.observable(false);

			this.parametersChanged = ko.observable(false);

			this.initialParams = '';
			this.useAdditionalOptions = true;
			this.forceSelfHostNavigation = false;
			this.forceChangeToSearch = false;
			this.forceInitialTripType = false;

			this.processInitParams();

			this.additionalParameters.maxPrice.subscribe(function (newValue) {
				var tmp = parseInt(newValue);

				if (isNaN(tmp)) {
					tmp = '';
				}
				else {
					tmp = Math.min(Math.abs(tmp), 999999);
				}

				if (tmp != newValue) {
					this.additionalParameters.maxPrice(tmp);
				}
			}, this);

			this.segments.subscribe(function (newValue) {
				this.recalcDateRestrictions();
			},this);

			this.tripType.subscribe(function (newValue) {
				var segments = this.segments();

				this.$$controller.log('TripType set to', newValue);

				switch (newValue) {
					case 'OW':
						this.segments.splice(1);
						break;

					case 'RT':
						var tmpdate = null;

						// We process segments only if current segments don't look like an RT
						if (
							// Segments count != 2
							segments.length != 2 ||
							// First segment departure and no second arrival
							(segments[0].items.departure.value() && !segments[1].items.arrival.value()) ||
							// First segment arrival and no second departure
							(segments[0].items.arrival.value() && !segments[1].items.departure.value()) ||
							// Second segment departure and no first arrival
							(segments[1].items.departure.value() && !segments[0].items.arrival.value()) ||
							// Second segment arrival and no first departure
							(segments[1].items.arrival.value() && !segments[0].items.departure.value()) ||
							// Departure and arrival mismatch
							(segments[0].items.departure.value() && segments[0].items.departure.value().identifier != segments[1].items.arrival.value().identifier) ||
							(segments[1].items.departure.value() && segments[1].items.departure.value().identifier != segments[0].items.arrival.value().identifier)
						) {
							if (segments.length >= 2) {
								tmpdate = segments[1].items.departureDate.value();
							}

							if (segments.length > 1) {
								this.segments.splice(1);
							}

							this.addSegment(this.segments()[0].items.arrival.value(), this.segments()[0].items.departure.value(), tmpdate);
						}

						break;

					case 'CR':
						break;
				}
			}, this);

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
					total = 0;

				for (var i in passengers) {
					if (passengers.hasOwnProperty(i)) {
						ret[i] = {min: 0, max: 0};

						total += passengers[i]();

						if (this.passengerAdultTypes.indexOf(i) >= 0) {
							adtSum += passengers[i]();
						}

						if (this.passengerInfantTypes.indexOf(i) >= 0) {
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
				for (var i = 0; i < this.passengerInfantTypes.length; i++) {
					if (ret.hasOwnProperty(this.passengerInfantTypes[i])) {
						ret[this.passengerInfantTypes[i]].max = Math.min(adtSum, ret[this.passengerInfantTypes[i]].max);
					}
				}

				// Adults: not less than infSum
				for (var i = 0; i < this.passengerAdultTypes.length; i++) {
					if (ret.hasOwnProperty(this.passengerAdultTypes[i])) {
						ret[this.passengerAdultTypes[i]].min = Math.max(
							0,
							passengers[this.passengerAdultTypes[i]]() - adtSum + infSum,
							ret[this.passengerAdultTypes[i]].min
						);
					}
				}

				return ret;
			}, this);

			this.isValid = ko.computed(function () {
				var segments = this.segments(),
					ret = true,
					prevDate,
					passengers = this.passengers(),
					totalPassengers = 0,
					adtPassengers = 0;

				// Checking passengers
				for (var i in passengers) {
					if (passengers.hasOwnProperty(i)) {
						totalPassengers += passengers[i]();

						if (this.passengerAdultTypes.indexOf(i) >= 0) {
							adtPassengers += passengers[i]();
						}
					}
				}

				if (totalPassengers == 0) {
					ret = false;
					this.passengersError('noPassengers');
				}
				else if (adtPassengers == 0) {
					ret = false;
					this.passengersError('noAdults');
				}
				else {
					this.passengersError(false);
				}

				if (segments.length) {
					for (var i = 0; i < segments.length; i++) {
						if (segments[i].items.departureDate.value()) {
							if (prevDate && segments[i].items.departureDate.value().dateObject() < prevDate) {
								segments[i].items.departureDate.error('notInOrder');
								ret = false;
							}
							else if (i + 1 == segments.length && segments[i].items.departureDate.value().dateObject() > this.options.dateOptions.maxDate) {
								segments[i].items.departureDate.error('tooLate');
								ret = false;
							}
							else if (i == 0 && segments[i].items.departureDate.value().dateObject() < this.options.dateOptions.minDate) {
								segments[i].items.departureDate.error('tooEraly');
								ret = false;
							}
							else {
								segments[i].items.departureDate.error(null);
							}

							prevDate = segments[i].items.departureDate.value().dateObject();
						}

						for (var j in segments[i].items) {
							if (segments[i].items.hasOwnProperty(j) && segments[i].items[j].error()) {
								ret = false;
							}
						}
					}
				}
				else {
					ret = false;
				}

				return ret;
			}, this);

			this.cookieData = ko.computed(function () {
				var ret = {
						segments: [],
						passengers: {},
						serviceClass: this.serviceClass(),
						direct: this.directFlights(),
						vicinityDates: this.vicinityDates()
					},
					segments = this.segments(),
					passengers = this.passengers();

				// Segments
				for (var i = 0; i < segments.length; i++) {
					ret.segments.push(
						[
							segments[i].items.departure.value() ? segments[i].items.departure.value().IATA : null,
							segments[i].items.arrival.value() ? segments[i].items.arrival.value().IATA : null,
							segments[i].items.departureDate.value() ? segments[i].items.departureDate.value().getISODate() : null,
							segments[i].items.departure.value() ? segments[i].items.departure.value().isCity : null,
							segments[i].items.arrival.value() ? segments[i].items.arrival.value().isCity : null
						]
					);
				}

				// Passengers
				for (var i in passengers) {
					if (passengers.hasOwnProperty(i)) {
						ret.passengers[i] = passengers[i]();
					}
				}

				return ret;
			}, this);

			this.searchAllowedByParamChange = ko.computed (function () {
				return this.parametersChanged() || !this.forceChangeToSearch;
			}, this);

			this.searchEnabled = ko.computed (function () {
				return (!this.validaTERROR() || this.isValid()) && this.searchAllowedByParamChange();
			}, this);

			this.cookieData.subscribe(function (newValue) {
				if (this.useCookies && this.setCookies) {
					this.$$controller.log('WRITING COOKIE', this.getCookieName(), newValue);

					Cookie.set(this.getCookieName(), newValue, { expires: 365 });
				}
				else {
					this.$$controller.log('COOKIE NOT ENABED YET', this.getCookieName(), newValue);
				}
			}, this);

			this.URLParams = ko.computed(function () {
				var urlAdder = '',
					segments = this.segments(),
					passengers = this.passengers(),
					tmp;

				if (this.tripType() == 'RT') {
					urlAdder +=
						(segments[0].items.departure.value() ? (segments[0].items.departure.value().isCity ? 'c' : 'a') + segments[0].items.departure.value().IATA : '###') +
						(segments[0].items.arrival.value() ? (segments[0].items.arrival.value().isCity ? 'c' : 'a') + segments[0].items.arrival.value().IATA : '###') +
						(segments[0].items.departureDate.value() ? segments[0].items.departureDate.value().dropTime().getISODate().replace(/-/g, '') : '########') +
						(segments[1].items.departureDate.value() ? segments[1].items.departureDate.value().dropTime().getISODate().replace(/-/g, '') : '########');
				}
				else {
					for (var i = 0; i < segments.length; i++) {
						urlAdder +=
							(segments[i].items.departure.value() ? (segments[i].items.departure.value().isCity ? 'c' : 'a') + segments[i].items.departure.value().IATA : '###') +
							(segments[i].items.arrival.value() ? (segments[i].items.arrival.value().isCity ? 'c' : 'a') + segments[i].items.arrival.value().IATA : '###') +
							(segments[i].items.departureDate.value() ? segments[i].items.departureDate.value().dropTime().getISODate().replace(/-/g, '') : '########');
					}
				}

				for (var i in passengers) {
					if (passengers.hasOwnProperty(i) && passengers[i]() > 0) {
						urlAdder += i+passengers[i]();
					}
				}

				urlAdder += '-class=' + this.serviceClass();

				if (this.directFlights()) {
					urlAdder += '-direct';
				}

				if (this.vicinityDates() && this.tripType() != 'CR') {
					urlAdder += '-vicinityDates='+this.options.dateOptions.aroundDatesValues[this.options.dateOptions.aroundDatesValues.length - 1];
				}

				// Additional parameters
				if (this.additionalParameters.maxPrice()) {
					urlAdder += '-PMaxPrice=' + this.additionalParameters.maxPrice() + this.$$controller.viewModel.agency.currency();
				}

				if (this.additionalParameters.maxTimeEnRoute()) {
					urlAdder += '-PMaxTimeEnRoute=' + this.additionalParameters.maxTimeEnRoute();
				}

				if (!this.directFlights() && this.additionalParameters.maxTransfersLength()) {
					urlAdder += '-PMaxTransfersLength=2';
				}


				tmp = this.additionalParameters.carriers();
				if (tmp.length) {
					urlAdder += '-PCarriers=';

					for (var i = 0; i < tmp.length; i++) {
						urlAdder += tmp[i].IATA;
					}
				}

				this.parametersChanged(this.initialParams != urlAdder);

				return urlAdder;
			}, this);
		}

		// Extending from dictionaryModel
		helpers.extendModel(FlightsSearchFormController, [BaseControllerModel]);

		// Inheritance override
		FlightsSearchFormController.prototype.cookieName           = 'FlightsSearchForm';
		FlightsSearchFormController.prototype.passengerTypesOrder  = ['ADT', 'CLD', 'INF', 'INS', 'YTH', 'SRC'];
		FlightsSearchFormController.prototype.passengerAdultTypes  = ['ADT', 'YTH', 'SRC'];
		FlightsSearchFormController.prototype.passengerInfantTypes = ['INF', 'INS'];
		FlightsSearchFormController.prototype.$$i18nSegments       = ['FlightsSearchForm'];
		FlightsSearchFormController.prototype.$$KOBindings         = ['FlightsSearchForm'];

		FlightsSearchFormController.prototype.openPassengersSelector = function () {
			if (
				this.passengersUseExtendedSelect
				||
				this.passengersFastSelectOptions.length != 0
			) {
				this.passengersFastSelectorOpen(!this.passengersFastSelectorOpen());
			}
		};

		FlightsSearchFormController.prototype.passengersTextForFastSelect = function (index) {
			var source = this.passengersFastSelectOptions[index].set,
				ret = [],
				tmp = '';

			for (var i = 0; i < this.passengerTypesOrder.length; i++) {
				if (source.hasOwnProperty(this.passengerTypesOrder[i]) && source[this.passengerTypesOrder[i]] > 0) {
					ret.push(source[this.passengerTypesOrder[i]] + ' ' + this.$$controller.i18n('FlightsSearchForm','passSummary_numeral_' + this.passengerTypesOrder[i] + '_' + helpers.getNumeral(source[this.passengerTypesOrder[i]], 'one', 'twoToFour', 'fourPlus')));
				}
			}

			return helpers.smartJoin(
				ret,
				', ',
				(this.$$controller.i18n('FlightsSearchForm','passSummary_fastSelect_lastConjunction')[0] == ',' ? '' : ' ') +
					this.$$controller.i18n('FlightsSearchForm','passSummary_fastSelect_lastConjunction') +
					' '
			);
		};

		FlightsSearchFormController.prototype.passengersSelectFast = function (index) {
			var passengers = this.passengers(),
				tmp = [];

			// Clearing passengers count
			for (var i in passengers) {
				if (passengers.hasOwnProperty(i)) {
					passengers[i](0);
				}
			}

			this.passengers(passengers);

			this.fillPreInittedPassengers(this.passengerAdultTypes, this.passengersFastSelectOptions[index].set);
			this.fillPreInittedPassengers(this.passengerInfantTypes, this.passengersFastSelectOptions[index].set);

			// Types that are not ADT/INF
			for (var i = 0; i < this.passengerTypesOrder.length; i++) {
				if (
					this.passengerAdultTypes.indexOf(this.passengerTypesOrder[i]) < 0 &&
					this.passengerInfantTypes.indexOf(this.passengerTypesOrder[i]) < 0
				) {
					tmp.push(this.passengerTypesOrder[i]);
				}
			}

			this.fillPreInittedPassengers(tmp, this.passengersFastSelectOptions[index].set);
		};

		// Additional stuff
		// RegExps for params parsing
		FlightsSearchFormController.prototype.paramsParsers = {
			segs: /([A-Z]{3})([A-Z]{3})(\d{8})/g,
			passengers: /([A-Z]{3})(\d+)/g
		};

		FlightsSearchFormController.prototype.getCookieName = function () {
			return this.$$controller.options.cookiesPrefix + this.cookieName;
		};

		FlightsSearchFormController.prototype.processInitParams = function () {
			if (typeof this.$$componentParameters.additional != 'undefined') {
				if ('delayed' in this.$$componentParameters.additional) {
					this.delayedSearch = !!this.$$componentParameters.additional.delayed;
				}

				if ('useAdditionalOptions' in this.$$componentParameters.additional) {
					this.useAdditionalOptions = !!this.$$componentParameters.additional.useAdditionalOptions;
				}

				if ('forceSelfHostNavigation' in this.$$componentParameters.additional) {
					this.forceSelfHostNavigation = !!this.$$componentParameters.additional.forceSelfHostNavigation;
				}

				if ('forceChangeToSearch' in this.$$componentParameters.additional) {
					this.forceChangeToSearch = !!this.$$componentParameters.additional.forceChangeToSearch;
				}

				if ('disableCookies' in this.$$componentParameters.additional) {
					this.useCookies = !this.$$componentParameters.additional.disableCookies;
				}

				if (
					'disableRouteTypes' in this.$$componentParameters.additional &&
					this.$$componentParameters.additional.disableRouteTypes instanceof Array &&
					this.$$componentParameters.additional.disableRouteTypes.length > 0
				) {
					for (var i = 0; i < this.$$componentParameters.additional.disableRouteTypes.length; i++) {
						var tmp = this.tripTypes.indexOf(this.$$componentParameters.additional.disableRouteTypes[i]);

						if (tmp >= 0 && this.tripTypes.length > 0) {
							this.tripTypes.splice(tmp, 1);
						}
					}
				}

				if ('forceInitialTripType' in this.$$componentParameters.additional && this.tripTypes.indexOf(this.$$componentParameters.additional.forceInitialTripType) >= 0) {
					this.forceInitialTripType = this.$$componentParameters.additional.forceInitialTripType;
				}
			}

			// Analyzing parameters
			// Preinitted by formData
			if (this.$$componentParameters.formData) {
				this.useCookies = false;
				this.$$rawdata = helpers.cloneObject(this.$$componentParameters.formData);
			}

			// Preinitted by controller params
			else if (this.$$componentParameters.additional && this.$$componentParameters.additional.init) {
				this.$$controller.log('Initted by component additional parameters', this.$$componentParameters.additional.init);
				this.$$controller.log('Cookies disabled');
				this.preinittedData = this.$$componentParameters.additional.init;
				this.mode = 'preinitted';
				this.useCookies = false;
			}
			// Tunesearch
			else if (this.$$componentParameters.route.length == 1 && parseInt(this.$$componentParameters.route[0]) > 0) {
				this.tuneSearch = parseInt(this.$$componentParameters.route[0]);

				if (!isNaN(this.tuneSearch)) {
					this.mode = 'tunesearch';
				}
			}
			// Preinitted by URL
			else if (this.$$componentParameters.route.length == 3) {
				var t;

				// Parsing segments
				while (t = this.paramsParsers.segs.exec(this.$$componentParameters.route[0])) {
					t.shift();

					// Processing date
					t[2] = t[2].substr(0,4) + '-' + t[2].substr(4,2) + '-' + t[2].substr(6);

					// If we're preinitted by URL - IATAs mean cities first
					t.push(true);
					t.push(true);

					this.preinittedData.segments.push(t);
				}

				// Parsing passengers
				while (t = this.paramsParsers.passengers.exec(this.$$componentParameters.route[1])) {
					this.preinittedData.passengers[t[1]] = parseInt(t[2]);
				}

				this.mode = 'preinitted';

				// Other params
				if (this.$$componentParameters.route[2]) {
					this.$$componentParameters.route[2] = this.$$componentParameters.route[2].split('-');

					for (var i = 0; i < this.$$componentParameters.route[2].length; i++) {
						// Direct flights flag
						if (this.$$componentParameters.route[2][i] == 'direct') {
							this.preinittedData.direct = true;
						}

						// Vicinity dates flag
						if (this.$$componentParameters.route[2][i] == 'vicinityDates') {
							this.preinittedData.vicinityDates = true;
						}

						// Immediate search start
						if (this.$$componentParameters.route[2][i] == 'GO') {
							this.preinittedData.immediateSearch = true;
						}

						// Class
						if (this.$$componentParameters.route[2][i].substr(0, 6) == 'class=') {
							t = this.$$componentParameters.route[2][i].substr(6);

							if (this.serviceClasses.indexOf(t) >= 0) {
								this.preinittedData.serviceClass = t;
							}
						}
					}
				}
			}
			// Preinitted by cookie
			else if (this.useCookies) {
				var cookie = Cookie.getJSON(this.getCookieName());

				// Checking cookie validity and fixing that
				if (cookie && cookie.passengers && cookie.segments && cookie.segments instanceof Array && cookie.segments.length > 0) {
					this.$$controller.log('Initted by cookie', cookie);
					this.preinittedData = cookie;
					this.mode = 'preinitted';
				}
			}
		};

		FlightsSearchFormController.prototype.recalcDateRestrictions = function () {
			var segments = this.segments(),
				prevdate,
				nextdate;

			this.dateRestrictions = [];

			for (var i = 0; i < segments.length; i++) {
				prevdate = this.options.dateOptions.minDate;
				nextdate = null;

				for (var j = 0; j < segments.length; j++) {
					if (j < i && segments[j].items.departureDate.value()) {
						if (!prevdate || prevdate < segments[j].items.departureDate.value().dateObject()) {
							prevdate = segments[j].items.departureDate.value().dateObject();
						}
					}
					else if (j > i && segments[j].items.departureDate.value() && !nextdate) {
						nextdate = segments[j].items.departureDate.value().dateObject();
					}
				}

				if (!nextdate || prevdate > nextdate) {
					nextdate = this.options.dateOptions.maxDate;
				}

				this.dateRestrictions.push([prevdate, nextdate]);
			}
		};

		FlightsSearchFormController.prototype.getSegmentDateParameters = function (dateObj, index) {
			var ret = {
					disabled: this.dateRestrictions[index][0] > dateObj || this.dateRestrictions[index][1] < dateObj,
					segments: [],
					period: false
				},
				segments = this.segments();

			for (var i = 0; i < segments.length; i++) {
				if (segments[i].items.departureDate.value() && dateObj.getTime() == segments[i].items.departureDate.value().dateObject().getTime()) {
					ret.segments.push(i);
				}

				if (
					i > 0 &&
					segments[i-1].items.departureDate.value() &&
					segments[i].items.departureDate.value() &&
					dateObj.getTime() > segments[i-1].items.departureDate.value().dateObject().getTime() &&
					dateObj.getTime() < segments[i].items.departureDate.value().dateObject().getTime()
				) {
					ret.period = true;
				}
			}

			return ret;
		};

		FlightsSearchFormController.prototype.segmentGeoChanged = function (segment, geo) {
			if (this.tripType() == 'RT' && segment.index == 0) {
				var targetSeg = this.segments()[1];

				targetSeg.items[geo == 'arrival' ? 'departure' : 'arrival'].value(segment.items[geo].value());
			}
		};

		FlightsSearchFormController.prototype.processValidation = function () {
			var segments;

			if (this.validaTERROR()) {
				segments = this.segments();

				for (var i = 0; i < segments.length; i++) {
					for (var j in segments[i].items) {
						if (
							segments[i].items.hasOwnProperty(j) &&
							segments[i].items[j].error()
						) {
							segments[i].items[j].focus(true);
							return;
						}
					}
				}
			}
		};

		FlightsSearchFormController.prototype.goToResults = function (id) {
			var urlAdder = this.URLParams();

			if (
				this.forceSelfHostNavigation ||
				this.$$controller.options.dataURL.indexOf('/') === 0 ||
				this.$$controller.options.dataURL.indexOf(document.location.protocol + '//' + document.location.host) === 0
			) {
				this.$$controller.navigate('results/' + (id ? id + '/' : '') + urlAdder, true, 'FlightsResults');
			}
			else {
				document.location = this.$$controller.options.dataURL.split('/').splice(0, 3).join('/') + '/results/' + (id ? id + '/' : '') + urlAdder;
			}
		};

		FlightsSearchFormController.prototype.startSearch = function () {
			function searchError (message, systemData) {
				if (typeof systemData != 'undefined' && systemData[0] !== 0) {
					self.$$controller.error('SEARCH ERROR: '+message, systemData);
				}

				if (typeof systemData == 'undefined' || systemData[0] !== 0) {
					self.searchError(self.$$controller.i18n('FlightsSearchForm', 'searchError_' + message));
				}

				self.isSearching(false);
			}

			// @CRUTCH ignoring empty segments in CR
			var segments = this.segments(),
				emptySegments = [];

			if (!this.searchAllowedByParamChange()) {
				this.parametersChanged(true);
				this.parametersChanged(false);
				return;
			}

			if (this.tripType() == 'CR') {
				for (var i = 0; i < segments.length; i++) {
					var isEmpty = true;

					for (var j in segments[i].items) {
						if (segments[i].items.hasOwnProperty(j) && segments[i].items[j].value()) {
							isEmpty = false;
							break;
						}
					}

					if (isEmpty) {
						emptySegments.push(i);
					}
				}

				if (emptySegments.length < segments.length) {
					var tmp = [];

					for (var i = 0; i < segments.length; i++) {
						if (emptySegments.indexOf(i) < 0) {
							segments[i].index = tmp.length;
							tmp.push(segments[i]);
						}
					}

					this.segments(tmp);
				}
			}
			// @CRUTCH RT with no second segment's date set -> OW
			else if (this.tripType() == 'RT' && !this.segments()[1].items.departureDate.value()) {
				this.tripType('OW');
			}

			this.searchError(false);

			if (!this.isValid()) {
				this.validaTERROR(true);
				this.processValidation();
			}
			else if (this.delayedSearch && this.$$controller.navigateGetPushStateSupport()) {
				this.goToResults();
			}
			else {
				var self = this,
				passengers = this.passengers(),
				params = {
						segments: [],
						passengers: [],
						parameters: {
							direct: this.directFlights(),
							aroundDates: this.vicinityDates() ? this.options.dateOptions.aroundDatesValues[this.options.dateOptions.aroundDatesValues.length - 1] : 0,
							serviceClass: this.serviceClass(),
							airlines: []/*,
							delayed: this.delayedSearch*/
						}
					};

				// Constructing params
				for (var i = 0; i < segments.length; i++) {
					params.segments.push({
						departure: {
							IATA: segments[i].items.departure.value().IATA,
							isCity: segments[i].items.departure.value().isCity
						},
						arrival: {
							IATA: segments[i].items.arrival.value().IATA,
							isCity: segments[i].items.arrival.value().isCity
						},
						// @CRUTCH - ignore missing date of second leg on RT
						departureDate: segments[i].items.departureDate.value() ? segments[i].items.departureDate.value().dropTime().getISODateTime() : null
					});
				}

				for (var i in passengers) {
					if (passengers.hasOwnProperty(i)) {
						params.passengers.push({
							type: i,
							count: passengers[i]()
						});
					}
				}

				this.$$controller.log('STARTING SEARCH');
				this.isSearching(true);

				self.searchError(false);

				this.searchRequest(
					this.$$controller.loadData(
						'/flights/search/request',
						{request: JSON.stringify(params)},
						function (text, request) {
							var response;

							try {
								response = JSON.parse(text);

								// Checking for errors
								if (!response.system || !response.system.error) {
									// Empty results check (automatically passed if we have a delayed search)
									if (
										self.delayedSearch ||
										!response.flights.search.results.info.errorCode
									) {
										self.goToResults(response.flights.search.request.id);
									}
									else {
										searchError('emptyResult');
									}
								}
								else {
									searchError('systemError', response.system.error);
								}
							}
							catch (e) {
								searchError('brokenJSON', text);
							}
						},
						function (request) {
							searchError('requestFailed', [request.status, request.statusText]);
						}
					)
				);
			}
		};

		FlightsSearchFormController.prototype.abortSearch = function () {
			if (this.isSearching()) {
				this.isSearching(false);
				this.searchRequest().abort();
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

			return ret;
		};

		FlightsSearchFormController.prototype.fillPreInittedPassengers = function (typesList, source) {
			var tmp;

			for (var i = 0; i < typesList.length; i++) {
				tmp = this.passengersRestrictions()[typesList[i]];
				if (tmp && source[typesList[i]]) {
					if (source[typesList[i]] > tmp.max) {
						source[typesList[i]] = tmp.max;
					}
					else if (source[typesList[i]] < tmp.min) {
						source[typesList[i]] = tmp.min;
					}

					this.setPassengers(typesList[i], source[typesList[i]]);
				}
			}
		};

		FlightsSearchFormController.prototype.buildModels = function () {
			var geo = {
					cities: {},
					countries: {},
					airports: {}
				},
				tmpass = {},
				today = new Date(),
				self = this;

			// Checking for errors
			if (this.$$rawdata.system && this.$$rawdata.system.error) {
				this.$$error(this.$$rawdata.system.error.message);
				return;
			}

			// Processing options
			// Passengers maximums
			this.options = this.$$rawdata.flights.search.formData.maxLimits;
			this.options.totalPassengers = parseInt(this.options.totalPassengers);

			// Processing fast and full passengers selection
			this.passengersUseExtendedSelect = this.$$rawdata.flights.search.formData.passengersSelect.extendedPassengersSelect;
			this.passengersFastSelectOptions = this.$$rawdata.flights.search.formData.passengersSelect.fastPassengersSelect;

			// Date options
			this.options.dateOptions = this.$$rawdata.flights.search.formData.dateOptions;
			today.setHours(0,0,0,0);
			this.options.dateOptions.minDate = new Date(today);
			this.options.dateOptions.minDate.setDate(this.options.dateOptions.minDate.getDate() + this.options.dateOptions.minOffset);
			this.options.dateOptions.maxDate = new Date(today);
			this.options.dateOptions.maxDate.setDate(this.options.dateOptions.maxDate.getDate() + this.options.dateOptions.maxOffset);

			// Processing segments
			if (this.mode == 'preinitted') {
				var tmp;

				for (var i = 0; i < this.preinittedData.segments.length; i++) {
					var depdata = null,
						arrdata = null;

					if (this.preinittedData.segments[i][0]) {
						depdata = this.$$controller.getModel('Flights/Common/Geo', {
							data: {
								IATA: this.preinittedData.segments[i][0],
								isCity: this.preinittedData.segments[i][3],
								cityID: 0
							},
							guide: this.$$rawdata.guide
						});
					}

					if (this.preinittedData.segments[i][1]) {
						arrdata = this.$$controller.getModel('Flights/Common/Geo', {
							data: {
								IATA: this.preinittedData.segments[i][1],
								isCity: this.preinittedData.segments[i][4],
								cityID: 0
							},
							guide: this.$$rawdata.guide
						});
					}

					this.addSegment(
						depdata,
						arrdata,
						this.preinittedData.segments[i][2] ? this.$$controller.getModel('Common/Date', this.preinittedData.segments[i][2]) : null
					);
				}

				// Detecting tripType
				if (this.forceInitialTripType) {
					this.tripType(this.forceInitialTripType);
				}
				else if (this.preinittedData.segments.length == 1) {
					this.tripType('OW');
				}
				else if (
					// Checking segments count
					this.preinittedData.segments.length == 2 &&

					// Checking IATAs
					this.preinittedData.segments[0][0] == this.preinittedData.segments[1][1] &&
					this.preinittedData.segments[0][1] == this.preinittedData.segments[1][0] &&

					// Checking city flags
					this.preinittedData.segments[0][3] == this.preinittedData.segments[1][4] &&
					this.preinittedData.segments[0][4] == this.preinittedData.segments[1][3]
				) {
					this.tripType('RT');
				}
				else {
					this.tripType('CR');
				}

				// Setting other options
				this.directFlights(this.preinittedData.direct);
				this.vicinityDates(this.preinittedData.vicinityDates);
				this.serviceClass(this.preinittedData.serviceClass);
			}
			else {
				for (var i = 0; i < this.$$rawdata.flights.search.request.segments.length; i++) {
					var data = this.$$rawdata.flights.search.request.segments[i];
					// departureDate = 2015-04-11T00:00:00
					this.addSegment(
						data.departure ? this.$$controller.getModel('Flights/Common/Geo', {data: data.departure, guide: this.$$rawdata.guide}) : null,
						data.arrival ? this.$$controller.getModel('Flights/Common/Geo', {data: data.arrival, guide: this.$$rawdata.guide}) : null,
						data.departureDate ? this.$$controller.getModel('Common/Date', data.departureDate) : null
					);
				}

				// Processing other options
				this.directFlights(this.$$rawdata.flights.search.request.parameters.direct);
				this.vicinityDates(this.$$rawdata.flights.search.request.parameters.aroundDates != 0);

				if (this.serviceClasses.indexOf(this.$$rawdata.flights.search.request.parameters.serviceClass) >= 0) {
					this.serviceClass(this.$$rawdata.flights.search.request.parameters.serviceClass);
				}

				if (this.forceInitialTripType) {
					this.tripType(this.forceInitialTripType);
				}
				else {
					this.tripType(this.$$rawdata.flights.search.request.parameters.searchType);
				}
			}

			// Passengers
			// Processing passengers counts
			var usePreInittedPassengers = this.mode == 'preinitted' && Object.keys(this.preinittedData.passengers).length > 0;
			for (var i = 0; i < this.$$rawdata.flights.search.request.passengers.length; i++) {
				tmpass[this.$$rawdata.flights.search.request.passengers[i].type] = this.$$rawdata.flights.search.request.passengers[i].count;
			}

			for (var i in this.options.passengerCount) {
				if (this.options.passengerCount.hasOwnProperty(i)) {
					// If we use preInitted passengers - we don't need to set innitial couunt
					tmpass[i] = ko.observable(tmpass[i] && !usePreInittedPassengers ? tmpass[i] : 0);
				}
			}

			this.passengers(tmpass);

			// We take preInitted if we have to and there is data regarding that.
			// If not - standart processing by formData from server
			if (usePreInittedPassengers) {
				this.fillPreInittedPassengers(this.passengerAdultTypes, this.preinittedData.passengers);
				this.fillPreInittedPassengers(this.passengerInfantTypes, this.preinittedData.passengers);

				// Types that are not ADT/INF
				tmp = [];

				for (var i = 0; i < this.passengerTypesOrder.length; i++) {
					if (
						this.passengerAdultTypes.indexOf(this.passengerTypesOrder[i]) < 0 &&
						this.passengerInfantTypes.indexOf(this.passengerTypesOrder[i]) < 0
					) {
						tmp.push(this.passengerTypesOrder[i]);
					}
				}

				this.fillPreInittedPassengers(tmp, this.preinittedData.passengers);
			}

			// All changes from now on will go to cookie
			this.setCookies = true;

			this.initialParams = this.URLParams();
			this.parametersChanged(false);

			// All seems OK - starting search if needed
			if (this.mode == 'preinitted' && this.preinittedData.immediateSearch) {
				this.$$loading(false);
				this.startSearch();
			}
			else {
				// Loading airlines
				if (!this.carriersLoaded()) {
					this.$$controller.loadData(
						'/guide/airlines/all',
						{},
						function (text, request) {
							try {
								var tmp = JSON.parse(text);

								if (tmp.guide && tmp.guide.airlines) {
									for (var i in tmp.guide.airlines) {
										if (tmp.guide.airlines.hasOwnProperty(i)) {
											if (FlightsSearchFormController.prototype.carriers === null) {
												FlightsSearchFormController.prototype.carriers = [];
											}

											FlightsSearchFormController.prototype.carriers.push(self.$$controller.getModel('Flights/Common/Airline', tmp.guide.airlines[i]));
										}
									}

									self.carriersLoaded(true);
								}
								else {
									self.$$controller.warn('Can not load carriers list, wrong data');
								}
							}
							catch (e) {
								self.$$controller.warn(e);
							}
						},
						function () {
							self.$$controller.warn('Can not load carriers list');
						}
					);
				}
			}
		};

		FlightsSearchFormController.prototype.addSegment = function (departure, arrival, departureDate) {
			this.segments.push(
				this.$$controller.getModel(
					'Flights/SearchForm/Segment',
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

		FlightsSearchFormController.prototype.$$usedModels = [
			'Flights/SearchForm/Segment',
			'Common/Date',
			'Flights/Common/Geo',
			'Flights/Common/Airline'
		];

		FlightsSearchFormController.prototype.dataURL = function () {
			var ret = '/flights/search/formData/';

			if (this.mode == 'tunesearch') {
				ret += this.tuneSearch;
			}

			if (this.$$rawdata) {
				return '';
			}

			return ret;
		};

		FlightsSearchFormController.prototype.dataPOSTParameters = function () {
			var ret = {},
				tmp = {};

			if (this.mode == 'preinitted') {
				for (var i = 0; i < this.preinittedData.segments.length; i++) {
					tmp[this.preinittedData.segments[i][0]] = this.preinittedData.segments[i][0];
					tmp[this.preinittedData.segments[i][1]] = this.preinittedData.segments[i][1];
				}

				ret.resources = {};

				Object.keys(tmp).map(function (n) {
					ret.resources["guide/airports/" + n] = {};
					ret.resources["guide/cities/"+n] = {};
				});

				ret.resources = JSON.stringify(ret.resources);
			}

			return ret;
		};

		FlightsSearchFormController.prototype.pageTitle = 'FlightsSearch';

		FlightsSearchFormController.prototype.carriers = null;

		return FlightsSearchFormController;
	}
);