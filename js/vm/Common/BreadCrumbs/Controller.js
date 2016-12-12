'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseControllerModel'],
	function (ko, helpers, BaseControllerModel) {
		function CommonBreadCrumbsController(componentParameters, variants) {

			BaseControllerModel.apply(this, arguments);

			this.elements = ko.observableArray([]);
			this.additionalComponent = componentParameters.includeComponent;

			var component = componentParameters.component, // controller
				componentName = component.name; // controller's name

			if (typeof componentName !== 'undefined') {

				if (componentName.indexOf('Flights') === 0) {
					this.elements([
						{
							title: 'flights-step_search',
							active: true,
							link: '/search/',
							router: true,
							pageTitle: 'FlightsSearch'
						},
						{
							title: 'flights-step_results',
							active: false,
							link: '/results/',
							router: true,
							pageTitle: 'FlightsResults'
						},
						{
							title: 'flights-step_checkout',
							active: false,
							link: '/order/',
							router: true
						}
					]);

					switch (componentName) {
						case 'FlightsSearchResultsController':
							if (typeof componentParameters.component.id == 'undefined') {
								this.elements()[0].link = '/';
							}
							else {
								this.elements()[0].link += componentParameters.component.id + '/' + helpers.getFlightsRouteURLAdder('search', componentParameters.component.searchInfo());
							}
							break;
					}
				}

				if (componentName.indexOf('Hotels') === 0) {
					this.elements(componentParameters.variants);
				}
			}
		}

		// Extending from dictionaryModel
		helpers.extendModel(CommonBreadCrumbsController, [BaseControllerModel]);

		CommonBreadCrumbsController.prototype.buildModels = function () {
		};

		CommonBreadCrumbsController.prototype.dataURL = function () {
			return null;
		};

		CommonBreadCrumbsController.prototype.$$i18nSegments = ['CommonBreadCrumbs'];

		return CommonBreadCrumbsController;
	}
);
