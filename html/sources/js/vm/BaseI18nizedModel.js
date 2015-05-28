'use strict';
define(
	['knockout'],
	function (ko) {
		/**
		 * Base model that knows which i18n segments it uses
		 */
		function BaseI18nizedModel (initialData, controllerObject) {}

		BaseI18nizedModel.prototype.getI18nSegments = function () {
			return this.$$i18nSegments;
		};

		BaseI18nizedModel.prototype.$$i18nSegments = [];

		return BaseI18nizedModel;
	}
);