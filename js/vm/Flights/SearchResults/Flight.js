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
			this.segmentsByLeg = [];
			this.legs = [];
			this.totalTimeEnRoute = null;
			this.timeEnRouteByLeg = [];
			this.totalStopovers = 0;
			this.transfers = [];
			this.transfersCount = 0;
			this.totalTimeTransfers = 0;
			this.isDirect = true;
			this.carriersMismatch = false;
			this.carriersMismatchData = {};

			this.warnings = [];

			// Dividing segments by leg
			for (var i = 0; i < this.segments.length; i++) {
				if (this.segments[i].routeNumber != tmp) {
					this.segmentsByLeg.push([]);
					tmpClasses.push([]);
					tmp = this.segments[i].routeNumber;
				}

				this.segmentsByLeg[this.segmentsByLeg.length - 1].push(this.segments[i]);

				if (this.getValidatingCompany().IATA != this.segments[i].operatingCompany.IATA) {
					this.carriersMismatch = true;
					this.carriersMismatchData[this.segments[i].operatingCompany.IATA] = this.segments[i].operatingCompany;
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

						this.transfers[i].push({
							duration: this.$$controller.getModel('Common/Duration', this.segmentsByLeg[i][j].depDateTime.getTimestamp() - this.segmentsByLeg[i][j-1].arrDateTime.getTimestamp()),
							place: this.segmentsByLeg[i][j].depAirp,
							depTerminal: this.segmentsByLeg[i][j].depTerminal,
							arrTerminal: this.segmentsByLeg[i][j-1].arrTerminal,
							depAirp: this.segmentsByLeg[i][j].depAirp,
							arrAirp: this.segmentsByLeg[i][j-1].arrAirp
						});

						this.isDirect = false;
						this.transfersCount++;
						this.totalTimeTransfers += this.transfers[i][this.transfers[i].length - 1].duration.length();

						transferTimeForLeg += this.transfers[i][this.transfers[i].length - 1].duration.length();
					}
				}

				this.totalTimeEnRoute += timeForLeg;
				this.timeEnRouteByLeg.push(this.$$controller.getModel('Common/Duration', timeForLeg));
				this.totalStopovers += stopoversForLeg;

				this.legs.push({
					depAirp: this.segmentsByLeg[i][0].depAirp,
					arrAirp: this.segmentsByLeg[i][this.segmentsByLeg[i].length - 1].arrAirp,
					depDateTime: this.segmentsByLeg[i][0].depDateTime,
					arrDateTime: this.segmentsByLeg[i][this.segmentsByLeg[i].length - 1].arrDateTime,
					timeEnRoute: this.timeEnRouteByLeg[this.timeEnRouteByLeg.length - 1],
					timeTransfers: this.$$controller.getModel('Common/Duration', transferTimeForLeg),
					transfersCount: this.transfers[i].length,
					classes: tmpClasses[i],
					availSeats: this.price.availableSeats[i],
					timeStopovers: this.$$controller.getModel('Common/Duration', stopoversForLegDuration),
					stopoversCount: stopoversForLeg,
					isCharter: this.segmentsByLeg[i][0].isCharter
				});
			}

			if (this.totalStopovers > 0) {
				this.warnings.push({
					type: 'stopovers',
					data: {
						count: this.totalStopovers
					}
				});
			}

			this.totalTimeEnRoute = this.$$controller.getModel('Common/Duration', this.totalTimeEnRoute);
			this.recommendRating = !isNaN(this.rating) ? this.rating : 0;

			this.buildRatingItems();
		}

		// Extending from dictionaryModel
		helpers.extendModel(Flight, [BaseModel]);

		Flight.prototype.seatsAvailThreshold = 5;

		Flight.prototype.ratingItemsCount = 5;
		Flight.prototype.ratingMaximumValue = 10;

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
			return this.price.validatingCompany || this.segments[0].marketingCompany;
		};

		return Flight;
	}
);