'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseStaticModel'],
	function (ko, helpers, BaseModel) {
		/**
		 * "Abstract" class that is a base for all PF types: numeric and string
		 * @constructor
		 */
		function PostFilterAbstract (initialData, controller) {
			BaseModel.apply(this, [{config: initialData.config}, controller]);

			this.onChange = initialData.onChange;

			/**
			 * Current PF status
			 * @type {Number}
			 */
			this.status = ko.observable(this.CONST_STATUS_CLEARED);

			/**
			 * Possible values:
			 * @type {*}
			 */
			this.values = ko.observable(this.buildInternalValues(initialData.items));

			this.value = ko.observable();

			this.value.subscribe(function (newValue){
				this.notifyController();
			}, this);

			this.hasValue = ko.computed(function () {
				return this.status() == this.CONST_STATUS_HASVALUE;
			}, this);

			this.isActive = ko.computed(function () {
				return Object.keys(this.values()).length > 1;
			}, this);

			this.recalculateOptions(
				Object.keys(initialData.items).map(function (key) {return initialData.items[key];})
			);
		}

		// Extending from dictionaryModel
		helpers.extendModel(PostFilterAbstract, [BaseModel]);

		// "Class constants"
		/**
		 * Event type - PF was cleared
		 * @type {Number}
		 */
		PostFilterAbstract.prototype.CONST_STATUS_CLEARED = 0;

		/**
		 * Event type - PF was set to a state when EVERYTHING passed to it will pass the filter e.g. user selected ALL or NO checkboxes of multiple-choice filter
		 * @type {Number}
		 */
		PostFilterAbstract.prototype.CONST_STATUS_NOVALUE = 1;

		/**
		 * Event type - PF was set to a state when SOMETHING passed to it will pass the filter
		 * @type {Number}
		 */
		PostFilterAbstract.prototype.CONST_STATUS_HASVALUE = 2;

		/**
		 * Executed on value change
		 */
		PostFilterAbstract.prototype.notifyController = function () {
			this.computeStatus();
			this.onChange(this);
		};

		/**
		 * Builds internal values needed for a PF
		 * @param objectsList
		 */
		PostFilterAbstract.prototype.buildInternalValues = function (objectsList) {throw 'Method buildInternalValues is not overridden!';};

		/**
		 * Determines and sets status based on self value
		 */
		PostFilterAbstract.prototype.computeStatus = function () {throw 'Method computeStatus is not overridden!';};

		/**
		 * Clears value
		 */
		PostFilterAbstract.prototype.clear = function () {throw 'Method clear is not overridden!';};

		/**
		 * Filters an object
		 * @param obj
		 * @returns {*}
		 */
		PostFilterAbstract.prototype.filter = function (obj) {
			if (typeof this.config.getter == 'function' && this.hasValue()) {
				return this.checkValue(obj);
			}

			return true;
		};

		/**
		 * Checks object using current filter status data. System guarantees getter exists
		 * @param obj
		 * @return {Boolean}
		 *
		 * @pseudo-abstract
		 */
		PostFilterAbstract.prototype.checkValue = function (obj) {throw 'Method checkValue is not overridden!';};

		/**
		 * Recalculates internal data by other filters' combined results
		 * @param items
		 */
		PostFilterAbstract.prototype.recalculateOptions = function (items) {};

		return PostFilterAbstract;
	}
);