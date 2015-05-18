'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/common/PostFilter/Abstract'],
	function (ko, helpers, BaseModel) {
		function PostFilterString (initialData, controller) {
			BaseModel.apply(this, arguments);

			this.type = this.config.options.type == 'multiChoice' ? 'multiChoice' : 'singleChoice'; // 'singleChoice' / 'multiChoice'

			// Override of value
			this.value = ko.observableArray([]);

			// newValue ia an array if checkboxed or string if radios
			this.value.subscribe(function (newValue){
				this.notifyController(this);
			}, this);
		}

		helpers.extendModel(PostFilterString, [BaseModel]);

		PostFilterString.prototype.buildInternalValues = function (items) {
			var values = {},
				tmp;

			for (var i in items) {
				if (items.hasOwnProperty(i)) {
					tmp = this.config.getter(items[i]);
					for (var j = 0; j < tmp.length; j++) {
						values[tmp[j][0]] = tmp[j][1];
					}
				}
			}

			return values;
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
			var data = this.config.getter(obj),
				value = this.value();

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

		return PostFilterString;
	}
);