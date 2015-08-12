'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseControllerModel'],
	function (ko, helpers, BaseControllerModel) {
		function CommonBreadCrumbsController (componentParameters) {
			BaseControllerModel.apply(this, arguments);

			this.elements = [];
			this.additionalComponent = componentParameters.includeComponent;
			var componentName = componentParameters.component.name;
			if(typeof componentName != 'null' && typeof componentName != 'undefined'){
				if (componentName.indexOf('Flights') === 0) {
					this.elements = [
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
					];

					switch (componentName) {
						case 'FlightsSearchResultsController':
							this.elements[0].link += componentParameters.component.id + '/' + helpers.getFlightsRouteURLAdder('search', componentParameters.component.searchInfo());
							break;
					}
				}
			}
		}
		// Extending from dictionaryModel
		helpers.extendModel(CommonBreadCrumbsController, [BaseControllerModel]);

		CommonBreadCrumbsController.prototype.buildModels = function () {};

		CommonBreadCrumbsController.prototype.dataURL = function () {
			return null;
		};

		CommonBreadCrumbsController.prototype.$$i18nSegments = ['CommonBreadCrumbs'];

		return CommonBreadCrumbsController;
	}
);