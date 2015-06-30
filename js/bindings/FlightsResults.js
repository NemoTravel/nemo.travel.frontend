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
		ko.bindingHandlers.flightsResultsCompareTableToggle = {
			init:function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext){
				function tableToggle(){
					if($('.nemo-flights-results__compareTable__root').hasClass('nemo-flights-results__compareTable__root_closed')){
						$('.nemo-flights-results__compareTable__root')
							.removeClass('nemo-flights-results__compareTable__root_closed')
							.addClass('nemo-flights-results__compareTable__root_opened');
						$('.js-flights-results__compareTable__opener').hide()
					}else{
						$('.nemo-flights-results__compareTable__root')
							.removeClass('nemo-flights-results__compareTable__root_opened')
							.addClass('nemo-flights-results__compareTable__root_closed');
						$('.js-flights-results__compareTable__opener').show()
					}
				}
				$(element).on('click', tableToggle);
				ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
					$(element).off('click', tableToggle);
				})
			}
		};
		ko.bindingHandlers.flightsResultsCompareTableWidth = {
			update:function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext){
				//unnecessary call just for bind watching
				valueAccessor();
				setTimeout(
					function(){
						if($(element).find('.js-flights-results__compareTable__companyColumn_visible').length > 1){
							$(element).parents('.js-flights-results__compareTable__wrapper').removeClass('js-flights-results__compareTable__wrapper_hidden');
							$('.js-flights-results__compareTable__opener').show();
							$(element).show();
							$(element).width($('.js-flights-results__compareTable__companyColumn:eq(0)').width()*$(element).find('.js-flights-results__compareTable__companyColumn_visible').length+'px');
						}else{
							$(element).hide();
							$(element).parents('.js-flights-results__compareTable__wrapper').addClass('js-flights-results__compareTable__wrapper_hidden');
							if($('.js-flights-results__compareTable__wrapper').length == $('.js-flights-results__compareTable__wrapper.js-flights-results__compareTable__wrapper_hidden').length){
								$('.js-flights-results__compareTable__opener').hide();
								$(element).hide();
								$(element).parents('.js-flights-results__compareTable__root')
									.removeClass('nemo-flights-results__compareTable__root_opened')
									.addClass('nemo-flights-results__compareTable__root_closed');
							}
						}
					}
				,100);
			}
		};
		ko.bindingHandlers.flightsResultsCompareTablePosition = {
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
		ko.bindingHandlers.flightsResultsCompareTableVisibleClass = {
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
		};
		ko.bindingHandlers.flightsResultsCompareTableCloneCell ={
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
		};

		ko.bindingHandlers.flightsResultsCompareTableGoToTicket = {
			update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var $element = $(element);
				var groupId = $element.data('groupid');
				function scrollToTicket(){
					$('html, body').scrollTop(
						$('[data-groupanchorid='+groupId+']').offset().top-10
					);
					console.log(groupId);
				}
				$element.on('click', scrollToTicket);
				ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
					$elemen.off('click', scrollToTicket);
				})
			}
		};

		ko.bindingHandlers.flightsResultsFlightSelector ={
			init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var $element = $(element),
					data = valueAccessor(),
					closeEvents = 'click';

				function closeDropDown (e) {
					var $target = $(e.target);
					if (!$target.is($element[0]) && !$target.parents().is($element[0])) {
						$element.removeClass('nemo-flights-results__flightGroupsSelector_open')
					}
				}

				function openDropDown () {
					if (data.selectableCount() > 1) {
						$element.addClass('nemo-flights-results__flightGroupsSelector_open')
					}
				}

				$element.on('click', openDropDown);

				$(document).on(closeEvents, closeDropDown);

				ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
					$element.off('click', closeDropDown);
					$(document).off(closeEvents, closeDropDown);
				});
			}
		};

        ko.bindingHandlers.flightsResultsContainerSticky = {
            init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

                $(element).addClass("js-common-sticker");
                $(element).addClass("nemo-common-sticker");

                $(element).children().wrapAll("<div class='nemo-common-sticker__inner js-common-sticker__inner'></div>");

                var scrolled, initialPosition;
                var sticker = $(element);
                var stickerInner = sticker.children(".js-common-sticker__inner");

                stickerInner.css("height", $(window).height() + "px");

                $(element).on("click", function(){
                    initialPosition = $(element).offset().top;
                    scrolled        = $(document).scrollTop();

                    console.log(initialPosition, scrolled, $(window).height() - initialPosition + scrolled + "px");

                    if (scrolled > initialPosition) {
                        stickerInner.css("top", scrolled - initialPosition + "px");
                    } else {
                        stickerInner.css("top", '');
                        stickerInner.css("height", $(window).height() - initialPosition + scrolled + "px");
                    }

                    if ((scrolled + $(window).height() - initialPosition) > $(element).height() ) {
                        stickerInner.css("top", '');
                        stickerInner.css("bottom", '0px');
                    } else {
                        stickerInner.css("bottom", '');
                    }
                });

                $(window).on("resize", function(){

                    stickerInner.css("height", $(window).height() + "px");

                    initialPosition = $(element).offset().top;
                    scrolled        = $(document).scrollTop();

                    console.log(initialPosition, scrolled, $(window).height() - initialPosition + scrolled + "px");

                    if (scrolled > initialPosition) {
                        stickerInner.css("top", scrolled - initialPosition + "px");
                    } else {
                        stickerInner.css("top", '');
                        stickerInner.css("height", $(window).height() - initialPosition + scrolled + "px");
                    }

                    if ((scrolled + $(window).height() - initialPosition) > $(element).height() ) {
                        stickerInner.css("top", '');
                        stickerInner.css("bottom", '0px');
                    } else {
                        stickerInner.css("bottom", '');
                    }
                });

                $(document).scroll(function (event) {

                    stickerInner.css("height", $(window).height() + "px");

                    initialPosition = $(element).offset().top;
                    scrolled        = $(document).scrollTop();

                    if (scrolled > initialPosition) {
                        stickerInner.css("top", scrolled - initialPosition + "px");
                        stickerInner.css("height", $(window).height() + "px");
                    } else {
                        stickerInner.css("top", '');
                        stickerInner.css("height", $(window).height() - initialPosition + scrolled + "px");
                    }

                    if ((scrolled + $(window).height() - initialPosition) > $(element).height() ) {
                        stickerInner.css("top", '');
                        stickerInner.css("bottom", '0px');
                    } else {
                        stickerInner.css("bottom", '');
                    }

                });

            },
            update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

            }
        };

		ko.bindingHandlers.flightsResultsMatrixHilighter = {
			init: function (element) {
				var $matrix = $(element);

				function hilightCells (event) {
					var $this = $(event.target),
						$targets = $matrix.find('.js-flights-results__matrix__row__cell_target').removeClass('nemo-flights-results__matrix__table__cell_hilighted'),
						posX, posY, $rows, $row;

					if (
						event.type == 'mouseenter' &&
						$this.hasClass('js-flights-results__matrix__row__cell_target')
					) {
						// Defining position
						// X poxition
						$row = $this.parents('.js-flights-results__matrix__row');

						posX = $row.find('.js-flights-results__matrix__row__cell_target').index($this);

						$rows = $matrix.find('.js-flights-results__matrix__row');

						posY = $rows.index($row);

						$rows.each(function (i) {
							var $row = $(this);

							if (i <= posY) {
								$row.find('.js-flights-results__matrix__row__cell_target:' + ($row.is($row[0]) ? 'lt(' + (posX + 1) + ')' : 'eq(' + posX + ')')).addClass('nemo-flights-results__matrix__table__cell_hilighted');
							}
						});
					}
				}

				$matrix
					.on('mouseleave', hilightCells)
					.on('mouseenter', '.js-flights-results__matrix__row__cell', hilightCells);
			}
		};
	}
);
