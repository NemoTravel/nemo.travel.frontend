define([], function () {

    function SliderViewModel(ko, type, min, max) {

        var self = this;

        self.type = type;

        // initial values
        self.initialMin = min;
        self.initialMax = max;
        
        // min value
        self.rangeMin = ko.observable(self.initialMin);

        // max value
        self.rangeMax = ko.observable(self.initialMax);

        // selected max value
        self.displayRangeMin = ko.observable(self.initialMin);

        // selected max value
        self.displayRangeMax = ko.observable(self.initialMax);

        self.isMinRangeChanged = function () {
            return self.rangeMin() !== self.initialMin;
        };

        self.isMaxRangeChanged = function () {
            return self.rangeMax() !== self.initialMax;
        };

        /**
         * Check is slider in initial state
         */
        self.isDefault = ko.computed(function () {

            if (self.type === SliderViewModel.TYPE_RANGE) {
                return !self.isMinRangeChanged() && !self.isMaxRangeChanged();
            }

            if (self.type === SliderViewModel.TYPE_MIN) {
                return !self.isMinRangeChanged();
            }

            return false;
        });

        self.reset = function () {
            self.rangeMin(self.initialMin);
            self.rangeMax(self.initialMax);
            self.displayRangeMin(self.initialMin);
            self.displayRangeMax(self.initialMax);
        };
    }

    SliderViewModel.TYPE_RANGE = 'range';
    SliderViewModel.TYPE_MIN = 'min';

    return SliderViewModel;
});
