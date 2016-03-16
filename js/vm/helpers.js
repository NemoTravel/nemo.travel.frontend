'use strict';
define(
	[/* We require nothing */],
	function () {
		return {
			language: 'en',
            ageMin: 0,
            ageMax: 17,

			extendModel: function (what, withWhatArray) {
				for (var i = 0; i < withWhatArray.length; i++) {
					for (var j in withWhatArray[i].prototype) {
						what.prototype[j] = withWhatArray[i].prototype[j];
					}
				}

				what.prototype.constructor = what;
			},

			cloneObject: function (obj) {
				var clone;

				if (typeof obj != 'object' || obj == null || typeof obj == 'undefined') {
					return obj;
				}

				if (obj instanceof Array) {
					clone = [];

					for (var i = 0; i < obj.length; i++) {
						clone.push(this.cloneObject(obj[i]));
					}
				}
				else {
					clone = {};

					for (var i in obj) {
						if (obj.hasOwnProperty(i)) {
							clone[i] = this.cloneObject(obj[i]);
						}
					}
				}

				return clone;
			},

			smartJoin: function (arr, conj, lastConj) {
				var ret = arr.slice(0),
					tmp = '';

				if (ret.length > 1) {
					tmp = lastConj + ret.pop();
				}

				return ret.join(conj) + tmp;
			},

			intersectArrays: function () {
				var ret;

				for (var i = 0; i < arguments.length; i++) {
					ret = arguments[i].filter(function (item) {
						return typeof ret == 'undefined' || ret.indexOf(item) >= 0;
					});
				}

				if (typeof ret == 'undefined') {
					ret = [];
				}

				return ret;
			},

			getNumeral: function (count, one, twoToFour, fourPlus) {
				// General cyrillic languages
				if (this.language == 'ua' || this.language == 'ru') {
					if (count == 0) {
						return fourPlus;
					}
					else if (count % 10 == 1 && Math.floor(count / 10) != 1) {
						return one;
					}
					else if (count % 10 > 0 && count % 10 <= 4 && Math.floor(count / 10) != 1) {
						return twoToFour;
					}
					else {
						return fourPlus;
					}
				}
				// Generic others
				else {
					if (count == 0) {
						return fourPlus;
					}
					else if (count == 1) {
						return one;
					}
					else if (count <= 4) {
						return twoToFour;
					}
					else {
						return fourPlus;
					}
				}
			},

			/**
			 * Returns a string - route data encoded in URL
			 * @param type 'search'|'results'
			 * @param data
			 * @returns {string}
			 */
			getFlightsRouteURLAdder: function (type, data) {
				var ret = '',
					tmp;

				function processDate (date) {
					return (typeof date == 'object' ? date.getISODate() : date.substr(0, 10))
						.replace(/-/g, '');
				}

				if (!data || !data.segments) {
					return ret;
				}

				// Segments
				// RT for results
				if (
					type == 'results' &&
					data.segments.length == 2 &&
					data.segments[0].arrival.IATA == data.segments[1].departure.IATA &&
					data.segments[1].arrival.IATA == data.segments[0].departure.IATA &&
					data.segments[0].arrival.isCity == data.segments[1].departure.isCity &&
					data.segments[1].arrival.isCity == data.segments[0].departure.isCity
				) {
					tmp = data.segments[0].departure;
					ret += (tmp.isCity ? 'c' : 'a') + tmp.IATA;

					tmp = data.segments[0].arrival;
					ret += (tmp.isCity ? 'c' : 'a') + tmp.IATA;

					ret += processDate(data.segments[0].departureDate);
					ret += processDate(data.segments[1].departureDate);
				}
				else {
					for (var i = 0; i < data.segments.length; i++) {
						tmp = data.segments[i].departure;
						ret += (type == 'results' ? (tmp.isCity ? 'c' : 'a') : '') + tmp.IATA;

						tmp = data.segments[i].arrival;
						ret += (type == 'results' ? (tmp.isCity ? 'c' : 'a') : '') + tmp.IATA;

						ret += processDate(data.segments[i].departureDate);
					}
				}

				// Passengers
				if (data.passengers instanceof Array) {
					for (var i = 0; i < data.passengers.length; i++) {
						if (data.passengers[i].count > 0) {
							ret += data.passengers[i].type + data.passengers[i].count;
						}
					}
				}
				else {
					for (var i in data.passengers) {
						if (data.passengers.hasOwnProperty(i) && data.passengers[i] > 0) {
							ret += i.toUpperCase() + data.passengers[i];
						}
					}
				}

				// Parameters
				ret += '-class=' + (typeof data.serviceClass != 'undefined' ? data.serviceClass : data.summary.serviceClass);

				if (data.direct) {
					ret += '-direct';
				}

				if (data.vicinityDates > 0) {
					ret += '-vicinityDates' + (type == 'results' ? '=' + data.vicinityDates : '');
				}

				return ret;
			},
            getTimeFromCommonDate: function (dateValue) {
                if (dateValue && dateValue.hasOwnProperty('dateObject')) {
                    dateValue.dateObject().setHours(0, 0, 0, 0);

                    return dateValue.dateObject().getTime();
                }

                return null;
            },
            highlight: function (word, term) {
                return word.replace(new RegExp('(' + term + ')', 'i'), '<span class="nemo-ui-autocomplete__match">$1</span>');
            },
            getAges: function () {
                var result = [];
                for (var age = this.ageMin; age <= this.ageMax; age++) {
                    result.push(age);
                }

                return result;
            },
            getAgesCount: function () {
                return this.ageMax - this.ageMin + 1 ;
            }

		};
	}
);