'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseStaticModel'],
	function (ko, helpers, BaseModel) {
		function HotelsSearchFormSegment (initialData, controller) {
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
				arrivalDate: {
					value: ko.observable(initialData.arrivalDate),
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
			this.items.arrival.value.subscribe(function (newValue) {
				this.validate();
			}, this);
			this.items.departureDate.value.subscribe(function (newValue) {
				this.form.recalcDateRestrictions();
				this.validate();
			}, this);
			this.items.arrivalDate.value.subscribe(function (newValue) {
				this.form.recalcDateRestrictions();
				this.validate();
			}, this);
		}

		// Extending from dictionaryModel
		helpers.extendModel(HotelsSearchFormSegment, [BaseModel]);

		HotelsSearchFormSegment.prototype.validate = function () {
			// Checking integrity
			for (var i in this.items) {
				if (this.items.hasOwnProperty(i) && !this.items[i].value()) {
					this.items[i].error('noInput');
				}
				else {
					this.items[i].error(null);
				}
			}

			// Notifying parent
			this.form.processValidation();
		};

		return HotelsSearchFormSegment;
	}
);