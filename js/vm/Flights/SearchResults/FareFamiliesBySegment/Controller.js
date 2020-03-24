'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/Flights/SearchResults/FareFamilies/Controller', '../FareFamilies/Abstract', 'js/lib/md5/md5', 'js/vm/EventManager'],
	function (ko, helpers, FlightsSearchResultsFareFamiliesController, AbstractFareFamiliesController, md5, Analytics) {
		function FlightsSearchResultsFareFamiliesBySegmentController(componentParameters) {
			FlightsSearchResultsFareFamiliesController.apply(this, arguments);
			AbstractFareFamiliesController.apply(this, arguments);

			this.parentFlightId = this.parentFlight.id;
			this.requestURL = this.$$controller.options.dataURL + '/flights/search/fareFamiliesSegmented/' + this.parentFlightId;
			this.hash = md5(this.parentFlight.id + Math.random() + 'fareFamiliesBySegment');
		}

		helpers.extendModel(FlightsSearchResultsFareFamiliesBySegmentController, [FlightsSearchResultsFareFamiliesController, AbstractFareFamiliesController]);

		/**
		 * Юзер выбрал перелет и нажал "Купить".
		 */
		FlightsSearchResultsFareFamiliesBySegmentController.prototype.bookFlight = function () {
			if (this.selectedFlightId && this.isValid() && !this.state().choosingFlight()) {
				var self = this;

				this.state().choosingFlight(true);

				this.resultsController.bookFlight(this.handleFlightIdsBeforeBooking([ this.selectedFlightId ]), {
					altFlightHasBeenChosen: true,
					parentFlightId: this.parentFlight.id
				});

				// Не показываем лоадер, если изменилась цена перелета.
				this.resultsController.bookingCheckPriceChangeData.subscribe(function (newVal) {
					if (newVal) {
						self.state().choosingFlight(false);
					}
				});
			}
		};

		/**
		 * Функция перевода меток.
		 */
		FlightsSearchResultsFareFamiliesBySegmentController.prototype.i18n = function (module, key) {
			return this.$$controller.i18n(module, key);
		};

		/**
		 * Функция получения модели денег.
		 */
		FlightsSearchResultsFareFamiliesBySegmentController.prototype.getMoneyModel = function (object) {
			return this.$$controller.getModel('Common/Money', object);
		};

		/**
		 * Триггерим событие веб-аналитики.
		 */
		FlightsSearchResultsFareFamiliesBySegmentController.prototype.analytics = function (name) {
			Analytics.tap(name);
		};

		/**
		 * Парсим ответ от сервера.
		 */
		FlightsSearchResultsFareFamiliesBySegmentController.prototype.processResponse = function (response) {
			return response;
		};

		/**
		 * Достаем название семейства.
		 */
		FlightsSearchResultsFareFamiliesBySegmentController.prototype.getFamilyName = function (family) {
			return family.familyName;
		};

		/**
		 * Парсим объект семейства.
		 */
		FlightsSearchResultsFareFamiliesBySegmentController.prototype.processFareFamily = function (data) {
			var family = Object.create(data);
			family.familyCode = family.id;

			return family;
		};

		/**
		 * Заменяем в семействе для конкретного сегмента инфу о багаже.
		 */
		FlightsSearchResultsFareFamiliesBySegmentController.prototype.replaceBaggageInFamily = function (family, baggageFeature) {
			if (family.features.hasOwnProperty('baggage') && family.features.baggage) {
				// Сначала удаляем все объекты с багажом и оставляем только ручную кладь.
				family.features.baggage = family.features.baggage.filter(function (feature) {
					return feature.code !== 'baggage';
				});

				// Добавляем новый объект с багажом.
				family.features.baggage.push(baggageFeature);
			}
		};

		return FlightsSearchResultsFareFamiliesBySegmentController;
	}
);
