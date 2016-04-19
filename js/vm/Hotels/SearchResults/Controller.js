'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseControllerModel', 'jsCookie'],
	function (ko, helpers, BaseControllerModel, Cookie) {
		function HotelsSearchResultsController (componentParameters) {
			BaseControllerModel.apply(this, arguments);

            this.name = 'HotelsSearchResultsController';

            HotelsSearchResultsController.prototype.$$usedModels = [
                'Hotels/Common/Geo'
            ];

            // Extending from dictionaryModel
            helpers.extendModel(HotelsSearchResultsController, [BaseControllerModel]);
		}
        
        HotelsSearchResultsController.prototype.pageTitle = 'HotelsResults';
        
		return HotelsSearchResultsController;
	}
);