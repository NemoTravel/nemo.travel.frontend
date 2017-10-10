'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/Flights/SearchForm/Controller'],
	function (ko, helpers, FlightsSearchFormController) {
		function FlightsSearchFormExchangeController(componentParameters) {
			FlightsSearchFormController.apply(this, arguments);

			var self = this,
				oldURLParams = this.URLParams.bind(this),
				oldBuildInitialSegments = this.buildInitialSegments.bind(this);

			this.exchangeBookingId = ko.observable(false);
			this.preinittedData.exchangeBookingId = null;
			this.postMessageHost = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '');

			/**
			 * @override
			 */
			this.buildInitialSegments = function () {
				oldBuildInitialSegments();

				if (this.mode == 'preinitted' && this.preinittedData.exchangeBookingId) {
					this.exchangeBookingId(this.preinittedData.exchangeBookingId);
				}
			};

			/**
			 * @override
			 */
			this.URLParams = ko.pureComputed(function () {
				var urlAdder = oldURLParams();

				if (this.exchangeBookingId()) {
					urlAdder += '-exchangeBookingId=' + this.exchangeBookingId();
				}

				this.parametersChanged(this.initialParams != urlAdder);

				return urlAdder;
			}, this);

			// Preinit params
			if (this.$$componentParameters.route.length == 3 && this.$$componentParameters.route[2]) {
				for (var i = 0; i < this.$$componentParameters.route[2].length; i++) {
					// Exchange booking ID
					if (this.$$componentParameters.route[2][i].substr(0, 18) == 'exchangeBookingId=') {
						this.preinittedData.exchangeBookingId = this.$$componentParameters.route[2][i].substr(18);
					}
				}
			}
			
			if ('exchangeBookingId' in this.$$componentParameters.additional) {
				this.exchangeBookingId(this.$$componentParameters.additional.exchangeBookingId);
			}

			parent.postMessage(JSON.stringify({ action: 'formController' }), this.postMessageHost);
		}

		helpers.extendModel(FlightsSearchFormExchangeController, [FlightsSearchFormController]);
		
		return FlightsSearchFormExchangeController;
	}
);