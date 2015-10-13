'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/Common/PostFilter/Abstract'],
	function (ko, helpers, BaseModel) {
		function PostFilterNumber (initialData, controller) {
			BaseModel.apply(this, arguments);

			this.type = this.config.options.type || 'range'; // 'range' / 'min' (Fixed minimum, maximum can be set) / 'max' (Fixed maximum, minimum can be set)

			this.displayValues = {
				min: null,
				max: null
			};

			if (typeof this.config.options.onInit == 'function') {
				this.config.options.onInit.call(this, initialData);
			}

			if (typeof this.config.options.onValuesUpdate == 'function') {
				this.value.subscribe(this.config.options.onValuesUpdate, this);
			}

			this.value({
				min: this.values().min,
				max: this.values().max
			});
		}

		helpers.extendModel(PostFilterNumber, [BaseModel]);

		PostFilterNumber.prototype.buildInternalValues = function (items) {
			var values = {},
				tmp;

			for (var i in items) {
				if (items.hasOwnProperty(i)) {
					tmp = this.config.getter(items[i]);
					if (typeof values.max == 'undefined' || tmp > values.max) {
						values.max = tmp;
					}

					if (typeof values.min == 'undefined' || tmp < values.min) {
						values.min = tmp;
					}
				}
			}

			if (typeof values.max == 'undefined' || typeof values.min == 'undefined' || values.max == values.min) {
				return {};
			}

			return values;
		};

		PostFilterNumber.prototype.computeStatus = function () {
			var value = this.value(),
				values = this.values();

			if (value.min > values.min || value.max < values.max) {
				this.status(this.CONST_STATUS_HASVALUE);
			}
			else {
				this.status(this.CONST_STATUS_CLEARED);
			}
		};

		PostFilterNumber.prototype.clear = function (obj) {
			var values = this.values();

			this.value({
				min: values.min,
				max: values.max
			});
		};

		PostFilterNumber.prototype.checkValue = function (obj) {
			var data = this.config.getter(obj),
				value = this.value();

			return data >= value.min && data <= value.max;
		};

		return PostFilterNumber;
	}
);