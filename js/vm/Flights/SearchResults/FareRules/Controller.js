'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseControllerModel', 'js/lib/md5/md5', 'jsCookie'],
	function (ko, helpers, BaseControllerModel, md5, Cookie) {
		function FlightsSearchResultsFareRulesController(componentParameters) {
			BaseControllerModel.apply(this, arguments);

			componentParameters.initSegment = componentParameters.initSegment || null;

			this.flight = componentParameters.flight;
			this.hash = md5(this.flight.id + Math.random() + 'fareRules');
			this.popupCSSClasses = 'nemo-flights-farerules';
			this.linkText = componentParameters.linkText;
			
			this.rules = ko.observableArray([]);
			this.agencyRules = ko.observable(null);
			this.canBeTranslated = ko.observable(false);
			this.isLoading = ko.observable(false);
			this.isLoaded = ko.observable(false);
			this.errorMessage = ko.observable('');
			this.selectedSegmentId = ko.observable(componentParameters.initSegment);
			this.translated = ko.observable(null);
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
						translateTo: 'ru'
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
			var result = [], 
				tariffRules = response.flights.utils.rules.tariffRules;
			
			this.canBeTranslated(response.flights.utils.rules.canBeTranslated);
			
			if (response.flights.utils.rules.agencyRules) {
				this.agencyRules(response.flights.utils.rules.agencyRules);
			}

			if ((response.system.hasOwnProperty('error') && response.system.error)) {
				throw new Error(response.system.error);
			}

			if (!tariffRules instanceof Array || tariffRules.length == 0) {
				throw new Error('No fare rules');
			}

			for (var segmentNumber in tariffRules) if (tariffRules.hasOwnProperty(segmentNumber)) {
				var rules = tariffRules[segmentNumber],
					passType = '',
					code = '';

				if (rules.hasOwnProperty('0')) {
					passType = rules['0'].passengerType;
					code = rules['0'].tarrifCode;
				}

				result.push({
					code: code,
					passType: passType,
					segNum: segmentNumber,
					rules: rules
				});
			}

			return result;
		};

		/**
		 * @returns {String}
		 */
		FlightsSearchResultsFareRulesController.prototype.currentLangLabel = function () {
			var lang = Cookie.get('nemo_lang') || 'ru';
			
			return this.$$controller.i18n('FlightsSearchResults', 'flightsFareRules__translator__' + lang.toLowerCase());
		};

		/**
		 * @param {Number} segmentId
		 */
		FlightsSearchResultsFareRulesController.prototype.selectSegment = function (segmentId) {
			if (!this.isLoading() && this.isLoaded()) {
				this.selectedSegmentId(segmentId);
			}
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