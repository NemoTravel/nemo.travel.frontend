'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseStaticModel'],
	function (ko, helpers, BaseModel) {
		function PFGroup (initialData, controller) {
			BaseModel.apply(this, arguments);

			this.activeFilter = ko.observable(this.filters.length > 1 ? -1 : 0);
			this.config = this.filters[0].config;
			this.type = this.filters[0].type;

			// Processing filters
			this.values;
			for (var i = 0; i < this.filters.length; i++) {
				if (typeof this.values == 'undefined') {
					this.values = this.filters[i].values();
				}
				else {
					var tmp = this.filters[i].values(),
						result = [];

					for (var j = 0; j < tmp.length; j++) {
						for (var k = 0; k < this.values.length; k++) {
							if (tmp[j].key == this.values[k].key) {
								result.push(tmp[j]);
							}
						}
					}

					this.values = result;
				}
			}

			this.value = ko.computed({
				read: function() {
					var ret;

					for (var i = 0; i < this.filters.length; i++) {
						var value = this.filters[i].value() || '';
						if (typeof ret == 'undefined') {
							ret = value;
						}
						else if (ret != value) {
							ret = null;
						}
					}

					return ret;
				},
				write: function (newValue) {
					this.resultsController.usePostfilters = false;

					for (var i = 0; i < this.filters.length; i++) {
						this.filters[i].value(newValue);
					}

					this.resultsController.usePostfilters = true;

					this.resultsController.PFChanged();
				}
			}, this);
		}

		// Extending from dictionaryModel
		helpers.extendModel(PFGroup, [BaseModel]);

		PFGroup.prototype.clear = function () {
			this.resultsController.usePostfilters = false;

			for (var i = 0; i < this.filters.length; i++) {
				this.filters[i].clear();
			}

			this.resultsController.usePostfilters = true;

			this.resultsController.PFChanged();
		};


		PFGroup.prototype.selectValue = function (value) {
			this.value([value]);
		};

		return PFGroup;
	}
);