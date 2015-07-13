'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/Common/PostFilter/Abstract'],
	function (ko, helpers, BaseModel) {
		function PostFilterString (initialData, controller) {
			BaseModel.apply(this, arguments);

			this.type = this.config.options.type == 'multiChoice' ? 'multiChoice' : 'singleChoice'; // 'singleChoice' / 'multiChoice'

			this.disabledOptions = ko.observable();
			this.additionalInfo = ko.observable();
		}

		helpers.extendModel(PostFilterString, [BaseModel]);

		PostFilterString.prototype.buildInternalValues = function (items) {
			var valuesRegistry = {},
				tmp,
				ret;

			for (var i in items) {
				if (items.hasOwnProperty(i)) {
					tmp = this.config.getter(items[i]);
					for (var j = 0; j < tmp.length; j++) {
						valuesRegistry[tmp[j][0]] = tmp[j][1];
					}
				}
			}

			ret = Object.keys(valuesRegistry)
				.map(
					function(key) {
						return {
							key: key,
							value: valuesRegistry[key],
							count: ko.observable(0),
							addValue: ko.observable(null)
						}
					}
				);

			if (typeof this.config.options.valuesSorter == 'function') {
				ret.sort(this.config.options.valuesSorter);
			}

			return ret;
		};

		PostFilterString.prototype.computeStatus = function () {
			var value = this.value();
			if (value instanceof Array && value.length > 0 && value.length < Object.keys(this.values()).length) {
				this.status(this.CONST_STATUS_HASVALUE);
			}
			else if (!(value instanceof Array) && value) {
				this.status(this.CONST_STATUS_HASVALUE);
			}
			else {
				this.status(this.CONST_STATUS_CLEARED);
			}
		};

		PostFilterString.prototype.clear = function (obj) {
			this.value([]);
		};

		PostFilterString.prototype.checkValue = function (obj) {
			return this.checkValueWorker(obj, this.value());
		};

		PostFilterString.prototype.checkValueWorker = function (obj, value) {
			var data = this.config.getter(obj);

			if (!(value instanceof Array)) {
				value = [value];
			}

			for (var i = 0; i < data.length; i++) {
				if (value.indexOf(data[i][0].toString()) >= 0) {
					return true;
				}
			}

			return false;
		};

		PostFilterString.prototype.selectValue = function (value) {
			if (this.type == 'singleChoice') {
				this.value([value]);
			}
			else {
				var values = this.value() || [],
					index = values.indexOf(value);

				if (index < 0) {
					values.push(value);
				}
				else {
					values.splice(index, 1);
				}

				this.value(values);
			}
		};

		PostFilterString.prototype.recalculateOptions = function (items) {
			var values = this.values(),
				additionalData = [];

			for (var j = 0; j < values.length; j++) {
				var count = 0,
					addValue = null;

				for (var i = 0; i < items.length; i++) {
					if (this.checkValueWorker(items[i], values[j].key)) {
						count++;

						if (typeof this.config.options.additionalValueChooser == 'function') {
							addValue = this.config.options.additionalValueChooser(addValue, items[i]);
						}
					}
				}

				this.values()[j].count(count);
				this.values()[j].addValue(addValue);
			}
		};

		return PostFilterString;
	}
);