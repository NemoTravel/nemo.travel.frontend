'use strict';
define(
	['knockout','js/vm/helpers','js/vm/BaseDynamicModel','js/vm/BaseI18nizedModel'],
	function (ko, helpers, BaseModel, BaseI18nizedModel) {
		function Money (initialData) {
			BaseModel.apply(this, arguments);

			this.normalizedAmount = ko.computed(function () {
				return Math.round(this.amount() * 100) / 100;
			}, this);
			
			this.getAbs = function () {
				var newAmount = this.amount() < 0 ? (this.amount() * -1) : this.amount();

				return this.$$controller.getModel('Common/Money', {
					amount: newAmount,
					currency: this.currency()
				});
			};
		}

		// Extending from base and i18nized model
		helpers.extendModel(Money, [BaseModel, BaseI18nizedModel]);

		return Money;
	}
);