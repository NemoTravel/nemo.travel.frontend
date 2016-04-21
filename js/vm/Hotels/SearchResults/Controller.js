'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseControllerModel', 'jsCookie'],
	function (ko, helpers, BaseControllerModel, Cookie) {
		function HotelsSearchResultsController (componentParameters) {
			BaseControllerModel.apply(this, arguments);

            this.name = 'HotelsSearchResultsController';
			this.error = ko.observable(false);
            this.mode = 'id'; // 'search'
            this.searchParameters = {
                cityId: 0,
                hotelId: 0,
                checkInDate: '',
                checkOutDate: '',
                isDelayed: false,
                rooms: [
                    {
                        ADT: 0,
                        CLD: 0,
                        childAges: []
                    }
                ],
                id: 0,
                uri: ''
            };

            this.processInitParams();

		}

        // Extending from dictionaryModel
        helpers.extendModel(HotelsSearchResultsController, [BaseControllerModel]);

        HotelsSearchResultsController.prototype.$$usedModels = [
            'Hotels/Common/Geo'
        ];

        HotelsSearchResultsController.prototype.processInitParams = function () {
            this.mode = 'search';

            /*if (this.$$componentParameters.route.length < 3) {
                this.id = this.$$componentParameters.route[0];
            } else if (this.$$componentParameters.route.length == 3) {
                this.mode = 'search';

                //good if we are here

                // Parsing segments
                // Resetting regexps
                this.paramsParsers.rtseg.lastIndex = 0;

            }*/
        };

        HotelsSearchResultsController.prototype.dataURL = function () {
            if (this.mode == 'id') {
                return '/hotels/search/results/' + this.id;
            }
            else {
                return '/hotels/search/request';
            }
        };

        HotelsSearchResultsController.prototype.dataPOSTParameters = function () {
            var ret = {};

            if (this.mode != 'id') {
                ret.request = JSON.stringify(this.searchParameters);
            }

            /*if (this.postfiltersData.preInitValues.carrier && this.postfiltersData.preInitValues.carrier.length) {
                ret.resources = {};
                for (var i = 0; i < this.postfiltersData.preInitValues.carrier.length; i++) {
                    ret.resources['guide/airlines/' + this.postfiltersData.preInitValues.carrier[i]] = {};
                }

                ret.resources = JSON.stringify(ret.resources);
            }*/

            return ret;
        };

        HotelsSearchResultsController.prototype.processSearchInfo = function () {

        };

        /*HotelsSearchResultsController.prototype.dataPOSTParameters = function () {
         var ret = {};
         debugger;
         if (this.mode != 'id') {
         ret.request = JSON.stringify(this.searchParameters);
         }

         return ret;
         };*/
        
        HotelsSearchResultsController.prototype.pageTitle = 'HotelsResults';

        HotelsSearchResultsController.prototype.buildModels = function () {
            var self = this;

        };
        
		return HotelsSearchResultsController;
	}
);