'use strict';
define(
	['knockout', 'jquery','jsCookie', 'jqueryUI','js/lib/jquery.mousewheel/jquery.mousewheel.min'],
	function (ko, $, Cookie) {
		// HotelsResults Knockout bindings are defined here
		/*
		 ko.bindingHandlers.testBinding = {
		 init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {},
		 update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {}
		 };

		 // Do not forget to add destroy callbacks
		 ko.utils.domNodeDisposal.addDisposeCallback(element, function() {});
		 */
		ko.bindingHandlers.hotelsResultsContainerSticky = {
            init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

                $(element).addClass("js-common-sticker");
                $(element).addClass("nemo-common-sticker");

                $(element).children().wrapAll("<div class='nemo-common-sticker__inner js-common-sticker__inner'></div>");

                var scrolled, initialPosition = 0;
                var sticker = $(element);
                var stickerInner = sticker.children(".js-common-sticker__inner");
                var margin = 20;

                stickerInner.css("top", margin + "px");
                stickerInner.css("height", $(window).height() - initialPosition - 2*margin + "px");

                $(element).mousewheel(function() {
                    stickyRedraw();
                });

                $(element).on("click", function(){
                    stickyRedraw();
                });

                $(window).on("resize", function(){
                    stickyRedraw();
                });

                $(document).scroll(function (event) {
                    stickyRedraw();
                });

                function stickyRedraw() {

                    //console.log("Sticky redraw.");

                    // Setting default height of sticker by the height of the window.
                    // stickerInner.css("height", $(window).height() + "px");

                    initialPosition = $(element).offset().top;
                    scrolled        = $(document).scrollTop();

                    if ((scrolled + $(window).height() - initialPosition) > $(element).height() ) {
                        stickerInner.css("top", '');
                        stickerInner.css("bottom", margin + 'px');

                        if (scrolled < initialPosition) {
                            stickerInner.css("height", $(element).height() - 2*margin  + "px");
                        } else {
                            stickerInner.css("height", initialPosition + $(element).height() - scrolled - 2*margin  + "px");
                        }

                    } else {

                        stickerInner.css("bottom", '');

                        if (scrolled > initialPosition) {
                            stickerInner.css("top", scrolled - initialPosition + margin + "px");
                            stickerInner.css("height", $(window).height() - 2*margin + "px");
                        } else {
                            stickerInner.css("top", margin + "px");
                            stickerInner.css("height", $(window).height() - initialPosition + scrolled - 2*margin + "px");
                        }

                    }
                }

            },
            update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {

            }
        };

		ko.bindingHandlers.hotelsResultsAdaptivePF = {
			init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				function closePF (e) {
					if (
						$(e.target).closest('.js-flights-results__adaptiveFiltersNoClose').length == 0
					) {
						valueAccessor()(false);
					}
				}

				$('body')
					.addClass('nemo-flights-results__adaptivePF')
					.on('click', closePF);

				ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
					$('body')
						.removeClass('nemo-flights-results__adaptivePF')
						.off('click', closePF);
				});
			}
		};

		ko.bindingHandlers.hotelsResultsSearchFormHider = {
			init: function (element, valueAccessor) {
				function hide (e) {
					var $this = $(e.target);

					//console.log($this, valueAccessor()());
					if (
						valueAccessor()() &&
						$this.closest('.ui-widget,.ui-dialog__wrapper,.js-nemo-pmu,.js-flights-results__formOpener,.js-flights-results__form').length == 0 &&
						$this.closest('body').length > 0
					) {
						valueAccessor()(false);
					}
				}

				$('body').on('click', hide);

				ko.utils.domNodeDisposal.addDisposeCallback(element, function() {$('body').off('click', hide)});
			}
		};

	}
);
