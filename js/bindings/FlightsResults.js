'use strict';
define(
	['knockout', 'jquery', 'jqueryUI','js/lib/jquery.select2/v.4.0.0/select2.full'],
	function (ko, $) {
		// FlightsResults Knockout bindings are defined here
		/*
		 ko.bindingHandlers.testBinding = {
		 init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {},
		 update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {}
		 };

		 // Do not forget to add destroy callbacks
		 ko.utils.domNodeDisposal.addDisposeCallback(element, function() {});
		 */
		ko.bindingHandlers.compareTableWidth = {
			update:function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext){
				//unnecessary call just for bind watching
				valueAccessor();
				setTimeout(
					function(){
						$(element).width($('.js-flights-results__compareTable__companyColumn:eq(0)').width()*$('.js-flights-results__compareTable__companyColumn_visible').length+'px');
					}
				,1);
			}
		}
		ko.bindingHandlers.compareTablePosition = {
			update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var leftOffset = 0;
				if(valueAccessor().paginationShownPages()*$('.nemo-flights-results__compareTable__companyColumn:eq(0)').width()
					>
					(valueAccessor().groups.length-(valueAccessor().paginationStep()))*$('.nemo-flights-results__compareTable__companyColumn:eq(0)').width())
					{
						leftOffset = '-'+(valueAccessor().groups.length-(valueAccessor().paginationStep()))*$('.nemo-flights-results__compareTable__companyColumn:eq(0)').width()+'px'
					}
				else
					{
						leftOffset = '-'+valueAccessor().paginationShownPages()*$('.nemo-flights-results__compareTable__companyColumn:eq(0)').width()+'px'
					}
				$(element).css('left',  leftOffset)
			}
		};
		ko.bindingHandlers.compareTableVisibleClass = {
			update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				if(
					bindingContext.$index() >= valueAccessor().paginationShownPages()
					&&
					bindingContext.$index() < valueAccessor().paginationShownPages()+valueAccessor().paginationStep()
				||
					valueAccessor().paginationShownPages()+valueAccessor().paginationStep() > valueAccessor().groups.length
					&&
					bindingContext.$index() > valueAccessor().paginationShownPages()-valueAccessor().paginationStep()
				){
					$(element).addClass('nemo-flights-results__compareTable__companyColumn_visible js-flights-results__compareTable__companyColumn_visible')
				}else{
					$(element).removeClass('nemo-flights-results__compareTable__companyColumn_visible js-flights-results__compareTable__companyColumn_visible')
				}
			}
		}
		ko.bindingHandlers.compareTableCloneCell ={
			update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				$(element).on('click', function () {
					var thisId = $(element).attr('data-flightid');
					var cloneElement = $('.js-flights-results__compareTable__inner_hidden').find('[data-flightid='+thisId+']');
					$('.js-flights-results__compareTable__inner_hidden')
						.find('.js-flights-results__compareTable__groupsItem_visible')
						.addClass('nemo-flights-results__compareTable__groupsItem_hidden')
						.removeClass('js-flights-results__compareTable__groupsItem_visible nemo-flights-results__compareTable__groupsItem_visible');
					var position = $(element).position();
					var parentOffsetLeft = $(element).parents('.js-flights-results__compareTable__companyColumn').position().left + $('.nemo-flights-results__compareTable__inner').position().left;
					var parentOffsetTop = $(element).parents('.js-flights-results__compareTable__groups').position().top-10;
					cloneElement
						.css({
							left:position.left+parentOffsetLeft,
							top:position.top+parentOffsetTop
						})
						.addClass('js-flights-results__compareTable__groupsItem_visible nemo-flights-results__compareTable__groupsItem_visible')
				});
				$('body').on('click',function(event) {
					if($(event.target).parents('.js-flights-results__compareTable__groupsItem_visible').length==0
						&& $('.js-flights-results__compareTable__groupsItem_visible').length > 0
						&& $(event.target).parents('.nemo-flights-results__compareTable__inner').length==0) {
						$('.js-flights-results__compareTable__groupsItem_visible')
							.removeClass('js-flights-results__compareTable__groupsItem_visible nemo-flights-results__compareTable__groupsItem_visible')
							.addClass('nemo-flights-results__compareTable__groupsItem_hidden');
					}
				});
			}
		}
	}
);