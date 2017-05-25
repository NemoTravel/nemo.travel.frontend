'use strict';
define(['knockout', 'js/vm/BaseStaticModel', 'js/vm/helpers', 'js/vm/Common/Money'], function (ko, BaseModel, helpers, Money) {
	function HotelsRoomTariffModel() {
		BaseModel.apply(this, arguments);
		
		this.fixPriceIfNeeded();
	}

	helpers.extendModel(HotelsRoomTariffModel, [BaseModel]);

	/**
	 * Есть ли проблемы с объектом стоимости тарифа.
	 * Могут возникать из-за лютого говнокода.
	 */
	HotelsRoomTariffModel.prototype.fixPriceIfNeeded = function () {
		var needFix = this.rate && this.rate.price && (
			!(this.rate.price instanceof Money) || 
			!ko.isObservable(this.rate.price.amount) ||
			!ko.isObservable(this.rate.price.currency)
		);
		
		if (needFix) {
			this.rate.price = this.$$controller.getModel('Common/Money', {
				amount: ko.unwrap(this.rate.price.amount),
				currency: ko.unwrap(this.rate.price.currency)
			});
		}
	};
	
	return HotelsRoomTariffModel;
});