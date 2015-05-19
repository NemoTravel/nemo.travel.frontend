'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseStaticModel'],
	function (ko, helpers, BaseModel) {
		function FlightsSearchFormSegment (initialData, controller) {
			// We need this for $$-prefixed fields only
			BaseModel.apply(this, [null, controller]);

			this.index = initialData.index;
			this.form = initialData.form;

			this.items = {
				arrival: {
					value: ko.observable(initialData.arrival),
					focus: ko.observable(false),
					error: ko.observable(null)
				},
				departure: {
					value: ko.observable(initialData.departure),
					focus: ko.observable(false),
					error: ko.observable(null)
				},
				departureDate: {
					value: ko.observable(initialData.departureDate),
					focus: ko.observable(false),
					error: ko.observable(null)
				}
			};

			// Initial validation
			this.validate();

			// Watchers for props change
			this.items.departure.value.subscribe(function (newValue) {
				this.form.segmentGeoChanged(this, 'departure');
				this.validate();
			}, this);
			this.items.arrival.value.subscribe(function (newValue) {
				this.form.segmentGeoChanged(this, 'arrival');
				this.validate();
			}, this);
			this.items.departureDate.value.subscribe(function (newValue) {
				this.form.recalcDateRestrictions();
				this.validate();
			}, this);
		}

		// Extending from dictionaryModel
		helpers.extendModel(FlightsSearchFormSegment, [BaseModel]);

		FlightsSearchFormSegment.prototype.validate = function () {
			// Checking integrity
			for (var i in this.items) {
				if (this.items.hasOwnProperty(i) && !this.items[i].value()) {
					this.items[i].error('noInput');
				}
				else {
					this.items[i].error(null);
				}
			}

			// Checking same geoPoint
			if (
				this.items.departure.value() &&
				this.items.arrival.value() &&
				this.items.departure.value().identifier == this.items.arrival.value().identifier
			) {
				this.items.arrival.error('sameAsDeparture');
			}

			// Notifying parent
			this.form.processValidation();
		};

		return FlightsSearchFormSegment;
	}
);