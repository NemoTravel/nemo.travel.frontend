'use strict';
define(
	[/* We require nothing */],
	function () {
		return {
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
			language: 'en'
		};
	}
);