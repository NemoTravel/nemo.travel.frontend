define(['js/vm/Models/SliderViewModel', 'js/vm/Models/HotelsBaseModel', 'js/vm/helpers', 'js/vm/Models/FilterModel'], function (SliderViewModel, HotelsBaseModel, helpers, FilterModel) {

	function HotelsFiltersViewModel(ko, minRoomPrice, maxRoomPrice) {

		var self = this;

		self.minRoomPrice = minRoomPrice;
		self.maxRoomPrice = maxRoomPrice;

		self.dummyObservalbe = ko.observable();

		self.sortTypes = [HotelsBaseModel.SORT_TYPES.BY_POPULAR, HotelsBaseModel.SORT_TYPES.BY_PRICE];
		self.sortType = ko.observable(HotelsBaseModel.SORT_TYPES.BY_POPULAR);

		self.starRatingFilterValues = {};

		self.resetStarFilter = function () {
			for (var i = 0; i <= HotelsFiltersViewModel.STARS_MAX_COUNT; i++) {
				if (!ko.isObservable(self.starRatingFilterValues[i])) {
					self.starRatingFilterValues[i] = ko.observable(false);
				} else {
					self.starRatingFilterValues[i](false);
				}
			}
		};

		self.resetStarFilter();

		self.findByName = ko.observable('');
		self.hotelsChainFilter = new FilterModel();
		self.featureFilter = new FilterModel();
		self.nightsCountPriceFilter = new SliderViewModel(ko, SliderViewModel.TYPE_RANGE, minRoomPrice, maxRoomPrice);
		self.averageCustomerRatingFilter = new SliderViewModel(ko, SliderViewModel.TYPE_MIN, HotelsFiltersViewModel.CUSTOMER_RATING_MIN, HotelsFiltersViewModel.CUSTOMER_RATING_MAX);
		self.specialFilter = new FilterModel();

		self.isStarFilterEmpty = ko.pureComputed(function () {
			return helpers.objectFilter(self.starRatingFilterValues, function (filterValue) {
					return true === filterValue();
				}).length === 0;
		});

		self.isFilterEmpty = ko.pureComputed(function () {
			return self.isStarFilterEmpty() && self.nightsCountPriceFilter.isDefault() &&
						self.averageCustomerRatingFilter.isDefault() && self.featureFilter.isDefault() &&
						self.findByName().length < 2 && self.specialFilter.isDefault() &&
						self.hotelsChainFilter.isDefault();
		});

		/**
		 *
		 * @param hotel
		 * @param filter
		 * @returns {*}
		 */
		self.isMatchWithFilter = function (hotel, filter) {

			/**
			 *
			 * @returns {boolean}
			 */
			var isMatchStarFilter = function (hotel) {

				var hotelStars = hotel.staticDataInfo.starRating ? hotel.staticDataInfo.starRating.length : 0;

				if (self.isStarFilterEmpty()) {
					return true;
				}

				var matches = helpers.objectFilter(self.starRatingFilterValues, function (isFilterChecked, starCount) {
					return isFilterChecked() === true && (hotelStars === parseInt(starCount, 10));
				});

				return matches.length > 0;
			};

			/**
			 * @returns {boolean}
			 */
			var isMatchFiveNightPriceFilter = function (hotel) {

				if (self.nightsCountPriceFilter.isDefault()) {
					return true;
				}

				var isMatchMinPrice = true,
					isMatchMaxPrice = true;

				if (self.nightsCountPriceFilter.isMinRangeChanged()) {
					isMatchMinPrice = Math.ceil(hotel.hotelPrice) >= self.nightsCountPriceFilter.rangeMin();
				}

				if (self.nightsCountPriceFilter.isMaxRangeChanged()) {
					isMatchMaxPrice = Math.floor(hotel.hotelPrice) <= self.nightsCountPriceFilter.rangeMax();
				}

				return isMatchMinPrice && isMatchMaxPrice;
			};

			/**
			 * @returns {*}
			 */
			var isMatchAverageCustomerRatingFilter = function (hotel) {

				var hotelRating = hotel.staticDataInfo.averageCustomerRating ? hotel.staticDataInfo.averageCustomerRating.value : 0;

				if (self.averageCustomerRatingFilter.isDefault()) {
					return true;
				}

				return hotelRating >= self.averageCustomerRatingFilter.rangeMin();
			};

			var isMatchHotelName = function (hotel) {
				
				if (hotel.name.toLowerCase().indexOf(self.findByName().toLowerCase()) >= 0 && self.findByName().length >= 2 || self.findByName().length < 2) {
					return true;
				} 
				else {
					return false;
				}
				
			};

			var isMatchSpecialFilter = function (hotel, selectedFilters) {
				var matchFilters = 0,
					checkedFilters = 0;
			
				if (self.specialFilter.isDefault()) {
					return true;
				}

				helpers.iterateObject(selectedFilters, function (filter) {
					checkedFilters++;
					if(hotel.hasOwnProperty(filter.id) && hotel[filter.id] === true)
						matchFilters++;
				});

				return checkedFilters === matchFilters;
			};

			var isMatchHotelsChainFilter = function (hotel, selectedFilters) {
				var matchFilters = 0;

				if (self.hotelsChainFilter.isDefault()) {
					return true;
				}

				helpers.iterateObject(selectedFilters, function (filter) {
					if (filter.checked()) {
						if (hotel.hotelChainName === filter.name)
							matchFilters++;
					}
				});

				return matchFilters > 0;
			};

			if (filter === HotelsFiltersViewModel.FILTER_TYPE_STARS) {
				return isMatchStarFilter(hotel);
			}

			if (filter === HotelsFiltersViewModel.FILTER_TYPE_PRICE) {
				return isMatchFiveNightPriceFilter(hotel);
			}

			if (filter === HotelsFiltersViewModel.FILTER_TYPE_RATING) {
				return isMatchAverageCustomerRatingFilter(hotel);
			}

			if (filter === HotelsFiltersViewModel.FILTER_TYPE_FEATURE) {
				return self.featureFilter.isMatch(hotel);
			}

			if (filter === HotelsFiltersViewModel.FILTER_TYPE_SPECIAL) {
				return isMatchSpecialFilter(hotel, self.specialFilter.values());
			}

			if (filter === HotelsFiltersViewModel.FILTER_TYPE_NAME) {
				return isMatchHotelName(hotel);
			}

			if (filter === HotelsFiltersViewModel.FILTER_TYPE_CHAIN) {
				return isMatchHotelsChainFilter(hotel, self.hotelsChainFilter.values());
			}

			return false;
		};

		/**
		 * Check is hotel matches with applied filters
		 * @param hotel
		 * @return {Boolean}
		 */
		self.isMatchWithAllFilters = function (hotel) {

			var matchFilters = HotelsFiltersViewModel.FILTERS.filter(function (filterId) {
				return self.isMatchWithFilter(hotel, filterId);
			});

			return matchFilters.length === HotelsFiltersViewModel.FILTERS.length;
		};

		/**
		 * Check is hotel matches with all filters ignoring passed filter
		 * @param hotel
		 * @param exceptFilter
		 * @returns {boolean}
		 */
		self.isMatchWithAllFiltersExcept = function (hotel, exceptFilter) {

			if (exceptFilter === HotelsFiltersViewModel.FILTER_TYPE_FEATURE) {
				return self.isMatchWithFilter(hotel, HotelsFiltersViewModel.FILTER_TYPE_STARS) &&
					self.isMatchWithFilter(hotel, HotelsFiltersViewModel.FILTER_TYPE_PRICE) &&
					self.isMatchWithFilter(hotel, HotelsFiltersViewModel.FILTER_TYPE_RATING) &&
					self.isMatchWithFilter(hotel, HotelsFiltersViewModel.FILTER_TYPE_NAME) && 
					self.isMatchWithFilter(hotel, HotelsFiltersViewModel.FILTER_TYPE_SPECIAL) &&
					self.isMatchWithFilter(hotel, HotelsFiltersViewModel.FILTER_TYPE_CHAIN);
			}

			if (exceptFilter === HotelsFiltersViewModel.FILTER_TYPE_STARS) {
				return self.isMatchWithFilter(hotel, HotelsFiltersViewModel.FILTER_TYPE_PRICE) &&
					self.isMatchWithFilter(hotel, HotelsFiltersViewModel.FILTER_TYPE_FEATURE) &&
					self.isMatchWithFilter(hotel, HotelsFiltersViewModel.FILTER_TYPE_RATING) &&
					self.isMatchWithFilter(hotel, HotelsFiltersViewModel.FILTER_TYPE_SPECIAL) &&
					self.isMatchWithFilter(hotel, HotelsFiltersViewModel.FILTER_TYPE_CHAIN);
			}

			return false;
		};

		self.resetAllFilters = function () {
			self.nightsCountPriceFilter.reset();
			self.resetStarFilter();
			self.featureFilter.resetFilters();
			self.averageCustomerRatingFilter.reset();
			self.findByName('');
			self.hotelsChainFilter.resetFilters();
		};
	}

	HotelsFiltersViewModel.FILTER_TYPE_PRICE = 'price';
	HotelsFiltersViewModel.FILTER_TYPE_STARS = 'stars';
	HotelsFiltersViewModel.FILTER_TYPE_FEATURE = 'feature';
	HotelsFiltersViewModel.FILTER_TYPE_SPECIAL = 'special';
	HotelsFiltersViewModel.FILTER_TYPE_RATING = 'rating';
	HotelsFiltersViewModel.FILTER_TYPE_NAME = 'name';
	HotelsFiltersViewModel.FILTER_TYPE_CHAIN = 'chain';

	HotelsFiltersViewModel.FILTERS = [
		HotelsFiltersViewModel.FILTER_TYPE_PRICE,
		HotelsFiltersViewModel.FILTER_TYPE_STARS,
		HotelsFiltersViewModel.FILTER_TYPE_FEATURE,
		HotelsFiltersViewModel.FILTER_TYPE_RATING,
		HotelsFiltersViewModel.FILTER_TYPE_NAME,
		HotelsFiltersViewModel.FILTER_TYPE_SPECIAL,
		HotelsFiltersViewModel.FILTER_TYPE_CHAIN
	];

	HotelsFiltersViewModel.CUSTOMER_RATING_MIN = 0;
	HotelsFiltersViewModel.CUSTOMER_RATING_MAX = 10;

	HotelsFiltersViewModel.STARS_MAX_COUNT = 5;

	helpers.extendModel(HotelsFiltersViewModel, [HotelsBaseModel]);

	return HotelsFiltersViewModel;
});
