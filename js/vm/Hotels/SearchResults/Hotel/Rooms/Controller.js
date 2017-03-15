'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseControllerModel'],
	function (ko, helpers, BaseControllerModel) {
		function HotelsSearchResultsHotelRoomsController(params) {
			BaseControllerModel.apply(this, arguments);
			
			var self = this;
			
			this.selectedRooms = params.selectedRooms;
			this.countOfNights = params.countOfNights;
			this.labelAfterNights = params.labelAfterNights;

			this.getCancellationTooltipContent = function (rules) {
				var result = [];

				rules.map(function(rule) {
					var deadLine = rule.deadLine.getFullDate(),
						string = '';

					string += '<p>' + self.$$controller.i18n('Hotels', 'hotels-room-cancel__freeRefund__until') + ' ' + deadLine + '.</p>';
					string += '<p>' + self.$$controller.i18n('Hotels', 'hotels-room-cancel__freeRefund__noRefundAfter_1') + ' ' + deadLine +
						' ' + self.$$controller.i18n('Hotels', 'hotels-room-cancel__freeRefund__noRefundAfter_2') + '.</p>';

					result.push(string);
				});

				return result.join('<br>');
			};

		}

		helpers.extendModel(HotelsSearchResultsHotelRoomsController, [BaseControllerModel]);
		
		return HotelsSearchResultsHotelRoomsController;
	}
);