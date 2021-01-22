'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseControllerModel', 'js/lib/md5/md5', 'js/vm/Analytics'],
	function (ko, helpers, BaseControllerModel, md5) {
		function FlightsSearchResultsSubsidyInformationController(componentParameters) {
			BaseControllerModel.apply(this, arguments);

			var self = this;

			this.parentFlight = componentParameters.flight;
			this.resultsController = componentParameters.resultsController;
			this.flights = [];
			this.flightsById = {};
			this.passegnersCount = ko.observable({});
			this.subsidyInformation = ko.observable({});
			this.currentFlightId = ko.observable(null);
			this.state = ko.observable({});
			this.state().infoIsLoading = ko.observable(false);
			this.state().infoAreLoaded = ko.observable(false);
			this.state().choosingFlight = ko.observable(false);
			this.state().bookInfoIsLoading = ko.observable(false);
			this.passengersError = ko.observable(false);

			/**
			 * We need an approximate unique ID to mark subsidy info block.
			 *
			 * Math.random() approximately precludes any problems.
			 */
			this.hash = md5(this.parentFlight.id + Math.random() + 'subsidyInformation');

			/**
			 * Catch errors and stop loading process.
			 */
			this.resultsController.bookingCheckError.subscribe(function (newVal) {
				if (this.resultsController.resultsLoaded() && newVal) {
					this.state().choosingFlight(false);
				}
			}, this);

			this.passengersCount = ko.pureComputed(function () {
				var passengersInfo = this.resultsController.searchInfo().passengers,
					count = 0;

				for (var passType in passengersInfo) {
					if (passengersInfo.hasOwnProperty(passType)) {
						count += passengersInfo[passType];
					}
				}

				return count;
			}, this);

			this.getPassengersForNewFlight = ko.pureComputed(function () {
				var result = [],
					category;

				for (var item in this.passegnersCount()) {
					if (this.passegnersCount().hasOwnProperty(item)) {
						category = this.passegnersCount()[item];

						if (category.count > 0) {
							result.push({
								nemoPassType: this.subsidyInformation().categories[category.id].nemoPassType,
								specialPassType: this.subsidyInformation().categories[category.id].specialPassType,
								count: category.count
							});
						}
					}
				}

				return result;
			}, this);

			this.getError = ko.pureComputed(function () {
				var passengers = this.getPassengersForNewFlight(),
					passengersCount = this.passengersCount();
				
				if (passengers.length === 0) {
					return 'noPassengers';
				}
				else {
					var passCount = 0;

					passengers.forEach(function (fare) {
						passCount += fare.count;
					});

					if (passCount != passengersCount) {
						return 'num_of_passengers';
					}
				}

				return false;
			}, this);

			/**
			 * Высчитываем общую стоимость
			 */
			this.getTotalPrice = ko.pureComputed(function () {
				var totalPrice = 0,
					currency   = this.subsidyInformation().categories[0].price.currency;

				for (var item in this.passegnersCount()) {
					if (this.passegnersCount().hasOwnProperty(item)) {
						var category = this.passegnersCount()[item];
						totalPrice += this.subsidyInformation().categories[category.id].price.amount * category.count;
					}
				}

				return this.$$controller.getModel('Common/Money', {
					amount: totalPrice,
					currency: currency
				});
			}, this);

			/**
			 * Устанавливаем кол-во пассажиров для каждой категории (для счетчика spinner)
			 */
			this.setPassengersCount = function (type, count, passengerId) {
				if (this.passegnersCount().hasOwnProperty(type)) {
					this.passegnersCount()[type].count = count;
				}
				else {
					this.passegnersCount()[type] = {
						id: passengerId, 
						count: count
					};
				}

				this.passegnersCount.valueHasMutated();
			};

			this.bookFlight = function () {
				var errorCode = this.getError();

				if (errorCode) {
					this.passengersError(errorCode);
					return;
				}

				this.passengersError(false);

				if (!this.state().bookInfoIsLoading()) {
					this.state().bookInfoIsLoading(true);

					self.$$controller.loadData(
						'/flights/search/newFlightByPassengers/' + self.parentFlight.id,
						{
							'passengers': this.getPassengersForNewFlight()
						},
						function (data, request) {
							try {
								data = JSON.parse(data);
							}
							catch (e) {
								self.state().bookInfoIsLoading(false);
								return false;
							}

							if (data.system && data.system.error) {
								self.state().bookInfoIsLoading(false);
								return false;
							}

							window.document.location = data.flights.search.flightInfo.createOrderLink;
						}
					);
				}
			};

			this.getValidatingCompany = function () {
				return this.parentFlight.price.validatingCompany || this.parentFlight.segments[0].marketingCompany || this.parentFlight.segments[0].operatingCompany;
			};
		}

		helpers.extendModel(FlightsSearchResultsSubsidyInformationController, [BaseControllerModel]);

		FlightsSearchResultsSubsidyInformationController.prototype.load = function () {
			var self = this;

			if (!self.state().infoIsLoading()) {

				self.state().infoIsLoading(true);
				self.state().infoAreLoaded(false);

				self.$$controller.loadData(
					'/flights/search/subsidyInformation/' + self.parentFlight.id, {},
					function (data, request) {
						try {
							data = JSON.parse(data);
						}
						catch (e) {
							return false;
						}

						if (data.system && data.system.error) {
							self.state().infoIsLoading(false);
							self.state().infoAreLoaded(false);
							return false;
						}

						self.subsidyInformation(data.flights.search.subsidyInformation);

						self.state().infoIsLoading(false);
						self.state().infoAreLoaded(true);
					},
					function (request) {
						self.state().infoIsLoading(false);
						self.state().infoAreLoaded(false);
					}
				);
			}
		};

		return FlightsSearchResultsSubsidyInformationController;
	}
);