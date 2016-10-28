define(
    [
        'knockout',
        'js/vm/helpers',
        'js/vm/BaseControllerModel',
        'jsCookie',
        'dotdotdot',
        'js/vm/Models/SelectRoomsViewModel',
        'js/vm/Models/HotelSearchResultsModel',
        'js/vm/Models/HotelsBaseModel',
        'js/vm/Models/RecentSearchModel',
        'js/vm/Models/RecentHotelsModel'
    ], function (ko,
                 helpers,
                 BaseControllerModel,
                 Cookie,
                 dotdotdot,
                 SelectRoomsViewModel,
                 HotelSearchResultsModel,
                 HotelsBaseModel,
                 RecentSearchModel,
                 RecentHotelsModel) {

        function changePhotos(photos) {
            var arrayInfoPhotos = [];

            photos.forEach(function (url) {
                arrayInfoPhotos.push({
                    img: url,
                    thumb: url
                });
            });

            return arrayInfoPhotos;
        }

        function HotelsSearchResultsController(componentParameters) {
            
            var self = this;

            BaseControllerModel.apply(this, arguments);
            HotelSearchResultsModel.apply(this, arguments);

            var getSearchId = function () {
                return self.$$controller.router.current.getParameterValue('search_id');
            };

            this.searchId = ko.observable(null);

            this.roomServicesList = HotelsBaseModel.ROOM_SERVICES;

            this.name = 'HotelsSearchResultsController';
            this.errorCode = ko.observable(false);
            this.$$loading = ko.observable(false);
            this.PFActive = ko.observable(false);
            this.mode = HotelsBaseModel.MODE_ID;
            this.resultsTypeCookie = 'HotelsSearchForm';
            this.currentCity = ko.observable('');
            this.currentActiveTab = ko.observable(HotelsBaseModel.DEFAULT_TAB);
            this.recentSearches = ko.observableArray(helpers.toArray(RecentSearchModel.getLast()));

            this.isTabActive = ko.computed(function () {
                return function (tab) {
                    return self.currentActiveTab() === tab;
                };
            });

            this.setActiveTab = function (tab) {
                self.currentActiveTab(tab);
            };

            this.bigMapIsVisible = ko.observable(false);

            this.showBigMap = function (hotel, clickOnBound) {
                clickOnBound = typeof clickOnBound === 'undefined' ? false : clickOnBound;
                self.bigMapIsVisible(true);
                this.initHotelCardMap(hotel, 'hotelBigMap', clickOnBound, true);
            };

            /** Hotels count displayed to user */
            this.visibleHotelsCount = ko.observable(HotelsBaseModel.DEFAULT_VISIBLE_HOTELS_COUNT);

            this.countOfNights = ko.observable(0);

            this.isListView = ko.observable(true);
            this.oldMarkers = ko.observable([]);

            this.searchInfo = ko.observable({});

            this.resultsLoaded = ko.observable(false);

            this.blocks = {

                // key is block id, value is Boolean value (visible or hidden)
                list: ko.observable({}),

                isVisible: ko.computed(function () {
                    return function (blockId) {
                        return self.blocks.list()[blockId] !== false;
                    };
                }, this),

                toggleVisibility: function (blockId) {
                    var data = self.blocks.list();

                    if (typeof data[blockId] === 'undefined') {
                        data[blockId] = true;
                    }

                    data[blockId] = !data[blockId];

                    self.blocks.list(data);
                }
            };

            this.mobileMenu = {

                opened: ko.observable(false),

                openedMain: ko.observable(false),
                openedCurrency: ko.observable(false),
                openedLanguage: ko.observable(false),

                openMain: function () {
                    this.openedMain(true);
                    this.openedLanguage(false);
                    this.openedCurrency(false);
                },

                openCurrency: function () {
                    this.openedMain(false);
                    this.openedLanguage(false);
                    this.openedCurrency(true);
                },

                openLanguage: function () {
                    this.openedMain(false);
                    this.openedCurrency(false);
                    this.openedLanguage(true);
                },

                clickHandler: function () {
                    $('body').addClass('nemo-common-mobileControlOpen');
                    this.opened(true);
                    this.openedMain(true);
                },

                close: function () {
                    $('body').removeClass('nemo-common-mobileControlOpen');
                    this.opened(false);
                    this.openedMain(false);
                },

                changeCurrency: function (currency) {
                    self.$$controller.viewModel.agency.onCurrencyChange(currency);
                    this.openMain();
                },

                changeLanguage: function (language) {
                    self.$$controller.viewModel.agency.changeLanguage(language);
                },
            };

            /**
             * Switch between map and list view
             */
            this.toggleView = function () {

                this.isListView(!this.isListView());

                if (!this.isListView()) {
                    // Show map with hotels
                    this.initMap();
                }
            };

            this.togglePFActive = function () {
                this.PFActive(!this.PFActive());
            };

            this.isShowResultIsEmpty = ko.computed(function () {
                return this.resultsLoaded() && !this.isCardHotelView() && this.isResultEmpty();
            }, this);

            this.searchFormActive = ko.observable(false);
            this.searchFormActive.subscribe(function () {
                $('.nemo-hotels-form').css('margin-top', 0);
            });

            this.hotels = ko.observableArray([]);

            this.$$controller.hotelsSearchCardActivated = ko.observable(false);
            this.isCardHotelView = ko.observable(false);
            this.hotelCard = ko.observable(null);

            this.breadCrumbsVariants = ko.computed(function () {

                var baseItems = [
                    {
                        title: 'hotels-step_search',
                        active: true,
                        link: '/hotels',
                        pageTitle: 'HotelsSearch'
                    },
                    {
                        title: 'hotels-step_results',
                        active: true,
                        link: '/hotels/results/' + (this.searchId() || ''),
                        pageTitle: 'HotelsResults'
                    }
                ];

                if (this.hotelCard()) {
                    baseItems.push({i18n: this.searchForm.city.country, active: false, pageTitle: 'HotelsSearch'});
                    baseItems.push({i18n: this.searchForm.city.name, active: false, pageTitle: 'HotelsSearch'});
                    baseItems.push({i18n: this.hotelCard().name, active: false, pageTitle: 'HotelsSearch'});
                } else {
                    baseItems.push({title: 'hotels-step_checkout', active: false});
                }

                return baseItems;

            }, this);

            this.isFilterNotificationVisible = ko.observable(Cookie.get('filter-notification-visible') !== 'false');

            this.hideFilterNotification = function () {
                Cookie.set('filter-notification-visible', 'false');
                this.isFilterNotificationVisible(false);
            };

            this.selectedRooms = new SelectRoomsViewModel(ko);

            this.showCardHotel = (function (hotel) {

                this.currentActiveTab(HotelsBaseModel.DEFAULT_TAB);
                this.selectedRooms.setHotel(hotel);
                this.recentViewedHotels(RecentHotelsModel.getLastThreeHotels());
                RecentHotelsModel.add(hotel);

                this.$$controller.navigate('/hotels/results/' + getSearchId() + '/' + hotel.id, false, 'HotelCard');
                this.isCardHotelView(true);

                this.$$controller.hotelsSearchCardActivated(true);
                this.$$controller.hotelsSearchController = this;

                this.hotelPhotos = changePhotos(hotel.staticDataInfo.photos || []);

                hotel.staticDataInfo.currentCity = this.currentCity();

                this.hotelCard(hotel);

                setTimeout(function () {
                    self.initHotelCardMap(hotel, 'cardHotelMap', false, true);
                }, 1000);

                $(window).scrollTop(0);
            }).bind(this);

            this.makeHotelLink = function (hotel) {
                return '/hotels/results/' + getSearchId() + '/' + hotel.id;
            };

            this.getHotelMainImage = function (hotel, defaultImage) {

                var photos = hotel.staticDataInfo.photos || [],
                    mainPhotoId = hotel.staticDataInfo.mainPhotoId,
                    url = 'url(' + (photos[mainPhotoId] ? photos[mainPhotoId] : '/img/no_hotel.png') + ')';

                if (defaultImage === 1) {
                    url += ', url(/img/no_hotel.svg)';
                } else if (defaultImage === 2) {
                    url += ', url(/img/hotel_thumb.svg)';
                }

                return url;
            };

            this.processInitParams();
        }

        // Extending from dictionaryModel
        helpers.extendModel(HotelsSearchResultsController, [BaseControllerModel, HotelSearchResultsModel]);

        HotelsSearchResultsController.prototype.$$KOBindings = ['common', 'HotelsResults'];

        HotelsSearchResultsController.prototype.$$usedModels = [
            'Common/Date',
            'Common/Duration',
            'Common/Money',
            'Common/PostFilter/Abstract',
            'Hotels/Common/Geo'
        ];

        HotelsSearchResultsController.prototype.$$i18nSegments = ['HotelsSearchForm', 'HotelsSearchResults', 'currencyNames'];

        HotelsSearchResultsController.prototype.pageTitle = null;

        return HotelsSearchResultsController;
    }
);
