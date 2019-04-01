'use strict';
function abstractFareFamiliesControllerCreator(ko) {
	function AbstractFareFamiliesController() {
		// Сгенерированные модельки сегментов.
		this.segments = ko.observableArray();
		// Можно ли перейти к оформлению заказа.
		this.isValid = ko.observable(true);
		// Сумма к оплате.
		this.money = ko.observable();
		// Выбранный айдишник перелета.
		this.selectedFlightId = '';
		// Цены комбинаций.
		this.combinationsPrices = {};
		// Валидные комбинации.
		this.validCombinations = {};
		// Предупреждение о возможном неправильном багаже при кодшере.
		this.fareFamilyNotice = ko.observable('');
		// Всякая инфа о перелетах.
		this.flightsById = {};
		// Всякие состояния.
		this.state = ko.observable({});
		this.state().fareFamiliesAreLoading = ko.observable(false);
		this.state().fareFamiliesAreLoaded = ko.observable(false);
		this.state().choosingFlight = ko.observable(false);
		this.state().fullScreen = ko.observable(false);
		this.state().errorSuffix = ko.observable('');

		this.state().fullScreen.subscribe(function () {
			if (this.state().fullScreen()) {
				var $popupBlock = $('.js-nemoApp__popupBlock[data-block=' + this.hash + ']');

				// Делаем попап на всю высоту и увеличиваем ширину...
				$popupBlock.parents('.nemo-flights-results__fareFamiliesBySegment__popup')
					.addClass('nemo-flights-results__fareFamiliesBySegment__popup_fullScreen');

				// ... и вызываем событие resize, чтобы плагин попапа выровнял его на странице.
				$popupBlock.trigger('resize');
			}
		}, this);

		this.state().fareFamiliesAreLoading.subscribe(function () {
			if (!this.state().fareFamiliesAreLoading()) {
				var hash = this.hash;

				setTimeout(function () {
					$('.js-nemoApp__popupBlock[data-block=' + hash + ']').trigger('resize');
				});
			}
		}, this);
	}

	/**
	 * Загружаем инфу о семействах.
	 */
	AbstractFareFamiliesController.prototype.load = function () {
		var self = this;

		if (!this.state().fareFamiliesAreLoading() && !this.segments().length) {
			this.analytics('searchResults.fareFamilies.load');

			this.state().fareFamiliesAreLoading(true);
			this.state().fareFamiliesAreLoaded(false);

			return fetch(this.requestURL, { credentials: 'include' })
				.then(function (response) { return response.json(); })
				.then(function (data) {
					data = self.processResponse(data);

					if (!data || !ko.unwrap(data.initialCombination) || data.system && data.system.error) {
						self.state().fareFamiliesAreLoading(false);
						self.state().fareFamiliesAreLoaded(false);

						if (data.system.error.message === 'Search result is obsolete, please start a new search') {
							self.state().errorSuffix('_obsolete');
						}
						else {
							self.state().errorSuffix('');
						}

						console.debug('error');
						return false;
					}
					else {
						self.state().fareFamiliesAreLoading(false);
						self.state().fareFamiliesAreLoaded(true);

						self.parse(data);
					}
				})
				.catch(function (error) {
					self.state().fareFamiliesAreLoading(false);
					self.state().fareFamiliesAreLoaded(false);
					throw error;
				});
		}
	};

	/**
	 * Парсим инфу о семействах.
	 *
	 * @param data
	 */
	AbstractFareFamiliesController.prototype.parse = function (data) {
		if (data.fareFamiliesBySegments) {
			var initialCombination = ko.unwrap(data.initialCombination),
				initialCombinationsArray = initialCombination.split('_'),
				baggageReplacement = ko.unwrap(data.baggageReplacement),
				fareFamiliesBySegments = ko.unwrap(data.fareFamiliesBySegments),
				segmentIndex = 0,
				linkedSegmentsCount = 0;

			this.fareFamilyNotice(ko.unwrap(data.fareFamilyNotice));
			this.validCombinations = ko.unwrap(data.validCombinations);
			this.combinationsPrices = ko.unwrap(data.combinationsPrices);
			this.flightsById = ko.unwrap(data.flightsInfo);

			ko.unwrap(data.segmentsByLegs).forEach(function (segments) {
				segments.forEach(function (segmentItem) {
					var segmentKey = 'S' + segmentIndex,
						fareFamiliesInSegment = ko.unwrap(fareFamiliesBySegments[segmentKey]),
						segment = {
							families: {},
							familiesArray: [],
							selectedFamily: ko.observable(initialCombinationsArray[segmentIndex]),
							isOpened: ko.observable(true),
							isDisabled: true,
							routeName: '',
							isSameAsPrevious: this.isSameAsPreviousSegment(segmentIndex),
							hasLinkedSegments: ko.observable(false)
						};

					if (segment.isSameAsPrevious) {
						linkedSegmentsCount++;
						this.setLinkedSegment(segmentIndex);
					}

					if (fareFamiliesInSegment) {
						fareFamiliesInSegment.forEach(function (familyData) {
							var family = this.processFareFamily(typeof familyData === 'string' ? data.fareFamilies[familyData] : familyData);
							var familyId = ko.unwrap(family.familyCode);

							// нужно для модели 'Flights/SearchResults/FareFeatures'
							family.segNum = segmentIndex;
							family.routeNumber = segmentIndex;

							var isAvailable = this.familyIsEnabled(familyId, segmentIndex);

							if (isAvailable) {
								segment.isDisabled = false;
							}
							else {
								return; // не добавлять тариф, который не учавствует ни в одной комбинации
							}

							family.canBeChosen = ko.observable(isAvailable);
							family.cannotBeChosenCause = ko.observable('');

							family.priceDiff = ko.observable(this.getMoneyModel({
								currency: ko.unwrap(this.combinationsPrices[initialCombination]).currency,
								amount: 0
							}));

							if (baggageReplacement.hasOwnProperty(familyId)) {
								var replacement = ko.unwrap(baggageReplacement[familyId]);

								if (replacement.hasOwnProperty(segmentIndex)) {
									this.replaceBaggageInFamily(family, ko.unwrap(replacement[segmentIndex]));
								}
							}

							if (segment.isSameAsPrevious) {
								segment.isOpened(false);
							}

							segment.familiesArray.push(family);
							segment.families[familyId] = family;
						}, this);
					}

					if (ko.unwrap(data.tripType) !== 'RT') {
						segment.routeName = this.i18n('FlightsSearchResults', 'flightsGroup__fareFamilies__bySegments__routeName__flight')
							.replace('[%-depAirp-%]', ko.unwrap(segmentItem.departureLocation))
							.replace('[%-arrAirp-%]', ko.unwrap(segmentItem.arrivalLocation));
					}
					else {
						if (segmentIndex < ko.unwrap(data.segmentsByLegs)[0].length) {
							segment.routeName = this.i18n('FlightsSearchResults', 'flightsGroup__fareFamilies__bySegments__routeName__to');
						}
						else {
							segment.routeName = this.i18n('FlightsSearchResults', 'flightsGroup__fareFamilies__bySegments__routeName__return');
						}
					}

					this.segments.push(segment);
					segmentIndex++;
				}, this);

				if (linkedSegmentsCount < this.segments().length - 1) {
					this.state().fullScreen(true);
				}
			}, this);
		}

		this.selectedFlightId = ko.unwrap(this.validCombinations[initialCombination]);
		this.money(this.getMoneyModel(ko.unwrap(this.combinationsPrices[initialCombination])));
		this.setValidFareFamiliesBySegments();
		this.updateDeltaPrices();
	};

	/**
	 * Если на сегменте нельзя выбрать отличный от предыдущего сегмента тариф, то считаем их связными.
	 * На форме, будем отображать только один блок с одинаковыми тарифами.
	 *
	 * @param segmentIndex
	 */
	AbstractFareFamiliesController.prototype.setLinkedSegment = function (segmentIndex) {
		var segments = this.segments();

		for (var index = segmentIndex - 1; index >= 0; index--) {
			segments[index].hasLinkedSegments(true);

			if (!segments[index].isSameAsPrevious) {
				break;
			}
		}
	};

	/**
	 * Можно ли на данном сегменте выбрать хотя бы один тариф, отличный от выбранного тарифа на предыдущем сегменте.
	 *
	 * @param segmentIndex
	 * @return {boolean}
	 */
	AbstractFareFamiliesController.prototype.isSameAsPreviousSegment = function (segmentIndex) {
		if (segmentIndex === 0) {
			return false;
		}

		for (var combination in this.combinationsPrices) {
			if (this.combinationsPrices.hasOwnProperty(combination)) {
				var fares = combination.split('_');

				if (fares[segmentIndex] !== fares[segmentIndex - 1]) {
					return false;
				}
			}
		}

		return true;
	};

	/**
	 * Скрывает\показывает блок с семействамин на сегменте.
	 *
	 * @param segment
	 */
	AbstractFareFamiliesController.prototype.toggleVisible = function (segment) {
		if (!segment.isDisabled && !segment.hasLinkedSegments()) {
			segment.isOpened(!segment.isOpened());
		}
	};

	/**
	 * Можно ли отображать семейство на сегменте.
	 * Если семейство недоступно для выбора ни в одной из комбинаций на данном сегменте,
	 * то нет смысла вообще отображать его пользователю.
	 *
	 * @param familyId
	 * @param segmentIndex
	 * @returns {boolean}
	 */
	AbstractFareFamiliesController.prototype.familyIsEnabled = function (familyId, segmentIndex) {
		for (var combination in this.combinationsPrices) {
			if (this.combinationsPrices.hasOwnProperty(combination)) {
				var fares = combination.split('_');

				if (fares[segmentIndex] === familyId) {
					return true;
				}
			}
		}

		return false;
	};

	/**
	 * Устанавливаем семейство в качестве выбранного на сегменте.
	 *
	 * @param familyId
	 * @param segmentIndex
	 */
	AbstractFareFamiliesController.prototype.selectFamily = function (familyId, segmentIndex) {
		this.segments()[segmentIndex].selectedFamily(familyId);
		this.setValidFareFamiliesBySegments();

		var combination = this.getCurrentCombination();

		if (combination) {
			this.isValid(true);
			this.selectedFlightId = ko.unwrap(this.validCombinations[combination]);
			this.money(this.getMoneyModel(ko.unwrap(this.combinationsPrices[combination])));
			this.updateDeltaPrices();
		}
		else {
			this.isValid(false);
		}
	};

	/**
	 * Узнаем какая комбинация будет следующей, если выбрать семейство `familyId` на сегменте `segmentIndex`.
	 *
	 * @param familyId
	 * @param segmentIndex
	 * @returns {string}
	 */
	AbstractFareFamiliesController.prototype.generateCombination = function(familyId, segmentIndex) {
		var currentCombinationParts = this.getCurrentCombination().split('_'),
			nextCombinationParts = currentCombinationParts.slice(0, segmentIndex),
			nextCombinationStart = nextCombinationParts.join('_'),
			segments = this.segments(),
			result;

		nextCombinationParts.push(familyId);

		for (var index = segmentIndex + 1; index < segments.length; index++) {
			var validFamiliesForSegment = [];
			var selectedFamilyOnSegment = segments[index].selectedFamily();

			// Получаем список семейств, которые подойдут для новой комбинации на сегменте `index`.
			for (var combination in this.validCombinations) {
				if (this.validCombinations.hasOwnProperty(combination)) {
					var combinationParts = combination.split('_'),
						candidateFamilyId = combinationParts[index];

					// Сначала быстрые проверки:
					// если в комбинации семейство на текущем сегменте отсутствует,
					// или не соответствует нужному нам, то комбинация нам не нужна.
					if (candidateFamilyId === '#' || combinationParts[segmentIndex] !== familyId) {
						continue;
					}

					var	canBeChosen = combinationParts.slice(0, segmentIndex).join('_') === nextCombinationStart;

					// Если начало комбинации совпадает с началом текущей выбранной комбинации, то добавляем семейство в список.
					if (canBeChosen && segments[index].families[candidateFamilyId]) {
						validFamiliesForSegment.push(candidateFamilyId);
					}
				}
			}

			if (validFamiliesForSegment.indexOf(selectedFamilyOnSegment) !== -1) {
				// Если текущее выбранное на сегменте семейство доступно для новой комбинации, то оставляем его.
				nextCombinationParts.push(segments[index].selectedFamily());
			}
			else {
				// Если нет, то выбираем первое попавшееся (или пустое).
				nextCombinationParts.push(validFamiliesForSegment.length ? validFamiliesForSegment[0]: '#');
			}
		}

		result = nextCombinationParts.join('_');

		return this.validCombinations.hasOwnProperty(result) ? result : '';
	};

	/**
	 * Расставляем признаки доступности выбора семейств на всех сегментах.
	 */
	AbstractFareFamiliesController.prototype.setValidFareFamiliesBySegments = function () {
		var segments = this.segments();

		for (var segmentIndex = 1; segmentIndex < segments.length; segmentIndex++) {
			if (!segments[segmentIndex].isDisabled) {
				var validFamiliesForSegment = [];

				for (var combination in this.validCombinations) {
					if (this.validCombinations.hasOwnProperty(combination)) {
						var combinationParts = combination.split('_'),
							familyId = combinationParts[segmentIndex],
							canBeChosen = true;

						for (var i = 0; i < segmentIndex; i++) {
							if (combinationParts[i] !== segments[i].selectedFamily()) {
								canBeChosen = false;
								break;
							}
						}

						if (canBeChosen && familyId !== '#' && segments[segmentIndex].families[familyId]) {
							validFamiliesForSegment.push(familyId);
						}
					}
				}

				// если текущий выбранный тариф (на i-том сегменте) не может быть выбран в новой комбинации, то устанавливаем выбранным первый из доступных
				if (validFamiliesForSegment.indexOf(segments[segmentIndex].selectedFamily()) === -1) {
					if (validFamiliesForSegment.length) {
						segments[segmentIndex].selectedFamily(validFamiliesForSegment[0]);
					}
					else {
						segments[segmentIndex].selectedFamily('#');
					}
				}

				// идем по всем семействам в i-том сегменте
				segments[segmentIndex].familiesArray.forEach(function (family) {
					family.cannotBeChosenCause('');

					if (validFamiliesForSegment.indexOf(ko.unwrap(family.familyCode)) >= 0) {
						family.canBeChosen(true);
					}
					else {
						family.canBeChosen(false);

						if (segmentIndex > 0) {
							var prevSegment = segmentIndex > 0 ? segments[segmentIndex - 1] : null;

							family.cannotBeChosenCause(this.getFamilyName(prevSegment.families[prevSegment.selectedFamily()]));
						}
					}
				}, this);
			}
		}
	};

	/**
	 * Обновляем относительные цены (+100р, -100р и т.д.).
	 */
	AbstractFareFamiliesController.prototype.updateDeltaPrices = function () {
		var selectedCombination = this.getCurrentCombination(),
			combinationsPrices = this.combinationsPrices,
			currentPrice = this.money().amount(),
			segments = this.segments();

		// Пробегаемся по списку доступных комбинаций.
		for (var combination in combinationsPrices) {
			if (combinationsPrices.hasOwnProperty(combination) && combination !== selectedCombination) {
				// Разбиваем каждую комбинацию на куски.
				combination.split('_').forEach(function (familyId, segmentIndex) {
					// Проверяем, есть ли вообще такое семейство и можно ли его выбрать.
					if (segments[segmentIndex].families[familyId] && segments[segmentIndex].families[familyId].canBeChosen() && segments[segmentIndex].selectedFamily() !== familyId) {
						// Если всё ок, пытаемся сгенерить новую комбинацию для этого семейства на этом сегменте
						// (т.е. представляем, что мы выбираем семейство `familyId` на сегменте `segmentIndex`).
						var candidateCombination = this.generateCombination(familyId, segmentIndex);

						// Если удалось сгенерить комбинацию, значит ее можно выбрать и для нее нужно посчитать разницу в цене,
						// относительно текущей выбранной комбинации.
						if (candidateCombination) {
							var priceFromCombination = ko.unwrap(combinationsPrices[candidateCombination]);

							segments[segmentIndex].families[familyId].priceDiff().amount(ko.unwrap(priceFromCombination.amount) - currentPrice);
						}
					}
				}, this);
			}
		}
	};

	/**
	 * Текущая выбранная комбинация.
	 *
	 * @returns {String}
	 */
	AbstractFareFamiliesController.prototype.getCurrentCombination = function () {
		var combination = this.segments().map(function (segment) {
			return segment.selectedFamily();
		});

		combination = combination.join('_');

		return this.validCombinations.hasOwnProperty(combination) ? combination : '';
	};

	return AbstractFareFamiliesController;
}

if (typeof define !== 'undefined') {
	define(['knockout'], function (ko) {
		return abstractFareFamiliesControllerCreator(ko);
	});
}
else {
	var AbstractFareFamiliesController = abstractFareFamiliesControllerCreator(ko);
}
