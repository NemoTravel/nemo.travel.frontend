'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseControllerModel', 'js/lib/md5/md5', 'jsCookie'],
	function (ko, helpers, BaseControllerModel, md5, Cookie) {
		function FlightsSearchResultsFareRulesController(componentParameters) {
			BaseControllerModel.apply(this, arguments);

			var initSegment = 0;

			if (typeof componentParameters.initSegment === 'number' || typeof componentParameters.initSegment === 'string') {
				initSegment = parseInt(componentParameters.initSegment);
			}

			this.flight = componentParameters.flight;
			this.hash = md5(this.flight.id + Math.random() + 'fareRules');
			this.popupCSSClasses = 'nemo-flights-farerules';
			this.linkText = componentParameters.linkText;
			
			this.rules = ko.observableArray([]);
			this.agencyRules = ko.observable(null);
			this.canBeTranslated = ko.observable(false);
			this.isManualFareRules = ko.observable(false);
			this.manualRulesArray = ko.observableArray([]);
			this.isLoading = ko.observable(false);
			this.isLoaded = ko.observable(false);
			this.errorMessage = ko.observable('');
			this.selectedSegmentId = ko.observable(initSegment);
			this.translated = ko.observable(null);

			this.visibleRules = ko.computed(function () {
				var result = [];

				this.rules().map(function (group) {
					var filteredRules = group.filter(function (rule) {
						return rule.segmentNumber === this.selectedSegmentId();
					}, this);

					if (filteredRules.length) {
						result.push(filteredRules);
					}
				}, this);
				
				return result;
			}, this);
			this.showYandexTranslator = function () {
				if(this.visibleRules()[0]) {
					return !this.visibleRules()[0].some(function(el) {
						return el.isURL === true;
					})
				}
				return true;
			};
		}
		helpers.extendModel(FlightsSearchResultsFareRulesController, [BaseControllerModel]);

		/**
		 * @param {Boolean} translate
		 * @param {Boolean} forced
		 */
		FlightsSearchResultsFareRulesController.prototype.load = function (translate, forced) {
			if (this.rules().length < 1 || forced === true) {
				var self = this,
					url = '/flights/utils/rules/' + self.flight.id,
					params = {
						translated: translate,
						translateTo: Cookie.get('nemo_lang') || 'ru'
					},
					parsedRules;

				self.isLoading(true);

				self.$$controller.loadData(url, params,
					function (data, request) {
						var response = JSON.parse(data);

						try {
							parsedRules = self.parseRules(response);

							if (parsedRules.length > 0 && self.selectedSegmentId() === null) {
								self.selectedSegmentId(parsedRules[0].segNum);
							}

							self.rules(parsedRules);
							self.isLoaded(true);
						}
						catch (error) {
							self.isLoaded(false);
							self.errorMessage(error.message);
							console.debug(error.message);
						}

						self.isLoading(false);
					},
					function (request) {
						self.isLoaded(false);
					}
				);
			}
		};

		/**
		 * @param {Object} response
		 * @returns {Array}
		 */
		FlightsSearchResultsFareRulesController.prototype.parseRules = function (response) {
			var result = [], rulesMap = {}, tariffRules, agencyRules, manualRules;

			if ((response.system.hasOwnProperty('error') && response.system.error)) {
				throw new Error(response.system.error);
			}

			tariffRules = response.flights.utils.rules.tariffRules;
			agencyRules = response.flights.utils.rules.agencyRules;
			manualRules = response.flights.utils.rules.manualRulesArray;
			this.canBeTranslated(response.flights.utils.rules.canBeTranslated);

			if (agencyRules) {
				this.agencyRules(agencyRules);
			}
			if (manualRules) {
				this.isManualFareRules(true);
				this.manualRulesArray(manualRules);
			}
			if (!tariffRules instanceof Array || tariffRules.length === 0) {
				throw new Error('No fare rules');
			}
			// Складываем в стопку правила, группируя их по коду тарифа + типу пассажира.
			for (var segmentNumber in tariffRules) if (tariffRules.hasOwnProperty(segmentNumber)) {
				if (tariffRules[segmentNumber] instanceof Array) {
					tariffRules[segmentNumber].map(function (rule) {
						var hash = md5(rule.tariffCode + JSON.stringify(rule.passengerTypes));

						if (!rulesMap.hasOwnProperty(hash)) {
							rulesMap[hash] = [];
						}

						rulesMap[hash].push(rule);
					});
				}
			}

			// Пихаем сгруппированные правила в массив.
			for (var hash in rulesMap) if (rulesMap.hasOwnProperty(hash)) {
				result.push(rulesMap[hash]);
			}
			
			return result;
		};

		/**
		 * @param {Number} segmentId
		 */
		FlightsSearchResultsFareRulesController.prototype.selectSegment = function (segmentId) {
			if (!this.isLoading() && this.isLoaded()) {
				this.isLoading(true);

				// Имитируем процесс загрузки.
				// Часто на всех сегментах один и тот же тариф, и при переключении сегментов, содержимое попапа 
				// не меняется, что может вводить юзера в ступор. Для того, чтобы юзер понимал, что все работает 
				// в штатном режиме, имитируем загрузку.
				setTimeout(function () {
					this.isLoading(false);
					this.selectedSegmentId(segmentId);
				}.bind(this), 200);
			}
		};

		/**
		 * @param code
		 */
		FlightsSearchResultsFareRulesController.prototype.scrollToTariffBlock = function (code) {
			var $content = $('.js-nemoApp__popupBlock[data-block="' + this.hash + '"] .js-nemo-popup__fareRules__content:first'),
				$target = $content.find('[data-block="' + code + '"]:first');
			
			var	currentScroll = parseInt($content.scrollTop()),
				newScroll = parseInt($target.position().top) + currentScroll;

			if ($target.length && newScroll !== currentScroll) {
				$content.animate({ scrollTop: newScroll });
			}
		};

		/**
		 * @param rule
		 */
		FlightsSearchResultsFareRulesController.prototype.getPassengersTypes = function (rule) {
			var types = rule.passengerTypes;

			types = types.map(function (type) {
				return this.$$controller.i18n('FlightsSearchResults', 'nemo__fareRules__passtype_' + type);
			}, this);

			return types.join(', ');
		};

		/**
		 * Load untranslated rules.
		 */
		FlightsSearchResultsFareRulesController.prototype.loadOriginal = function () {
			if (!this.isLoading() && (this.translated() === null || this.translated())) {
				this.translated(false);
				this.load(false, true);
			}
		};

		/**
		 * Load translated rules.
		 */
		FlightsSearchResultsFareRulesController.prototype.loadTranslated = function () {
			if (!this.isLoading() && !this.translated()) {
				this.translated(true);
				this.load(true, true);
			}
		};
		
		return FlightsSearchResultsFareRulesController;
	}
);
