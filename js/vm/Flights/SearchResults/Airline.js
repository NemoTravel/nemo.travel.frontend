'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseStaticModel'],
	function (ko, helpers, BaseModel) {
		function Airline (initialData, controller) {
			BaseModel.apply(this, arguments);

			if (!this.logo) {
				this.logo = {
					image: '',
					icon: ''
				};
			}

			// Processing rating
			this.ratingItems = [];

			this.buildRatingItems();
		}

		// Extending from dictionaryModel
		helpers.extendModel(Airline, [BaseModel]);

		Airline.prototype.ratingItemsCount = 5;

		Airline.prototype.buildRatingItems = function () {
			var rating = Math.round((this.rating / 10) * 5);

			for (var i = 0; i < this.ratingItemsCount; i++) {
				this.ratingItems.push(rating > i);
			}
		};

		return Airline;
	}
);