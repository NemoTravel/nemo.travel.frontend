'use strict';

define(['knockout', 'js/vm/helpers'], function (ko, helpers) {

    function FeatureFilter(options) {
        this.id = options.id;
        this.name = options.name;
        this.count = ko.observable(options.count || 0);
        this.checked = ko.observable(options.checked || false);
    }

    function FilterModel() {

        var self = this;

        self.values = ko.observable({});

        self.valuesAsArray = ko.computed(function () {

            var filtersAsArray = [];

            helpers.iterateObject(this.values(), function (filter) {
                filtersAsArray.push(filter);
            });

            return helpers.sortArrayOfObjectsByProperty(filtersAsArray, 'count', 'DESC');
        }, self);

        self.setFilterValues = function (filters) {

            var temp = {};

            helpers.iterateObject(filters, function (filter, id) {

                // if new filter value
                if (!self.values()[id]) {
                    temp[id] = new FeatureFilter(filter);
                } else {
                    temp[id] = self.values()[id];
                    temp[id].count(filter.count);
                }
            });

            this.values(temp);
        };

        /**
         * Check if any of filters weren't applied
         */
        self.isDefault = ko.computed(function () {

            var applied = false;

            helpers.iterateObject(this.values(), function (filter) {
                if (true === filter.checked()) {
                    applied = true;
                }
            });

            return !applied;

        }, this);

        self.getAppliedFilters = ko.computed(function () {
            return this.valuesAsArray().filter(function (filter) {
                return true === filter.checked();
            });
        }, self);

        self.resetFilters = function () {
            helpers.iterateObject(self.values(), function (filter) {
                filter.checked(false);
            });
        };

        /**
         * Check is hotel matches with all checked services
         * @returns {boolean}
         */
        self.isMatch = function (hotel) {

            var popularFeatures = hotel.staticDataInfo.popularFeatures,
                selectedFilters = self.values(),
                checkedFilters = 0,
                matchFilters = 0;

            if (self.isDefault()) {
                return true;
            }

            if (!popularFeatures) {
                return false;
            }

            // check all selected filters
            helpers.iterateObject(selectedFilters, function (filter) {

                if (filter.checked()) {

                    checkedFilters++;

                    if (popularFeatures.indexOf(filter.id) !== -1) {
                        matchFilters++;
                    }
                }
            });

            return checkedFilters === matchFilters;
        };
    }

    return FilterModel;
});
