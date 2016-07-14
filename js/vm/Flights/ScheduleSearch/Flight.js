'use strict';
define(
	['knockout','js/vm/helpers','js/vm/BaseStaticModel'],
	function (ko, helpers, BaseModel) {
		function ScheduleSearchFlight(initialData) {
			var guide = initialData.guide,
				today = new Date(),
				prevseg = null;

			delete initialData.guide;

			BaseModel.apply(this, arguments);

			today.setHours(0,0,0);

			this.filteredOut = false;

			this.scheduleDates = {};

			this.depTime = null;
			this.arrTime = null;

			this.arrivalDateShift = 0;

			this.depTimeSeconds = 0;
			this.arrTimeSeconds = 0;

			this.totalTimeEnRoute = 0;

			this.depAirp = null;
			this.arrAirp = null;

			this.depTerminal = '';
			this.arrTerminal = '';

			for (var i = 0; i < this.segments.length; i++) {
				// Preparing segments data
				var tmp = this.segments[i],
					tmp2;

				tmp.depTerminal = (tmp.depTerminal || '').replace(/\s/, '');
				tmp.arrTerminal = (tmp.arrTerminal || '').replace(/\s/, '');

				tmp.depAirp = this.$$controller.getModel(
					'Flights/Common/Geo',
					{
						data: {
							IATA: tmp.depAirp
						},
						guide: guide
					}
				);

				// Guide for Flights/Common/Geo is already set
				tmp.arrAirp = this.$$controller.getModel(
					'Flights/Common/Geo',
					{
						data: {
							IATA: tmp.arrAirp
						},
						guide: null
					}
				);

				tmp.operatingCompany = guide.airlines[tmp.operatingCompany];
				tmp.marketingCompany = guide.airlines[tmp.marketingCompany];
				tmp.aircraftType = guide.aircrafts[tmp.aircraftType];

				tmp.flightTime = this.$$controller.getModel('Common/Duration', tmp.flightTime * 60);

				// Adding stuff needed
				tmp2 = this.segments[i].depTime.split(':');
				tmp2 = (parseInt(tmp2[0], 10) * 3600) + parseInt(tmp2[1], 10) * 60;
				tmp.depTimeSeconds = tmp2;

				tmp2 = this.segments[i].arrTime.split(':');
				tmp2 = (parseInt(tmp2[0], 10) * 3600) + parseInt(tmp2[1], 10) * 60;
				tmp.arrTimeSeconds = tmp2;

				// Constructing new segment
				this.segments[i] = this.$$controller.getModel('BaseStaticModel', tmp);

				// Processing global flight parameters
				if (i == 0) {
					this.depTimeSeconds = this.segments[i].depTimeSeconds;
					this.depTime = this.segments[i].depTime;
					this.depAirp = this.segments[i].depAirp;
					this.depTerminal = this.segments[i].depTerminal;
				}

				if (i == this.segments.length - 1) {
					this.arrTimeSeconds = this.segments[i].arrTimeSeconds;
					this.arrTime = this.segments[i].arrTime;
					this.arrAirp = this.segments[i].arrAirp;
					this.arrTerminal = this.segments[i].arrTerminal;
				}

				this.totalTimeEnRoute += this.segments[i].flightTime.length();

				// Adding transfer time
				if (prevseg) {
					this.totalTimeEnRoute +=
						((this.segments[i].depDateShift - prevseg.arrDateShift) * 86400) - // Days difference
						(prevseg.arrTimeSeconds - this.segments[i].depTimeSeconds);        // Time difference
				}

				// Setting arrival date shift
				this.arrivalDateShift = this.segments[i].arrDateShift;

				prevseg = this.segments[i];
			}

			this.totalTimeEnRoute = this.$$controller.getModel('Common/Duration', this.totalTimeEnRoute);
		}

		helpers.extendModel(ScheduleSearchFlight, [BaseModel]);

		ScheduleSearchFlight.prototype.addScheduleDate = function (date) {
			this.scheduleDates[date.getISODate()] = true;
		};

		ScheduleSearchFlight.prototype.isOnSchedule = function (date) {
			return date.getISODate() in this.scheduleDates;
		};

		ScheduleSearchFlight.prototype.getMarketingCompany = function () {
			return this.segments[0].marketingCompany;
		};

		ScheduleSearchFlight.prototype.getFlightNumber = function () {
			return this.getMarketingCompany().IATA + '-' + this.segments[0].flightNumber;
		};

		ScheduleSearchFlight.prototype.getCleanFlightNumber = function () {
			return this.getMarketingCompany().IATA + this.segments[0].flightNumber;
		};

		return ScheduleSearchFlight;
	}
);