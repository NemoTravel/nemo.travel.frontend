'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseStaticModel'],
	function (ko, helpers, BaseModel) {
		function Airline (initialData, controller) {
			BaseModel.apply(this, arguments);

			// Normalizing rating
			this.rating = Math.round(parseFloat(this.rating) * 100) / 100;
			this.rating = !isNaN(this.rating) ? this.rating : 0;

			if (!this.logo) {
				this.logo = {
					image: this.defaultLogo,
					icon: this.defaultLogo
				};
			}

			if (!this.monochromeLogo) {
				this.monochromeLogo = this.logo;
			}

			// Processing rating
			this.ratingItems = [];

			this.buildRatingItems();
		}

		// Extending from dictionaryModel
		helpers.extendModel(Airline, [BaseModel]);

		Airline.prototype.ratingItemsCount = 5;
		Airline.prototype.ratingMaximumValue = 10;

		Airline.prototype.defaultLogo = '/static/images/logos/nologo.gif';

		Airline.prototype.buildRatingItems = function () {
			var rating = (this.rating / this.ratingMaximumValue) * this.ratingItemsCount,
				fullItems = Math.floor(rating),
				lastItem = rating - fullItems;

			for (var i = 0; i < this.ratingItemsCount; i++) {
				this.ratingItems.push(i < fullItems ? 1 : (i == fullItems ? lastItem : 0));
			}
		};

		return Airline;
	}
);