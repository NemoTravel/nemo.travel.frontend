'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseControllerModel', 'js/vm/Models/RecentHotelsModel'],
	function (ko, helpers, BaseControllerModel, RecentHotelsModel) {
		/**
		 * Hotel card component.
		 * 
		 * @param params
		 * @constructor
		 */
		function HotelsSearchResultsHotelController(params) {
			BaseControllerModel.apply(this, arguments);
			
			// Params
			this.hotel = params.hotel;
			this.resultsController = params.resultsController;

			// Observables
			this.recentHotels = ko.pureComputed(function () {
				return RecentHotelsModel.getLastThreeHotels(this.hotel(), this.resultsController.hotelsPool);
			}, this);
			
			this.activeTab = ko.observable('rooms');
			
			// Properties
			this.tabs = [
				{
					name: 'rooms',
					title: this.$$controller.i18n('HotelsSearchResults', 'tabRooms'),
					isActive: ko.pureComputed(function () { return this.activeTab() === 'rooms'; }, this)
				},
				{
					name: 'about',
					title: this.$$controller.i18n('HotelsSearchResults', 'tabAboutHotel'),
					isActive: ko.pureComputed(function () { return this.activeTab() === 'about'; }, this),
					initCallback: function () {
						return this.resultsController.initHotelCardMap(this.hotel(), 'aboutLocationMap');
					}.bind(this)
				},
				{
					name: 'conveniences',
					title: this.$$controller.i18n('HotelsSearchResults', 'tabConveniences'),
					isActive: ko.pureComputed(function () { return this.activeTab() === 'conveniences'; }, this)
				},
				{
					name: 'rules',
					title: this.$$controller.i18n('HotelsSearchResults', 'tabHotelRules'),
					isActive: ko.pureComputed(function () { return this.activeTab() === 'rules'; }, this)
				}
			];
		}

		helpers.extendModel(HotelsSearchResultsHotelController, [BaseControllerModel]);

		/**
		 * @param {object} tab
		 */
		HotelsSearchResultsHotelController.prototype.selectTab = function (tab) {
			this.activeTab(tab.name);

			if (typeof tab.initCallback === 'function') {
				tab.initCallback();
			}
		};

		/**
		 * Opens search form and smoothly scrolls the page to the top.
		 *
		 * All these timeouts are needed for proper UI reaction.
		 *
		 * Little time for a search form to open.
		 * Little time for a ko.bindingHandlers.hotelsResultsSearchFormHider to trigger.
		 */
		HotelsSearchResultsHotelController.prototype.openSearchFormAndFocus = function () {
			setTimeout(function () {
				var $searchForm = $('.js-hotels-results__formOpener'),
					scrollPosition;

				if ($searchForm.length) {
					scrollPosition = $searchForm.offset().top;

					setTimeout(function () {
						this.resultsController.searchFormActive(true);
						helpers.scroll(scrollPosition, 500);
					}.bind(this), 5);
				}
			}.bind(this), 5);
		};

		return HotelsSearchResultsHotelController;
	}
);