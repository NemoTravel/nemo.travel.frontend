'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseStaticModel'],
	function (ko, helpers, BaseModel) {
		function Flight (initialData, controller) {
			var tmp,
				tmpClasses = [];

			BaseModel.apply(this, arguments);

			this.rating = Math.round(parseFloat(this.rating) * 100) / 100;
			this.ratingItems = [];

			this.filteredOut = ko.observable(false);
			this.overlandTrip = false;
			this.overlandTripType = '';
			this.segmentsByLeg = [];
			this.legs = [];
			this.searchInfoKey = '';
			this.totalTimeEnRoute = null;
			this.timeEnRouteByLeg = [];
			this.totalStopovers = 0;
			this.transfers = [];
			this.transfersCount = 0;
			this.totalTimeTransfers = 0;
			this.isDirect = true;
			this.carriersMismatch = false;
			this.carriersMismatchData = {};
			this.carriersMismatchArrayByLeg = [];
			this.carriersMismatchDataByLeg = [];
			this.economyClassSegments = [];

			if (this.price && this.price.pricingDebug) {
				this.pricingInfoLink = this.price.pricingDebug.link + '&flight_id=' + this.id;
			}

			this.warnings = [];

			// Dividing segments by leg
			for (var i = 0; i < this.segments.length; i++) {
				this.segments[i].shortInfo = '';
				this.segments[i].shortInfo += this.segments[i].depAirp.city.name;
				this.segments[i].shortInfo += '&nbsp;&rarr;&nbsp;';
				this.segments[i].shortInfo += this.segments[i].arrAirp.city.name;
				this.segments[i].shortInfo += '&nbsp;';
				this.segments[i].shortInfo += '(' + this.segments[i].depDateTime.getDate() + '&nbsp;' + this.segments[i].depDateTime.getMonthName() + ',&nbsp;' + this.segments[i].depDateTime.getDOWName() +')';
				this.segments[i].overlandTrip = false;
				this.searchInfoKey += this.segments[i].marketingCompany.IATA + '-' + this.segments[i].flightNumber;

				this.segments[i].specialMark = {
					name: '',
					label: '',
					desc: ''
				};

				if (this.segments[i].aircraftType === 'BUS' || this.segments[i].aircraftType === 'TRAIN') {
					this.overlandTrip = this.segments[i].aircraftType;
					this.segments[i].overlandTrip = true;
				}

				if (this.segments[i].isLowCost || this.segments[i].isCharter) {
					this.segments[i].specialMark.name = this.segments[i].isLowCost ? 'Lowcost' : 'Charter';

					var description = this.$$controller.i18n('FlightsSearchResults', 'flightsGroup__selector__is' + this.segments[i].specialMark.name + '__desc');

					this.segments[i].specialMark.label = this.$$controller.i18n('FlightsSearchResults', 'flightsGroup__selector__is' + this.segments[i].specialMark.name);
					this.segments[i].specialMark.desc = description !== '{i18n:FlightsSearchResults:flightsGroup__selector__is' + this.segments[i].specialMark.name + '__desc}' ? description : '';
				}

				this.segments[i].isNightDeparture = this.isNightSegmentDeparture(i);

				if (this.segments[i].routeNumber != tmp) {
					this.segmentsByLeg.push([]);
					tmpClasses.push([]);
					tmp = this.segments[i].routeNumber;
				}

				this.segmentsByLeg[this.segmentsByLeg.length - 1].push(this.segments[i]);

				if (this.getFirstSegmentMarketingCompany().IATA != this.segments[i].operatingCompany.IATA) {
					this.carriersMismatch = true;
					this.carriersMismatchData[this.segments[i].operatingCompany.IATA] = this.segments[i].operatingCompany;
				}

				if (this.price.segmentInfo[i].serviceClass === 'Economy' && this.searchInfo.serviceClass !== 'Economy') {
					this.economyClassSegments.push({
						departure: this.segments[i].depAirp.city.name,
						arrival: this.segments[i].arrAirp.city.name
					});
				}

				tmpClasses[this.segmentsByLeg.length - 1].push(this.price.segmentInfo[i]);
			}

			// Calculating total time in flight
			for (var i = 0; i < this.segmentsByLeg.length; i++) {
				var timeForLeg = 0,
					transferTimeForLeg = 0,
					stopoversForLeg = 0,
					stopoversForLegDuration = 0;

				this.transfers.push([]);

				for (var j = 0; j < this.segmentsByLeg[i].length; j++) {
					timeForLeg += this.segmentsByLeg[i][j].flightTime.length();

					// Stopovers
					if (this.segmentsByLeg[i][j].stopPoints.length > 0) {
						stopoversForLeg += this.segmentsByLeg[i][j].stopPoints.length;

						for (var k = 0; k < this.segmentsByLeg[i][j].stopPoints.length; k++) {
							stopoversForLegDuration += this.segmentsByLeg[i][j].stopPoints[k].duration.length();
						}
					}

					// Transfer time
					if (j > 0) {
						timeForLeg += this.segmentsByLeg[i][j].depDateTime.getTimestamp() - this.segmentsByLeg[i][j-1].arrDateTime.getTimestamp();

						this.transfers[i].push(this.$$controller.getModel('Flights/SearchResults/Transfer', {
							duration: this.$$controller.getModel('Common/Duration', this.segmentsByLeg[i][j].depDateTime.getTimestamp() - this.segmentsByLeg[i][j-1].arrDateTime.getTimestamp()),
							place: this.segmentsByLeg[i][j].depAirp,
							depTerminal: this.segmentsByLeg[i][j].depTerminal,
							arrTerminal: this.segmentsByLeg[i][j-1].arrTerminal,
							depAirp: this.segmentsByLeg[i][j].depAirp,
							arrAirp: this.segmentsByLeg[i][j-1].arrAirp,
							marketingCompany: this.segmentsByLeg[i][j].marketingCompany,
							flightNumber:  this.segmentsByLeg[i][j].flightNumber,
							aircraftType: this.segmentsByLeg[i][j].aircraftType
						}));

						this.isDirect = false;
						this.transfersCount++;
						this.totalTimeTransfers += this.transfers[i][this.transfers[i].length - 1].duration.length();

						transferTimeForLeg += this.transfers[i][this.transfers[i].length - 1].duration.length();
					}
				}

				this.totalTimeEnRoute += timeForLeg;
				this.timeEnRouteByLeg.push(this.$$controller.getModel('Common/Duration', timeForLeg));
				this.totalStopovers += stopoversForLeg;

				if (this.segmentsByLeg[i][0].isCharter) {
					this.isCharter = true;
				}

				this.legs.push(this.$$controller.getModel('Flights/SearchResults/Leg', {
					depAirp: this.segmentsByLeg[i][0].depAirp,
					arrAirp: this.segmentsByLeg[i][this.segmentsByLeg[i].length - 1].arrAirp,
					depDateTime: this.segmentsByLeg[i][0].depDateTime,
					arrDateTime: this.segmentsByLeg[i][this.segmentsByLeg[i].length - 1].arrDateTime,
					timeEnRoute: this.timeEnRouteByLeg[this.timeEnRouteByLeg.length - 1],
					timeTransfers: this.$$controller.getModel('Common/Duration', transferTimeForLeg),
					transfersCount: this.transfers[i].length,
					transfers: this.transfers[i],
					segments: this.segmentsByLeg[i],
					classes: tmpClasses[i],
					availSeats: this.price.availableSeats[i],
					timeStopovers: this.$$controller.getModel('Common/Duration', stopoversForLegDuration),
					stopoversCount: stopoversForLeg,
					specialMark: this.segmentsByLeg[i][0].specialMark,
					isCharter: this.segmentsByLeg[i][0].isCharter,
					isNightDeparture: this.segmentsByLeg[i][0].isNightDeparture,
					overlandTrip: this.overlandTrip,
				}));
			}

			// Adding warnings
			// Stopovers
			if (this.totalStopovers > 0) {
				this.warnings.push({
					type: 'stopovers',
					data: {
						count: this.totalStopovers
					}
				});
			}

			// Price warnings
			if (this.price.warnings && !(this.price.warnings instanceof Array)) {
				for (var i in this.price.warnings) {
					if (this.price.warnings.hasOwnProperty(i)) {
						this.warnings.push({
							type: i,
							data: {}
						});
					}
				}
			}

			if (this.economyClassSegments.length) {
				var segmentsWithEconomy = this.economyClassSegments.map(function (segment) {
					return segment.departure + ' - ' + segment.arrival;
				});

				this.warnings.push({
					type: 'economyClassInBusinessFlight',
					data: {
						label: segmentsWithEconomy.join(', '),
						count: this.economyClassSegments.length
					}
				});
			}

			this.totalTimeEnRoute = this.$$controller.getModel('Common/Duration', this.totalTimeEnRoute);
			this.recommendRating = !isNaN(this.rating) ? this.rating : 0;

			/**
			 * Fare Families features.
			 *
			 * @type {FlightsSearchResultsFareFeatures}
			 */
			this.fareFeatures = this.$$controller.getModel('Flights/SearchResults/FareFeatures', this.price.passengerFares);

			this.buildRatingItems();

			this.expectedNumberOfTicketsText = '';

			if (this.expectedNumberOfTickets !== false) {
				var one = this.$$controller.i18n('FlightsSearchResults', 'flightsGroup__footer__passengersDisclaimer_tickets_1'),
					twoToFour = this.$$controller.i18n('FlightsSearchResults', 'flightsGroup__footer__passengersDisclaimer_tickets_2'),
					fourPlus = this.$$controller.i18n('FlightsSearchResults', 'flightsGroup__footer__passengersDisclaimer_tickets_0');

				this.expectedNumberOfTicketsText = this.expectedNumberOfTickets + ' ' + helpers.getNumeral(this.expectedNumberOfTickets, one, twoToFour, fourPlus);
			}

			for (var leg = 0; leg < this.segmentsByLeg.length; leg++) {
				var firstCarrierIATA = this.getFirstSegmentMarketingCompanyInLeg(leg).IATA;
				var airlines = {},
					airArray = [],
					labelForLeg = this.getFirstSegmentMarketingCompanyInLeg(leg).name,
					airlineNames = [];

				this.segmentsByLeg[leg].map(function (segment) {
					if (firstCarrierIATA !== segment.operatingCompany.IATA) {
						airlines[segment.operatingCompany.IATA] = segment.operatingCompany;
					}

					if (
						segment.marketingCompany &&
						segment.marketingCompany.IATA !== segment.operatingCompany.IATA &&
						segment.marketingCompany.IATA !== firstCarrierIATA
					) {
						airlines[segment.marketingCompany.IATA] = segment.marketingCompany;
					}
				});

				for (var IATA in airlines) {
					if (airlines.hasOwnProperty(IATA)) {
						airArray.push({name: airlines[IATA].name, logo: airlines[IATA].logo});
						airlineNames.push(airlines[IATA].name);
						labelForLeg += ', ' + airlines[IATA].name;
					}
				}

				this.carriersMismatchArrayByLeg[leg] = airArray;
				this.carriersMismatchDataByLeg[leg] = {
					array: airArray,
					airlineNames: airlineNames,
					label: labelForLeg,
					isCarriersMismatch: airArray.length
				}
			}
		}

		// Extending from dictionaryModel
		helpers.extendModel(Flight, [BaseModel]);

		Flight.prototype.seatsAvailThreshold = 5;

		Flight.prototype.ratingItemsCount = 5;
		Flight.prototype.ratingMaximumValue = 10;

		Flight.prototype.isNightSegmentDeparture = function (segmentIndex) {
			if (this.segments[segmentIndex].depDateTime) {
				var depHours = this.segments[segmentIndex].depDateTime.getHours();

				if (depHours >= 0 && depHours < 4) {
					var fromDay = this.segments[segmentIndex].depDateTime.offsetDate(-1).getDate(),
						toDay = this.segments[segmentIndex].depDateTime.getDate(),
						monthName = this.$$controller.i18n('dates', 'month_'+parseInt(this.segments[segmentIndex].depDateTime.getMonth())+'_f'),
						overland = this.segments[segmentIndex].overlandTrip;

					return this.$$controller.i18n('FlightsSearchResults', overland ? 'flightsGroup__info__nightDeparture_overland' : 'flightsGroup__info__nightDeparture')
						.replace('[%-from-%]', fromDay)
						.replace('[%-to-%]', toDay)
						.replace('[%-month-%]', monthName);
				}
			}

			return false;
		};

		Flight.prototype.buildRatingItems = function () {
			var rating = (this.recommendRating / this.ratingMaximumValue) * this.ratingItemsCount,
				fullItems = Math.floor(rating),
				lastItem = rating - fullItems;

			for (var i = 0; i < this.ratingItemsCount; i++) {
				this.ratingItems.push(i < fullItems ? 1 : (i == fullItems ? lastItem : 0));
			}
		};

		Flight.prototype.clone = function () {
			return this.$$controller.getModel('Flights/SearchResults/Flight', this.$$originalData);
		};

		Flight.prototype.getTotalPrice = function () {
			return this.price.totalPrice;
		};

		Flight.prototype.getAgentProfit = function () {
			return this.price.agentProfit !== 'undefined' ? this.price.agentProfit : false;
		};

		Flight.prototype.getPackageCurrency = function () {
			if(this.$$controller.viewModel.user.isB2B()) {
				return this.price.originalCurrency;
			}
			else {
				return '';
			}
		};

		Flight.prototype.getValidatingCompany = function () {
			/**
			 * @CRUTCH in rare cases we don't have a validating company in price so we just crutch it
			 */
			return this.price.validatingCompany || this.segments[0].marketingCompany || this.segments[0].operatingCompany;
		};

		Flight.prototype.getFirstSegmentMarketingCompany = function () {
			return this.segments[0].marketingCompany || this.segments[0].operatingCompany;
		};

		Flight.prototype.getFirstSegmentMarketingCompanyInLeg = function (leg) {
			return this.segmentsByLeg[leg][0].marketingCompany || this.segmentsByLeg[leg][0].operatingCompany;
		};

		Flight.prototype.getBaggageForFilter = function () {
			var family = this.fareFeatures.getFirstFamily(),
				baggage = {};

			if (family && family.hasOwnProperty('list') && family.list.hasOwnProperty('baggage')) {
				family.list.baggage.map(function (item) {
					// Если в семействе есть хотя бы одна опция с недоступным бесплатным багажом,
					// берём её в качестве основной.
					if (item.code === 'baggage' && baggage.value !== 0) {
						if (item.needToPay === 'Free') {
							// Если до этого не нашли опцию с неизвестным багажом.
							if (baggage.value !== null) {
								// То считаем что есть бесплатный.
								baggage.value = 1;
							}
						}
						else if (item.needToPay === 'Unknown') {
							// Багаж неизвестен.
							baggage.value = null;
						}
						else {
							// Только платный багаж.
							baggage.value = 0;
						}
					}
				});
			}
			else {
				this.price.segmentInfo.map(function (segmentInfo) {
					// Если в перелёте есть хотя бы один сегмент с недоступным бесплатным багажом,
					// берём его в качестве основны.
					if (baggage.value !== 0) {
						var minBaggage = segmentInfo.minBaggage;

						if (minBaggage) {
							if (minBaggage.value === null) {
								// Багаж неизвестен.
								baggage.value = null;
							}
							else {
								var value = parseFloat(minBaggage.value);

								if (value) {
									// Если до этого не нашли сегмент с неизвестным багажом.
									if (baggage.value !== null) {
										// То считаем что есть бесплатный.
										baggage.value = 1;
									}
								}
								else {
									// Только платный багаж.
									baggage.value = 0;
								}
							}
						}
						else {
							// Багаж неизвестен.
							baggage.value = null;
						}
					}
				});
			}

			return baggage;
		};

		return Flight;
	}
);
