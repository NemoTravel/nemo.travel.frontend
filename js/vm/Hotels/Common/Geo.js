'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseStaticModel'],
	function (ko, helpers, BaseModel) {
		function HotelsSearchFormGeo (initialData, controller) {
			// Processing initialData: a pair of guide data and an object telling us what to take
			// Processing data
			BaseModel.apply(this, [initialData.data, controller]);

			// Processing guide
			this.processGuide(initialData.guide);

            if (this.t == undefined) {
                return;
            }

            this.category = this.t;

            var itemFrom = this.pool[this.category][this.id].n.search(',');
            var itemTo = this.pool[this.category][this.id].n.length;

            this.name = this.pool[this.category][this.id].n.substring(0, itemFrom);
            this.country = this.pool[this.category][this.id].n.substring(itemFrom + 1, itemTo).trim();
		}

		// Extending from dictionaryModel
		helpers.extendModel(HotelsSearchFormGeo, [BaseModel]);

        HotelsSearchFormGeo.prototype.pool = [];

        HotelsSearchFormGeo.prototype.processGuide = function (guide) {
			if (typeof guide == 'object') {
				for (var i in guide) {
                    if (guide[i].hasOwnProperty('t') && guide[i].hasOwnProperty('id')) {
                        if (this.pool[guide[i].t] == undefined) {
                            this.pool[guide[i].t] = [];
                        }
                        this.pool[guide[i].t][guide[i].id] = this.$$controller.getModel('BaseStaticModel', guide[i]);
                    }
				}
			}
		};

		return HotelsSearchFormGeo;
	}
);