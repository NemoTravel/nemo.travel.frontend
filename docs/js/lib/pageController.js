'use strict';
define (function () {
	var PageController = function (url, scope, options, ko) {
		var self = this;

		this.url = url;
		this.scope = scope;
		this.options = {};
		this.ko = ko;
		this.uniqueObjectsId = 0;

		this.rawdata = null;

		/**
		 * Storage for all objects accessible by their id
		 * @type {{}}
		 */
		this.objectsById = {};

		this.unusedObjectsIds = {};

			this.viewModel = {
			data: ko.observable(null),
			options: ko.observable({}),
			server: ko.observable({})
		};

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

		this.objectPool.push(this);

		this.log('PageController loaded and initted. URL - "' + this.url + '", Options', options, 'Resulting options', this.options, 'Loading data');

		// Setting KO
		ko.applyBindings(this.viewModel, this.scope);

		this.log('KO bound successfully');

		this.loadData();
	};

	PageController.prototype.loadData = function (additionalParams) {
		// We use vanilla js because we don't know which of the third-party libraries are present on page
		var request = new XMLHttpRequest(),
			method = "GET",
			self = this,
			formData = [];

		// Change this to recursive function if needed
		if (typeof this.options.postParameters == 'object' && this.options.postParameters) {
			for (var i in this.options.postParameters) {
				if (this.options.postParameters.hasOwnProperty(i)) {
					method = "POST";
					formData.push(i+'='+encodeURIComponent(this.options.postParameters[i]));
				}
			}
		}

		if (typeof additionalParams == 'object' && additionalParams) {
			for (var i in additionalParams) {
				if (additionalParams.hasOwnProperty(i)) {
					method = "POST";
					formData.push(i+'='+encodeURIComponent(additionalParams[i]));
				}
			}
		}

		formData = formData.join('&');

		request.open(method,this.url,true);
		request.setRequestHeader('User-Agent','XMLHTTP/1.0');

		if (this.options.postParameters) {
			request.setRequestHeader('Content-type','application/x-www-form-urlencoded');
		}

		request.onreadystatechange = function () {
			if (request.readyState != 4) {
				return;
			}

			if (request.status != 200 && request.status != 304) {
				self.error('REQUEST FAILED. Request status: ' + request.status);
				return;
			}
			self.log('Raw data loaded');

			// Parsing json and updating model
			try {
				self.rawdata = JSON.parse(request.responseText);

				self.log('Raw parsed data:', self.rawdata);

				self.repopulateModel();
			}
			catch (e) {
				self.error(e);
			}
		};

		if (request.readyState == 4) {
			return;
		}

		request.send(formData);
	};

	PageController.prototype.sync = function (additionalParams) {
		var json = {};

		if (typeof additionalParams != 'object' || additionalParams == null) {
			additionalParams = {};
		}

		// Adding whole stuff here
		for (var i in this.objectsById) {
			if (this.objectsById.hasOwnProperty(i)) {
				json[i] = this.objectsById[i].unMap();
			}
		}

		additionalParams.json = JSON.stringify(json);

		this.loadData(additionalParams);
	};

	PageController.prototype.repopulateModel = function () {
		var typesList = {},
			modelsURLList = [],
			self = this;

		this.log('Repopulating model with', this.rawdata);

		// Setting needed unpreprocessable data
		if (typeof this.rawdata.options != 'undefined') {
			this.viewModel.options(this.rawdata.options);
		}
		else {
			this.error('Format mismatch: no options found');
		}

		if (typeof this.rawdata.server != 'undefined') {
			this.viewModel.server(this.rawdata.server);
		}
		else {
			this.error('Format mismatch: no server info');
		}

		if (typeof this.rawdata.data != 'undefined' && typeof this.rawdata.rootModel != 'undefined' && typeof this.rawdata.data[this.rawdata.rootModel] != 'undefined') {
			// Defining needed viewModels to load them
			typesList = this.recursiveGrabModelTypes(this.rawdata.data, typesList);

			// Converting to array
			typesList = Object.keys(typesList).map(function (key) {return typesList[key]});

			// Creating a list of models URLs
			for (var i = 0; i < typesList.length; i++) {
				modelsURLList.push(self.options.modelsPath + typesList[i].replace('.','/'));
			}

			this.log('Found types:', typesList, 'Loading common bindings and dictionary model (base model)');

			require (
				[
					self.options.modelsPath + '/common/commonBindings',
					self.options.modelsPath + '/common/dictionaryModel'
				],
				function (bindings, dictionaryModel) {
					self.processLoadedModel('dictionaryModel', dictionaryModel);

					self.log('Loading needed models...');

					require(modelsURLList, function () {
						for (var i = 0; i < arguments.length; i++) {
							self.processLoadedModel(typesList[i], arguments[i]);
						}

						self.log('All needed models loaded');

						self.processRawData();
					});
				}
			);
		}
		else {
			this.error('Format mismatch: no viewModel data, or rootModel is missing or invalid');
		}
	};

	PageController.prototype.processRawData = function () {
		this.log('Creating models tree');

		// Creating a list of ids of used objects
		var tmp = Object.keys(this.objectsById);
		for (var i = 0; i < tmp.length; i++) {
			this.unusedObjectsIds[tmp[i]] = tmp[i];
		}

		this.log('Current objects ids:', this.unusedObjectsIds);

		this.createModel(this.rawdata.data);

		// Deeleting unused objects
		this.log('Unused objects:', this.unusedObjectsIds);
		for (var i in this.unusedObjectsIds) {
			if (this.unusedObjectsIds.hasOwnProperty(i)) {
				delete this.objectsById[i];
			}
		}

		this.viewModel.data(this.objectsById[this.rawdata.rootModel]);

		this.log('Objects tree built:', this.viewModel.data(), 'Objects by id:', this.objectsById);
	};

	PageController.prototype.createModel = function (node) {
		// Looking for embedded objects and other objects references
		if (typeof node == 'object' && node != null && typeof node.$$modelType == 'undefined') {
			for (var i in node) {
				if (node.hasOwnProperty(i)) {
					// Embedded objects
					if (i.substr(0,2) != '$$') {
						if (typeof node[i] == 'object') {
							node[i] = this.createModel(node[i]);
						}
						// Other object references
						else if (typeof node[i] == 'string' && node[i].indexOf('$ref_') === 0) {
							node[i] = this.createModel(this.rawdata.data[node[i].substr(5)]);
						}
					}
				}
			}
		}

		// Creating model if needed (node has 'modelType' -> it's not a viewModel/dictionaryModel descendant)
		if (typeof node == 'object' && node != null && typeof node.modelType != 'undefined') {
			if (typeof this.modelsPool[node.modelType] != 'undefined') {
				if (typeof node.uri == 'undefined') {
					node.uri = 'uniqid_'+node.modelType+'_'+(this.uniqueObjectsId++);
				}

				if (typeof this.objectsById[node.uri] != 'undefined') {
					// If we have data set - we're in update mode, so we must update models
					if (this.viewModel.data()) {
						this.updateModel(this.objectsById[node.uri], node);
					}

					// Deleting object uri from list of unused objects
					delete this.unusedObjectsIds[node.uri];

					return this.objectsById[node.uri];
				}

				this.log('Creating new', node.modelType, node.uri, 'initializong with', node);

				this.objectsById[node.uri] = new this.modelsPool[node.modelType](node, this);

				// Deleting object uri from list of unused objects
				delete this.unusedObjectsIds[node.uri];

				// Extending if needed
				if (typeof this.extensions[node.modelType] != 'undefined') {
					for (i = 0; i < this.extensions[node.modelType].length; i++) {
						this.extensions[node.modelType][i].call(this.objectsById[node.uri]);
					}
				}

				return this.objectsById[node.uri];
			}
			else {
				this.error('Unknown model', node.modelType);
			}
		}

		return node;
	};

	PageController.prototype.updateModel = function (model, data) {
		this.log('Updating', model, 'with', data);

		model.updateModel(data);
	};

	PageController.prototype.processLoadedModel = function (name, model) {
		if (typeof this.modelsPool[name] == 'undefined') {
			this.log('Loaded new model:', name, model);
			this.modelsPool[name] = model;
		}
		else {
			this.log('Existing model:', name, model, 'skipping');
		}
	};

	PageController.prototype.recursiveGrabModelTypes = function (node, typesList) {
		for (var i in node) {
			if (node.hasOwnProperty(i)) {
				if (i === 'modelType' && !typesList.hasOwnProperty(node[i])) {
					typesList[node[i]] = node[i];
				}
				else if (typeof node[i] == 'object') {
					typesList = this.recursiveGrabModelTypes(node[i], typesList);
				}
			}
		}

		return typesList;
	};

	PageController.prototype.log = function () {
		if (this.options.verbose && typeof console != "undefined" && typeof console.log == "function") {
			console.log.apply(console, arguments);
		}
	};

	PageController.prototype.error = function () {
		if (typeof console != "undefined" && typeof console.error == "function") {
			console.error.apply(console, arguments);
		}
	};

	PageController.prototype.extend = function (what, extensionFunction) {
		console.log('EXTENDING:', what, extensionFunction);

		if (!(PageController.prototype.extensions[what] instanceof Array)) {
			PageController.prototype.extensions[what] = [];
		}

		PageController.prototype.extensions[what].push(extensionFunction);
	};

	PageController.prototype.defaultOptions = {
		verbose: false,
		modelsPath: '/kocontroller/js/mvvm/',
		postParameters: {}
	};

	PageController.prototype.objectPool = [];

	PageController.prototype.modelsPool = {};

	PageController.prototype.extensions = {};

	return PageController;
});