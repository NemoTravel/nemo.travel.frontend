define(
	[],
	function () {
		function BreadcrumbViewModel(searchInfo, controller, staticDataInfo) {
			var self    = this,
				segment = searchInfo.segments && searchInfo.segments[0] ? searchInfo.segments[0] : [];

			// returns string like "2 взрослых, 1 ребенек"
			var getGuestsSummary = function (rooms) {
				var adults        = 0,
					childrenCount = 0,
					result        = [];

				rooms.forEach(function (room) {
					adults += room.adults || 0;
					childrenCount += room.infants ? room.infants.length : 0;
				});

				if (adults > 0) {
					var adultStrKey = (adults === 1) ? 'hotels__passSummary_numeral_ADT_one' : 'hotels__passSummary_numeral_ADT_twoToFour';
					result.push(adults + ' ' + controller.i18n('HotelsSearchForm', adultStrKey));
				}

				if (childrenCount > 0) {
					var infantStrKey = (childrenCount === 1) ?
						'hotels__passSummary_numeral_CLD_one' :
						'hotels__passSummary_numeral_CLD_twoToFour';

					result.push(childrenCount + ' ' + controller.i18n('HotelsSearchForm', infantStrKey));
				}

				return result.join(', ');
			};

			self.city = controller.getModel('Hotels/Common/Geo', {
				data: {
					id: segment[1]
				},
				guide: staticDataInfo
			});

			self.arrivalDate = controller.getModel('Common/Date', segment[2]);
			self.departureDate = controller.getModel('Common/Date', segment[3]);
			self.guestsSummary = getGuestsSummary(searchInfo.rooms || []);
		}

		return BreadcrumbViewModel;
	}
);
