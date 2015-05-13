'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseControllerModel'],
	function (ko, helpers, BaseControllerModel) {
		function FlightsSearchResultsController (componentParameters) {
			BaseControllerModel.apply(this, arguments);

			this.segments = {};
			this.prices = {};
			this.flights = {};

			this.allGroups = [];

			this.visibleResult = ko.observableArray([]);
		}

		// Extending from dictionaryModel
		helpers.extendModel(FlightsSearchResultsController, [BaseControllerModel]);

		// Own prototype stuff
		FlightsSearchResultsController.prototype.buildModels = function () {
			var setSegmentsGuide = true,
				tmpGroups = {},
				mindur, maxdur, minprice, maxprice;

			// Processing segments
			for (var i in this.$$rawdata.flights.search.results.groupsData.segments) {
				if (this.$$rawdata.flights.search.results.groupsData.segments.hasOwnProperty(i)) {
					this.segments[i] = this.$$controller.getModel('BaseStaticModel', this.$$rawdata.flights.search.results.groupsData.segments[i]);

					// Times
					this.segments[i].depDateTime = this.$$controller.getModel('common/Date', this.segments[i].depDateTime);
					this.segments[i].arrDateTime = this.$$controller.getModel('common/Date', this.segments[i].arrDateTime);

					// Time in air - from minutes to seconds
					this.segments[i].flightTime *= 60;

					this.segments[i].depAirp = this.$$controller.getModel(
						'FlightsSearchForm/FlightsSearchFormGeo',
						{
							data: {
								IATA: this.segments[i].depAirp
							},
							guide: setSegmentsGuide ? this.$$rawdata.guide : null
						}
					);

					// Guide for FlightsSearchForm/FlightsSearchFormGeo is already set
					this.segments[i].arrAirp = this.$$controller.getModel(
						'FlightsSearchForm/FlightsSearchFormGeo',
						{
							data: {
								IATA: this.segments[i].arrAirp
							},
							guide: null
						}
					);

					setSegmentsGuide = false;
				}
			}

			// Processing price objects
			for (var i in this.$$rawdata.flights.search.results.groupsData.prices) {
				if (this.$$rawdata.flights.search.results.groupsData.prices.hasOwnProperty(i)) {
					this.prices[i] = this.$$controller.getModel('FlightsSearchResults/FlightsSearchResultsFlightPrice', this.$$rawdata.flights.search.results.groupsData.prices[i]);
				}
			}

			// Processing flights (iterating over groups because flights are grouped by routes)
			for (var i = 0; i < this.$$rawdata.flights.search.results.flightGroups.length; i++) {
				var segsarr = [],
					source = this.$$rawdata.flights.search.results.flightGroups[i];

				// Preparing segments array
				for (var j = 0; j < source.segments.length; j++) {
					segsarr.push(this.segments[source.segments[j]]);
				}

				// Creating flights and defining minimum and maximum flight durations and prices
				for (var j = 0; j < source.flights.length; j++) {
					this.flights[source.flights[j].id] = this.$$controller.getModel(
						'FlightsSearchResults/FlightsSearchResultsFlight',
						{
							id: source.flights[j].id,
							price: this.prices[source.flights[j].price],
							segments: segsarr
						}
					);

					if (typeof minprice == 'undefined' || minprice > this.flights[source.flights[j].id].getTotalPrice().normalizedAmount()) {
						minprice = this.flights[source.flights[j].id].getTotalPrice().normalizedAmount();
					}

					if (typeof maxprice == 'undefined' || maxprice < this.flights[source.flights[j].id].getTotalPrice().normalizedAmount()) {
						maxprice = this.flights[source.flights[j].id].getTotalPrice().normalizedAmount();
					}

					if (typeof mindur == 'undefined' || mindur > this.flights[source.flights[j].id].totalTimeEnRoute.length()) {
						mindur = this.flights[source.flights[j].id].totalTimeEnRoute.length();
					}

					if (typeof maxdur == 'undefined' || maxdur < this.flights[source.flights[j].id].totalTimeEnRoute.length()) {
						maxdur = this.flights[source.flights[j].id].totalTimeEnRoute.length();
					}
				}
			}

			// Creating flight groups (we group by same price and validating company)
			// Also - post-processing flights for them to calculate their "recommended" rating
			// that relies on maximum/minimum values for all flights
			for (var i in this.flights) {
				if (this.flights.hasOwnProperty(i)) {
					var tmp = this.flights[i].getTotalPrice().normalizedAmount() + '-' + this.flights[i].getTotalPrice().currency() + '-' + this.flights[i].getValidatingCompany();
					if (!tmpGroups[tmp]) {
						tmpGroups[tmp] = [];
					}

					tmpGroups[tmp].push(this.flights[i]);

					this.flights[i].calculateRecommendRating(mindur, maxdur, minprice, maxprice);
				}
			}

			for (var i in tmpGroups) {
				if (tmpGroups.hasOwnProperty(i)) {
					this.allGroups.push(
						this.$$controller.getModel('FlightsSearchResults/FlightsSearchResultsGroup', {flights: tmpGroups[i]})
					);
				}
			}

			// Sorting by price
			this.allGroups.sort(function (a, b) {
				return a.getTotalPrice().normalizedAmount() - b.getTotalPrice().normalizedAmount();
			});

			this.visibleResult(this.allGroups);
		};

		FlightsSearchResultsController.prototype.$$usedModels = [
			'FlightsSearchResults/FlightsSearchResultsFlightPrice',
			'FlightsSearchResults/FlightsSearchResultsFlight',
			'FlightsSearchResults/FlightsSearchResultsGroup',
			'common/Date',
			'common/Duration',
			'common/Money',
			'FlightsSearchForm/FlightsSearchFormGeo'
		];

		FlightsSearchResultsController.prototype.dataURL = function () {
			return '/flights/search/results/'+this.$$componentParameters.route[0];
		};

		return FlightsSearchResultsController;
	}
);