'use strict';
define (function () {
	var NemoFrontEndController = function (routes, root, scope, options, ko) {
		this.CONST_COMMON_LOAD = [
			'vm/BaseStaticModel',      // Base model: static
			'vm/BaseDynamicModel',     // Base model: dynamic
			'vm/BaseControllerModel',  // Base model: controller
			'bindings/common',         // Common bindings
			'lib/i18n/i18n'            // Internationalization plugin
		];

		var self = this;

		this.scope = scope;
		this.options = {};
		this.ko = ko;
		this.uniqueObjectsId = 0;
		this.routes = routes || [];
		this.root = root || '/';

		for (var i in this.defaultOptions) {
			if (this.defaultOptions.hasOwnProperty(i)) {
				if (typeof options == "object" && options.hasOwnProperty(i)) {
					this.options[i] = options[i];
				}
				else {
					this.options[i] = this.defaultOptions[i];
				}
			}
		}

		/**
		 * Routing object.
		 *
		 * Modified router from http://krasimirtsonev.com/blog/article/A-modern-JavaScript-router-in-100-lines-history-api-pushState-hash-url
		 *
		 * @type {{interval: null, init: init, getFragment: getFragment, clearSlashes: clearSlashes, check: check, listen: listen, navigate: navigate}}
		 */
		this.router = {
			interval: null,
			init: function () {
				self.root = '/'+this.clearSlashes(root)+'/';
			},
			getFragment: function() {
				var fragment = '/'+this.clearSlashes(decodeURI(location.pathname + location.search))+'/';
				fragment = fragment.replace(/\?(.*)$/, '');
				fragment = self.root != '/' ? fragment.replace(self.root, '') : fragment;

				return this.clearSlashes(fragment);
			},
			clearSlashes: function(path) {
				return path.toString().replace(/\/$/, '').replace(/^\//, '');
			},
			check: function() {
				var fragment = this.getFragment();
				for(var i = 0; i < self.routes.length; i++) {
					var match = fragment.match(self.routes[i].re);
					if(match) {
						match.shift();
						return [self.routes[i].handler, match];
					}
				}

				return null;
			},
			navigate: function(path) {
				path = path ? path : '';
				if(!!(history.pushState)) {
					history.pushState(null, null, self.root + this.clearSlashes(path));
				} else {
					window.location = self.root + this.clearSlashes(path);
				}
				return this;
			}
		};


		this.viewModel = {
			data: ko.observable(null)
		};

		this.router.init();

		// Setting KO
		ko.applyBindings(this.viewModel, this.scope);

		this.log('NemoFrontEndController loaded and initted. KO bound. Options', options, 'Resulting options', this.options);

		this.processRoute();
	};

	NemoFrontEndController.prototype.processRoute = function () {
		var route = this.router.check(),
			self = this;

		if (route instanceof Array) {
			this.log('Route detected: ', route);
			var t = this.CONST_COMMON_LOAD.slice(0);
			t.unshift(route[0]);

			require (t, function () {
				console.log(arguments);
				self.processLoadedModel(arguments[0], t[0]);
				self.processLoadedModel(arguments[1], t[1]);
				self.processLoadedModel(arguments[2], t[2]);
				self.processLoadedModel(arguments[3], t[3]);
			});
		}
		else {
			this.warn('No route detected. Terminating.');
		}
	};

	NemoFrontEndController.prototype.processLoadedModel = function (name, model) {
		if (typeof this.modelsPool[name] == 'undefined') {
			this.log('Loaded new model:', name, model);
			this.modelsPool[name] = model;
		}
		else {
			this.log('Existing model:', name, model, 'skipping');
		}
	};

	NemoFrontEndController.prototype.log = function () {
		if (this.options.verbose && typeof console != "undefined" && typeof console.log == "function") {
			console.log.apply(console, arguments);
		}
	};

	NemoFrontEndController.prototype.error = function () {
		if (typeof console != "undefined" && typeof console.error == "function") {
			console.error.apply(console, arguments);
		}
	};

	NemoFrontEndController.prototype.warn = function () {
		if (typeof console != "undefined" && typeof console.warn == "function") {
			console.warn.apply(console, arguments);
		}
	};

	NemoFrontEndController.prototype.extend = function (what, extensionFunction) {
		if (!(NemoFrontEndController.prototype.extensions[what] instanceof Array)) {
			NemoFrontEndController.prototype.extensions[what] = [];
		}

		NemoFrontEndController.prototype.extensions[what].push(extensionFunction);
	};

	NemoFrontEndController.prototype.defaultOptions = {
		verbose: false,
		postParameters: {},
		i18nLanguage: 'en',
		i18nURL: ''
	};

	NemoFrontEndController.prototype.modelsPool = {};

	NemoFrontEndController.prototype.extensions = {};

	return NemoFrontEndController;
});