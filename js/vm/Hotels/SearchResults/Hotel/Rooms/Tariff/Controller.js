'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseControllerModel'],
	function (ko, helpers, BaseControllerModel) {
		function HotelsSearchResultsHotelRoomsTariffController(params) {
			BaseControllerModel.apply(this, arguments);
			
			this.roomIndex = parseInt(params.roomIndex);
			this.tariff = params.tariff;
			this.selectedRoomsTariffs = params.selectedRoomsTariffs;
			this.tariffCombinations = params.tariffCombinations;
			this.resultsController = params.resultsController;
			this.originalSelectTariffForRoom = params.selectTariffForRoom;

			/**
			 * Полное название тарифа комнаты.
			 * 
			 * @returns {String}
			 */
			this.tariffName = ko.pureComputed(function () {
				if (this.tariff.type) {
					return this.tariff.type.commonName ? this.tariff.type.commonName : this.tariff.type.name;
				}
				else {
					return '';
				}
			}, this);

			/**
			 * Цена за 1 ночь.
			 * 
			 * @returns {Money}
			 */
			this.pricePerNight = ko.pureComputed(function () {
				var numOfNights = parseInt(this.resultsController.countOfNights()),
					amount = this.tariff.rate.price.amount();

				if (numOfNights) {
					amount /= numOfNights;
				}
				
				return this.$$controller.getModel('Common/Money', {
					amount: amount,
					currency: this.tariff.rate.price.currency()
				});
			}, this);

			/**
			 * Выбран ли тариф.
			 * 
			 * @returns {Boolean}
			 */
			this.isSelected = ko.pureComputed(function () {
				return this.selectedRoomsTariffs()[this.roomIndex]() === this.tariff;
			}, this);
			
			/**
			 * Можно ли выбрать тариф.
			 * Выбор может быть запрещен в соответствии с доступными комбинациями тарифов
			 *
			 * @returns {Boolean}
			 */
			this.isSelectable = ko.pureComputed(function () {
				if (!Object.keys(this.tariffCombinations()).length) {
					return true;
				}

				var selectedRoomsTariffs = this.selectedRoomsTariffs(),
					selectedCount        = 0,
					possibleCombination  = [],
					result               = false;

				_.forOwn(selectedRoomsTariffs, function (tariff, selectedRoomIndex) {
					selectedRoomIndex = parseInt(selectedRoomIndex);

					if (selectedRoomIndex === this.roomIndex) {
						possibleCombination.push(this.tariff.id);
					}
					else {
						if (tariff()) {
							selectedCount++;
							possibleCombination.push(tariff().id);
						}
						else {
							// формируем заготовку под regexp
							possibleCombination.push('(\\d+)');
						}
					}
				}.bind(this));

				// Если еще ничего не выбрали, то значит можно ткнуть куда угодно.
				if (selectedCount === 0) {
					result = true;
				}
				else {
					possibleCombination = new RegExp(possibleCombination.join('_'));

					for (var combination in this.tariffCombinations()) {
						if (possibleCombination.test(combination)) {
							result = true;
							break;
						}
					}
				}

				return result;
			}, this);
			
			this.cancellationTooltipId = ko.pureComputed(function () {
				return 'cancellationTooltip_' + this.roomIndex + '_' + this.tariff.id;
			}, this);
		}

		helpers.extendModel(HotelsSearchResultsHotelRoomsTariffController, [BaseControllerModel]);

		HotelsSearchResultsHotelRoomsTariffController.prototype.selectTariffForRoom = function () {
			if (this.isSelectable()) {
				this.originalSelectTariffForRoom(this.roomIndex, this.tariff);
			}
		};

		return HotelsSearchResultsHotelRoomsTariffController;
	}
);