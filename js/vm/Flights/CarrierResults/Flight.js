define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseStaticModel'],
	function (ko, helpers, BaseModel) {
		function Flight(initialData, controller) {
			var time, totalTime;

			BaseModel.apply(this, arguments);

			var i18n = this.$$controller.i18n.bind(this.$$controller);
			var flightAirline = null;
			var specialFamilyRules = [
				{
					departure: 'UUD',
					arrival: 'ICN',
					airline: 'R3'
				},
				{
					departure: 'ICN',
					arrival: 'UUD',
					airline: 'R3'
				},
			];

			this.depAirp = this.segments[0].depAirp;
			this.arrAirp = this.segments[this.segments.length - 1].arrAirp;
			this.depDateTime = this.segments[0].depDateTime;
			this.arrDateTime = this.segments[this.segments.length - 1].arrDateTime;
			this.transfers = [];
			this.totalDistance = 0;
			this.specialRules = [];

			this.detailsOpen = ko.observable(false);
			this.isHidden = ko.observable(false);

			time = 0;
			totalTime = 0;
			
			for (var i = 0; i < this.segments.length; i++) {
				time += this.segments[i].flightTime.length();
				totalTime += this.segments[i].flightTime.length();
				this.totalDistance += this.segments[i].distance;

				if (i > 0) {
					this.transfers.push({
						place: this.segments[i - 1].arrAirp,
						duration: this.$$controller.getModel('Common/Duration', this.segments[i].depDateTime.getTimestamp() - this.segments[i - 1].arrDateTime.getTimestamp())
					});
					
					totalTime += this.segments[i].depDateTime.getTimestamp() - this.segments[i - 1].arrDateTime.getTimestamp();
				}

				if (!flightAirline) {
					flightAirline = this.segments[i].marketingCompany.IATA;
				}
			}

			specialFamilyRules.forEach(function (rule) {
				if (
					flightAirline === rule.airline &&
					this.depAirp.IATA === rule.departure &&
					this.arrAirp.IATA === rule.arrival
				) {
					var title = i18n('FlightsSearchResults', 'carrierResults__familyWarning__' + rule.departure + '-' + rule.arrival, null, true);

					if (title) {
						this.specialRules.push(title);
					}
				}
			}.bind(this));

			this.timeEnRoute = this.$$controller.getModel('Common/Duration', time);
			this.totalTimeEnRoute = this.$$controller.getModel('Common/Duration', totalTime);

			this.transfersCodeIATA = ko.pureComputed(function () {
				var ret = '(';
				
				for (var i = 0; i < this.transfers.length; i++) {
					ret += this.transfers[i].place.IATA + ',';
				}
				
				ret = ret.substring(0, ret.length - 1) + ')';
				
				return ret;
			}, this);

			this.transfersCityName = ko.pureComputed(function () {
				var ret = '';
				
				for (var i = 0; i < this.transfers.length; i++) {
					ret += this.transfers[i].place.city.name + ', ';
				}
				
				return ret.substring(0, ret.length - 2);
			}, this);
		}

		// Extending from dictionaryModel
		helpers.extendModel(Flight, [BaseModel]);

		return Flight;
	}
);
