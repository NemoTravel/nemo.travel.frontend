'use strict';
define(
	['knockout','/kocontroller/js/mvvm/common/dictionaryModel'],
	function (ko, dictionaryModel) {
		function FlightsSearchForm (initialData) {
			/**
			 * We do initializing work here.
			 * i.e. this.address = ko.observable(initialData.addressParts.join(' '));
			 */

			// This is a parent class/model constructor call. It will convert to observables everything that we missed + some obligatory system data
			dictionaryModel.apply(this, arguments);

			this.typeSelectorOpen = ko.observable(false);
			this.classSelectorOpen = ko.observable(false);
			this.passengersSelectorOpen = ko.observable(false);

			this.toggleTypeSelector = function () {
				this.typeSelectorOpen(!this.typeSelectorOpen());
			}

			this.toggleClassSelector = function () {
				this.classSelectorOpen(!this.classSelectorOpen());
			}

			this.togglePassengersSelector = function () {
				this.passengersSelectorOpen(!this.passengersSelectorOpen());
			}

			this.tripType = ko.computed({
				read: function () {
					console.log('TT');
					var segments = this.segments();
					if (segments.length == 1) {
						return 'OW';
					}

					if (
						segments.length == 2 &&
						segments[0].depAirport() &&
						segments[0].arrAirport() &&
						segments[1].depAirport() &&
						segments[1].arrAirport() &&
						segments[0].depAirport().IATA() == segments[1].arrAirport().IATA() &&
						segments[1].depAirport().IATA() == segments[0].arrAirport().IATA()
					) {
						return 'RT';
					}

					return 'CR';
				},
				write: function () {

				}
			},this);/*ko.observable(initialData.searchType || 'OW');*/

			this.sync = function () {
				this.$$controller.sync({action: 'search'});
			}

//			this.segments.pop();
//			this.segments(this.segments());
//			console.log('!!!');
		}

		// Extending from dictionaryModel
		FlightsSearchForm.prototype = new dictionaryModel();
		FlightsSearchForm.prototype.constructor = FlightsSearchForm;

		/**
		 * If a model adds nothing to basic dictionaryModel functionality you can just return it
		 * i.e. return dictionaryModel
		 */
		return FlightsSearchForm;
	}
);