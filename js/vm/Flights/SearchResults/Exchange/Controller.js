'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/Flights/SearchResults/Controller'],
	function (ko, helpers, FlightsSearchResultsController) {
		function FlightsSearchResultsExchangeController(componentParameters) {
			FlightsSearchResultsController.apply(this, arguments);
			
			var that = this;

			this.searchParameters.parameters.exchangeBookingId = false;

			if (this.$$componentParameters.route.length == 3) {
				var tmp = this.$$componentParameters.route[2].split('-');

				for (var i = 0; i < tmp.length; i++) {
					// Exchange booking ID
					if (tmp[i].substr(0, 18) == 'exchangeBookingId=') {
						this.searchParameters.parameters.exchangeBookingId = parseInt(tmp[i].substr(18));
					}
				}
			}
			
			this.postMessageHost = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
			
			this.resultsLoaded.subscribe(function (newVal) {
				if (newVal && !that.$$loading()) {
					parent.postMessage(JSON.stringify({ action: 'resultsController', id: that.searchParameters.parameters.exchangeBookingId }), that.postMessageHost);
				}
			});
			
			/**
			 * Get original search request URL.
			 */
			this.originalRequestUrl = ko.computed(function () {
				var exchangeBookingId = this.searchParameters.parameters.exchangeBookingId,
					adder = '';
				
				if (exchangeBookingId) {
					adder += '-exchangeBookingId=' + exchangeBookingId;
				}
				
				return helpers.getFlightsRouteURLAdder('search', this.searchInfo()) + adder;
			}, this);

			/**
			 * Saves selected flights ids into exchange booking.
			 * 
			 * @param {Array} flids
			 */
			this.bookFlight = function (flids) {
				var self = this;

				this.bookingCheckError(null);
				this.bookingCheckPriceChangeData(null);

				if (
					!this.bookingCheckInProgress() &&
					flids instanceof Array &&
					flids.length > 0
				) {
					this.bookingCheckInProgress(true);

					this.$$controller.loadData(
						'/flights/search/exchange/' + flids[0],
						{ exchangeBookingId: this.searchParameters.parameters.exchangeBookingId },
						function (data, request) {
							try {
								data = JSON.parse(data);
							}
							catch (e) {
								self.bookingCheckInProgress(false);
								self.resultsLoaded(true);
								self.bookingCheckError(self.$$controller.i18n('FlightsSearchResults', 'bookingCheck__error__error_wrongResponse'));
								return;
							}

							if (data.system.error && data.system.error.message) {
								self.bookingCheckInProgress(false);
								self.resultsLoaded(true);
								self.bookingCheckError(
									self.$$controller.i18n('FlightsSearchResults', 'bookingCheck__error__error_serverError') + ' ' +
									data.system.error.message
								);
							}
							else if (self.options.needCheckAvail && !data.flights.search.flightInfo.isAvail) {
								self.bookingCheckInProgress(false);
								self.resultsLoaded(true);
								self.bookingCheckError(self.$$controller.i18n('FlightsSearchResults', 'bookingCheck__error__error_unavailable'));
							}
							else {
								// parent.location.reload();
								parent.postMessage(JSON.stringify({ action: 'flightIsSelected', id: self.searchParameters.parameters.exchangeBookingId }), that.postMessageHost);
							}
						},
						function (request) {
							self.bookingCheckInProgress(false);
							self.bookingCheckError(self.$$controller.i18n('FlightsSearchResults', 'bookingCheck__error__error_wrongResponse'));
						}
					);
				}
			};
		}

		helpers.extendModel(FlightsSearchResultsExchangeController, [FlightsSearchResultsController]);

		return FlightsSearchResultsExchangeController;
	}
);