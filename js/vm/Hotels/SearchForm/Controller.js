define([
		'knockout',
		'js/vm/helpers',
		'js/vm/BaseControllerModel',
		'jsCookie',
		'js/vm/Models/HotelsBaseModel',
		'js/vm/Models/RecentHotelsModel',
		'js/vm/Models/LocalStorage',
		'js/vm/Models/RecentSearchModel'
	],
	function (
		ko,
		helpers,
		BaseControllerModel,
		Cookie,
		HotelsBaseModel,
		RecentHotelsModel,
		LocalStorage,
		RecentSearchModel
	) {

		function HotelsSearchFormController(componentParameters) {
			BaseControllerModel.apply(this, arguments);

			var self = this;

			this.name = 'HotelsSearchFormController';
			this.maxInfants = 4;
			this.delayedSearch = true;
			this.roomsUseExtendedSelect = false;
			this.searchError = ko.observable(false);
			this.segments = ko.observableArray([]);
			this.citySuggestions = ko.observableArray([]);
			this.roomsFastSelectOptions = [];
			this.rooms = ko.observableArray();
			this.infantsAges = [];
			this.datesUnknown = ko.observable(false);
			this.options = {};
			// ограничения на количество гостей, если параметры заданы через Fast Search
			this.maxAdultsFromFS = null;
			this.maxInfantsFromFS = null;
			this.validaTERROR = ko.observable(false);
			this.recentSearches = ko.observableArray(helpers.toArray(RecentSearchModel.getLast()));
			this.preinittedData = {
				dateUnknown: true,
				immediateSearch: false,
				segments: [],
				rooms: [],
				loyaltyCard: {
					cardNumber: null,
					hotelsChain: null
				}
			};
			// Set cookies is not an observable for when it changes it won't trigger cookie setting via
			this.setCookies = false;
			this.useCookies = true;
			this.mode = HotelsBaseModel.MODE_NORMAL;
			this.roomsFastSelectorOpen = ko.observable(false);
			this.parametersChanged = ko.observable(false);
			this.showPreviousSearches = true;

			this.searchAllowedByParamChange = ko.computed(function () {
				return this.parametersChanged() || !this.forceChangeToSearch;
			}, this);

			this.searchEnabled = ko.computed(function () {
				return (!this.validaTERROR() || this.isValid()) && this.searchAllowedByParamChange();
			}, this);

			this.processInitParams();
			this.loyaltyCardNumber = ko.observable();
			this.loyaltyCardChain = ko.observable('');
			this.clientNationality = ko.observable('');
			this.loyaltyCardChainValid = ko.observable(true);

			this.loyaltyCardChain.subscribe(function () {
				var value = self.loyaltyCardChain().toUpperCase();

				if (value.length <= 2 && /^([A-Z])+$/.test(value)) {
					self.loyaltyCardChainValid(true);
				}
				else if (value.length > 0) {
					self.loyaltyCardChainValid(false);
				}
			});

			this.segments.subscribe(function () {
				this.recalcDateRestrictions();
			}, this);

			function infantsToi18n(value) {
				var key = 'hotels__passSummary_numeral_CLD_' + helpers.getNumeral(value, 'one', 'twoToFour', 'fourPlus');
				return self.$$controller.i18n('HotelsSearchForm', key);
			}

			// returns string like "16 взрослых, 9 детей в 4 номерах"
			function getSummaryGuests(rooms, guest) {

				var result = guest.adults + ' ' +
					self.$$controller.i18n('HotelsSearchForm', 'hotels__passSummary_numeral_ADT_' +
						helpers.getNumeral(guest.adults, 'one', 'twoToFour', 'fourPlus'));

				if (guest.infants === 0 && guest.adults === 1) {
					return result;
				}

				if (guest.infants > 0) {
					result += ', ' + guest.infants + ' ' + infantsToi18n(guest.infants);
				}

				result += ' ' + self.$$controller.i18n('HotelsSearchForm', 'hotels_in') + ' ' + rooms.length + ' ' +
					self.$$controller.i18n('HotelsSearchForm', 'hotels_in_room_' +
						helpers.getNumeral(rooms.length, 'one', 'more', 'more'));

				return result;
			}

			this.guestsSummary = ko.computed(function () {
				var guest = { adults: 0, infants: 0 },
					rooms = this.rooms();

				if (!rooms || !rooms.length) {
					return '';
				}

				rooms.forEach(function (room) {
					guest.adults += room.adults();
					guest.infants += room.infants().length;
				});

				return getSummaryGuests(rooms, guest);
			}, this);

			/**
			 * Возвращает объект с указанием общего кол-ва гостей по каждому типу
			 * @return Object { adults: 0, infants: 0 }
			 */
			this.guestsSummaryByType = ko.computed(function () {
				var guest = { adults: 0, infants: 0 },
					rooms = this.rooms();

				if (!rooms.length) {
					return {adults: 0, infants: 0};
				}

				rooms.forEach(function (room) {
					guest.adults += room.adults();
					guest.infants += room.infants().length;
				});

				return guest;

			}, this);

			this.isValid = ko.computed(function () {
				var segments = this.segments(),
					isValid = true;

				if (segments.length) {
					isValid = segments[0].items.arrival.error() ||
						segments[0].items.departureDate.error() ||
						segments[0].items.arrivalDate.error();
				}

				return !isValid;
			}, this);

			this.countriesArray = ko.pureComputed(function() {
				var countriesGuide = this.$$rawdata.guide.countries,
					countriesArray = [];

				for (var country in countriesGuide) {
					if (countriesGuide.hasOwnProperty(country)) {
						countriesArray.push(countriesGuide[country]);
					}
				}

				return countriesArray;
			}, this);

			this.cookieData = ko.computed(function () {

				var res = {
						segments: [],
						rooms: [],
						datesUnknown: this.datesUnknown(),
						loyaltyCard: {
							hotelsChain: this.loyaltyCardChainValid() ? this.loyaltyCardChain().toUpperCase() : '',
							cardNumber: this.loyaltyCardChainValid() ? this.loyaltyCardNumber() : ''
						},
						clientNationality: this.$$controller.options.clientNationalitySelect ? this.clientNationality() : ''
					},
					segments = this.segments(),
					rooms = this.rooms();

				// Segments
				for (var i = 0; i < segments.length; i++) {
					var segment = segments[i];

					res.segments.push([
						segment.items.arrival.value() ? segment.items.arrival.value().t : null,
						segment.items.arrival.value() ? segment.items.arrival.value().id : null,
						segment.items.arrivalDate.value() ? segment.items.arrivalDate.value().getISODate() : null,
						segment.items.departureDate.value() ? segment.items.departureDate.value().getISODate() : null]);
				}

				// Rooms
				rooms.forEach(function (room) {
					res.rooms.push({
						adults: room.adults(),
						infants: room.infants()
					});
				});

				return res;
			}, this);

			this.cookieData.subscribe(function (newValue) {

				if (this.useCookies && this.setCookies) {
					LocalStorage.set('searchFormData', newValue);
				} else {
					this.$$controller.log('COOKIE NOT ENABED YET', this.getCookieName(), newValue);
				}
			}, this);
		}

		// Extending from dictionaryModel
		helpers.extendModel(HotelsSearchFormController, [BaseControllerModel]);
		// Inheritance override
		HotelsSearchFormController.prototype.cookieName = 'HotelsSearchForm';
		HotelsSearchFormController.prototype.$$i18nSegments = ['HotelsSearchForm', 'Hotels'];
		HotelsSearchFormController.prototype.$$KOBindings = ['HotelsSearchForm'];
		HotelsSearchFormController.prototype.openRoomsSelector = function () {
			if (this.roomsUseExtendedSelect || this.roomsFastSelectOptions.length !== 0) {
				this.roomsFastSelectorOpen(!this.roomsFastSelectorOpen());
			}
		};
		HotelsSearchFormController.prototype.roomsTextForFastSelect = function (index) {

			var rooms = this.roomsFastSelectOptions[index].rooms,
				adults = this.roomsFastSelectOptions[index].adults;

			var result = adults + ' ' + this.$$controller.i18n('HotelsSearchForm', 'hotels__passSummary_numeral_ADT_' +
					helpers.getNumeral(adults, 'one', 'twoToFour', 'fourPlus'));

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

			this.rooms();

			var rooms = [];

			if (this.roomsFastSelectOptions[index].rooms == 1) {
				rooms.push({
					adults: ko.observable(this.roomsFastSelectOptions[index].adults),
					infants: ko.observableArray([])
				});
			}
			else {
				var countRooms = this.roomsFastSelectOptions[index].rooms;
				for (var i = 0; i < countRooms; i++) {
					rooms.push({
						adults: ko.observable(1), infants: ko.observableArray([])
					});
				}
			}
			this.rooms(rooms);
		};
		HotelsSearchFormController.prototype.getCookieName = function () {
			return this.$$controller.options.cookiesPrefix + this.cookieName;
		};

		HotelsSearchFormController.prototype.getSearchParams = function () {
			return LocalStorage.get('searchFormData');
		};

		HotelsSearchFormController.prototype.processInitParams = function () {
			// Preinitted by URL
			if (this.$$componentParameters.route.length === 10) {
				var route = this.$$componentParameters.route[0],
					pointer = 0,
					childrenCount = 0,
					childrenArray = [],
					hotelID = null,
					arrivalDateTemp = null,
					departureDateTemp = null,
					todayTimestamp = new Date(),
					tmpDate = null,
					arrivalTimestamp = null;

				todayTimestamp.setHours(0, 0, 0, 0);
				todayTimestamp = todayTimestamp.getTime();

				route = route.split('-');

				var numOfParams = route.length;

				if (!helpers.stringIsDate(route[pointer])) { // hotel id ?
					// hotel ID
					hotelID = route[pointer];
					pointer++;
				}

				if (helpers.stringIsDate(route[pointer])) { // arrival date ?
					// get arrival date
					arrivalDateTemp = route[pointer];
					arrivalDateTemp = arrivalDateTemp.substr(0, 4) + '-' + arrivalDateTemp.substr(4, 2) + '-' + arrivalDateTemp.substr(6);
					// check date
					tmpDate = new Date(arrivalDateTemp);
					tmpDate.setHours(0, 0, 0, 0);
					if (tmpDate.getTime() < todayTimestamp) {
						arrivalDateTemp = null;
					}
					else {
						arrivalTimestamp = tmpDate.getTime();
					}
					pointer++;
				}

				if (helpers.stringIsDate(route[pointer])) { // is departure date exist?
					// get departure date
					departureDateTemp = route[pointer];
					departureDateTemp = departureDateTemp.substr(0, 4) + '-' + departureDateTemp.substr(4, 2) + '-' + departureDateTemp.substr(6);
					// check date
					tmpDate = new Date(departureDateTemp);
					tmpDate.setHours(0, 0, 0, 0);
					if (tmpDate.getTime() < todayTimestamp || tmpDate.getTime() <= arrivalTimestamp + 86400) {
						departureDateTemp = null;
					}
					pointer++;
				}

				this.maxAdultsFromFS = 0;
				this.maxInfantsFromFS = 0;

				if (numOfParams !== pointer) {
					if (route[numOfParams - 1] === 'GO') {
						this.preinittedData.immediateSearch = true;
						route.pop();
					}
				}
				else {
					this.preinittedData.rooms.push({
						adults: 1,
						infants: []
					});

					this.maxAdultsFromFS = null;
					this.maxInfantsFromFS = null;
				}

				// get guests
				// for each room
				for (pointer; pointer < route.length; pointer += 1) {
					var term = route[pointer];
					var adultCount = parseInt(term.substr(3, 1));
					childrenArray = [];

					// Children
					childrenCount = parseInt(term.length > 4 ? term.substr(7) : 0);
					for (var i = 0; i < childrenCount; i++) {
						childrenArray.push(0);
					}

					this.maxAdultsFromFS += adultCount;
					this.maxInfantsFromFS += childrenCount;

					this.preinittedData.rooms.push({adults: adultCount, infants: childrenArray});
				}

				this.preinittedData.segments.push([null, hotelID, arrivalDateTemp, departureDateTemp]);
				this.preinittedData.dateUnknown = false;
				this.mode = HotelsBaseModel.MODE_PREINITTED;
			}
			// Preinitted by Cookie
			else {
				var cookie = this.getSearchParams();

				if (cookie) {

					var hasSegments = cookie.segments && cookie.segments instanceof Array && cookie.segments.length > 0,
						hasRooms    = cookie.rooms && cookie.rooms instanceof Array && cookie.rooms.length > 0;

					// Checking cookie validity and fixing that
					if (hasSegments && hasRooms) {
						this.$$controller.log('Initted by cookie', cookie);

						for (var field in this.preinittedData) {
							if (this.preinittedData.hasOwnProperty(field) && cookie.hasOwnProperty(field)) {
								this.preinittedData[field] = cookie[field];
							}
						}

						this.mode = HotelsBaseModel.MODE_PREINITTED;
					}
				}

				var additional = this.$$componentParameters.additional;

				if (additional) {
					this.showPreviousSearches = !!additional.showPreviousSearches;
				}
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

					segments[i].items.departureDate.value(null);
				}

				this.dateRestrictions.push([prevdate, nextdate]);
			}
		};

		HotelsSearchFormController.prototype.getSegmentDateParameters = function (dateObj, index, isArrival, isDepartureSelect) {
			var ret = {
				disabled: this.dateRestrictions[index][0] > dateObj || this.dateRestrictions[index][1] < dateObj,
				segments: [],
				period: true
			};

			var segments = ret.segments = this.segments(),
				   today = new Date();

			today.setHours(0, 0, 0, 0);
			dateObj.setHours(0, 0, 0, 0);

			for (var i = 0; i < segments.length; i++) {
				if (segments[i].items.departureDate.value() && segments[i].items.arrivalDate.value()) {
					if (isArrival && dateObj.getTime() >= today.getTime()) {
						ret.disabled = false;
					}

					if (segments[i].items.arrivalDate.value().dateObject().getTime() <= dateObj.getTime()) {
						ret.disabled = false;
					}
				}
				else if (segments[i].items.arrivalDate.value() && segments[i].items.departureDate.value() === null && isDepartureSelect === false) {
					// при выборе заезда все даты должны быть доступны
					ret.disabled = false;
				}
			}

			return ret;
		};

		/**
		 * Submits search form
		 */
		HotelsSearchFormController.prototype.startSearch = function () {

			this.searchError(false);

			if (!this.isValid()) {
				this.validaTERROR(true);
				this.processValidation();
			} else if (this.delayedSearch && this.$$controller.navigateGetPushStateSupport()) {
				RecentHotelsModel.clearRecent();
				this.$$controller.navigate('/hotels/results', true, 'HotelsResults');
			} else {
				var self = this;

				this.$$controller.log('STARTING SEARCH');
				self.searchError(false);
			}
		};

		HotelsSearchFormController.prototype.processValidation = function () {

			if (this.validaTERROR()) {

				var segments = this.segments();

				segments.forEach(function (segment) {
					helpers.iterateObject(segment.items, function (item) {
						if (item.error()) {
							item.focus(true);
							return true;
						}
					});
				});
			}
		};

		function processPreinittedMode(self) {

			for (var i = 0; i < self.preinittedData.segments.length; i++) {

				var segment = self.preinittedData.segments[i],
					arrData = null;

				if (segment[1]) {
					arrData = self.$$controller.getModel('Hotels/Common/Geo', {
						data: {
							t: segment[0],
							id: segment[1]
						},
						guide: self.$$rawdata.guide
					});
				}
				self.addSegment(
					arrData,
					segment[2] ? self.$$controller.getModel('Common/Date', segment[2]) : null,
					segment[3] ? self.$$controller.getModel('Common/Date', segment[3]) : null
				);
			}

			// Add rooms from cookies
			for (i = 0; i < self.preinittedData.rooms.length; i++) {
				if (self.preinittedData.rooms[i].hasOwnProperty('adults')) {
					self.rooms.push({
						adults: ko.observable(self.preinittedData.rooms[i].adults),
						infants: ko.observableArray(self.preinittedData.rooms[i].infants)
					});
				}
			}

			self.datesUnknown(self.preinittedData.datesUnknown);
			self.loyaltyCardNumber(self.preinittedData.loyaltyCard.cardNumber);
			self.loyaltyCardChain(self.preinittedData.loyaltyCard.hotelsChain ? self.preinittedData.loyaltyCard.hotelsChain : '');
		}

		HotelsSearchFormController.prototype.buildModels = function () {
			var today = new Date(),
				self = this,
				citySuggestions;

			// Checking for errors
			if (this.$$rawdata.system && this.$$rawdata.system.error) {
				this.$$error(this.$$rawdata.system.error.message);

				return;
			}

			// Processing options
			// Passengers maximums
			this.options = this.$$rawdata.hotels.search.formData.maxLimits;
			this.options.totalPassengers = parseInt(this.options.totalPassengers, 10);

			this.roomsUseExtendedSelect = true;
			this.roomsFastSelectOptions = [
				{rooms: 1, adults: 1, infants: []},
				{rooms: 1, adults: 2, infants: []},
				{rooms: 1, adults: 3, infants: []},
				{rooms: 1, adults: 4, infants: []},
				{rooms: 2, adults: 2, infants: []}
			];

			// Date options
			this.options.dateOptions = this.$$rawdata.hotels.search.formData.dateOptions;

			today.setHours(0, 0, 0, 0);
			this.options.dateOptions.minDate = new Date(today);

			this.options.dateOptions.minDate.setDate(
				this.options.dateOptions.minDate.getDate() + this.options.dateOptions.minOffset
			);

			this.options.dateOptions.maxDate = new Date(today);

			this.options.dateOptions.maxDate.setDate(
				this.options.dateOptions.maxDate.getDate() + this.options.dateOptions.maxOffset
			);

			citySuggestions = this.$$rawdata.hotels.search.formData.citySuggestions;

			if (citySuggestions instanceof Array) {
				this.citySuggestions(citySuggestions);
			}

			// Processing segments
			if (this.mode === HotelsBaseModel.MODE_PREINITTED) {
				processPreinittedMode(this);
			}
			else {
				// Segments
				this.addSegment(null, null, null);

				// Rooms
				this.rooms([{
					adults: ko.observable(1),
					infants: ko.observableArray([])
				}]);
			}

			this.infantsAges = helpers.getAges();

			// All changes from now on will go to cookie
			this.setCookies = true;
			this.parametersChanged(false);

			var clientNationalityByDefault = this.$$rawdata.system.info.user.settings.agencyCountry;

			this.clientNationality(clientNationalityByDefault);

			if (this.preinittedData.immediateSearch) {
				this.startSearch();
			}
		};

		HotelsSearchFormController.prototype.addSegment = function (arrival, arrivalDate, departureDate) {
			this.segments.push(this.$$controller.getModel('Hotels/SearchForm/Segment', {
				arrival: arrival,
				arrivalDate: arrivalDate,
				departureDate: departureDate,
				index: this.segments().length,
				form: this
			}));
		};

		HotelsSearchFormController.prototype.$$usedModels = [
			'Hotels/SearchForm/Segment',
			'Common/Date',
			'Hotels/Common/Geo'
		];

		HotelsSearchFormController.prototype.dataURL = function () {

			var url = '/hotels/search/formData/';

			if (this.$$rawdata) {
				return '';
			}

			return url;
		};

		HotelsSearchFormController.prototype.dataPOSTParameters = function () {

			var request = {},
				tmp = {};

			request.resources = {};

			if (this.mode === HotelsBaseModel.MODE_PREINITTED) {

				for (var i = 0; i < this.preinittedData.segments.length; i++) {
					tmp[this.preinittedData.segments[i][0]] = this.preinittedData.segments[i][0];
					tmp[this.preinittedData.segments[i][1]] = this.preinittedData.segments[i][1];
				}


				Object.keys(tmp).map(function (n) {
					// request.resources['guide/hotels/' + n] = {};
					request.resources['guide/cities/' + n] = {};
				});
			}

			request.resources['system/info/currencyRates'] = {};

			request.resources = JSON.stringify(request.resources);

			return request;
		};

		HotelsSearchFormController.prototype.roomAdd = function () {
			this.rooms.push({
				adults: ko.observable(1),
				infants: ko.observableArray([])
			});
		};

		HotelsSearchFormController.prototype.roomRemove = function (index) {
			this.rooms.splice(index, 1);
		};

		HotelsSearchFormController.prototype.selectInfantAge = function (room, infant, age) {
			this.rooms()[room].infants()[infant] = age;

			this.rooms.valueHasMutated();
		};

		HotelsSearchFormController.prototype.pageTitle = 'HotelsSearch';

		return HotelsSearchFormController;
	});
