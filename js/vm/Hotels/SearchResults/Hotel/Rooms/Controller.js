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
				var result = [],
					i18n = {
						freeRefundUntil: self.$$controller.i18n('Hotels', 'hotels-room-cancel__freeRefund__until'),
						freeRefundNoRefundAfter1: self.$$controller.i18n('Hotels', 'hotels-room-cancel__freeRefund__noRefundAfter_1'),
						freeRefundNoRefundAfter2: self.$$controller.i18n('Hotels', 'hotels-room-cancel__freeRefund__noRefundAfter_2')
					};
				
				for (var i in i18n) {
					i18n[i] = $.trim(i18n[i]);
				}

				rules.map(function(rule) {
					var deadLine = rule.deadLine.getFullDate(),
						string = '';

					string += '<p>' + i18n.freeRefundUntil + ' ' + deadLine + '.</p>';
					string += '<p>' + i18n.freeRefundNoRefundAfter1 + ' ' + deadLine + (i18n.freeRefundNoRefundAfter2 ? ' ' + i18n.freeRefundNoRefundAfter2 : '') + '.</p>';

					result.push(string);
				});

				return result.join('<br>');
			};

		}

		helpers.extendModel(HotelsSearchResultsHotelRoomsController, [BaseControllerModel]);
		
		return HotelsSearchResultsHotelRoomsController;
	}
);