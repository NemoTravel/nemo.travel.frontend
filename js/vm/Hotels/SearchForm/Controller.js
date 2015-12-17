'use strict';
define(['knockout', 'js/vm/helpers', 'js/vm/BaseControllerModel', 'jsCookie'],
       function (ko, helpers, BaseControllerModel, Cookie) {
	       function HotelsSearchFormController (componentParameters) {
		       BaseControllerModel.apply(this, arguments);

		       this.name = 'HotelsSearchFormController';

		       this.maxInfants = 4;

		       this.delayedSearch = true;
		       this.searchError = ko.observable(false);
		       this.segments = ko.observableArray([]);
		       this.roomsFastSelectOptions = [];
		       this.rooms = ko.observableArray();
		       this.infantsAges = [];
		       this.datesUnknown = ko.observable(false);
		       this.options = {};
		       this.validaTERROR = ko.observable(false);
		       // Set cookies is not an observable for when it changes it won't trigger cookie setting via
		       // this.cookieData
		       this.setCookies = false;
		       this.useCookies = true;
		       this.mode = 'normal'; // tunesearch preinitted cookied
		       this.tuneSearch = 0;
		       this.searchMode = 'popup';
		       this.isSearching = ko.observable(false);
		       this.roomsFastSelectorOpen = ko.observable(false);
		       this.parametersChanged = ko.observable(false);
		       this.initialParams = '';

		       this.searchAllowedByParamChange = ko.computed (function () {
			       return this.parametersChanged() || !this.forceChangeToSearch;
		       }, this);

		       this.searchEnabled = ko.computed (function () {
			       return (!this.validaTERROR() || this.isValid()) && this.searchAllowedByParamChange();
		       }, this);

		       this.processInitParams();

		       this.segments.subscribe(function (newValue) {
			       this.recalcDateRestrictions();
		       }, this);

		       this.guestsSummary = ko.computed(function () {
			       var guest = {
							adults  : 0,
							infants : 0
			           },
			           rooms = this.rooms(),
			           result = '';

			       if (!rooms.length) {
				       return result;
			       }

			       for (var i in rooms) {
				       if (rooms.hasOwnProperty(i)) {
					       var room      = rooms[i];
					       guest.adults  += room.adults();
					       guest.infants += room.infants().length;
				       }
			       }

			       result = guest.adults +
			                ' ' +
		                    this.$$controller.i18n(
			                    'HotelsSearchForm',
			                    'passSummary_numeral_ADT_' + helpers.getNumeral(
																		guest.adults,
																			'one',
																			'twoToFour',
																			'fourPlus'
																		)
		                    );

			       if (guest.infants == 0 && guest.adults == 1) {
				       return result;
			       }

			       if (guest.infants > 0) {
				       result += ', ' +
				                 guest.infants +
								 ' ' +
                                 this.$$controller.i18n('HotelsSearchForm',
                                                         'passSummary_numeral_CLD_' + helpers.getNumeral(
																								guest.infants,
																									'one',
																									'twoToFour',
																									'fourPlus'
																								)
                                 );
			       }
			       result += ' ' +
			                 this.$$controller.i18n(
				                 'HotelsSearchForm',
				                 'hotels_in'
			                 ) +
							 ' ' +
			                 rooms.length +
			                 ' ' +
			                 this.$$controller.i18n(
				                 'HotelsSearchForm',
				                 'hotels_in_room_' + helpers.getNumeral(
																rooms.length,
																	'one',
																	'more',
																	'more'
																)
			                 );

			       return result;
		       }, this);

		       this.isValid = ko.computed(function () {
			       var segments = this.segments(),
			           result = true;

			       if (segments.length) {
				       result = segments[0].items.arrival.error() ||
				                segments[0].items.departureDate.error() ||
				                segments[0].items.arrivalDate.error();
			       }

			       return !result;
		       }, this);

		       this.cookieData = ko.computed(function () {
			       var ret = {
					       segments: [], rooms: [], datesUnknown: this.datesUnknown()
				       },
			           segments = this.segments(),
			           rooms = this.rooms();

			       // Segments
			       for (var i = 0; i < segments.length; i++) {
				       ret.segments.push([
                            segments[i].items.arrival.value() ? segments[i].items.arrival.value().t : null,
                            segments[i].items.arrival.value() ? segments[i].items.arrival.value().id : null,
                            segments[i].items.arrivalDate.value() ? segments[i].items.arrivalDate.value().getISODate() : null,
                            segments[i].items.departureDate.value() ? segments[i].items.departureDate.value().getISODate() : null]);
			       }

			       // Rooms
			       for (i in rooms) {
				       if (rooms.hasOwnProperty(i)) {
					       var room = {
						       adults: rooms[i].adults(),
						       infants: rooms[i].infants()
					       };

					       ret.rooms.push(room);
				       }
			       }

			       return ret;
		       }, this);

		       this.cookieData.subscribe(function (newValue) {
			       if (this.useCookies &&
			           this.setCookies
			       ) {
				       this.$$controller.log(
					       'WRITING COOKIE',
					       this.getCookieName(),
					       newValue
				       );

				       Cookie.set(
					       this.getCookieName(),
					       newValue,
					       {
						       expires: 365
					       }
				       );
			       }
			       else {
				       this.$$controller.log(
					       'COOKIE NOT ENABED YET',
					       this.getCookieName(),
					       newValue
				       );
			       }
		       }, this);
	       }

	       // Extending from dictionaryModel
	       helpers.extendModel(HotelsSearchFormController, [BaseControllerModel]);
	       // Inheritance override
	       HotelsSearchFormController.prototype.cookieName = 'HotelsSearchForm';
	       // TODO: Fix when will be ready api
	       HotelsSearchFormController.prototype.$$i18nSegments = ['HotelsSearchForm'];
	       HotelsSearchFormController.prototype.$$KOBindings = ['HotelsSearchForm'];
	       HotelsSearchFormController.prototype.openRoomsSelector = function () {
		       if (this.roomsUseExtendedSelect ||
		           this.roomsFastSelectOptions.length != 0
		       ) {
			       this.roomsFastSelectorOpen(!this.roomsFastSelectorOpen());
		       }
	       };
	       HotelsSearchFormController.prototype.roomsTextForFastSelect = function (index) {
		       var rooms = this.roomsFastSelectOptions[index].rooms,
		           adults = this.roomsFastSelectOptions[index].adults,
		           result = '';

		       result = adults +
		                ' ' +
	                    this.$$controller.i18n(
		                    'HotelsSearchForm',
		                    'passSummary_numeral_ADT_' + helpers.getNumeral(
																	adults,
																	'one',
																	'twoToFour',
																	'fourPlus'
																)
	                    );
		       if (rooms && adults > 1) {
			       result += ' ' +
			                 this.$$controller.i18n(
				                 'HotelsSearchForm',
				                 'hotels_in'
			                 ) +
                             ' ' +
		                     rooms +
	                         ' ' +
			                 this.$$controller.i18n(
				                 'HotelsSearchForm',
				                 'hotels_in_room_' + helpers.getNumeral(
												                 rooms,
												                 'one',
												                 'more',
												                 'more'
											                 )
			                 );
		       }

		       return result;
	       };
	       HotelsSearchFormController.prototype.roomsSelectFast = function (index) {
		       var rooms = this.rooms(),
		           tmp = [];

		       rooms = [];
		       if (this.roomsFastSelectOptions[index].rooms == 1) {
			       rooms.push(
				       {
						  adults : ko.observable(this.roomsFastSelectOptions[index].adults),
						  infants: ko.observableArray([])
				       }
			       );
		       }
		       else {
			       var countRooms = this.roomsFastSelectOptions[index].rooms;
			       for (var i = 0; i < countRooms; i++) {
				       rooms.push(
					       {
								adults: ko.observable(1), infants: ko.observableArray([])
					       }
				       );
			       }
		       }
		       this.rooms(rooms);
	       };
	       HotelsSearchFormController.prototype.getCookieName = function () {
		       return this.$$controller.options.cookiesPrefix + this.cookieName;
	       };
	       HotelsSearchFormController.prototype.processInitParams = function () {
		       var cookie = Cookie.getJSON(this.getCookieName());

		       // Checking cookie validity and fixing that
		       if (cookie &&
		           cookie.rooms &&
				   cookie.segments &&
                   cookie.segments instanceof Array &&
		           cookie.segments.length > 0 &&
                   cookie.rooms instanceof Array &&
                   cookie.rooms.length > 0
		       ) {
			       this.$$controller.log('Initted by cookie', cookie);
			       this.preinittedData = cookie;
			       this.mode = 'preinitted';
		       }
	       };
	       HotelsSearchFormController.prototype.recalcDateRestrictions = function () {
		       var segments = this.segments(),
		           prevdate,
		           nextdate;

		       this.dateRestrictions = [];
		       for (var i = 0; i < segments.length; i++) {
			       prevdate = this.options.dateOptions.minDate;
			       nextdate = this.options.dateOptions.maxDate;

			       if (segments[i].items.arrivalDate.value()) {
				       prevdate = segments[i].items.arrivalDate.value().dateObject();
			       }

			       if (segments[i].items.departureDate.value()) {
				       nextdate = segments[i].items.departureDate.value().dateObject();
			       }

			       if (prevdate.getTime() > nextdate.getTime()) {
				       nextdate = prevdate;

				       segments[i].items.departureDate.value(segments[i].items.arrivalDate.value());
			       }

			       this.dateRestrictions.push([prevdate, nextdate]);
		       }
	       };
	       HotelsSearchFormController.prototype.getSegmentDateParameters = function (dateObj, index, isArrival) {
		       var ret = {
			       disabled: this.dateRestrictions[index][0] > dateObj || this.dateRestrictions[index][1] < dateObj,
			       segments: [],
			       period  : true
		       };
		       var segments = ret.segments = this.segments();
		       for (var i = 0; i < segments.length; i++) {
			       if (segments[i].items.departureDate.value() && segments[i].items.arrivalDate.value()) {
				       var today = new Date();

				       if (isArrival && dateObj.getTime() >= today.getTime()) {
					       ret.disabled = false;
				       }

				       if (segments[i].items.arrivalDate.value().dateObject().getTime() <= dateObj.getTime()) {
					       ret.disabled = false;
				       }
			       }
		       }

		       return ret;
	       };
	       HotelsSearchFormController.prototype.startSearch = function () {
		       function searchError (message, systemData) {
			       if (typeof systemData != 'undefined' && systemData[0] !== 0) {
				       self.$$controller.error('SEARCH ERROR: ' + message, systemData);
			       }

			       if (typeof systemData == 'undefined' || systemData[0] !== 0) {
				       self.searchError(self.$$controller.i18n('HotelsSearchForm', 'searchError_' + message));
			       }

			       self.isSearching(false);
		       }

		       this.searchError(false);
		       if (!this.isValid()) {
			       this.validaTERROR(true);
			       this.processValidation();
		       }
	       };
	       HotelsSearchFormController.prototype.processValidation = function () {
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
		       }
	       };
	       HotelsSearchFormController.prototype.buildModels = function () {
		       var today = new Date();

		       // Checking for errors
		       if (this.$$rawdata.system && this.$$rawdata.system.error) {
			       this.$$error(this.$$rawdata.system.error.message);

			       return;
		       }
		       // Processing options
		       // Passengers maximums
		       this.options = this.$$rawdata.hotels.search.formData.maxLimits;
		       this.options.totalPassengers = parseInt(this.options.totalPassengers);

		       this.roomsUseExtendedSelect = true;
		       this.roomsFastSelectOptions = [{
			       rooms: 1, adults: 1, infants: []
		       }, {
			       rooms: 1, adults: 2, infants: []
		       }, {
			       rooms: 1, adults: 3, infants: []
		       }, {
			       rooms: 1, adults: 4, infants: []
		       }, {
			       rooms: 2, adults: 2, infants: []
		       }];

		       // Date options
		       this.options.dateOptions = this.$$rawdata.hotels.search.formData.dateOptions;

		       today.setHours(0, 0, 0, 0);
		       this.options.dateOptions.minDate = new Date(today);
		       this.options.dateOptions.minDate.setDate(this.options.dateOptions.minDate.getDate() +
		                                                this.options.dateOptions.minOffset);
		       this.options.dateOptions.maxDate = new Date(today);

		       this.options.dateOptions.maxDate.setDate(this.options.dateOptions.maxDate.getDate() +
		                                                this.options.dateOptions.maxOffset);


		       // Processing segments
		       if (this.mode == 'preinitted') {
			       for (var i = 0; i < this.preinittedData.segments.length; i++) {
				       var arrData = null;
				       if (this.preinittedData.segments[i][1]) {
					       arrData = this.$$controller.getModel('Hotels/Common/Geo', {
						       data    : {
							       t: this.preinittedData.segments[i][0],
							       id: this.preinittedData.segments[i][1]
						       },
						       guide: this.$$rawdata.guide
					       });
				       }
				       this.addSegment(arrData,
				                       this.preinittedData.segments[i][2] ?
					                       this.$$controller.getModel(
						                       'Common/Date',
						                       this.preinittedData.segments[i][2]) :
					                       null,
				                       this.preinittedData.segments[i][3] ?
					                       this.$$controller.getModel(
						                       'Common/Date',
						                       this.preinittedData.segments[i][3]) :
					                       null);
			       }

			       // Add rooms from cookies
			       for (i = 0; i < this.preinittedData.rooms.length; i++) {
				       if (this.preinittedData.rooms[i].hasOwnProperty('adults')) {
					       this.rooms.push(
						       {
			                       adults : ko.observable(this.preinittedData.rooms[i].adults),
			                       infants: ko.observableArray(this.preinittedData.rooms[i].infants)
		                       }
					       );
				       }
			       }

			       this.datesUnknown(this.preinittedData.datesUnknown);
		       }
		       else {
			       // Segments
			       this.addSegment(null, null, null);

			       // Rooms
			       this.rooms(
						[
							{
								adults: ko.observable(1),
								infants: ko.observableArray([])
							}
						]
			       );
		       }

		       this.infantsAges = helpers.getAges();

		       // All changes from now on will go to cookie
		       this.setCookies = true;
		       this.parametersChanged(false);
	       };
	       HotelsSearchFormController.prototype.addSegment = function (arrival, arrivalDate, departureDate) {
		       this.segments.push(this.$$controller.getModel('Hotels/SearchForm/Segment', {
			       arrival      : arrival,
			       arrivalDate  : arrivalDate,
			       departureDate: departureDate,
			       index        : this.segments().length,
			       form         : this
		       }));
	       };
	       HotelsSearchFormController.prototype.$$usedModels = ['Hotels/SearchForm/Segment', 'Common/Date', 'Hotels/Common/Geo'];
	       HotelsSearchFormController.prototype.dataURL = function () {
		       var ret = '/hotels/search/formData/';

		       if (this.mode == 'tunesearch') {
			       ret += this.tuneSearch;
		       }

		       if (this.$$rawdata) {
			       return '';
		       }

		       return ret;
	       };

	       HotelsSearchFormController.prototype.dataPOSTParameters = function () {
		       var ret = {},
		           tmp = {};

		       if (this.mode == 'preinitted') {
			       for (var i = 0; i < this.preinittedData.segments.length; i++) {
				       tmp[this.preinittedData.segments[i][0]] = this.preinittedData.segments[i][0];
				       tmp[this.preinittedData.segments[i][1]] = this.preinittedData.segments[i][1];
			       }

			       ret.resources = {};

			       Object.keys(tmp).map(function (n) {
				       ret.resources["guide/hotels/" + n] = {};
				       ret.resources["guide/cities/" + n] = {};
			       });

			       ret.resources = JSON.stringify(ret.resources);
		       }

		       return ret;
	       };
	       HotelsSearchFormController.prototype.roomAdd = function () {
		       this.rooms.push(
			       {
						adults: ko.observable(1),
						infants: ko.observableArray([])
                   }
		       );
	       };
	       HotelsSearchFormController.prototype.roomRemove = function (index) {
		       this.rooms.splice(index, 1);
	       };
	       HotelsSearchFormController.prototype.selectInfantAge = function (room, infant, age) {
		       var infants = this.rooms()[room].infants(),
		           newInfants = [];

		       for (var i = 0; i < infants.length; i++) {
			       if (i != infant) {
				       newInfants.push(infants[i]);
			       }
			       else {
				       newInfants.push(age);
			       }
		       }

		       this.rooms()[room].infants(newInfants);
	       };
	       HotelsSearchFormController.prototype.pageTitle = 'HotelsSearch';
	       return HotelsSearchFormController;
       });