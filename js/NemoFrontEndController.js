'use strict';
define (
	['knockout', 'js/vm/helpers', 'js/lib/stacktrace/v.1.3.1/stacktrace.min', 'js/vm/Common/Cache/Cache', 'js/vm/Models/LocalStorage', 'js/lib/md5/md5'],
	function (ko, helpers, StackTrace, Cache, LocalStorage, md5) {
		var NemoFrontEndController = function (scope, options) {
			var self = this;

			this.scope = scope;
			this.options = {};
			this.ko = ko;

			this.initErrorHandler();

			this.routes = [
				// Flights Search Form
				{
					re: [
						// Form with optional data from existing search
						/^(?:search\/(\d+)(?:\/?.*)?)?$/,

						// Form with initialization by URL:
						// /IEVPEW20150718PEWMOW20150710ADT3INS1CLD2-direct-vicinityDates-class=Business-GO
						// /IEVPEWd1PEWMOWd10ADT3INS1CLD2-direct-vicinityDates-class=Business-GO
						// IEV, PEW - IATAs with city priority, 20150718 - YYYY-MM-DD date
						// d1 & d10 in second URL - relative dates
						// ADT 3 INS 1 CLD 2 - Passenger types with corresponding counts
						// direct - direct flights flag
						// vicinityDates - vicinity dates flag
						// class=Business - class definition
						// GO - immediate search flag
						/^search\/((?:[A-ZА-Я]{6}(?:\d{8}|d\d{1,2}))+)((?:[A-Z]{3}\d+)+)?((?:-[a-zA-Z=\d]+)+)?(?:\/?\?.*)?$/
					],
					handler: 'Flights/SearchForm/Controller'
				},

				// Flights Schedule Search
				{
					re: [
						/^scheduleSearch(?:\/(\d+)(?:\/?.*)?)?(?:\/?\?.*)?$/,
						/^scheduleSearch\/((?:[A-ZА-Я]{6}\d{8})+)((?:[A-Z]{3}\d+)+)?((?:-[a-zA-Z=\d\+]+)+)?(?:\/?\?.*)?$/
					],
					handler: 'Flights/ScheduleSearch/Controller'
				},

				// Flights Search Results
				{
					re: [
						// Search by results id
						/^results\/(\d+)(\/.*)?$/,

						// Search by URL params
						// /cLONcPAR2015081920150923ADT1SRC1YTH1CLD1INF1INS1-class=Business-direct-vicinityDates=3 - RT, note 2 dates together (16 numbers)
						// /cIEVaPEW20150731aPEWcIEV20150829cIEVaQRV20150916ADT3CLD2INS1-class=Business-direct - CR, 3 segments
						/^results\/((?:[ac][A-ZА-Я]{3}[ac][A-ZА-Я]{3}\d{8,16})+)((?:[A-Z]{3}[1-9])+)((?:-[a-zA-Z=\d\+]+)+)(?:\/?\?.*)?$/
					],
					handler: options.carrierResultsMode ? 'Flights/CarrierResults/Controller' : 'Flights/SearchResults/Controller'
				},

				// Hotels Search Form
				{
					re: [
						/^hotels$/,

						// Search by URL params
						// /123-20170801-20170803-ADT4INF2-ADT5INF4-ADT1
						// 123 - hotel id (optional)
						// 20170801 - arrival date (optional) (yyyymmdd)
						// 20170803 - departure date (optional)
						// -ADT4INF2 - 4 adults and 2 childs (optional) - (-ADT{X}INF{Y}) {X}, {Y} <= 9
						// GO - immediate search flag
						/^hotels\/search\/(((\d)*(-)?)?(\d{8}(-)?)?(-\d{8})?(-ADT\d(CLD\d)?)*(-GO)?)$/
					],
					handler: 'Hotels/SearchForm/Controller'
				},
				// Hotels Search Results
				{
					re: [
						// /hotels/results/:search_id?/:hotel_id?
						/^hotels\/results\/?(\d+)?\/?(\d+|\w+)?$/,

						// Fallback
						/^hotels\/results\/(\d+)\/(\d+|\w+)(\?.*)?$/
					],
					handler: 'Hotels/SearchResults/Controller',
					params: ['search_id', 'hotel_id']
				},

				// Fallback for the search form
				{
					re: /^(\/?)\?(.*)?$/,
					handler: 'Flights/SearchForm/Controller'
				},

				// Fallback for the hotels search form
				{
					re: /^hotels(\/?)\?(.*)?$/,
					handler: 'Hotels/SearchForm/Controller'
				},
				// ??? what is that thing
				{re: /^order\/(\d+)$/, handler: 'Flights/Checkout/Controller'}
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
				current: {
					route: [],
					set: function (data) {
						self.router.current.route = data;
					},
					getParameterValue: function (parameterId, defaultValue) {
						return self.router.current.route[2] && self.router.current.route[2][parameterId] ? self.router.current.route[2][parameterId] : defaultValue;
					},
					get: function (parameter, defaultValue) {
						var allParams = location.search.substring(1);
						var arrayParams = allParams.split('&');
						var objectParams = {};
						arrayParams.forEach(function (value) {
							var pair = value.split('=');
							objectParams[pair[0]] = pair[1];
						});
						return typeof objectParams[parameter] !== 'undefined' ? objectParams[parameter] : defaultValue;
					}
				},

				pushStateSupport: !!(history.pushState),

				init: function () {
					self.options.root = '/'+this.clearSlashes(self.options.root)+'/';

					if (self.options.root == '//') {
						self.options.root = '/';
					}
				},
				getFragment: function() {
					var path = ('/' + this.clearSlashes(decodeURI(location.pathname + (location.host.indexOf('yandex') !== -1 ? '' : location.search)))/*.replace(/\?(.*)$/, '')*/ + '/'),
						fragment;

					if (path == '//') {
						path = '/';
					}

					if (self.options.root == '/' || path.indexOf(self.options.root) === 0) {
						fragment = self.options.root != '/' ? path.replace(self.options.root, '') : path;
						return this.clearSlashes(fragment);
					}

					return '### NO ROUTE ###';
				},
				clearSlashes: function(path) {
					return path.toString().replace(/\/$/, '').replace(/^\//, '');
				},
				check: function() {
					var fragment = this.getFragment();

					for (var i = 0; i < self.routes.length; i++) {
						var patterns = self.routes[i].re;

						if (!(patterns instanceof Array)) {
							patterns = [patterns];
						}

						for (var j = 0, max = patterns.length; j < max; j++) {
							var match = fragment.match(patterns[j]);

							if (match) {
								var routeParams = match.slice(1),
									routeParamsValues = {};

								if (self.routes[i].params) {
									self.routes[i].params.forEach(function (paramId, index) {
										routeParamsValues[paramId] = routeParams[index];
									});
								}

								match.shift();

								return [self.routes[i].handler, match, routeParamsValues];
							}
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

					self.router.current.set(self.router.check()); // update current route

					return this;
				},
				listen: function() {
					var self = this;
					var current = self.getFragment();
					var fn = function() {
						if(current !== self.getFragment()) {
							current = self.getFragment();
							self.check(current);
						}
					}
					clearInterval(this.interval);
					this.interval = setInterval(fn, 50);
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
					userCurrency: ko.observable(LocalStorage.get('currency', null) || 'RUB'), // user currency
					priceCurrency: ko.observable(''),
					list: ko.observableArray([]), // all available currencies
					rates: ko.observableArray([]), // exchange rate
					onCurrencyChange: function (currency) {
						self.viewModel.agency.userCurrency(currency);
						LocalStorage.set('currency', currency);
					},
					changeLanguage: function (language) {
						LocalStorage.set('language', language);
						location.reload();
					}
				},
				user: {
					id: ko.observable(0),
					status: ko.observable('guest'),
					isB2B: ko.observable(false),
					settings: {
						googleMapsApiKey: ko.observable(''),
						currentCurrency: ko.observable('RUB'),
						agencyCurrency: ko.observable('RUB')
					}
				},
				languages: [
					{'id': 'en', 'title': 'English', 'icon': 'gb'},
					{'id': 'ru', 'title': 'Русский', 'icon': 'ru'},
					{'id': 'es', 'title': 'Español', 'icon': 'es'},
					{'id': 'ua', 'title': 'Українська', 'icon': 'ua'}
				],
				getLanguageById: function (languageId) {

					var language = {};

					this.languages.forEach(function (item) {
						if (item.id === languageId) {
							language = item;
							return;
						}
					});

					return language;
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
			// runs each time when app is booted
			var segments = ['common', 'pageTitles', 'currencyNames'],
				currentRoute = this.router.check();

			if (currentRoute) {
				segments.push(currentRoute[0].replace(/\//g, '').replace('Controller', ''));
			}

			if (segments.indexOf('HotelsSearchResults') === -1) {
				segments.push('HotelsSearchResults');
			}

			if (segments.indexOf('CommonBreadCrumbs') === -1) {
				segments.push('CommonBreadCrumbs');
			}

			this.loadI18n(segments, function () {

				require (
					[
						/*this.options.controllerSourceURL + */
						'js/vm/BaseDynamicModel',
						'js/vm/BaseStaticModel',
						'js/vm/BaseI18nizedModel',
						'js/vm/BaseControllerModel',
						'js/bindings/common',
						'domReady'
					],
					function (BaseDynamicModel, BaseStaticModel, BaseI18nizedModel, BaseControllerModel) {
						// We must always require a domready event.
						// domready is triggered after popstate event and we don't need our listener catch the first one due
						// to different browsers triggering popstate differently
						require (self.options.waitForDOMReady ? ['domReady!'] : [], function () {
							// Adding base models to storage
							self.processLoadedModel('BaseDynamicModel', BaseDynamicModel);
							self.processLoadedModel('BaseStaticModel', BaseStaticModel);
							self.processLoadedModel('BaseI18nizedModel', BaseI18nizedModel);
							self.processLoadedModel('BaseControllerModel', BaseControllerModel);

							// Setting KO
							ko.applyBindings(self.viewModel, self.scope);

							self.log('NemoFrontEndController loaded and initted. KO bound. Options', options, 'Resulting options', self.options);

							// Setting event listener that will fire on page URL change
							window.addEventListener("popstate", self.processRoute.bind(self), false);

							self.processRoute();
						});
					}
				);
			});
		};

		NemoFrontEndController.prototype.navigate = function (url, processRoute, titlekey) {
			var title = this.i18n('pageTitles', titlekey, null, true);

			this.router.navigate(url, title ? title : titlekey);

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

		NemoFrontEndController.prototype.i18n = function (segment, key, values, returnNull) {
			if (this.i18nExtensions[segment] && this.i18nExtensions[segment][key]) {
				return this.i18nExtensions[segment][key];
			}
			else if (this.i18nStorage[segment] && this.i18nStorage[segment][key]) {
				var template = this.i18nStorage[segment][key];

				if (typeof values === 'object') {
					helpers.iterateObject(values, function (value, prop) {
						template = template.replace('{' + prop + '}', value);
					});
				}

				return template;
			}
			else if (returnNull) {
				return null;
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
		 * @param successCallback executed when everything is loaded and parsed successfully
		 * @param errorCallback executed when something could not be loaded or some segments were not parsed
		 */
		NemoFrontEndController.prototype.loadI18n = function (segmentsArray, successCallback, errorCallback) {
			var self = this,
				loadByRequire = [],
				loadByAjax = [],
				cache = Cache.storage();

			errorCallback = errorCallback || function () {};
			successCallback = successCallback || function () {};

			segmentsArray.map(function (segmentName) {
				var moduleName = 'i18n/' + segmentName;

				if (require.specified(moduleName)) {
					// Find out if we can load i18n module by requirejs.
					loadByRequire.push(segmentName);
				}
				else if (!self.i18nStorage[segmentName]) {
					// Otherwise, we need to load file via AJAX.
					loadByAjax.push(segmentName);
				}
			});

			if (loadByAjax.length === 0 && loadByRequire.length === 0) {
				// There are nothing to load.
				successCallback();
			}
			else {
				var needToLoad = loadByAjax.length + loadByRequire.length;

				loadByRequire.map(function (segmentName, index, array) {
					var moduleName = 'i18n/' + segmentName;

					require(
						[ moduleName ],
						function (module) {
							self.i18nStorage[segmentName] = module;

							needToLoad--;

							if (needToLoad === 0) {
								successCallback();
							}
						},
						function () {
							errorCallback();
							needToLoad--;
						}
					);
				});

				loadByAjax.map(function (segmentName, index, array) {
					var fileURL = self.options.i18nURL + '/' + self.options.i18nLanguage + '/' + segmentName + '.json',
						urlHash = md5(fileURL);

					if (cache.has(urlHash)) {
						self.i18nStorage[segmentName] = JSON.parse(cache.get(urlHash));

						needToLoad--;

						if (needToLoad === 0) {
							successCallback();
						}
					}
					else {
						self.makeRequest(
							fileURL,
							null,
							function (text, request) {
								try {
									self.log('Setting i18n segmeent', segmentName);
									self.i18nStorage[segmentName] = JSON.parse(text);
								}
								catch (e) {
									self.error(e);
								}

								needToLoad--;

								if (needToLoad === 0) {
									successCallback();
								}
							},
							function () {
								errorCallback();
								needToLoad--;
							}
						);
					}
				});
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
			return this.makeRequest(this.options.dataURL + url /*FIXME*/ + ((url.indexOf('?') < 0) ? '?' : '&') + 'user_language_get_change=' + this.options.i18nLanguage /*ENDFIXME*/, additionalParams, callback, errorCallback);
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
			var request = new XMLHttpRequest(),
				POSTParams = '';

			if (typeof this.options.postParameters === 'object' && this.options.postParameters) {
				POSTParams += this.processPOSTParameters(this.options.postParameters);
			}
			if (typeof additionalParams === 'object' && additionalParams) {
				POSTParams += (POSTParams ? '&' : '') + this.processPOSTParameters(additionalParams);
			}

			// A wildcard '*' cannot be used in the 'Access-Control-Allow-Origin' header when the credentials flag is true.
			try {
				request.withCredentials = this.options.CORSWithCredentials;
				if(url.indexOf('frontendStatic') !== -1){
					request.withCredentials = false;
				}
				request.open(POSTParams ? 'POST' : 'GET', url, true);
			}
			catch(e){
				console.log('Ajax call threw this:'+e);
				request.open(POSTParams ? 'POST' : 'GET', url, true);
				request.withCredentials = this.options.CORSWithCredentials;
			}

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
		};

		NemoFrontEndController.prototype.processServerData = function (responseText) {
			var data;

			try {
				data = JSON.parse(responseText);

				if (data.system && data.system.info && data.system.info.currencyRates) {
					var currencyRates = data.system.info.currencyRates;
					this.viewModel.agency.list(currencyRates.backendCurrencyList);
					this.viewModel.agency.rates(currencyRates.rates);
				}

				if (data && data.system && data.system.info && data.system.info.user) {

					this.viewModel.user.id(data.system.info.user.userID);
					this.viewModel.user.status(data.system.info.user.status);
					this.viewModel.user.isB2B(data.system.info.user.isB2B);
					this.viewModel.user.settings.googleMapsApiKey(data.system.info.user.settings.googleMapsApiKey);
					this.viewModel.user.settings.agencyCurrency(data.system.info.user.settings.agencyCurrency);
					this.viewModel.user.settings.currentCurrency(data.system.info.user.settings.currentCurrency);

					this.viewModel.agency.id(data.system.info.user.agencyID);
					this.viewModel.agency.priceCurrency(data.system.info.user.settings.currentCurrency); // price currency
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
				template = name.replace('Controller', '').split('/'),
				bundledName;

			template.pop();
			template = template.join('');

			this.log('Detected component', name, callback);

			// Used for packaged app
			bundledName = 'html/' + template;

			var templateSource = document.getElementById(template);

			if (templateSource) {
				// Load via script tag.
				templateSource = {
					element: templateSource
				};
			}
			else {
				// Load via AJAX.
				templateSource = {
					require: require.specified(bundledName) ? bundledName : 'text!' + self.options.templateSourceURL + template + '.html'
				};
			}

			callback({
				viewModel: { require: 'js/vm/' + name },
				template: templateSource
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
				self.viewModel.componentAdditionalParams(this.componentsAdditionalParameters[route[0]] || {});
				self.viewModel.component(route[0]);
				self.router.current.set(route);
			}
			else {
				this.warn('No route detected. App terminated.');
				self.viewModel.globalError(this.i18n('common', 'nemoApp__globalError__noRoute'));
			}
		};

		/**
		 * A factory that returns a ViewModel by provided name and initialized with provided data object.
		 *
		 * It is responsible for ViewModels extensions.
		 *
		 * @param name
		 * @param initialData
		 * @param constructor If model is not loaded yet, provide the constructor function to generate model
		 * @throws {String} when model is not found in storage
		 *
		 * @returns {Object}
		 */
		NemoFrontEndController.prototype.getModel = function (name, initialData, constructor) {
			var model;

			if (constructor) {
				this.processLoadedModel(name, constructor);
			}

			if (typeof this.modelsPool[name] !== 'undefined') {
				this.log('Creating new', name, 'initializing with', initialData);

				model = new this.modelsPool[name](initialData, this);

				// Extending if needed
				if (typeof this.extensions[name] !== 'undefined') {
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
		};

		/**
		 * Stores model into internal storage
		 *
		 * @param name
		 * @param model
		 */
		NemoFrontEndController.prototype.processLoadedModel = function (name, model) {
			if (typeof this.modelsPool[name] === 'undefined') {
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

		NemoFrontEndController.prototype.initErrorHandler = function () {
			var self = this;

			/**
			 * @param {String} message
			 * @param {String} filename
			 * @param {String} line
			 * @param {String} column
			 * @param {Error} error
			 * @returns {boolean}
			 */
			window.onerror = function (message, filename, line, column, error) {
				/** @see https://www.stacktracejs.com/#!/docs/stacktrace-js */
				StackTrace.fromError(error).then(function (frames) {
					var stack = [],
						overlay = document.createElement('div'),
						errorTitle = self.i18n('common', 'nemoApp__globalError__uncaughtError__title'),
						errorMessage = self.i18n('common', 'nemoApp__globalError__uncaughtError__message'),
						errorCode = self.i18n('common', 'nemoApp__globalError__uncaughtError__errorCode'),
						searchId,
						matchResults;

					// We generate inline error page overlay intentionally,
					// to provide bulletproof reliability.
					document.body.style.overflow = 'hidden';
					overlay.style.zIndex = 99999;
					overlay.style.position = 'fixed';
					overlay.style.top = 0;
					overlay.style.left = 0;
					overlay.style.right = 0;
					overlay.style.bottom = 0;
					overlay.style.paddingTop = '150px';
					overlay.style.paddingLeft = '20px';
					overlay.style.paddingRight = '20px';
					overlay.style.background = '#ffffff';
					overlay.style.textAlign = 'center';
					overlay.innerHTML = '' +
						'<img style="width: 45vmin; height: auto; display: inline !important;" src="/templates/wurst/f2.0/img/404-cloud.svg">' +
						'<h1 style="margin-top: 5vmin; color: #999999; font-size: 5.5vmin; font-weight: normal;">' + errorTitle +'</h1>' +
						'<h3 style="color: #999999; font-size: 3vmin; font-weight: normal; padding-top: 0 !important;">' + errorMessage + '</h3>';

					//document.body.appendChild(overlay);

					// Generating backtrace
					frames.map(function (frame) {
						stack.push({
							line: frame.lineNumber ? frame.lineNumber : 0,
							column: frame.columnNumber ? frame.columnNumber : 0,
							path: frame.fileName ? frame.fileName : '',
							method: frame.functionName ? frame.functionName : ''
						});
					});

					matchResults = window.location.pathname.match(/\/results\/(\d+)\/.*/i);

					// Trying to find out search id.
					if (matchResults instanceof Object && 1 in matchResults) {
						searchId = matchResults[1];
					}

					self.loadData(
						'/system/logger/error',
						{
							searchId: searchId,
							error: {
								name: error.name,
								message: error.message,
								stack: stack
							}
						},
						function (data) {
							data = JSON.parse(data);

							if (data.error.code) {
								overlay.innerHTML += '' +
									'<h3 style="color: #999999; font-size: 3vmin; font-weight: normal; padding-top: 5px !important;">'
									+ errorCode + ': ' + data.error.code
									+ '</h3>';
							}
						},
						function () {
						}
					);
				});

				return false;
			};
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
			hotelsTemplateSourceURL: '',
			corporateHotelsShowcase: false,
			createOrderLinkPrefixHotels: null,
			dataURL: '',
			staticInfoURL: '',
			version: '',
			hostId: '',
			verbose: false,
			postParameters: {},
			i18nLanguage: 'en',
			i18nURL: '',
			CORSWithCredentials: false,
			cookiesPrefix: 'nemo-',
			waitForDOMReady: true,
			carrierResultsMode: false,
			showNewDesignButton: false,
			clientNationalitySelect: false
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
