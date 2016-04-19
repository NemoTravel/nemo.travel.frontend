'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseControllerModel'],
	function (ko, helpers, BaseControllerModel) {
		function FlightsLastSearchesController (componentParameters) {
			this.name = 'FlightsLastSearchesController';
			BaseControllerModel.apply(this, arguments);

			this.history = ko.observableArray([]);
		}
		// Extending from dictionaryModel
		helpers.extendModel(FlightsLastSearchesController, [BaseControllerModel]);

		FlightsLastSearchesController.prototype.maxCount = 5;

		FlightsLastSearchesController.prototype.buildModels = function () {
			var tmpArr = [],
				tmp;

			if (
				this.$$rawdata.flights &&
				this.$$rawdata.flights.search &&
				this.$$rawdata.flights.search.history
			) {
				for (var i = 0; i < this.$$rawdata.flights.search.history.length; i++) {
					if (tmpArr.length >= this.maxCount) {
						break;
					}

					tmp = this.$$rawdata.flights.search.history[i].request;

					for (var j = 0; j < tmp.segments.length; j++) {
						tmp.segments[j].departure = this.$$controller.getModel('Flights/Common/Geo', {data: tmp.segments[j].departure, guide: this.$$rawdata.guide});
						tmp.segments[j].arrival = this.$$controller.getModel('Flights/Common/Geo', {data: tmp.segments[j].arrival, guide: this.$$rawdata.guide});
						tmp.segments[j].departureDate = this.$$controller.getModel('Common/Date', tmp.segments[j].departureDate);
					}

					if (this.$$rawdata.flights.search.history[i].hasResults && this.$$rawdata.flights.search.history[i].resultsCount > 0) {
						tmpArr.push(tmp);
					}
				}

				this.history(tmpArr);
			}
		};

		FlightsLastSearchesController.prototype.passengersSummary = function (passArray) {
			var ret = '',
				total = 0,
				passTypes = [],
				passengers = {};

			passArray.map(function (item) {
				total += item.count;
				passTypes.push(item.type);
			});

			if (passTypes.length == 0) {
				ret = this.$$controller.i18n('FlightsSearchForm','passSummary_numeral_noPassengers');
			}
			else if (passTypes.length == 1) {
				ret = total + ' ' + this.$$controller.i18n('FlightsSearchForm','passSummary_numeral_' + passTypes.pop() + '_' + helpers.getNumeral(total, 'one', 'twoToFour', 'fourPlus'));
			}
			else {
				ret = total + ' ' + this.$$controller.i18n('FlightsSearchForm','passSummary_numeral_mixed_' + helpers.getNumeral(total, 'one', 'twoToFour', 'fourPlus'));
			}

			return ret;
		};

		FlightsLastSearchesController.prototype.goTo = function (data) {
			// TODO add IATAS and stuff to this URL
			this.$$controller.navigate('results/' + data.id, true, 'FlightsResults');
		};

		FlightsLastSearchesController.prototype.dataURL = function () {
			return '/flights/search/history';
		};

		FlightsLastSearchesController.prototype.$$usedModels = ['Common/Date','Flights/Common/Geo'];

		FlightsLastSearchesController.prototype.$$i18nSegments = ['FlightsLastSearches', 'FlightsSearchForm'];

		return FlightsLastSearchesController;
	}
);