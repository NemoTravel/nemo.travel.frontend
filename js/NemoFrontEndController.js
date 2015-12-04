'use strict';
define (
	['knockout', 'js/vm/helpers'],
	function (ko, helpers) {
		var NemoFrontEndController = function (scope, options) {
			var self = this;

			this.scope = scope;
			this.options = {};
			this.ko = ko;

			this.routes = [
				// Form with optional data from existing search
				{re: /^(?:search\/(\d+)(?:\/.*)?)?$/, handler: 'Flights/SearchForm/Controller'},

				// Form with initialization by URL:
				// /IEVPEW20150718PEWMOW20150710ADT3INS1CLD2-direct-vicinityDates-class=Business-GO
				// IEV, PEW - IATAs with city priority, 20150718 - YYYY-MM-DD date
				// ADT 3 INS 1 CLD 2 - Passenger types with corresponding counts
				// direct - direct flights flag
				// vicinityDates - vicinity dates flag
				// class=Business - class definition
				// GO - immediate search flag
				{re: /^search\/((?:[A-Z]{6}\d{8})+)((?:[A-Z]{3}\d+)+)?((?:-[a-zA-Z=\d]+)+)?$/, handler: 'Flights/SearchForm/Controller'},

				{re: /^results\/(\d+)(\/.*)?$/, handler: 'Flights/SearchResults/Controller'},

				// Search by URL params
				// /cLONcPAR2015081920150923ADT1SRC1YTH1CLD1INF1INS1-class=Business-direct-vicinityDates=3 - RT, note 2 dates together (16 numbers)
				// /cIEVaPEW20150731aPEWcIEV20150829cIEVaQRV20150916ADT3CLD2INS1-class=Business-direct - CR, 3 segments
				{re: /^results\/((?:[ac][A-Z]{3}[ac][A-Z]{3}\d{8,16})+)((?:[A-Z]{3}[1-9])+)((?:-[a-zA-Z=\d]+)+)$/, handler: 'Flights/SearchResults/Controller'},

				{re: /^order\/(\d+)$/, handler: 'Flights/Checkout/Controller'},
                {re: /^hotels$/, handler: 'Hotels/SearchForm/Controller'}
			];
			this.i18nStorage = {};

			this.componentsAdditionalParameters = {};

			// Processing options
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

			if (!this.options.dataURL) {
				this.options.dataURL = this.options.controllerSourceURL;
			}

			if (!this.options.templateSourceURL) {
				this.options.templateSourceURL = this.options.controllerSourceURL + '/html/';
			}

			if (!this.options.i18nURL) {
				this.options.i18nURL = this.options.controllerSourceURL+'/i18n';
			}

			// Setting components' additional parameters
			if (typeof options == "object" && typeof options.componentsAdditionalInfo == 'object') {
				this.componentsAdditionalParameters = options.componentsAdditionalInfo;
			}

			/**
			 * Routing object.
			 *
			 * Modified router from http://krasimirtsonev.com/blog/article/A-modern-JavaScript-router-in-100-lines-history-api-pushState-hash-url
			 */
			this.router = {
				pushStateSupport: !!(history.pushState),
				init: function () {
					self.options.root = '/'+this.clearSlashes(self.options.root)+'/';

					if (self.options.root == '//') {
						self.options.root = '/';
					}
				},
				getFragment: function() {
					var controllerSourceURL = ('/'+this.clearSlashes(decodeURI(location.pathname + location.search)).replace(/\?(.*)$/, '')+'/'),
						fragment;

					if (controllerSourceURL == '//') {
						controllerSourceURL = '/';
					}

					if (self.options.root == '/' || controllerSourceURL.indexOf(self.options.root) === 0) {
						fragment = self.options.root != '/' ? controllerSourceURL.replace(self.options.root, '') : controllerSourceURL;
						return this.clearSlashes(fragment);
					}

					return '### NO ROUTE ###';
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
				navigate: function(path, title) {
					path = path ? path : '';

					document.title = title;

					if(this.pushStateSupport) {
						history.pushState('', title, self.options.root + this.clearSlashes(path));
					} else {
						window.location = self.options.root + this.clearSlashes(path);
					}
					return this;
				},
				replaceState: function(path, title) {
					path = path ? path : '';

					document.title = title;

					if(this.pushStateSupport) {
						history.replaceState(null, null, self.options.root + this.clearSlashes(path));
					} else {
						window.location = self.options.root + this.clearSlashes(path);
					}
					return this;
				}/*,
				back: function() {
					history.back();

					return this;
				}*/
			};

			this.viewModel = {
				component: ko.observable(null),
				componentRoute: ko.observable(null),
				componentAdditionalParams: ko.observable(null),
				controller: this,
				globalError: ko.observable(null),
				i18n: function () {return self.i18n.apply(self, arguments);},
				helpers: helpers,
				agency: {
					id: ko.observable(0),
					currency: ko.observable('')
				},
				user: {
					id: ko.observable(0),
					status: ko.observable('guest')
				}
			};

			// Setting needed info for helpers
			helpers.language = self.options.i18nLanguage;

			// Adding component loader
			ko.components.loaders.unshift({
				getConfig: function() {self.compLoaderGetConfig.apply(self, arguments);},
				loadViewModel: function() {self.compLoaderLoadViewModel.apply(self, arguments);}
			});

			this.router.init();

			// Requiring base things: common bindings, base models etc
			this.loadI18n(['common', 'pageTitles'], function () {
				require (
					[
						/*this.options.controllerSourceURL + */'js/vm/BaseDynamicModel',
						/*this.options.controllerSourceURL + */'js/vm/BaseStaticModel',
						/*this.options.controllerSourceURL + */'js/vm/BaseI18nizedModel',
						/*this.options.controllerSourceURL + */'js/vm/BaseControllerModel',
						/*this.options.controllerSourceURL + */'js/bindings/common',
						'domReady'
					],
					function (BaseDynamicModel, BaseStaticModel, BaseI18nizedModel, BaseControllerModel) {
						// We must always require a domready event.
						// domready is triggered after popstate event and we don't need our listener catch the first one due
						// to different browsers triggering popstate differently
						require (['domReady!'], function () {
							// Adding base models to storage
							self.processLoadedModel('BaseDynamicModel', BaseDynamicModel);
							self.processLoadedModel('BaseStaticModel', BaseStaticModel);
							self.processLoadedModel('BaseI18nizedModel', BaseI18nizedModel);
							self.processLoadedModel('BaseControllerModel', BaseControllerModel);

							// Setting KO
							ko.applyBindings(self.viewModel, self.scope);

							self.log('NemoFrontEndController loaded and initted. KO bound. Options', options, 'Resulting options', self.options);

							// Setting event listener that will fire on page URL change
							window.addEventListener(
								"popstate",
								function () {
									self.processRoute();
								}
								, false);

							self.processRoute();
						});
					}
				);
			});
		};

		NemoFrontEndController.prototype.navigate = function (url, processRoute, titlekey) {
			this.router.navigate(url, this.i18n('pageTitles', titlekey));

			if (typeof processRoute == 'undefined' || processRoute) {
				this.processRoute();
			}
		};

		NemoFrontEndController.prototype.navigateReplace = function (newUrl, processRoute, titlekey) {
			this.router.replaceState(newUrl, this.i18n('pageTitles', titlekey));

			if (typeof processRoute == 'undefined' || processRoute) {
				this.processRoute();
			}
		};

		NemoFrontEndController.prototype.navigateGetPushStateSupport = function () {
			return this.router.pushStateSupport;
		};

		NemoFrontEndController.prototype.i18n = function (segment, key) {
			if (this.i18nExtensions[segment] && this.i18nExtensions[segment][key]) {
				return this.i18nExtensions[segment][key];
			}
			else if (this.i18nStorage[segment] && this.i18nStorage[segment][key]) {
				return this.i18nStorage[segment][key];
			}
			else {
				return '{i18n:'+segment+':'+key+'}';
			}
		};

		/**
		 * Loads a collection of ViewModels, processes them and then executes provided callback
		 * @param modelsArray string[]
		 * @param callback function
		 */
		NemoFrontEndController.prototype.loadViewModels = function (modelsArray, callback) {
			var self = this,
				modelsRequireArray = [];

			for (var i = 0; i < modelsArray.length; i++) {
				modelsRequireArray.push(/*this.options.controllerSourceURL + */'js/vm/' + modelsArray[i]);
			}

			require (
				modelsRequireArray,
				function () {
					for (var i = 0; i < modelsArray.length; i++) {
						self.processLoadedModel(modelsArray[i], arguments[i]);
					}

					callback(arguments);
				}
			);
		};

		/**
		 * Loads knockout bindings by provided array of names
		 *
		 * @param bindPacksArray array of knockout bindings package names
		 * @param callback executed when everything is loaded
		 * @param errorCallback executed when something could not be loaded
		 */
		NemoFrontEndController.prototype.loadKOBindings = function (bindPacksArray, callback, errorCallback) {
			// Cloning array
			bindPacksArray = bindPacksArray.slice(0);

			for (var i = 0; i < bindPacksArray.length; i++) {
				bindPacksArray[i] = /*this.options.controllerSourceURL + */'js/bindings/' + bindPacksArray[i];
			}

			require(
				bindPacksArray,
				callback,
				errorCallback
			);
		};

		/**
		 * Load i18n segments data
		 *
		 * @param segmentsArray array of i18n segments names
		 * @param callback executed when everything is loaded and parsed successfully
		 * @param errorCallback executed when something could not be loaded or some segments were not parsed
		 */
		NemoFrontEndController.prototype.loadI18n = function (segmentsArray, callback, errorCallback) {
			var self = this,
				segmentsLoaded = 0,
				requestsCompleted = 0,
				loadArray = [];

			function checkReadiness () {
				if (segmentsLoaded == loadArray.length) {
					callback();
				}
				else if (requestsCompleted == loadArray.length) {
					if (errorCallback != undefined) {
						errorCallback();
					}
				}
			}

			// Filtering out loaded segments
			for (var i = 0; i < segmentsArray.length; i++) {
				if (!self.i18nStorage[segmentsArray[i]]) {
					loadArray.push(segmentsArray[i]);
				}
			}

			if (loadArray.length == 0) {
				checkReadiness();
			}

			for (var i = 0; i < loadArray.length; i++) {
				if (!self.i18nStorage[loadArray[i]]) {
					// Need a closure here
					(function (index) {
						self.makeRequest(
							self.options.i18nURL + '/' + self.options.i18nLanguage + '/' + loadArray[index] + '.json',
							null,
							function (text, request) {
								requestsCompleted++;

								try {
									if (!self.i18nStorage[loadArray[index]]) {
										self.log('Setting i18n segmeent', loadArray[index]);
										self.i18nStorage[loadArray[index]] = JSON.parse(text);
									}

									segmentsLoaded++;
								}
								catch (e) {
									self.error(e);
								}

								checkReadiness();
							},
							function () {
								requestsCompleted++;
								checkReadiness();
							}
						);
					})(i);
				}
				else {
					requestsCompleted++;
					segmentsLoaded++;
				}
			}
		};

		/**
		 * Wrapper function for makeRequest for initial data loading
		 *
		 * @param url
		 * @param additionalParams
		 * @param callback
		 * @param errorCallback
		 * @returns {*}
		 */
		NemoFrontEndController.prototype.loadData = function (url, additionalParams, callback, errorCallback) {
			return this.makeRequest(this.options.dataURL + url /*FIXME*/ + '?user_language_get_change=' + this.options.i18nLanguage /*ENDFIXME*/, additionalParams, callback, errorCallback);
		};

		/**
		 * Makes an AJAX call using CORS
		 *
		 * Vanilla requests are used because in general we don't know which libraries are present and used on page
		 *
		 * @param url
		 * @param additionalParams
		 * @param callback
		 * @param errorCallback
		 * @returns {XMLHttpRequest}
		 */
		NemoFrontEndController.prototype.makeRequest = function (url, additionalParams, callback, errorCallback) {
			var self = this;

			// We use vanilla js because we don't know which of the third-party libraries are present on page
			// TODO - make code more simple
			if ( typeof XDomainRequest != "undefined" && url.indexOf(window.location.hostname) <= 0) {
				//This pitiful parody on a normal request is written solely for IE9. Kill it with fire when support will no longer be needed
				var request = new XDomainRequest(),
				POSTParams = '';

				if (typeof additionalParams == 'object' && additionalParams) {
					POSTParams += (POSTParams ? '&' : '') + this.processPOSTParameters(additionalParams);
				}
				if (POSTParams) {
					request.open('GET', url+'&'+POSTParams);
				} else {
					request.open('GET', url);
				}

				request.onload = function(){
					if(callback){
						self.processServerData(request.responseText);
						callback(request.responseText, request);
					}
				};
				request.onerror = function(){
					if(errorCallback){
						errorCallback(request);
					}
				};
				request.onprogress = function(){ };
				request.ontimeout = function(){ };
				setTimeout(function(){
					request.send();
				}, 0);
				return request
			}else{
				var request = new XMLHttpRequest(),
					POSTParams = '';

				try {
					// A wildcard '*' cannot be used in the 'Access-Control-Allow-Origin' header when the credentials flag is true.
					request.withCredentials = this.options.CORSWithCredentials;
				} catch (e) {
				}

				if (typeof this.options.postParameters == 'object' && this.options.postParameters) {
					POSTParams += this.processPOSTParameters(this.options.postParameters);
				}
				if (typeof additionalParams == 'object' && additionalParams) {
					POSTParams += (POSTParams ? '&' : '') + this.processPOSTParameters(additionalParams);
				}

				request.open(POSTParams ? 'POST' : 'GET', url, true);

				if (POSTParams) {
					if(request.setRequestHeader) {
						request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
					}
				}

				request.onreadystatechange = function() {
					if (request.readyState === 4) {
						if (request.status >= 200 && request.status < 400) {
							self.processServerData(request.responseText);
							callback(request.responseText, request);
						} else {
							errorCallback(request);
						}
					}
				};

				request.send(POSTParams);

				return request;
			}

		};

		NemoFrontEndController.prototype.processServerData = function (responseText) {
			var data;

			try {
				data = JSON.parse(responseText);

				if (data && data.system && data.system.info && data.system.info.user) {
					this.viewModel.user.id(data.system.info.user.userID);
					this.viewModel.user.status(data.system.info.user.status);

					this.viewModel.agency.id(data.system.info.user.agencyID);
					this.viewModel.agency.currency(data.system.info.user.settings.agencyCurrency);
				}
			}
			catch (e) {
				this.warn(e);
			}
		};

		/**
		 * Knockout component loader method: creates a viewModel/template pair
		 *
		 * @param name
		 * @param callback
		 */
		NemoFrontEndController.prototype.compLoaderGetConfig = function (name, callback) {
			var self = this,
				template = name.replace('Controller', '').split('/');

			template.pop();
			template = template.join('');

			this.log('Detected component', name, callback);

			callback({
				viewModel: { require: self.options.controllerSourceURL + '/js/vm/' + name + '.js' },
				template: { require: 'text!' + self.options.templateSourceURL + template + '.html' }
			});
		};

		/**
		 * Knockout component loader method: provides a factory of ViewModels.
		 *
		 * Created ViewModels self-initialization is immediately launched
		 *
		 * @param name
		 * @param templateConfig
		 * @param callback
		 */
		NemoFrontEndController.prototype.compLoaderLoadViewModel = function (name, templateConfig, callback) {
			var self = this;
			this.log('Component loaded:',name, templateConfig, callback);

			this.processLoadedModel(name, templateConfig);

			callback(function (params, componentInfo) {
				self.log('Creating component instance:', params, componentInfo);

				var ret = self.getModel(name, params);

				ret.run();

				if (params.$$rootComponent && ret.pageTitle) {
					document.title = self.i18n('pageTitles', ret.pageTitle);
				}

				return ret;
			});
		};

		/**
		 * Defines route and sets initial data to root ViewModel
		 */
		NemoFrontEndController.prototype.processRoute = function () {
			var route = this.router.check(),
				self = this;

			if (route instanceof Array) {
				this.log('Route detected: ', route);
				self.viewModel.componentRoute(route[1]);
				self.viewModel.componentAdditionalParams(this.componentsAdditionalParameters[route[0]] || {}),
				self.viewModel.component(route[0]);
			}
			else {
				this.warn('No route detected. App terminated.');
				self.viewModel.globalError(this.i18n('common', 'nemoApp__globalError__noRoute'));
			}
		};

		/**
		 * A factory that returns a ViewModel by provided name and initialized with provided data object.
		 *
		 * It is responsible for ViewModels extensions
		 *
		 * @param name
		 * @param initialData
		 * @throws {String} when model is not found in storage
		 * @returns {}
		 */
		NemoFrontEndController.prototype.getModel = function (name, initialData) {
			var model;

			if (typeof this.modelsPool[name] != 'undefined') {
				this.log('Creating new', name, 'initializing with', initialData);

				model = new this.modelsPool[name](initialData, this);

				// Extending if needed
				if (typeof this.extensions[name] != 'undefined') {
					this.log('Extending', name, 'with', this.extensions[name]);

					for (var i = 0; i < this.extensions[name].length; i++) {
						this.extensions[name][i].call(model);
					}
				}

				return model;
			}
			else {
				throw "Unknown model name " + name;
			}
		}

		/**
		 * Stores model into internal storage
		 *
		 * @param name
		 * @param model
		 */
		NemoFrontEndController.prototype.processLoadedModel = function (name, model) {
			if (typeof this.modelsPool[name] == 'undefined') {
				this.log('Loaded new model:', name, model);
				this.modelsPool[name] = model;
			}
			else {
				this.log('Existing model:', name, model, 'skipping');
			}
		};

		/**
		 * Logger method with safeguard against console inexistence
		 */
		NemoFrontEndController.prototype.log = function () {
			if (this.options.verbose && typeof console != "undefined" && typeof console.log == "function") {
				console.log.apply(console, arguments);
			}
		};

		/**
		 * Logger method with safeguard against console inexistence
		 */
		NemoFrontEndController.prototype.error = function () {
			if (typeof console != "undefined" && typeof console.error == "function") {
				console.error.apply(console, arguments);
			}
		};

		/**
		 * Logger method with safeguard against console inexistence
		 */
		NemoFrontEndController.prototype.warn = function () {
			if (typeof console != "undefined" && typeof console.warn == "function") {
				console.warn.apply(console, arguments);
			}
		};

		/**
		 * Prototype method that sets ViewModel "extender functions" into storage
		 *
		 * @param what
		 * @param extensionFunction
		 */
		NemoFrontEndController.prototype.extend = function (what, extensionFunction) {
			if (!(NemoFrontEndController.prototype.extensions[what] instanceof Array)) {
				NemoFrontEndController.prototype.extensions[what] = [];
			}

			NemoFrontEndController.prototype.extensions[what].push(extensionFunction);
		};

		/**
		 * Prototype method that sets i18n extensions into storage
		 *
		 * @param extension
		 */
		NemoFrontEndController.prototype.i18nExtend = function (extension) {
			for (var i in extension) {
				if (extension.hasOwnProperty(i)) {
					if (!NemoFrontEndController.prototype.i18nExtensions[i]) {
						NemoFrontEndController.prototype.i18nExtensions[i] = {};
					}

					for (var j in extension[i]) {
						if (extension[i].hasOwnProperty(j)) {
							NemoFrontEndController.prototype.i18nExtensions[i][j] = extension[i][j];
						}
					}
				}
			}
		};

		/**
		 * Converts a voluntary object into POST-parameters string
		 *
		 * Ported from jQuery
		 *
		 * @param obj
		 * @returns {string}
		 */
		NemoFrontEndController.prototype.processPOSTParameters = function(obj) {
			var result = [],
				addItem = function(key, value) {
					result[result.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value == null ? "" : value);
				};

			function recursiveBuild (prefix, node) {
				var name;

				if (Array.isArray(node)) {
					// Serialize array item.
					for (var i in node) {
						if (node.hasOwnProperty(i)) {
							var v = node[i];

							if (/\[\]$/.test(prefix)) {
								// Treat each array item as a scalar.
								addItem(prefix, v);

							} else {
								// Item is non-scalar (array or object), encode its numeric index.
								recursiveBuild(prefix + "[" + (typeof v === "object" ? i : "") + "]", v);
							}
						}
					}
				} else if (typeof node === "object") {
					// Serialize object item.
					for (name in node) {
						recursiveBuild(prefix + "[" + name + "]", node[ name ]);
					}

				} else {
					// Serialize scalar item.
					addItem(prefix, node);
				}
			}

			for ( var prefix in obj ) {
				if (obj.hasOwnProperty(prefix)) {
					recursiveBuild(prefix, obj[prefix]);
				}
			}

			// Return the resulting serialization
			return result.join("&").replace(/%20/g,"+");
		};

		/**
		 * Default options object
		 *
		 * @type {{root: string, controllerSourceURL: string, templateSourceURL: string, dataURL: string, staticInfoURL: string, version: string, hostId: string, verbose: boolean, postParameters: {}, i18nLanguage: string, i18nURL: string, CORSWithCredentials: boolean, cookiesPrefix: string}}
		 */
		NemoFrontEndController.prototype.defaultOptions = {
			root: '/',
			controllerSourceURL: '',
			templateSourceURL: '',
			dataURL: '',
			staticInfoURL: '',
			version: '',
			hostId: '',
			verbose: false,
			postParameters: {},
			i18nLanguage: 'en',
			i18nURL: '',
			CORSWithCredentials: false,
			cookiesPrefix: 'nemo-'
		};

		/**
		 * ViewModels storage for factory
		 *
		 * @type {{}}
		 */
		NemoFrontEndController.prototype.modelsPool = {};

		/**
		 * ViewModels extension functions storage
		 *
		 * @type {{}}
		 */
		NemoFrontEndController.prototype.extensions = {};

		/**
		 * i18n extensions storage
		 *
		 * @type {{}}
		 */
		NemoFrontEndController.prototype.i18nExtensions = {};

		return NemoFrontEndController;
	}
);