'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseDynamicModel'], 
	function (ko, helpers, BaseDynamicModel) {
		function HotelsSearchResultsHotelRoom() {
			BaseDynamicModel.apply(this, arguments);
			
			/**
			 * Текущее количество отображаемых тарифов.
			 */
			this.visibleTariffsCount = ko.observable(HotelsSearchResultsHotelRoom.INITIAL_VISIBLE_COUNT);

			/**
			 * Отображаемые тарифы.
			 * 
			 * @returns {Array}
			 */
			this.visibleTariffs = ko.pureComputed(function () {
				return this.tariffs().slice(0, this.visibleTariffsCount());
			}, this);

			/**
			 * Кол-во спрятанных тарифов.
			 * 
			 * @returns {Number}
			 */
			this.hiddenTarrifsCount = ko.pureComputed(function () {
				return this.tariffs().length - this.visibleTariffs().length;
			}, this);

			/**
			 * Текст кнопки "Показать еще N тарифов".
			 */
			this.showAllText = ko.pureComputed(function () {
				var count = this.hiddenTarrifsCount(),
					showMoreText = this.$$controller.i18n('HotelsSearchResults', 'showMore');
				
				return (
					showMoreText +
					' ' +
					count +
					' ' +
					helpers.getNumeral(
						count,
						this.$$controller.i18n('HotelsSearchResults', 'variant_1'),
						this.$$controller.i18n('HotelsSearchResults', 'variant_2'),
						this.$$controller.i18n('HotelsSearchResults', 'variant_0')
					)
				);
			}, this);

			/**
			 * Отображать ли кнопку "Показать еще N тарифов".
			 */
			this.showHideButton = ko.pureComputed(function () {
				return this.visibleTariffsCount() > HotelsSearchResultsHotelRoom.INITIAL_VISIBLE_COUNT;
			}, this);

			this.guestsSummary = ko.pureComputed(function () {
				var rooms = this.resultsController().searchInfo().rooms,
					result = [],
					adults = 0,
					infants = 0;
				
				if (!rooms || !rooms.length) {
					return '';
				}

				adults += rooms[this.roomIndex()].adults;
				infants += rooms[this.roomIndex()].infants.length;
				
				if (adults) {
					result.push('&nbsp;&mdash;');
					result.push(adults);
					result.push(this.$$controller.i18n('HotelsSearchForm', 'hotels__passSummary_numeral_ADT_' + helpers.getNumeral(adults, 'one', 'twoToFour', 'fourPlus')));
					
					if (infants) {
						result.push(this.$$controller.i18n('HotelsSearchForm', 'hotels__passSummary_and'));
						result.push(infants);
						result.push(this.$$controller.i18n('HotelsSearchForm', 'hotels__passSummary_numeral_CLD_' + helpers.getNumeral(infants, 'one', 'twoToFour', 'fourPlus')));
					}
				}
				
				return result.length ? result.join('&nbsp;') : '';
			}, this);
		}
		
		helpers.extendModel(HotelsSearchResultsHotelRoom, [BaseDynamicModel]);

		/**
		 * Кол-во отображаемых тарифов по умолчанию, остальные спрятаны.
		 * 
		 * @type {number}
		 */
		HotelsSearchResultsHotelRoom.INITIAL_VISIBLE_COUNT = 3;

		/**
		 * Показать все тарифы.
		 */
		HotelsSearchResultsHotelRoom.prototype.showAllTariffs = function () {
			this.visibleTariffsCount(this.visibleTariffsCount() + this.hiddenTarrifsCount());
		};

		/**
		 * Показать только фиксированное кол-во тарифов, спрятав остальные.
		 */
		HotelsSearchResultsHotelRoom.prototype.hideTariffs = function () {
			this.visibleTariffsCount(HotelsSearchResultsHotelRoom.INITIAL_VISIBLE_COUNT);
		};
	
		return HotelsSearchResultsHotelRoom;
	}
);
