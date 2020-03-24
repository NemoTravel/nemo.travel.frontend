'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseControllerModel', 'js/lib/md5/md5', 'js/vm/EventManager'],
	function (ko, helpers, BaseControllerModel, md5, Analytics) {
		function FlightsSearchResultsFareFamiliesController (componentParameters) {
			BaseControllerModel.apply(this, arguments);

			this.parentFlight = componentParameters.flight;
			this.resultsController = componentParameters.resultsController;
			this.flights = [];
			this.flightsById = {};
			this.fareFamilyNotice = '';
			this.currentFlightId = ko.observable(null);
			this.state = ko.observable({});
			this.state().fareFamiliesAreLoading = ko.observable(false);
			this.state().fareFamiliesAreLoaded = ko.observable(false);
			this.state().choosingFlight = ko.observable(false);

			/**
			 * We need an approximate unique ID to mark fare family block.
			 * 
			 * In best-case scenario the parentFlight.id is enough,
			 * but some times, there are more than one fare family block for the one flight.
			 * (Best Flight, Fastest Flight, Recommended Flight etc)
			 * 
			 * Math.random() approximately precludes any problems.
			 */
			this.hash = md5(this.parentFlight.id + Math.random() + 'fareFamilies');

			/**
			 * Catch errors and stop loading process.
			 */
			this.resultsController.bookingCheckError.subscribe(function (newVal) {
				if (this.resultsController.resultsLoaded() && newVal) {
					this.state().choosingFlight(false);
				}
			}, this);
		}

		helpers.extendModel(FlightsSearchResultsFareFamiliesController, [BaseControllerModel]);
		
		FlightsSearchResultsFareFamiliesController.prototype.$$KOBindings = ['FareFamilies'];

		/**
		 * Load fare families flights by given flight ID.
		 * 
		 * Don't forget to bind context for this method.
		 */
		FlightsSearchResultsFareFamiliesController.prototype.load = function () {
			var self = this;
			
			if (!self.state().fareFamiliesAreLoading()) {
				Analytics.tap('searchResults.fareFamilies.load');
				
				self.state().fareFamiliesAreLoading(true);
				self.state().fareFamiliesAreLoaded(false);

				self.$$controller.loadData(
					'/flights/search/fareFamilies/' + self.parentFlight.id, {},
					function (data, request) {
						var newFlights = [], isSuccess = false;

						data = JSON.parse(data);

						if (data.system && data.system.error) {
							self.state().fareFamiliesAreLoading(false);
							self.state().fareFamiliesAreLoaded(false);
							console.debug('error');
							return false;
						}

						if (data.flights.search.fareFamilies.flights instanceof Array) {
							data.flights.search.fareFamilies.flights.map(function (element) {
								var features = [], i;

								for (i in element.features) {
									if (element.features.hasOwnProperty(i) && element.features[i] instanceof Array) {
										features.push({
											title: i,
											array: element.features[i]
										});
									}
								}

								newFlights.push({
									id: element.id,
									nemo2id: element.nemo2id,
									expectedNumberOfTickets: element.expectedNumberOfTickets,
									name: element.name,
									price: self.$$controller.getModel('Common/Money', element.price),
									features: features
								});
							});
						}

						self.flights = newFlights;
						self.fareFamilyNotice = data.flights.search.fareFamilies.fareFamilyNotice;

						newFlights.map(function (flight) {
							self.flightsById[flight.id] = flight;
						});

						if (self.flights.length > 0) {
							isSuccess = true;
						}

						self.state().fareFamiliesAreLoading(false);
						self.state().fareFamiliesAreLoaded(isSuccess);
					},
					function (request) {
						self.state().fareFamiliesAreLoading(false);
						self.state().fareFamiliesAreLoaded(false);
						console.debug('error');
					}
				);
			}
		};

		/**
		 * For overriding.
		 * 
		 * @param {Array} flightIds
		 * @returns {Array}
		 */
		FlightsSearchResultsFareFamiliesController.prototype.handleFlightIdsBeforeBooking = function (flightIds) {
			return flightIds;
		};

		return FlightsSearchResultsFareFamiliesController;
	}
);
