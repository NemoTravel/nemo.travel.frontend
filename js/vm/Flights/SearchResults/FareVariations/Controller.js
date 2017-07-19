'use strict';
define(
	[
		'knockout', 
		'js/vm/helpers', 
		'js/vm/Flights/SearchResults/FareFamilies/Controller', 
		'js/lib/md5/md5', 
		'js/lib/jquery.tablesorter/v.2.0.5/jquery.tablesorter.min'
	],
	function (ko, helpers, FlightsSearchResultsFareFamiliesController, md5) {

		/**
		 * @constructor
		 * @extends FlightsSearchResultsFareFamiliesController
		 *
		 * @param {Object} componentParameters
		 * @property {Object} parentFlight
		 * @property {Object} resultsController
		 * @property {Object} flights
		 */
		function FlightsSearchResultsFareVariationsController(componentParameters) {
			FlightsSearchResultsFareFamiliesController.apply(this, arguments);

			this.hash = md5(this.parentFlight.id + Math.random() + 'fareVariations');

			/**
			 * @override FlightsSearchResultsFareFamiliesController.load
			 */
			this.load = function () {
				var self = this;

				if (!self.state().fareFamiliesAreLoading()) {
					self.state().fareFamiliesAreLoading(true);
					self.state().fareFamiliesAreLoaded(false);

					self.$$controller.loadData(
						'/flights/search/fareVariations/' + self.parentFlight.id, {},
						function (data, request) {
							var newFlights = [],
								isSuccess = false,
								response = JSON.parse(data);

							if (response.system && response.system.error) {
								self.state().fareFamiliesAreLoading(false);
								self.state().fareFamiliesAreLoaded(false);
								console.debug('error');
								return false;
							}

							// Checking results
							if (
								response.flights.search.results.info &&
								response.flights.search.results.info.errorCode &&
								response.flights.search.results.info.errorCode != 204
							) {
								self.state().fareFamiliesAreLoading(false);
								self.state().fareFamiliesAreLoaded(false);
							}
							else {
								newFlights = self.parseFlights(response);
							}
							
							if (newFlights.length > 0) {
								isSuccess = true;
								self.flights = newFlights;
							}
							
							self.state().fareFamiliesAreLoading(false);
							self.state().fareFamiliesAreLoaded(isSuccess);
						},
						function (request) {
							console.debug('error');
							self.state().fareFamiliesAreLoading(false);
							self.state().fareFamiliesAreLoaded(false);
						}
					);
				}
			};
		}

		helpers.extendModel(FlightsSearchResultsFareVariationsController, [FlightsSearchResultsFareFamiliesController]);

		/**
		 * JQuery tablesort plugin.
		 */
		FlightsSearchResultsFareVariationsController.prototype.afterTableRender = function () {
			var $table = $('.js-fareVariations-table'),
				$columns = $table.find('th'),
				options = {};
			
			if ($table.length) {
				options.headers = {};
				options.headers[$columns.length - 1] = {
					sorter: 'digit'
				};
				
				$table.tablesorter(options);
			}
		};

		/**
		 * Parse flights from API.
		 * Carved out FlightsSearchResultsController.
		 * 
		 * @see FlightsSearchResultsController
		 * 
		 * @param {Object} response
		 * @returns {Array}
		 */
		FlightsSearchResultsFareVariationsController.prototype.parseFlights = function (response) {
			var self = this,
				newFlights = [],
				segments = {},
				prices = {},
				i, j;
			
			// Processing segments
			for (i in response.flights.search.results.groupsData.segments) {
				if (response.flights.search.results.groupsData.segments.hasOwnProperty(i)) {
					response.flights.search.results.groupsData.segments[i].depTerminal = (response.flights.search.results.groupsData.segments[i].depTerminal || '').replace(/\s/, '');
					response.flights.search.results.groupsData.segments[i].arrTerminal = (response.flights.search.results.groupsData.segments[i].arrTerminal || '').replace(/\s/, '');

					segments[i] = self.$$controller.getModel('BaseStaticModel', response.flights.search.results.groupsData.segments[i]);
					segments[i].depDateTime = self.$$controller.getModel('Common/Date', segments[i].depDateTime);
					segments[i].arrDateTime = self.$$controller.getModel('Common/Date', segments[i].arrDateTime);
					segments[i].flightTime *= 60;
					segments[i].flightTime = self.$$controller.getModel('Common/Duration', segments[i].flightTime);
					segments[i].stopPoints = [];

					segments[i].depAirp = self.$$controller.getModel(
						'Flights/Common/Geo',
						{
							data: {
								IATA: segments[i].depAirp
							},
							guide: null
						}
					);

					segments[i].arrAirp = self.$$controller.getModel(
						'Flights/Common/Geo',
						{
							data: {
								IATA: segments[i].arrAirp
							},
							guide: null
						}
					);
				}
			}

			// Processing price objects
			for (i in response.flights.search.results.groupsData.prices) {
				if (response.flights.search.results.groupsData.prices.hasOwnProperty(i)) {
					prices[i] = self.$$controller.getModel('Flights/SearchResults/FlightPrice', response.flights.search.results.groupsData.prices[i]);
				}
			}

			// Processing flights (iterating over groups because flights are grouped by routes)
			for (i = 0; i < response.flights.search.results.flightGroups.length; i++) {
				var segsarr = [],
					source = response.flights.search.results.flightGroups[i];

				// Preparing segments array
				for (j = 0; j < source.segments.length; j++) {
					segsarr.push(segments[source.segments[j]]);
				}

				// Creating flights and defining minimum and maximum flight durations and prices
				for (j = 0; j < source.flights.length; j++) {
					newFlights.push(self.$$controller.getModel(
						'Flights/SearchResults/Flight',
						{
							id: source.flights[j].id,
							rating: source.flights[j].rating,
							price: prices[source.flights[j].price],
							segments: segsarr,
							createOrderLink: source.flights[j].createOrderLink
						}
					));
				}
			}
			
			return newFlights;
		};

		return FlightsSearchResultsFareVariationsController;
	}
);