define(
	[
		'knockout',
		'js/vm/helpers',
		'js/vm/Models/HotelsFiltersViewModel',
		'js/vm/Models/SliderViewModel',
		'js/vm/Models/BreadcrumbViewModel',
		'js/vm/Models/HotelsBaseModel',
		'js/vm/Models/GoogleMapModel',
		'js/vm/Models/RecentSearchModel',
		'js/vm/Models/LocalStorage',
		'js/lib/lodash/v.4.17.4/lodash.min',
		'js/vm/Hotels/SearchResults/Hotel/Rooms/Tariff'
	],
	function (
		ko,
		helpers,
		HotelsFiltersViewModel,
		SliderViewModel,
		BreadcrumbViewModel,
		HotelsBaseModel,
		GoogleMapModel,
		RecentSearchModel,
		LocalStorage,
		_,
		TariffModel
	) {
		function HotelSearchResultsModel() { }

		helpers.extendModel(HotelSearchResultsModel, [HotelsBaseModel, GoogleMapModel]);

		/**
		 * Mapped popular hotel features.
		 *
		 * @type {Object}
		 */
		HotelSearchResultsModel.prototype.popularHotelsFeatures = {};

		HotelSearchResultsModel.prototype.processInitParams = function () {
			this.mode = HotelsBaseModel.MODE_SEARCH;
			this.searchInfo(LocalStorage.get('searchFormData'));
		};

		/**
		 * Returns modified data entered by user in search form
		 * @returns {Object}
		 */
		HotelSearchResultsModel.prototype.prepareRequestData = function () {
			var requestData          = {},
				rooms                = [],
				localStorageFormData = LocalStorage.get('searchFormData'),
				segment              = localStorageFormData.segments[0];

			var KEY_CITY_ID        = 1,
				KEY_CHECK_IN_DATE  = 2,
				KEY_CHECK_OUT_DATE = 3;

			localStorageFormData.rooms.forEach(function (room, i) {
				if (!rooms[i]) {
					rooms[i] = {};
				}

				rooms[i].ADT = room.adults;

				if (room.infants.length) {

					rooms[i].CLD = room.infants.length;

					for (var indexInfants = 0; indexInfants < room.infants.length; indexInfants++) {
						if (!rooms[i].childAges) {
							rooms[i].childAges = [];
						}
						rooms[i].childAges.push(room.infants[indexInfants]);
					}
				}
			});
			
			var checkInDate = this.$$controller.getModel('Common/Date', segment[KEY_CHECK_IN_DATE]),
				checkOutDate = this.$$controller.getModel('Common/Date', segment[KEY_CHECK_OUT_DATE]);
			
			requestData.request = JSON.stringify({
				cityId: segment[KEY_CITY_ID],
				checkInDate: checkInDate.getISODateTime(),
				checkOutDate: checkOutDate.getISODateTime(),
				isDelayed: false,
				rooms: rooms,
				loyaltyCard: {
					number: localStorageFormData.loyaltyCard ? localStorageFormData.loyaltyCard.cardNumber : null,
					hotelsChain: localStorageFormData.loyaltyCard ? localStorageFormData.loyaltyCard.hotelsChain : null
				},
				clientNationality: localStorageFormData.clientNationality
			});

			return requestData;
		};

		HotelSearchResultsModel.prototype.buildModels = function () {
			var self = this;

			function searchError(code, systemData) {
				self.fillSearchForm();

				if (typeof systemData !== 'undefined' && systemData[0] !== 0) {
					self.$$controller.error('SEARCH ERROR: ' + code, systemData);
				}

				if (typeof systemData === 'undefined' || systemData[0] !== 0) {
					self.errorCode(code);
				}
			}

			var onSuccess = function (json) {
				try {
					var response          = JSON.parse(json),
						responseErrorCode = null,
						error;

					self.$$rawdata = response;

					if (response.system && response.system.error) {
						responseErrorCode = response.system.error.code;
						error = response.system.error;
					}
					else if (!self.$$rawdata.hotels.staticDataInfo.hotels) {
						responseErrorCode = '404';
					}
					else if (response.hotels.search.results.info.errorCode) {
						responseErrorCode = response.hotels.search.results.info.errorCode;
					}

					if (response.hotels.search.results.info.errors) {
						self.errorMessageAsIs(response.hotels.search.results.info.errors[0]);
					}

					if (responseErrorCode) {
						searchError(responseErrorCode, error);
						return;
					}

					var searchId = response.hotels.search.results.id,
						hotelId  = self.$$controller.router.current.getParameterValue('hotel_id'),
						newUrl   = '/hotels/results/' + searchId;

					if (hotelId) {
						newUrl += '/' + hotelId;
					}

					self.$$controller.router.replaceState(newUrl, self.$$controller.i18n('pageTitles', 'HotelsResults'));

					LocalStorage.set('searchFormData', self.createCookieParamsFromResponse(self.$$rawdata.hotels.search.request));
					self.processSearchResults();

				}
				catch (e) {
					console.error(e);
				}
			};

			var searchId = this.$$controller.router.current.getParameterValue('search_id'),
				url      = searchId ? ('/hotels/search/results/' + searchId) : '/hotels/search/request',
				postData = searchId ? {} : this.prepareRequestData();

			this.$$controller.loadData(url, postData, onSuccess);
		};

		/**
		 * Returns total price of hotels include all rooms by cheapest tariff
		 * @param hotel
		 * @returns {Object}
		 */
		HotelSearchResultsModel.prototype.getFirstRoomsPrice = function (hotel) {
			var price = 0, currency;

			hotel.rooms.forEach(function (tariffs) {
				if (!currency) {
					currency = tariffs[0].rate.price.currency();
				}
				
				price += tariffs[0].rate.price.amount();
			});

			return {
				amount: price,
				currency: currency
			};
		};

		/**
		 * Search rooms with special offer in hotel
		 * @param hotel
		 * @return {boolean}
		 */
		HotelSearchResultsModel.prototype.isSpecialOfferExist = function (hotel) {
			for (var item in hotel.rooms[0]) {
				if (hotel.rooms[0].hasOwnProperty(item) && hotel.rooms[0][item].rate.isSpecialOffer) {
					return true;
				}
			}
			return false;
		};

		HotelSearchResultsModel.prototype.isСorporateRatesExist = function (hotel) {
			for (var item in hotel.rooms[0]) {
				if (hotel.rooms[0].hasOwnProperty(item) && hotel.rooms[0][item].rate.discountId) {
					return true;
				}
			}
			return false;
		};

		/**
		 * Get distance from center and airport
		 * @param hotel
		 * @returns {string[]} first element is distance from center, second is distance from airport
		 */
		HotelSearchResultsModel.prototype.getDistances = function (hotel) {
			var TYPE_NAME_CENTER  = 'Center',
				TYPE_NAME_AIRPORT = 'Airport',
				distances         = ['', ''],
				distanceOriginal  = hotel.staticDataInfo.distancesOriginal;

			/**
			 *
			 * @param {Object} distanceData
			 * @param {Number} distanceData.distance
			 * @param {String} distanceData.measurement
			 * @param {String} distanceData.transportType
			 * @returns {String}
			 */
			var getDistance = function (distanceData) {
				var res = '';

				if (distanceData) {
					res = distanceData.distance + ' ' + distanceData.measurement;
				}

				return res;
			};

			if (!(distanceOriginal instanceof Array) && typeof distanceOriginal === 'object') {
				// iterate over all existing distances and check is there distance to the center or an airport
				helpers.iterateObject(distanceOriginal, function (distance, typeName) {
					if (distance.distancesArray && distance.distancesArray.length > 0) {
						if (typeName === TYPE_NAME_CENTER) {
							distances[0] = getDistance(distance.distancesArray[0].value);
						}
						else if (typeName === TYPE_NAME_AIRPORT) {
							distances[1] = getDistance(distance.distancesArray[0].value);
						}
					}
				});
			}

			return distances;
		};

		function compareObjects(firstArray, secondArray, propertyFirst, propertySecond) {
			var data = secondArray.slice(0);

			firstArray.forEach(function (firstArrayValue, firstArrayIndex, arrFirst) {
				secondArray.forEach(function (secondArrayValue, secondArrayIndex) {
					if (firstArrayValue.id === secondArrayValue[propertyFirst]) {
						data[secondArrayIndex][propertySecond] = arrFirst[firstArrayIndex];
					}
				});
			});

			return data;
		}

		/**
		 * Makes associations "room id" to "room"
		 * @param roomsGroup
		 * @returns {{}}
		 */
		function createRoomsDictionary(roomsGroup) {
			var rooms = {};

			roomsGroup.forEach(function (itemGroup) {
				if (itemGroup.id || itemGroup.id === 0) {
					rooms[itemGroup.id] = itemGroup;
				}
			});

			return rooms;
		}

		function createStarsArray(starRating) {
			var starRatingArr = [];

			for (var indexStar = 0; indexStar < starRating; indexStar++) {
				starRatingArr.push('1');
			}

			return starRatingArr;
		}

		function getPromotionalHotels(allHotels, promotionalHotels) {
			promotionalHotels = promotionalHotels || [];

			var existingHotels = allHotels.filter(function (item) {
				return promotionalHotels.indexOf(item.id) > -1;
			});

			// get first 2 hotels;
			return existingHotels.slice(0, 2);
		}

		HotelSearchResultsModel.prototype.addHotelsRooms = function(results) {
			var self            = this,
				hotels          = [],
				roomsDictionary = createRoomsDictionary(results.roomsGroup);

			// running through all hotels in search results
			helpers.iterateObject(results.hotels, function (hotel) {
				var rooms = [];

				// rooms in a hotel
				hotel.roomGroups.forEach(function (room) {
					var roomTariffs = [];

					if (room.roomCharges) {
						room.roomCharges.forEach(function (charge) {
							if (roomsDictionary[charge.roomId]) {
								var priceCharge = self.$$controller.getModel('Common/Money', charge.price);
								
								roomsDictionary[charge.roomId].rate.priceCharge = priceCharge;
								roomsDictionary[charge.roomId].rate.price.add(priceCharge);
							}
						});
					}

					// room variants
					room.roomVariants.forEach(function (roomId) {
						roomTariffs.push(roomsDictionary[roomId]);
					});

					rooms[room.searchRoomId] = roomTariffs;
				});

				// create properties which include data about rooms
				hotel.rooms = rooms;

				//create array with hotels,static data and rooms
				hotels.push(hotel);
			});

			return hotels;
		};

		HotelSearchResultsModel.prototype.processSearchResults = function (data) {
			if (data) {
				_.merge(this.$$rawdata, data);
			}

			var self                = this,
				searchData          = this.$$rawdata.hotels.search ? this.$$rawdata.hotels.search : null,
				staticData          = this.$$rawdata.hotels.staticDataInfo ? this.$$rawdata.hotels.staticDataInfo : null,
				googleMapKey        = this.$$rawdata.system.info.user.settings.googleMapsApiKey ? this.$$rawdata.system.info.user.settings.googleMapsApiKey : null,
				minHotelPrice       = Infinity,
				maxHotelPrice       = -Infinity,
				maxAverageCustomerRating = 0,
				MILLISECONDS_IN_DAY = 86400000,
				$body               = $('body');
			
			if (googleMapKey && !$body.find('.js-googleMapScript').length) {
				self.$$controller.viewModel.user.settings.googleMapsApiKey(googleMapKey);
				$body.append('<script class="js-googleMapScript" src="//maps.googleapis.com/maps/api/js?key=' + googleMapKey + '&libraries=places"></script>');
			}

			self.cheapestHotel = null;
			self.minHotelPrice = null;

			this.popularHotelsFeatures = this.mapPopularHotelFeatures(staticData.popularHotelsFeatures);
			this.showMaps = ko.observable(false);
			this.searchId(searchData && searchData.request ? searchData.request.id : '');

			searchData.results.roomMeals = helpers.toArray(searchData.results.roomMeals);
			searchData.results.roomRates = helpers.toArray(searchData.results.roomRates);
			searchData.results.roomTypes = helpers.toArray(searchData.results.roomTypes);
			searchData.results.roomsGroup = helpers.toArray(searchData.results.roomsGroup);

			searchData.results.roomRates.map(function (rate) {
				if ('cancellationRules' in rate) {
					rate.cancellationRules.map(function (rule) {
						if ('deadLine' in rule) {
							rule.deadLine = self.$$controller.getModel('Common/Date', rule.deadLine);
						}

						if ('money' in rule) {
							rule.money = self.$$controller.getModel('Common/Money', rule.money);
						}
					});
				}
			});

			searchData.results.roomsGroup = compareObjects(searchData.results.roomMeals, searchData.results.roomsGroup, 'mealId', 'meal');
			searchData.results.roomsGroup = compareObjects(searchData.results.roomRates, searchData.results.roomsGroup, 'rateId', 'rate');
			searchData.results.roomsGroup = compareObjects(searchData.results.roomTypes, searchData.results.roomsGroup, 'typeId', 'type');
			searchData.results.roomsGroup = searchData.results.roomsGroup.map(function (tariff) {
				var tariffModel;
				
				if (tariff instanceof TariffModel) {
					tariffModel = tariff;
				}
				else {
					tariffModel = self.$$controller.getModel('Hotels/SearchResults/Hotel/Rooms/Tariff', tariff);
				}

				tariffModel.fixPriceIfNeeded();
				
				return tariffModel;
			});

			if (staticData && 'hotels' in staticData && staticData.hotels) {
				var hotelsStatic = {};

				staticData.hotels.forEach(function (hotel) {
					hotelsStatic[hotel.id] = hotel;
				});

				for (var id in searchData.results.hotels) {
					if (searchData.results.hotels.hasOwnProperty(id) && hotelsStatic.hasOwnProperty(searchData.results.hotels[id].id)) {
						var hotelStaticData = hotelsStatic[searchData.results.hotels[id].id];

						if (searchData.results.hotels[id].staticDataInfo) {
							_.merge(searchData.results.hotels[id].staticDataInfo, hotelStaticData);
						}
						else {
							searchData.results.hotels[id].staticDataInfo = hotelStaticData;
						}
					}
				}
			}
			
			// find hotel with cheapest price
			function findCheapestHotel(hotel) {
				if (hotel.hotelPrice < minHotelPrice) {
					minHotelPrice = hotel.hotelPrice;
					self.cheapestHotel = hotel;
					self.minHotelPrice = minHotelPrice;
				}
			}

			// find hotel with max price
			function findMostExpensiveHotel(hotel) {
				if (hotel.hotelPrice > maxHotelPrice) {
					maxHotelPrice = hotel.hotelPrice;
				}
			}
			
			// find hotel with max average customer rating
			function findMaxAverageCustomerRating(hotel) {
				if (hotel.averageCustomerRating > maxAverageCustomerRating) {
					maxAverageCustomerRating = hotel.averageCustomerRating;
				}
			}

			var hotels = this.addHotelsRooms(searchData.results);
			var hotelsPool = {};
			var hasCoordinates = false;
			
			hotels.map(function (hotel, index) {
				hotel.staticDataInfo.featuresArray = [];

				helpers.iterateObject(hotel.staticDataInfo.features, function (feature, id) {
					feature.id = id;
					hotel.staticDataInfo.featuresArray.push(feature);
				});

				if (!(hotel.staticDataInfo.starRating instanceof Array)) {
					hotel.staticDataInfo.starRating = createStarsArray(hotel.staticDataInfo.starRating);
				}

				hotel.staticDataInfo.distancesOriginal = hotel.staticDataInfo.distances;
				hotel.staticDataInfo.distances = helpers.toArray(hotel.staticDataInfo.distances || {});

				if (hotel.staticDataInfo.photos && hotel.staticDataInfo.photos instanceof Array) {
					hotel.hotelPhotos = hotel.staticDataInfo.photos.map(function (url) {
						return {
							img: url,
							thumb: url
						};
					});
				}
				else {
					hotel.hotelPhotos = [];
				}

				hotel.showMap = !!(hotel.staticDataInfo.posLatitude || hotel.staticDataInfo.posLongitude);

				hasCoordinates = hasCoordinates || hotel.showMap;

				var firstRoomPrice = self.getFirstRoomsPrice(hotel);
				// Тот, кто изначально писал этот код, подумал что будет смешно, если он ВЕЗДЕ расчеты 
				// связанные со стоимостью чего-либо будет проводить с цифрами, а не с обычными нашими моделями...
				hotel.hotelPriceOriginal = firstRoomPrice.amount;
				hotel.hotelPrice = Math.round(hotel.hotelPriceOriginal);
				hotel.isSpecialOffer = self.isSpecialOfferExist(hotel);
				hotel.isCorporateRates = self.isСorporateRatesExist(hotel);
				hotel.hotelChainName = hotel.staticDataInfo.hotelChainName;
				hotel.priceObservable = self.$$controller.getModel('Common/Money', {
					amount: firstRoomPrice.amount,
					currency: firstRoomPrice.currency
				});

				findCheapestHotel(hotel);
				findMostExpensiveHotel(hotel);
				findMaxAverageCustomerRating(hotel);

				if (!hotel.averageCustomerRating) {
					hotel.averageCustomerRating = {
						value: 0,
						description: ''
					};
				}

				hotelsPool[hotel.resultsHotelId] = hotel;
			});

			// Get city info from the search info object (new way).
			if (this.searchInfo && this.searchInfo() && this.searchInfo().segments.length) {
				var cityId = this.searchInfo().segments[0][1];

				if (cityId && this.$$rawdata.guide.cities && this.$$rawdata.guide.cities.hasOwnProperty(cityId)) {
					this.currentCity(this.$$rawdata.guide.cities[cityId]);
				}
			}

			// Get city info from the supplier (old way).
			if (!this.currentCity() && staticData && 'cities' in staticData) {
				this.currentCity({
					id: staticData.cities[0].id,
					name: staticData.cities[0].name
				});
			}

			this.hotels = ko.observableArray(hotels);
			this.hotelsPool = hotelsPool;
			this.showMaps(hasCoordinates);

			this.promotionalHotels = ko.observableArray(
				getPromotionalHotels(hotels, self.$$rawdata.hotels.search.resultData.promotionalHotels)
			);

			// nights count between dates entered in search form
			this.countOfNights = ko.observable(
				Math.floor((new Date(searchData.request.checkOutDate) - new Date(searchData.request.checkInDate)) / MILLISECONDS_IN_DAY)
			);
			
			this.maxAverageCustomerRating = ko.observable(maxAverageCustomerRating);

			this.filters = new HotelsFiltersViewModel(ko, minHotelPrice, maxHotelPrice);
			
			this.averageCustomerRatingComputed = ko.pureComputed(function () {
				if (self.maxAverageCustomerRating() === 0) {
					self.filters.sortTypes = [HotelsBaseModel.SORT_TYPES.BY_PRICE, HotelsBaseModel.SORT_TYPES.BY_STARS];
					self.filters.sortType(HotelsBaseModel.SORT_TYPES.BY_PRICE);
				}
			});
			this.initialAverageCustomerRating = this.averageCustomerRatingComputed();
			
			/**
			 * Returns sorted hotels
			 */
			this.getSortedHotels = ko.pureComputed(function () {
				self.filters.dummyObservalbe();

				/**
				 * Sorts hotels by rating (from max rating to min rating)
				 * @param currentElement
				 * @param nextElement
				 * @returns {number}
				 */
				var sortHotelsByPopular = function (currentElement, nextElement) {
					var currentElementRating = currentElement.staticDataInfo.averageCustomerRating,
						nextElementRating    = nextElement.staticDataInfo.averageCustomerRating;

					if (!currentElementRating) {
						return 1;
					}

					if (!nextElementRating) {
						return -1;
					}

					return currentElementRating.value > nextElementRating.value ? -1 : 1;
				};

				/**
				 * Sorts hotels by price (from min price to max price)
				 * @param currentElement
				 * @param nextElement
				 * @returns {number}
				 */
				var sortHotelsByPrice = function (currentElement, nextElement) {
					return currentElement.hotelPrice > nextElement.hotelPrice ? 1 : -1;
				};

				var sortHotelsByStars = function (currentElement, nextElement) {
					return currentElement.staticDataInfo.starRating.length < nextElement.staticDataInfo.starRating.length ? 1 : -1;
				};

				if (self.filters.sortType() === HotelsBaseModel.SORT_TYPES.BY_PRICE) {
					return self.hotels().sort(sortHotelsByPrice);
				}

				if (self.filters.sortType() === HotelsBaseModel.SORT_TYPES.BY_POPULAR) {
					return self.hotels().sort(sortHotelsByPopular);
				}

				if (self.filters.sortType() === HotelsBaseModel.SORT_TYPES.BY_STARS) {
					return self.hotels().sort(sortHotelsByStars);
				}

				return self.hotels();
			});

			this.preFilteredAndSortedHotels = ko.pureComputed(function() {
				// if any of filters weren't applied will return all hotels
				if (self.filters.isFilterEmpty()) {
					return self.getSortedHotels();
				}

				return ko.utils.arrayFilter(self.getSortedHotels(), function (hotel) {
					return self.filters.isMatchWithAllFilters(hotel);
				});
			});

			/**
			 * Returns array of hotels filtered by stars, features, price, and sorting
			 * @return {Array}
			 */
			this.getFilteredAndSortedHotels = ko.pureComputed(function () {
				var filteredHotels = self.preFilteredAndSortedHotels();

				if (self.$$controller.options.corporateHotelsShowcase) {
					return filteredHotels.filter(function (hotel) {
						return !hotel.isCorporateRates;
					});
				}

				return filteredHotels;
			});

			this.exceptStarFilteredHotels = ko.pureComputed(function () {
				if (self.filters.isFilterEmpty()) {
					return self.getSortedHotels();
				}

				return ko.utils.arrayFilter(self.getSortedHotels(), function (hotel) {
					return self.filters.isMatchWithAllFiltersExcept(hotel, HotelsFiltersViewModel.FILTER_TYPE_STARS);
				});
			});

			this.getHotelsExceptFeatureFilter = ko.pureComputed(function () {
				if (self.filters.isFilterEmpty()) {
					return self.getSortedHotels();
				}

				return ko.utils.arrayFilter(self.getSortedHotels(), function (hotel) {
					return self.filters.isMatchWithAllFiltersExcept(hotel, HotelsFiltersViewModel.FILTER_TYPE_FEATURE);
				});
			});

			/**
			 * Returns array of hotels which will be displayed to user (depends on filters, lazy load)
			 */
			this.slicedFilteredHotels = ko.pureComputed(function () {
				return self.getFilteredAndSortedHotels().slice(0, self.visibleHotelsCount());
			});

			this.showCaseHotels = ko.pureComputed(function () {
				if (!self.$$controller.options.corporateHotelsShowcase) {
					return [];
				}

				var filteredHotels = self.preFilteredAndSortedHotels();

				return filteredHotels.filter(function (hotel) {
					if (hotel.isCorporateRates) {
						return hotel;
					}
				});
			});

			this.slicedShowCaseHotels = ko.pureComputed(function () {
				return self.showCaseHotels().slice(0, self.showCaseVisibleItems());
			});

			this.distanceFromCenter = new SliderViewModel(
				ko,
				SliderViewModel.TYPE_MIN,
				GoogleMapModel.MAP_DISTANCE_MIN,
				GoogleMapModel.MAP_DISTANCE_MAX
			);

			this.isResultEmpty = ko.pureComputed(function () {
				return !self.filters.isFilterEmpty() && self.preFilteredAndSortedHotels() && self.preFilteredAndSortedHotels().length === 0;
			});

			function updateMapMarkers(hotels) {
				var METERS_PER_ONE_KILOMETER = 1000;

				if (self.circle) {
					self.circle.setRadius(self.distanceFromCenter.rangeMin() * METERS_PER_ONE_KILOMETER); // sets radius in meters
				}

				var bounds = self.addMarkersOnMap(hotels);

				if (bounds) {
					self.maps['map'].fitBounds(bounds);
					self.maps['map'].panToBounds(bounds);
				}
			}

			// hotels shown on google map in circle
			this.inCircleFilteredHotels = ko.pureComputed(function () {
				self.filters.dummyObservalbe();

				var minPrice           = Infinity,
					index              = 0,
					minPriceHotelIndex = 0;

				var hotels = ko.utils.arrayFilter(self.preFilteredAndSortedHotels(), function (hotel) {

					hotel.staticDataInfo.isBestPrice = false;

					var showHotel = hotel.distanceFromCenter <= self.distanceFromCenter.rangeMin();

					if (showHotel) {

						if (hotel.hotelPrice < minPrice) {
							minPrice = hotel.hotelPrice;
							minPriceHotelIndex = index;
						}

						index++;
					}

					return showHotel;
				});

				if (hotels[minPriceHotelIndex]) {
					hotels[minPriceHotelIndex].staticDataInfo.isBestPrice = true;
				}

				return hotels;
			});

			this.inCircleFilteredHotels.subscribe(function (hotels) {
				updateMapMarkers(hotels);
			});

			/**
			 * Returns minimal hotel price by stars
			 * @return {Array}
			 */
			this.minStarPrices = ko.pureComputed(function () {
				var minPrices = [],
					hotels    = self.exceptStarFilteredHotels();

				for (var star = 0; star <= HotelsFiltersViewModel.STARS_MAX_COUNT; star++) {
					minPrices[star] = 0;
				}

				hotels.forEach(function (hotel) {
					var hotelStar = hotel.staticDataInfo.starRating ? hotel.staticDataInfo.starRating.length : 0,
						price     = hotel.priceObservable;

					if (!minPrices[hotelStar] || minPrices[hotelStar].amount() > price.amount()) {
						minPrices[hotelStar] = price;
					}

				});

				return minPrices;
			});

			/**
			 * Returns summary hotels count of each feature.
			 *
			 * @return {Object}
			 */
			this.featuresCount = ko.pureComputed(function () {
				var self                = this,
					featureFilterValues = {},
					hotels              = self.getHotelsExceptFeatureFilter();

				hotels.forEach(function (hotel) {
					var hotelServices = hotel.staticDataInfo.popularFeatures || [];

					hotelServices.map(function (feature) {
						if (!featureFilterValues[feature]) {
							featureFilterValues[feature] = {
								id: feature,
								count: 0
							};

							if (feature in self.popularHotelsFeatures) {
								featureFilterValues[feature].name = self.popularHotelsFeatures[feature];
							}
						}

						featureFilterValues[feature].count++;
					});
				});
				
				this.filters.featureFilter.setFilterValues(featureFilterValues);

			}, this);

			this.hotelsChainCount = ko.pureComputed(function() {
				var self 		= this,
					hotelsChains = {};

				hotels.forEach(function (hotel) {
					if(hotel.hotelChainName) {
						if (!hotelsChains.hasOwnProperty(hotel.hotelChainName)) {
							hotelsChains[hotel.hotelChainName] = {
								id: hotel.hotelChainName,
								name: hotel.hotelChainName,
								count: 0
							}
						}
						hotelsChains[hotel.hotelChainName].count++;
					}
				});

				this.filters.hotelsChainFilter.setFilterValues(hotelsChains);

			}, this);

			this.specialConditionsCount = ko.pureComputed(function() {
				var self = this,
					specialConditions = {specialOffer : 0, corporateRates: 0},
					hotels = self.getHotelsExceptFeatureFilter(),
					resultSpecialValues = {};
					
					hotels.forEach(function (hotel) {
						if(self.isSpecialOfferExist(hotel)) {
							specialConditions.specialOffer++;
							isFilterVisible = true;
						}
						if(self.isСorporateRatesExist(hotel) && !self.$$controller.options.corporateHotelsShowcase) {
							specialConditions.corporateRates++;
						}
					});

					if (specialConditions.specialOffer > 0) {
						resultSpecialValues['SpecialOffer'] = {id: 'isSpecialOffer', name: this.$$controller.i18n('HotelsSearchResults','header-flag__special-offer'), count: specialConditions.specialOffer};
					}

					if (specialConditions.corporateRates > 0) {
						resultSpecialValues['CorporateRates'] = {id: 'isCorporateRates', name: this.$$controller.i18n('HotelsSearchResults','header-flag__corporate-rates'), count: specialConditions.corporateRates};
					}
					
					this.filters.specialFilter.setFilterValues(resultSpecialValues);
			}, this);

			this.initialMinStarPrices = this.minStarPrices();
			this.initialFeaturesCount = this.featuresCount();
			this.initialSpecialCount = this.specialConditionsCount();
			this.initialHotelsChainCount = this.hotelsChainCount();

			/**
			 * Returns hotels count what can be loaded with lazy loading
			 * @return {Number}
			 */
			this.lazyLoadHotelsCount = ko.pureComputed(function () {
				var hiddenHotelsCount = self.getFilteredAndSortedHotels().length - self.visibleHotelsCount();

				return Math.min(
					Math.max(hiddenHotelsCount, 0),
					HotelsBaseModel.MAX_HOTELS_COUNT_WHAT_CAN_BE_LOADED_WITH_LAZY_LOADING
				);
			});

			this.hideShowMoreButton = ko.pureComputed(function () {
				return self.lazyLoadHotelsCount() === 0;
			});

			this.hideShowCaseMoreButton = ko.pureComputed(function() {
				return self.slicedShowCaseHotels().length >= self.showCaseHotels().length;
			});

			this.searchFormURL = ko.pureComputed(function () {
				return self.$$controller.options.root + 'hotels';
			});

			this.showNextHotels = function () {
				self.visibleHotelsCount(self.visibleHotelsCount() + self.lazyLoadHotelsCount());
			};

			this.showCaseNextHotels = function () {
				self.showCaseVisibleItems(self.showCaseVisibleItems() + 4);
			};

			/**
			 * Hide hotel check error popup.
			 */
			this.hideHotelCheckErrorPopup = function () {
				self.bookingCheckError(false);
			};

			/**
			 * @deprecated
			 *
			 * @param hotels
			 * @returns {[*,*]}
			 */
			function getMinAndMaxPriceOrArrayOfHotels(hotels) {
				var minPrice = Infinity,
					maxPrice = -Infinity;

				hotels.forEach(function (hotel) {
					if (hotel) {
						if (hotel.hotelPrice < minPrice) {
							minPrice = hotel.hotelPrice;
						}

						if (hotel.hotelPrice > maxPrice) {
							maxPrice = hotel.hotelPrice;
						}
					}
				});

				return [minPrice, maxPrice];
			}

			/**
			 * Text for "Show XX more variants" button.
			 */
			this.showNextHotelsButtonText = ko.pureComputed(function () {
				var lazyLoadHotelsCount = self.lazyLoadHotelsCount();

				return this.$$controller.i18n('HotelsSearchResults', 'showAlsoVariants', {
					value: lazyLoadHotelsCount,
					variants: this.$$controller.i18n('HotelsSearchResults', 'variants_' + helpers.getNumeral(lazyLoadHotelsCount, 'one', 'twoToFour', 'fourPlus'))
				});
			}, this);

			// returns string like "ночь", "ночи", "ночей"
			this.labelAfterNights = ko.pureComputed(function () {
				return self.$$controller.i18n(
					'HotelsSearchResults',
					'PH__label_after_nights_' + helpers.getNumeral(self.countOfNights(), 'one', 'two_to_four', 'more_than_five')
				);
			});

			// returns string like "Цена за 28 ночей"
			this.displayCountOfNightsPrice = ko.pureComputed(function () {
				return self.$$controller.i18n('HotelsSearchResults', 'PF__filter__price_part') + ' ' + self.countOfNights() + ' ' + self.labelAfterNights();
			});

			if (typeof this.$$rawdata.system !== 'undefined' && typeof this.$$rawdata.system.error !== 'undefined') {
				this.$$error(this.$$rawdata.system.error.message);
			}
			else {
				// Processing options
				this.options = this.$$rawdata.hotels.search.resultData;
			}

			this.fillSearchForm();

			this.breadCrumbsVariants.notifySubscribers();

			this.resultsLoaded(true);

			function getHotelById(id) {
				return id in self.hotelsPool ? self.hotelsPool[id] : null;
			}

			var hotelId = self.$$controller.router.current.getParameterValue('hotel_id');

			if (hotelId) {
				self.showCardHotel(getHotelById(hotelId));
			}
		};

		HotelSearchResultsModel.prototype.mapPopularHotelFeatures = function (features) {
			var result = {};

			if (features instanceof Array && features.length) {
				features.map(function (feature) {
					result[feature.type] = feature.title;
				});
			}

			return result;
		};

		HotelSearchResultsModel.prototype.fillSearchForm = function () {
			// var staticDataInfo = this.$$rawdata.hotels && this.$$rawdata.hotels.staticDataInfo ? this.$$rawdata.hotels.staticDataInfo : {};
			var staticDataInfo = this.$$rawdata.guide ? this.$$rawdata.guide : {},
				searchInfo;

			if (this.$$rawdata.hotels && this.$$rawdata.hotels.search && this.$$rawdata.hotels.search.request) {
				searchInfo = this.createCookieParamsFromResponse(this.$$rawdata.hotels.search.request);
			}
			else {
				searchInfo = LocalStorage.get('searchFormData');
			}

			var form = this.searchForm = new BreadcrumbViewModel(searchInfo, this.$$controller, staticDataInfo);

			if (this.$$controller.router.current.getParameterValue('search_id')) {
				RecentSearchModel.add(this.$$controller.router.current.getParameterValue('search_id'), {
					title: form.city.name + ', ' +
					form.arrivalDate.getShortDateWithDOW() + ' - ' + form.departureDate.getShortDateWithDOW()
				});
			}
		};

		return HotelSearchResultsModel;
	}
);
