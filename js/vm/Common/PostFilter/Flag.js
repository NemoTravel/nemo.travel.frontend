'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/Common/PostFilter/Abstract', 'js/vm/EventManager'],
	function (ko, helpers, BaseModel, Analytics) {
		function PostFilterFlag (initialData, controller) {
			BaseModel.apply(this, arguments);

			this.isActive = ko.computed(function () {
				return this.values().length == 2;
			}, this);

			console.log(this.values(), this.value(), this.isActive());
		}

		helpers.extendModel(PostFilterFlag, [BaseModel]);

		PostFilterFlag.prototype.buildInternalValues = function (items) {
			var tmp,
				ret = {};

			for (var i in items) {
				if (items.hasOwnProperty(i)) {
					tmp = this.config.getter(items[i]) ? 't' : 'f';

					ret[tmp] = tmp;
				}
			}

			return Object.keys(ret);
		};

		PostFilterFlag.prototype.computeStatus = function () {
			if (this.value()) {
				this.status(this.CONST_STATUS_HASVALUE);
			}
			else {
				this.status(this.CONST_STATUS_CLEARED);
			}
		};

		PostFilterFlag.prototype.clear = function (obj) {
			this.value(false);
		};

		PostFilterFlag.prototype.checkValue = function (obj) {
			return this.checkValueWorker(obj, this.value());
		};

		PostFilterFlag.prototype.checkValueWorker = function (obj, value) {
			return value && this.config.getter(obj);
		};

		PostFilterFlag.prototype.selectValue = function (value) {
			Analytics.tap('searchResults.filter.value', { name: this.config.name, value: value });
			this.value(true);
		};

		PostFilterFlag.prototype.toggleValue = function (value) {
			this.value(!this.value());
		};

		return PostFilterFlag;
	}
);