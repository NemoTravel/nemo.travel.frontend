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
						$('.nemo-flights-results__compareTable__root').removeClass('nemo-flights-results__compareTable__root_closed')
							.addClass('nemo-flights-results__compareTable__root_opened');
						$('.js-flights-results__compareTable__opener').hide()
					}else{
						$('.nemo-flights-results__compareTable__root').removeClass('nemo-flights-results__compareTable__root_opened')
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
							$(element).show();
							$(element).width($('.js-flights-results__compareTable__companyColumn:eq(0)').width()*$(element).find('.js-flights-results__compareTable__companyColumn_visible').length+'px');
						}else{
							$(element).hide();
						}
					}
				,1);
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

		ko.bindingHandlers.flightsResultsFlightSelector ={
			init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var $element = $(element),
					data = valueAccessor(),
					closeEvents = 'click';

				function closeDropDown (e) {
					var $target = $(e.target);

					if (!$target.is($element[0]) && !$target.parents().is($element[0])) {
						data.open(false);
					}
				}

				function openDropDown () {
					if (data.selectableCount() > 1) {
						data.open(true);
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

        ko.bindingHandlers.sticky = {
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

        ko.bindingHandlers.customScroll = {
            init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

                // TODO Initial state should be checked (when we finally loaded view)
                // TODO Window.resize

                $(element).addClass("nemo-common-scrollable js-common-scrollable");
                $(element).children().wrapAll("<div class='nemo-common-scrollable__content js-scrollable__content'><div class='nemo-common-scrollable__content_inner js-scrollable__content_inner'>");
                $(element).append("<div class='nemo-common-scrollable__scroller js-scrollable__scroller'><div class='nemo-common-scrollable__scroller__control js-scrollable__scroller__control'></div></div>");

                var scrollAmount, scrollDistance, scrollerControlMoveAmount, scrollProportion, scrollerControlHeight;

                var scrollableContent       = $(".js-scrollable__content");
                var scrollableContentInner  = $(".js-scrollable__content_inner");
                var scroller                = $(element).children(".js-scrollable__scroller");
                var scrollerControl         = scroller.children(".js-scrollable__scroller__control");
                var scrollDecay             = 0.5;
                var scrollableDistance      = scrollableContentInner.height() - scrollableContent.height();
                var dragging;

                scroller.on("mousedown", function(event){
                    dragging = true;
                    //console.log("Pressed");
                });

                $(element).parent().on("mouseup", function(event){
                    dragging = false;
                    //console.log("UnPressed");
                });

                $(element).parent().on("mousemove", function(event) {

                    if (dragging) {

                        var scrollTo = event.pageY - scroller.offset().top;
                        scrollProportion = scrollableContent.height() / scrollableContentInner.height();
                        scrollerControlHeight = scroller.height() * scrollProportion;
                        scrollerControl.css('height', scrollerControlHeight);

                        if (scrollProportion < 1) {
                            $(element).removeClass("js-common-scrollable_off");

                            scrollableDistance = scrollableContentInner.height() - scrollableContent.height();
                            scrollDistance = (scrollTo - scrollerControl.height()/2) / scrollProportion;
                            scrollAmount = scrollDistance;

                            if (scrollAmount > scrollableDistance) {
                                scrollAmount = scrollableDistance;
                            } else if (scrollAmount < 0) {
                                scrollAmount = 0;
                            }

                            scrollableContent.scrollTop(scrollAmount);
                            scrollerControlHeight = scroller.height() * scrollProportion;
                            scrollerControlMoveAmount = scrollAmount * scrollProportion;
                            scrollerControl.css('top', scrollerControlMoveAmount);
                            scrollerControl.css('height', scrollerControlHeight);
                        } else {
                            $(element).addClass("js-common-scrollable_off");
                        }

                        return false;
                    }

                });

                scroller.on("click", function(event) {

                    var scrollTo = event.pageY - $(this).offset().top;
                    scrollProportion = scrollableContent.height() / scrollableContentInner.height();
                    scrollerControlHeight = scroller.height() * scrollProportion;
                    scrollerControl.css('height', scrollerControlHeight);


                    if (scrollProportion < 1) {
                        $(element).removeClass("js-common-scrollable_off");

                        scrollableDistance = scrollableContentInner.height() - scrollableContent.height();
                        scrollDistance = (scrollTo - scrollerControl.height()/2) / scrollProportion;
                        scrollAmount = scrollDistance;

                        console.log(scrollDistance);

                        if (scrollAmount > scrollableDistance) {
                            scrollAmount = scrollableDistance;
                        } else if (scrollAmount < 0) {
                            scrollAmount = 0;
                        }

                        scrollableContent.scrollTop(scrollAmount);
                        scrollerControlHeight = scroller.height() * scrollProportion;
                        scrollerControlMoveAmount = scrollAmount * scrollProportion;
                        scrollerControl.css('top', scrollerControlMoveAmount);
                        scrollerControl.css('height', scrollerControlHeight);
                    } else {
                        $(element).addClass("js-common-scrollable_off");
                    }

                    return false;
                });

                $(element).on("click", function(){

                    scrollProportion = scrollableContent.height() / scrollableContentInner.height();

                    if (scrollProportion < 1) {
                        $(element).removeClass("js-common-scrollable_off");

                        scrollableDistance = scrollableContentInner.height() - scrollableContent.height();
                        scrollDistance = event.deltaY * event.deltaFactor * scrollDecay;
                        scrollAmount = scrollableContent.scrollTop() - scrollDistance;

                        if (scrollAmount > scrollableDistance) {
                            scrollAmount = scrollableDistance;
                        } else if (scrollAmount < 0) {
                            scrollAmount = 0;
                        }

                        scrollableContent.scrollTop(scrollAmount);
                        scrollerControlHeight = scroller.height() * scrollProportion;
                        scrollerControlMoveAmount = scrollAmount * scrollProportion;
                        scrollerControl.css('top', scrollerControlMoveAmount);
                        scrollerControl.css('height', scrollerControlHeight);
                    } else {
                        $(element).addClass("js-common-scrollable_off");
                    }

                });

                $(element).mousewheel(function (event) {
                    scrollProportion = scrollableContent.height() / scrollableContentInner.height();

                    if (scrollProportion < 1) {
                        $(element).removeClass("js-common-scrollable_off");

                        scrollableDistance = scrollableContentInner.height() - scrollableContent.height();
                        scrollDistance = event.deltaY * event.deltaFactor * scrollDecay;
                        scrollAmount = scrollableContent.scrollTop() - scrollDistance;

                        if (scrollAmount > scrollableDistance) {
                            scrollAmount = scrollableDistance;
                        } else if (scrollAmount < 0) {
                            scrollAmount = 0;
                        }

                        scrollableContent.scrollTop(scrollAmount);
                        scrollerControlHeight = scroller.height() * scrollProportion;
                        scrollerControlMoveAmount = scrollAmount * scrollProportion;
                        scrollerControl.css('top', scrollerControlMoveAmount);
                        scrollerControl.css('height', scrollerControlHeight);

                        return false;
                    } else {
                        $(element).addClass("js-common-scrollable_off");
                    }

                });

            },

            update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

            }
        };


	}
);
