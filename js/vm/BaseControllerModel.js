'use strict';
define(
	['knockout'],
	function (ko) {
		/**
		 * Base controller model - base model that implements standard controller behaviour and is suitable
		 * for easy extending
		 *
		 * @param componentParameters
		 * @param controller
		 * @constructor
		 */
		function BaseControllerModel (componentParameters, controller) {
			this.$$componentParameters = componentParameters;
			this.$$controller = controller;
			this.$$loading = ko.observable(true);
			this.$$error = ko.observable(null);
			this.$$rawdata = null;
			this.$$loadingItems = 0;
			this.name = '';
		}

		/**
		 * Method that loads everything that is commonly needed
		 */
		BaseControllerModel.prototype.run = function () {
			var self = this,
				dataURL = this.dataURL();

			/**
			 * We set here how many loading steps do we take
			 * @type {number}
			 */
			this.$$loadingItems = 3;

			// Loading needed view models
			this.$$controller.loadViewModels(this.getUsedModels(), function (loadedModels) {
				self.$$loadingItems--;
				self.checkInitialLoadCompletion();

				var segments = self.getI18nSegments();

				for (var i = 0; i < loadedModels.length; i++) {
					if ('getI18nSegments' in loadedModels[i].prototype) {
						var modelsegs = loadedModels[i].prototype.getI18nSegments();

						self.$$controller.log('Additional model', loadedModels[i], 'i18n segments:', modelsegs);

						segments = segments.concat(modelsegs);
					}
				}

				// Loading i18n
				self.$$controller.loadI18n(
					segments,
					function () {
						self.$$loadingItems--;
						self.checkInitialLoadCompletion();
					},
					function () {
						self.$$error('Could not load i18n data.');
					}
				);
			});

			// Loading data
			if (dataURL) {
				this.$$loadingItems++;

				this.$$controller.loadData(
					dataURL,
					this.dataPOSTParameters(),
					function (text, request) {
						try {
							self.$$rawdata = JSON.parse(text);
						}
						catch (e) {
							self.$$error('Request failed: wrong response.');
							self.$$loading(false);
							return;
						}

						self.$$loadingItems--;
						self.checkInitialLoadCompletion();
					},
					function (request) {
						self.$$error('Request failed: ' + request.status + ': ' + request.statusText);
						self.$$loading(false);
					}
				);
			}

			// Loading needed ko bindings
			this.$$controller.loadKOBindings(
				this.getKOBindings(),
				function () {
					self.$$loadingItems--;
					self.checkInitialLoadCompletion();
				},
				function () {
					self.$$error('Could not load KO bindings.');
					self.$$controller.error(arguments);
				}
			);
		};

		/**
		 * Method that checks if we have loaded everything and if successful - starts a conversion of raw data into ViewModel structure
		 */
		BaseControllerModel.prototype.checkInitialLoadCompletion = function () {
			if (this.$$loadingItems == 0) {
				this.$$controller.log('Finished initial loading of', this, ' starting to build models: ', this.$$rawdata);
				this.buildModels();
				this.$$loading(false);
			}
		};

		/**
		 * Returns an array of used ViewModels' names
		 * @returns {Array}
		 */
		BaseControllerModel.prototype.getUsedModels = function () {
			return this.$$usedModels;
		};

		/**
		 * Returns an array of used i18n segments' names
		 * @returns {Array}
		 */

		BaseControllerModel.prototype.getI18nSegments = function () {
			return this.$$i18nSegments;
		};
		/**
		 * Returns an array of used knockout bindings packages' names
		 * @returns {Array}
		 */
		BaseControllerModel.prototype.getKOBindings = function () {
			return this.$$KOBindings;
		};

		BaseControllerModel.prototype.buildModels = function () {};

		BaseControllerModel.prototype.dataURL = function () {};

		BaseControllerModel.prototype.dataPOSTParameters = function () {};

		BaseControllerModel.prototype.$$usedModels = [];

		BaseControllerModel.prototype.$$i18nSegments = [];

		BaseControllerModel.prototype.$$KOBindings = [];

		BaseControllerModel.prototype.pageTitle = null;

		return BaseControllerModel;
	}
);