'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseStaticModel'],
	function (ko, helpers, BaseModel) {
		function FlightsSearchResultsFlight (initialData, controller) {
			var tmp;

			BaseModel.apply(this, arguments);

			this.filteredOut = ko.observable(false);
			this.segmentsByLeg = [];
			this.totalTimeEnRoute = 0;
			this.timeEnRouteByLeg = [];
			this.transfers = [];
			this.recommendRating = 0;

			// Dividing segments by leg
			for (var i = 0; i < this.segments.length; i++) {
				if (this.segments[i].routeNumber != tmp) {
					this.segmentsByLeg.push([]);
					tmp = this.segments[i].routeNumber;
				}

				this.segmentsByLeg[this.segmentsByLeg.length - 1].push(this.segments[i]);
			}

			// Calculating total time in flight
			for (var i = 0; i < this.segmentsByLeg.length; i++) {
				var timeForLeg = 0;

				this.transfers.push([]);

				for (var j = 0; j < this.segmentsByLeg[i].length; j++) {
					timeForLeg += this.segmentsByLeg[i][j].flightTime;

					// Transfer time
					if (j > 0) {
						timeForLeg += this.segmentsByLeg[i][j].depDateTime.getTimestamp() - this.segmentsByLeg[i][j-1].arrDateTime.getTimestamp();

						this.transfers[i].push({
							duration: this.$$controller.getModel('common/Duration', this.segmentsByLeg[i][j].depDateTime.getTimestamp() - this.segmentsByLeg[i][j-1].arrDateTime.getTimestamp())
						});
					}
				}

				this.totalTimeEnRoute += timeForLeg;
				this.timeEnRouteByLeg.push(this.$$controller.getModel('common/Duration', timeForLeg));
			}

			this.totalTimeEnRoute = this.$$controller.getModel('common/Duration', this.totalTimeEnRoute);
		}

		// Extending from dictionaryModel
		helpers.extendModel(FlightsSearchResultsFlight, [BaseModel]);

		FlightsSearchResultsFlight.prototype.calculateRecommendRating = function (mindur, maxdur, minprice, maxprice) {
			// Calculating relative values
			var relativeDuration = (this.totalTimeEnRoute.length() / maxdur) * 100,
				relativePrice = (this.getTotalPrice().normalizedAmount() / maxprice) * 100,
				carrierRating = 1; // TODO

			// All this numbers are MAGIC!!!
			this.recommendRating = -((1 * relativeDuration) + (1 * relativePrice)) + (20 * carrierRating);
		};

		FlightsSearchResultsFlight.prototype.getTotalPrice = function () {
			return this.price.totalPrice;
		};

		FlightsSearchResultsFlight.prototype.getValidatingCompany = function () {
			return this.price.validatingCompany;
		};

		return FlightsSearchResultsFlight;
	}
);