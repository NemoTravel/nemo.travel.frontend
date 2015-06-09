'use strict';
define(
	['knockout', 'js/vm/helpers', 'js/vm/BaseStaticModel'],
	function (ko, helpers, BaseModel) {
		function CompareTable (initialData, controller) {

			var tempFlightGroups = initialData.groups,
				tmpct = {},
				tmpctDirect = {},
				tmpctTransfer = {};
			
			for (var i = 0; i < tempFlightGroups.length; i++) {
				if (tempFlightGroups[i].isDirectGroup == false){
					if (typeof tmpctTransfer[tempFlightGroups[i].getValidatingCompany().IATA] == 'undefined') {
						tmpctTransfer[tempFlightGroups[i].getValidatingCompany().IATA] = {
							company: tempFlightGroups[i].getValidatingCompany(),
							groups: []
						};
					}
					tmpctTransfer[tempFlightGroups[i].getValidatingCompany().IATA].groups.push(tempFlightGroups[i]);
				}else if (tempFlightGroups[i].isDirectGroup == true) {
					if (typeof tmpctDirect[tempFlightGroups[i].getValidatingCompany().IATA] == 'undefined') {
						tmpctDirect[tempFlightGroups[i].getValidatingCompany().IATA] = {
							company: tempFlightGroups[i].getValidatingCompany(),
							groups: []
						};
					}
					tmpctDirect[tempFlightGroups[i].getValidatingCompany().IATA].groups.push(tempFlightGroups[i]);
				}
			}


			var tempGroupsArrDirect =[],
			tempGroupsArrTransfer =[];

			for(var i in tmpctTransfer ) {
				if (tmpctTransfer.hasOwnProperty(i)){
					if (!isNaN(parseFloat(i)) && isFinite(i)){
						tempGroupsArrTransfer[i] = tmpctTransfer[i];
					}else{
						tempGroupsArrTransfer.push(tmpctTransfer[i]);
					}
				}
			}
			for(var i in tmpctDirect ) {
				if (tmpctDirect.hasOwnProperty(i)){
					if (!isNaN(parseFloat(i)) && isFinite(i)){
						tempGroupsArrDirect[i] = tmpctDirect[i];
					}else{
						tempGroupsArrDirect.push(tmpctDirect[i]);
					}
				}
			}

			for (var i in tempGroupsArrTransfer){
				tempGroupsArrTransfer[i].groupsFilteredOut = ko.computed(function() {
					for (var j = 0; j < this.groups.length; j++) {
						if (this.groups[j].filteredOut() == false) {
							return false;
						}
						else {
							return true;
						}
					}
				}, tempGroupsArrTransfer[i]);
			}

			for (var i in tmpctDirect){
				tmpctDirect[i].groupsFilteredOut = ko.computed(function() {
					for (var j = 0; j < this.groups.length; j++) {
						if (this.groups[j].filteredOut() == false) {
							return false;
						}
						else {
							return true;
						}
					}
				}, tmpctDirect[i]);
			}
			if(initialData.direct == true){
				this.groups = tempGroupsArrDirect;
			}else if (initialData.direct == false){
				this.groups = tempGroupsArrTransfer;
			}

			//pagination
			this.paginationStep = ko.observable(3);
			this.paginationShownPages = ko.observable(0);
			this.indexHelper = ko.computed(function(){ //TODO refactor flag counting for ShowMore
				 return [this.paginationShownPages() + this.paginationStep()-3,this.paginationShownPages() + this.paginationStep()-2, this.paginationShownPages() + this.paginationStep()-1]
			}, this);
			this.paginationHasNext = ko.computed(function(){
				if ((this.paginationShownPages() + this.paginationStep() >= this.groups.length)){
					return false;
				}else{
					return true;
				}
			}, this);
			this.paginationHasPrev = ko.computed(function(){
				if ((this.paginationShownPages() <= 0)){
					return false;
				}else{
					return true;
				}
			}, this);
			this.paginationNext = function(){
				if(this.paginationHasNext()){
					var current = this.paginationShownPages();
					this.paginationShownPages(current + this.paginationStep());
				}
			};
			this.paginationPrev = function(){
				if(this.paginationHasPrev()){
					var current = this.paginationShownPages();
					this.paginationShownPages(current - this.paginationStep());
				}
			};


			//show more block
			this.flagToShowMore = ko.computed(function(){
				for (var i in this.indexHelper()){
					if(typeof this.groups[this.indexHelper()[i]] != 'undefined' && this.groups[this.indexHelper()[i]].groups.length >= 3){
						return true;
					}
				}
			},this);
			this.allGroupsVisible = ko.observable(true);
			this.toggleVisibleGroups = function(){
				if(this.allGroupsVisible() == false ){
					this.allGroupsVisible(true);
				}else{
					this.allGroupsVisible(false);
				}
			};
			BaseModel.apply(this, arguments);

		}

		// Extending from dictionaryModel
		helpers.extendModel(CompareTable, [BaseModel]);

		return CompareTable;
	});