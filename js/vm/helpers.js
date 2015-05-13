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