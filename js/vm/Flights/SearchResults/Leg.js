define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseStaticModel'],
	function (ko, helpers, BaseModel) {
		function Leg(initialData) {
			BaseModel.apply(this, arguments);
			
			this.baseBaggage = this.getBaseBaggage();
			this.baseBaggageText = this.buildBaggageText(this.baseBaggage);
			this.baseBaggageTooltip = this.buildBaggageTooltip(this.baseBaggage);
			this.transfersText = this.buildTransfersText();
			this.transfersNumberText = this.buildTransfersNumberText();
			this.transfersTimeText = this.timeTransfers.readableStringShort() + ', ';
		}

		helpers.extendModel(Leg, [BaseModel]);

		/**
		 * Генерит текст с названиями городов пересадок "Саратов, Москва".
		 * 
		 * @returns {string}
		 */
		Leg.prototype.buildTransfersText = function () {
			var transfers = this.transfers,
				result = '';
			
			if (transfers instanceof Array) {
				result = transfers.map(function (transfer) {
					return transfer.placeName;
				}).join(', ');
			}
			
			return result;
		};

		/**
		 * Генерит текст "1 пересадка".
		 * 
		 * @returns {string}
		 */
		Leg.prototype.buildTransfersNumberText = function () {
			return this.transfers.length + ' ' +
				this.$$controller.i18n(
					'FlightsSearchResults',
					'flightsGroup__leg__transfers_' + helpers.getNumeral(
						this.transfers.length,
						'one',
						'twoToFour',
						'fourPlus'
					)
				);
		};

		/**
		 * @param {Object} baggage
		 * @returns {string}
		 */
		Leg.prototype.buildBaggageTooltip = function (baggage) {
			var parts = [];
			
			if (baggage instanceof Array && baggage.length) {
				parts = baggage.map(function (fare, i) {
					var baggageText = this.buildBaggageText(fare.minBaggage);
					
					return '<li>' + this.segments[i].depAirp.city.name + ' &mdash; ' + this.segments[i].arrAirp.city.name + ': ' + baggageText + '</li>';
				}, this);

				parts.unshift('<ul>');
				parts.push('</ul>');
			}
			
			return parts.join('');
		};

		/**
		 * @param {Object} baggage
		 * @returns {string}
		 */
		Leg.prototype.buildBaggageText = function (baggage) {
			var baseBaggageText;
			
			if (!baggage) {
				// baseBaggageText = this.$$controller.i18n('FlightsFlightInfo', 'leg__segment__baggage__noBaggage');
				baseBaggageText = ''; // We don't have any information about free baggage.
			}
			else if (baggage instanceof Array) {
				baseBaggageText = this.$$controller.i18n('FlightsFlightInfo', 'leg__segment__baggage__withBaggage');
			}
			else if (baggage.value === null) {
				baseBaggageText = ''; // We don't have any information about free baggage.
			}
			else {
				var baggageValue = parseFloat(baggage.value);
				
				if (baggageValue) {
					var suffix = '';

					if (baggage.measurement === 'pc') {
						baggageValue = baggageValue + '';

						switch (baggageValue) {
							case '0':
							case '5':
							case '6':
							case '7':
							case '8':
							case '9':
							case '10':
							case '11':
							case '12':
							case '13':
							case '14':
							case '15':
								suffix = 'leg__segment__baggage__metric_bag_3';
								break;

							case '1':
								suffix = 'leg__segment__baggage__metric_bag_1';
								break;

							case '2':
							case '3':
							case '4':
								suffix = 'leg__segment__baggage__metric_bag_2';
								break;
						}
					}
					else {
						suffix = 'leg__segment__baggage__metric_' + baggage.measurement;
					}

					baseBaggageText = baggage.value + ' ' + this.$$controller.i18n('FlightsFlightInfo', suffix);
				}
				else {
					baseBaggageText = this.$$controller.i18n('FlightsFlightInfo', 'leg__segment__baggage__noBaggage');
				}
			}
			
			return baseBaggageText;
		};

		/**
		 * Пытаемся получить инфу о багаже на плече.
		 * 
		 * - если инфы о багаже вообще нет, то null
		 * - если инфа есть и на всех сегментах плеча одинаковая, то Object с инфой о багаже
		 * - если инфа есть, но разная на разных сегментах, то Array с инфой о тарифах
		 * 
		 * @returns {Array|Object|null}
		 */
		Leg.prototype.getBaseBaggage = function () {
			var fares       = this.classes,
				lastBaggage = null;

			if (fares instanceof Array && fares.length) {
				for (var i = 0, max = fares.length; i < max; i++) {
					var fare = fares[i],
						baggage = fare.minBaggage;

					if (baggage) {
						if (lastBaggage) {
							// Если вдруг на плече на разных сегментах разный багаж, 
							// то возвращаем просто массив с тарифами.
							if (
								lastBaggage.value !== baggage.value || 
								lastBaggage.measurement !== baggage.measurement
							) {
								lastBaggage = fares;
								break;
							}
						}
						else {
							lastBaggage = baggage;
						}
					}
				}
			}

			return lastBaggage;
		};

		return Leg;
	}
);