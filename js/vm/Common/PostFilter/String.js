'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/Common/PostFilter/Abstract', 'js/vm/EventManager'],
	function (ko, helpers, BaseModel, Analytics) {
		function PostFilterString (initialData, controller) {
			BaseModel.apply(this, arguments);

			this.type = this.config.options.type == 'multiChoice' ? 'multiChoice' : 'singleChoice'; // 'singleChoice' / 'multiChoice'

			this.sort();
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
							addValue: ko.observable(null),
							removeOnDeselect: false
						}
					}
				);

			return ret;
		};


		PostFilterString.prototype.sort = function () {
			if (typeof this.config.options.valuesSorter == 'function') {
				this.values(this.values().sort(this.config.options.valuesSorter));
			}
		};

		PostFilterString.prototype.setValues = function (values) {
			var filteredValues = [];

			if (!(values instanceof Array)) {
				values = [values];
			}

			for (var i = 0; i < values.length; i++) {
				if (filteredValues.indexOf(values[i]) < 0) {
					filteredValues.push(values[i]);
				}
			}

			this.value(filteredValues);
		};

		PostFilterString.prototype.addValue = function (key, value, removeOnDeselect) {
			var values = this.values();

			for (var i = 0; i < values.length; i++) {
				if (values[i].key == key) {
					return;
				}
			}

			values.push({
				key: key,
				value: value,
				count: ko.observable(0),
				addValue: ko.observable(null),
				removeOnDeselect: removeOnDeselect
			});
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
			var oldValues = this.values(),
				newValues = [];

			this.value([]);

			// Removing everything that needs to be removed on deselect
			for (var i = 0; i < oldValues.length; i++) {
				if (!oldValues[i].removeOnDeselect) {
					newValues.push(oldValues[i]);
				}
			}

			if (newValues.length != oldValues.length) {
				this.values(newValues);
			}
		};

		PostFilterString.prototype.checkKeyExists = function (key) {
			var values = this.values() || [],
				i;

			for (i = 0; i < values.length; i++) {
				if (values[i].key == key) {
					return true;
				}
			}

			return false;
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
			var removeOnDeselect = false,
				allValues = this.values(),
				foundIndex = 0,
				currentValue = this.value() || [];

			Analytics.tap('searchResults.filter.value', { name: this.config.name, value: value });

			if (this.type == 'singleChoice') {
				this.value([value]);

				if (currentValue.length > 0) {
					for (var i = 0; i < allValues.length; i++) {
						if (allValues[i].key == currentValue[0]) {
							removeOnDeselect = allValues[i].removeOnDeselect;
							foundIndex = i;
							break;
						}
					}
				}
			}
			else {
				var index = currentValue.indexOf(value);

				if (index < 0) {
					currentValue.push(value);
				}
				else {
					currentValue.splice(index, 1);

					for (var i = 0; i < allValues.length; i++) {
						if (allValues[i].key == value) {
							removeOnDeselect = allValues[i].removeOnDeselect;
							foundIndex = i;
							break;
						}
					}

				}

				this.value(currentValue);
			}

			if (removeOnDeselect) {
				allValues.splice(foundIndex, 1);

				this.values(allValues);
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