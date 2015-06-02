'use strict';
define(
	['knockout', 'js/vm/Flights/Controller'],
	function (ko, controller) {

		var tempFlightGroups = controller.groups(),
			tmpct = {};

		for (var i = 0; i < tempFlightGroups.length; i++) {
			if (typeof tmpct[tempFlightGroups[i].getValidatingCompany().IATA] == 'undefined') {
				tmpct[tempFlightGroups[i].getValidatingCompany().IATA] = {
					company: tempFlightGroups[i].getValidatingCompany(),
					groups: []
				};
			}
			tmpct[tempFlightGroups[i].getValidatingCompany().IATA].groups.push(tempFlightGroups[i]);
		}

		var tempGroupsArr = [];
		for (var i in tmpct) {
			if (tmpct.hasOwnProperty(i)) {
				if (!isNaN(parseFloat(i)) && isFinite(i)) {
					tempGroupsArr[i] = tmpct[i];
				} else {
					tempGroupsArr.push(tmpct[i]);
				}
			}
		}

		for (var i in tempGroupsArr) {
			tempGroupsArr[i].groupsFilteredOut = ko.computed(function () {
				for (var j = 0; j < this.groups.length; j++) {
					if (this.groups[j].filteredOut() == false) {
						return false;
					}
					else {
						return true;
					}
				}
			}, tempGroupsArr[i]);
		}


		tempGroupsArr.pagination = ko.computed(function (dataToPaginate) {
			if (typeof dataToPaginate == "undefined") {
				var self = tempGroupsArr;
			}
			this.pageNumber = ko.observable(0);
			this.nbPerPage = 3;
			this.totalPages = ko.computed(function () {
				var div = ~~(self.length / self.nbPerPage);
				div += self.length % self.nbPerPage > 0 ? 1 : 0;
				return div - 1;
			});

			this.paginated = ko.computed(function () {
				var first = self.pageNumber() * self.nbPerPage;
				return self.slice(first, first + self.nbPerPage);
			});
			this.hasPrevious = ko.computed(function () {
				return self.pageNumber() !== 0;
			});
			this.hasNext = ko.computed(function () {
				return self.pageNumber() !== self.totalPages();
			});
			this.next = function () {
				if (self.pageNumber() < self.totalPages()) {
					self.pageNumber(self.pageNumber() + 1);
				}
			};

			this.previous = function () {
				if (self.pageNumber() != 0) {
					self.pageNumber(self.pageNumber() - 1);
				}
			};

		}, tempGroupsArr);


	});