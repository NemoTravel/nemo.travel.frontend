'use strict';
define(
	['js/vm/polyfills'],
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

				var clone, i;

				if (typeof obj !== 'object' || obj == null || typeof obj === 'undefined') {
					return obj;
				}

				if (obj instanceof Array) {
					clone = [];

					for (i = 0; i < obj.length; i++) {
						clone.push(this.cloneObject(obj[i]));
					}
				}
				else {
					clone = {};

					for (i in obj) {
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
						return typeof ret === 'undefined' || ret.indexOf(item) >= 0;
					});
				}

				if (typeof ret === 'undefined') {
					ret = [];
				}

				return ret;
			},

			// General cyrillic languages
			getNumeral: function (count, one, twoToFour, fourPlus) {

				count = parseInt(count, 10);

				if (count == 0) {
					return fourPlus;
				} else if (this.language === 'ua' || this.language === 'ru') {

					if (count % 10 === 1 && Math.floor(count / 10) !== 1) {
						return one;
					} else if (count % 10 > 0 && count % 10 <= 4 && Math.floor(count / 10) !== 1) {
						return twoToFour;
					}
				} else {

					if (count === 1) {
						return one;
					} else if (count <= 4) {
						return twoToFour;
					}
				}

				return fourPlus;
			},

			/**
			 * Returns a string - route data encoded in URL
			 * @param type 'search'|'results'
			 * @param data
			 * @returns {string}
			 */
			getFlightsRouteURLAdder: function (type, data) {
				var ret = '',
					tmp,
					i;

				function processDate (date) {
					return (typeof date === 'object' ? date.getISODate() : date.substr(0, 10))
						.replace(/-/g, '');
				}

				if (!data || !data.segments) {
					return ret;
				}

				// Segments
				// RT for results
				if (
					type === 'results' &&
					data.segments.length === 2 &&
					data.segments[0].arrival.IATA === data.segments[1].departure.IATA &&
					data.segments[1].arrival.IATA === data.segments[0].departure.IATA &&
					data.segments[0].arrival.isCity === data.segments[1].departure.isCity &&
					data.segments[1].arrival.isCity === data.segments[0].departure.isCity
				) {
					tmp = data.segments[0].departure;
					ret += (tmp.isCity ? 'c' : 'a') + tmp.IATA;

					tmp = data.segments[0].arrival;
					ret += (tmp.isCity ? 'c' : 'a') + tmp.IATA;

					ret += processDate(data.segments[0].departureDate);
					ret += processDate(data.segments[1].departureDate);
				}
				else {
					for (i = 0; i < data.segments.length; i++) {
						tmp = data.segments[i].departure;
						ret += (type === 'results' ? (tmp.isCity ? 'c' : 'a') : '') + tmp.IATA;

						tmp = data.segments[i].arrival;
						ret += (type === 'results' ? (tmp.isCity ? 'c' : 'a') : '') + tmp.IATA;

						ret += processDate(data.segments[i].departureDate);
					}
				}

				// Passengers
				if (data.passengers instanceof Array) {
					for (i = 0; i < data.passengers.length; i++) {
						if (data.passengers[i].count > 0) {
							ret += data.passengers[i].type + data.passengers[i].count;
						}
					}
				}
				else {
					for (i in data.passengers) {
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
					ret += '-vicinityDates' + (type === 'results' ? '=' + data.vicinityDates : '');
				}

				return ret;
			},
			
			time: function () {
				return Math.floor(Date.now() / 1000);
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
			},

			/**
			 * @param object
			 * @param onIterate - Has 2 parameters: value, property. If function returns true, iterations will break
			 */
			iterateObject: function (object, onIterate) {

				if (typeof object === 'object' && Array.isArray(object)) {
					throw new TypeError('Pass object instead of array');
				}

				for (var property in object) {
					if (object.hasOwnProperty(property)) {
						var res = onIterate(object[property], property);
						if (true === res) {
							break;
						}
					}
				}

			},

			objectFilter: function (object, cb) {

				var filtered = [];

				for (var i in object) {
					if (object.hasOwnProperty(i) && cb(object[i], i, object)) {
						filtered.push(object[i]);
					}
				}

				return filtered;
			},

			/**
			 * @param date
			 * @returns {string} Example: "2016-12-31T00:00:00"
			 * @constructor
			 */
			ISODateString: function (date) {

				function leftZero(n) {
					return n < 10 ? '0' + n : n;
				}

				var year = date.getUTCFullYear(),
					month = leftZero(date.getUTCMonth() + 1),
					day = leftZero(date.getUTCDate()),
					hours = leftZero(date.getUTCHours()),
					minutes = leftZero(date.getUTCMinutes()),
					seconds = leftZero(date.getUTCSeconds());

				return year + '-' + month + '-' + day + 'T' + hours + ':' + minutes + ':' + seconds;
			},

			/**
			 * @param {Object} from
			 * @param {Number} from.lat
			 * @param {Number} from.lng
			 *
			 * @param {Object} to
			 * @param {Number} to.lat
			 * @param {Number} to.lng
			 *
			 * @returns {Number} Distance between two coordinates in km
			 */
			calculateDistanceBetweenTwoCoordinates: function (from, to) {

				var deg2rad = function (deg) {
					return deg * (Math.PI / 180);
				};

				var cos = function (deg) {
					return Math.cos(deg2rad(deg));
				};

				var EARTH_RADIUS_KM = 6371,
					distanceLatInRad = deg2rad(to.lat - from.lat),
					distanceLngInRad = deg2rad(to.lng - from.lng),
					sinDLat = Math.sin(distanceLatInRad / 2),
					sinDLon = Math.sin(distanceLngInRad / 2),
					value = sinDLat * sinDLat + cos(from.lat) * cos(to.lat) * sinDLon * sinDLon;

				return EARTH_RADIUS_KM * (2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value)));
			},

			sortArrayOfObjectsByProperty: function (array, propery, order) {

				var self = this,
					data = array.splice(0);

				order = typeof order === 'undefined' ? 'ASC' : order;

				data.sort(function (a, b) {

					var first = self.objectGet(a, propery);
					var second = self.objectGet(b, propery);

					var count1 = typeof first === 'function' ? first() : first,
						count2 = typeof second === 'function' ? second() : second;

					if (count1 < count2) {
						return order === 'ASC' ? -1 : 1;
					}

					if (count1 > count2) {
						return order === 'ASC' ? 1 : -1;
					}

					return 0;
				});

				return data;
			},

			objectGet: function (object, key, defaultValue) {

				var nested = key.split('.'),
					value = object;

				nested.forEach(function (nestedKey) {
					value = value[nestedKey];
				});

				return typeof value === 'undefined' ? defaultValue : value;
			},

			toArray: function (object) {

				var array = [];

				for (var key in object) {
					if (object.hasOwnProperty(key)) {
						array.push(object[key]);
					}
				}

				return array;
			},

			createArray: function (count) {

				var elements = [];

				for (var i = 0; i < count; i++) {
					elements.push(undefined);
				}

				return elements;
			},

			/**
			 * Makes "123 456 790" from "123456789.05"
			 * @param {Number} value
			 * @returns {string}
			 */
			toMoney: function (value) {

				if (typeof value === 'number') {
					value = Math.round(value).toString();
				}

				return value.replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 ');
			},

			convertMoney: function (moneyValue, currentCurrency, convertToCurrency, ratesArray) {

				var rates = {},
					mainCurrency;

				ratesArray.forEach(function (rate) {
					rates[rate.currency] = rate;
					if (rate.rate === 1) {
						mainCurrency = rate;
					}
				});

				if (typeof mainCurrency === 'undefined') {
					return 0;
				}

				var from = rates[currentCurrency],
					to = rates[convertToCurrency];

				if (typeof from === 'undefined' || typeof to === 'undefined') {
					return 0;
				}

				// converts to main currency
				var convertedValue = (from === mainCurrency) ? moneyValue : moneyValue / from.rate;

				convertedValue = convertedValue * to.rate;

				return convertedValue;
			},

			/**
			 *
			 * @param array
			 * @param cb
			 * @returns {undefined|*}
			 */
			arrayFirst: function (array, cb) {

				var filteredArray = array.filter(function (item) {
					return cb(item);
				});

				return filteredArray[0];
			},

			findObjectInArrayByProperty: function (array, property, value) {

				var copy = JSON.parse(JSON.stringify(array)); // makes clone of array

				var res = copy.filter(function (item) {
					return item[property] === value;
				});

				return res[0] ? res[0] : null;
			}
		};
	}
);
