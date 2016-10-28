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

					if (componentName === 'FlightsSearchResultsController') {
						this.elements()[0].link += component.id + '/' + helpers.getFlightsRouteURLAdder('search', component.searchInfo());
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
