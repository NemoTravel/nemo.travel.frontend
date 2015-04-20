'use strict';
define(
	['knockout'],
	function (ko) {
		/**
		 * Dictionary model - model that takes arbitrary data and converts it into observables.
		 * It also manages stuff like obligatory system fields and the like
		 */
		function DictionaryModel (initialData, controllerObject) {
			for (var i in initialData) {
				if (initialData.hasOwnProperty(i)) {
					if (this.CONST_SYSTEM_FIELDS.indexOf(i) >= 0) {
						this['$$'+i] = initialData[i];
					}
					else if (initialData[i] instanceof Array) {
						this[i] = ko.observableArray(initialData[i]);
					}
					else if (typeof this[i] == 'undefined') {
						this[i] = ko.observable(initialData[i]);
					}
				}
			}

			this.$$originalData = initialData;
			this.$$controller = controllerObject;
		}

		/**
		 * Updates model by provided data object
		 * @param {{}} data
		 */
		DictionaryModel.prototype.updateModel = function (data) {
			for (var i in data) {
				if (data.hasOwnProperty(i)) {
					if (typeof this[i] == 'undefined') {
						if (this.CONST_SYSTEM_FIELDS.indexOf(i) < 0) {
							this.error('Unknown property', i, 'in model', this);
						}
					}
					else if (typeof this[i] == 'function') {
						this[i](data[i]);
					}
					else {
						this[i] = data[i];
					}
				}
			}
		};

		/**
		 * "Unmaps" viewModel turning it into an object to be sent to server
		 * @returns {{}}
		 */
		DictionaryModel.prototype.unMap = function () {
			return this._unMapWorker(this);
		};

		/**
		 * Worker recursive function for this.unMap
		 * @param node
		 * @returns {{}}
		 * @private
		 */
		DictionaryModel.prototype._unMapWorker = function (node) {
			var ret = {},
				tmp;

			for (var i in node) {
				if (node.hasOwnProperty(i) && i.substr(0,2) != '$$') {
					tmp = ko.unwrap(node[i]);

					// We don't process computeds or functions
					if (!ko.isComputed(node[i]) && typeof tmp != 'function') {
						// We process only ViewModel case setting a ref
						if (typeof tmp == 'object' && tmp instanceof DictionaryModel) {
							ret[i] = '$ref_'+tmp.$$uri;
						}
						// Object and not null - recursively go down
						else if (typeof tmp == 'object' && tmp !== null) {
							ret[i] = DictionaryModel.prototype._unMapWorker(tmp);
						}
						// Any other case except function - simple value
						else {
							ret[i] = tmp;
						}
					}
				}
			}

			return ret;
		};

		/**
		 * List of
		 * @type {string[]}
		 */
		DictionaryModel.prototype.CONST_SYSTEM_FIELDS = ['modelType', 'uri'];

		return DictionaryModel;
	}
);