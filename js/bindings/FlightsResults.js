'use strict';
define(
	[
		'knockout',
		'jquery',
		'jsCookie',
		'js/vm/helpers',
		'jqueryUI',
		'js/lib/jquery.mousewheel/jquery.mousewheel.min',
		'js/lib/jquery.ui.popup/jquery.ui.popup'
	],
	function (ko, $, Cookie, helpers) {
		// FlightsResults Knockout bindings are defined here
		/*
		 ko.bindingHandlers.testBinding = {
		 init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {},
		 update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {}
		 };

		 // Do not forget to add destroy callbacks
		 ko.utils.domNodeDisposal.addDisposeCallback(element, function() {});
		 */
		ko.bindingHandlers.flightsResultsCompareTableWidth = {
			update:function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext){
				//unnecessary call just for bind watching
				valueAccessor();
				setTimeout(
					function(){
						if($(element).find('.js-flights-results__compareTable__companyColumn_visible').length > 0){
							$(element).parents('.js-flights-results__compareTable__wrapper').removeClass('js-flights-results__compareTable__wrapper_hidden');
							$(element).show();
							$(element).width($('.js-flights-results__compareTable__companyColumn:eq(0)').width()*$(element).find('.js-flights-results__compareTable__companyColumn_visible').length+'px');
						}else{
							$(element).hide();
							$(element).parents('.js-flights-results__compareTable__wrapper').addClass('js-flights-results__compareTable__wrapper_hidden');
							if($('.js-flights-results__compareTable__wrapper').length == $('.js-flights-results__compareTable__wrapper.js-flights-results__compareTable__wrapper_hidden').length){
								$(element).hide();
								$(element).parents('.js-flights-results__compareTable__root')
									.removeClass('nemo-flights-results__compareTable__root_opened')
									.addClass('nemo-flights-results__compareTable__root_closed');
							}
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
				// TODO CRITICAL set selectors to js-classes
				$(element).on('click', function () {
					var thisId = $(element).attr('data-flightid');
					var cloneElement = $('.js-flights-results__compareTable__inner_hidden').find('[data-flightid='+thisId+']');
					$('.js-flights-results__compareTable__inner_hidden')
						.find('.js-flights-results__compareTable__groupsItem_visible')
						.addClass('nemo-flights-results__compareTable__groupsItem_hidden')
						.removeClass('js-flights-results__compareTable__groupsItem_visible nemo-flights-results__compareTable__groupsItem_visible');
					var position = $(element).parent().position();
					var parentOffsetLeft = $(element).parents('.js-flights-results__compareTable__companyColumn').position().left + $(element).parents('.nemo-flights-results__compareTable__inner').position().left;
					var parentOffsetTop = $(element).parents('.js-flights-results__compareTable__groups').position().top-10;
					cloneElement
						.css({
							left:position.left+parentOffsetLeft,
							top:position.top+parentOffsetTop
						})
						.addClass('js-flights-results__compareTable__groupsItem_visible nemo-flights-results__compareTable__groupsItem_visible')
				});

				$('body').on('click',function(event) {
					if(
						$(event.target).parents('.js-flights-results__compareTable__groupsItem_visible').length==0 // If this is not an opened column
						&& $('.js-flights-results__compareTable__groupsItem_visible').length > 0                   // If we have an opened column
						&& $(event.target).parents('.js-flights-results__compareTable__groupsItem').length==0         // Click is outside of table
					) {
						$('.js-flights-results__compareTable__groupsItem_visible')
							.removeClass('js-flights-results__compareTable__groupsItem_visible nemo-flights-results__compareTable__groupsItem_visible')
							.addClass('nemo-flights-results__compareTable__groupsItem_hidden');
					}
				});

				// TODO add dispose callback
			}
		};

		ko.bindingHandlers.flightsResultsCompareLoadInfo = {
			update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				function openCompareTable(){
					viewModel.compareTablesOpen(!viewModel.compareTablesOpen());
					setTimeout(function(){
						viewModel.compareTablesRenderFlag(true)
					},100);
				};
				$(element).on('click', openCompareTable);
				ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
					$(element).off('click', openCompareTable)
				})
			}
		};

		ko.bindingHandlers.flightsResultsCompareTableGoToTicket = {
			update: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var $element = $(element);
				var groupId = $element.data('groupid');
				function scrollToTicket(){
					if($('[data-groupanchorid='+groupId+']').length > 0){
						$('html, body').scrollTop(
							$('[data-groupanchorid='+groupId+']').offset().top-10
						);
					}else{
						bindingContext.$parents[2].showAllGroups();
						$('html, body').scrollTop(
							$('[data-groupanchorid='+groupId+']').offset().top-10
						);
					}
				}
				$element.on('click', scrollToTicket);
				ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
					$element.off('click', scrollToTicket);
				})
			}
		};

        ko.bindingHandlers.flightsResultsContainerSticky = {
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

		ko.bindingHandlers.flightsResultsMatrixHilighter = {
			init: function (element) {
				var $matrix = $(element);

				function hilightCells (event) {
					var $this = $(event.target),
						$targets = $matrix.find('.js-flights-results__matrix__row__cell_target').removeClass('nemo-flights-results__matrix__table__cell_hilighted'),
						posX, posY, $rows, $row;

					if (
						event.type == 'mouseenter' &&
						$this.hasClass('js-flights-results__matrix__row__cell_target') &&
						!$this.hasClass('js-flights-results__matrix__table__cell_empty') &&
						!$this.hasClass('js-flights-results__matrix__table__cell_impossible')
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
								$row.find('.js-flights-results__matrix__row__cell_target:' + ($row.is($row[0]) ? 'eq(' + (posX) + ')' : 'eq(' + posX + ')')).addClass('nemo-flights-results__matrix__table__cell_hilighted');
								if(posY == $row.index()+1){
									$row.find('.js-flights-results__matrix__row__cell_target:lt('+posX+')').addClass('nemo-flights-results__matrix__table__cell_hilighted')
								}
							}
						});
					}
				}

				$matrix
					.on('mouseleave', hilightCells)
					.on('mouseenter', '.js-flights-results__matrix__row__cell', hilightCells);
			}
		};

		ko.bindingHandlers.flightsResultsAdaptivePF = {
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

		ko.bindingHandlers.flightsResultsCouplingTableDraw2LegConnector = {
			update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var $groupsList = $(element);

				function build () {
					setTimeout(function(){
						var $selectable = $groupsList.find('.js-flights-couplingTable__group__item:not(.js-flights-couplingTable__group__item_inactive)'),
							$visibleSelectable = $selectable.filter(':visible'),
							firstGroupOffset = $groupsList.find('.js-flights-couplingTable__group').eq(1).position().left,
							tmp;

						$groupsList.find('.js-flights-couplingTable__connector').remove();

						tmp = defineMinMaxTopOffset($visibleSelectable);

						if ($visibleSelectable.length != $selectable.length) {
							tmp.max += $visibleSelectable.eq(0).outerHeight() / 2;
						}

						$groupsList.append(
							$('<div></div>')
								.addClass('js-flights-couplingTable__connector nemo-flights-results__couplingTable__groups__connector  nemo-flights-results__couplingTable__groups__connector_selectable')
								.css({
									top: tmp.min + 'px',
									left: firstGroupOffset + 'px',
									height: (tmp.max - tmp.min + 1.5) + 'px' // FIXME add correct number based on width
								})
						);

						tmp = defineMinMaxTopOffset($groupsList.find('.js-flights-couplingTable__group__item_selected'));

						$groupsList.append(
							$('<div></div>')
								.addClass('js-flights-couplingTable__connector nemo-flights-results__couplingTable__groups__connector  nemo-flights-results__couplingTable__groups__connector_selected')
								.css({
									top: tmp.min + 'px',
									left: firstGroupOffset + 'px',
									height: (tmp.max - tmp.min + 2) + 'px'
								})
						);

						if ($groupsList.find('.js-flights-couplingTable__group__item_selected:not(:visible)').length) {
							viewModel.shownFlights(Infinity);
							$groupsList.trigger('resize');
						}
					}, 1);
				}

				function defineMinMaxTopOffset ($collection) {
					var ret = {}, tmp;

					for (var i = 0; i < $collection.length; i++) {
						tmp = $collection.eq(i).position().top;

						if (!('min' in ret) || ret.min > tmp) {
							ret.min = tmp;
						}

						if (!('max' in ret) || ret.max < tmp) {
							ret.max = tmp;
						}
					}

					if (!('min' in ret)) {
						ret.min = 0;
					}

					if (!('max' in ret)) {
						ret.max = 0;
					}

					return ret;
				}

				// Setting rebuild callback on popup contents container.
				// We go via $('body') because $groupsList.parents('.js-nemoApp__popupBlock')
				// Returns wrong element for some reason
				$('body').one('popupopen', function (e) {
					$(e.target).on('popupopen', function () {
						build();
					});
				});

				// Needed for autoupdate
				viewModel.selectedFlightsIds();
				viewModel.sort();
				viewModel.shownFlights();

				if (viewModel.flights[0].legs.length == 2) {
					build();
				}
			}
		};

		ko.bindingHandlers.flightsResultsCouplingTableDetails = {
			init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				$(element).click(function (e) {
					e.stopPropagation();
					e.preventDefault();

					var data = valueAccessor(),
						possibleSelected = null,
						cheapest;

					if (data.group.disabled()) {
						data.table.detailsPopupFlight(data.table.flightsById[data.group.cheapestId]);
					}
					else {
						for (var i = 0; i < data.table.legGroupings.length; i++) {
							if (possibleSelected === null) {
								possibleSelected = i == data.index ? data.group.ids : data.table.legGroupings[i].selected().ids;

							}
							else {
								possibleSelected = bindingContext.$root.helpers.intersectArrays(
									possibleSelected,
									i == data.index ? data.group.ids : data.table.legGroupings[i].selected().ids
								);
							}
						}

						// Defining cheapest
						if (possibleSelected.length == 0) {
							return;
						}

						// Define needed flight here
						for (var i = 0; i < possibleSelected.length; i++) {
							if (!cheapest || cheapest.getTotalPrice().normalizedAmount() > data.table.flightsById[possibleSelected[i]].getTotalPrice().normalizedAmount()) {
								cheapest = data.table.flightsById[possibleSelected[i]];
							}
						}

						data.table.detailsPopupFlight(cheapest);
					}

					data.table.detailsPopupLeg(data.index);
					data.table.detailsPopupOpen(true);
				});
			}
		};

		ko.bindingHandlers.flightsResultsSearchFormHider = {
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

		ko.bindingHandlers.flightsResultsBuyButtonFlightCheck = {
			_worker: function ($element, valueAccessor) {
				// We need to call valueAcessor from inside click handler for it to return latest data passed to binding as a parameter
				var data = valueAccessor();

				if (data.ids.length) {
					if($element.parents('.js-flights-results__showcase').length > 0){
						Cookie.set('nemo-showcaseFlight-' + data.ids[0], true, 30);
					}

					if (data.controller.options.needCheckAvail) {
						$element.data('nemo-flights-results__bookingCheckInProgress',true);
					}

					data.controller.bookFlight(data.ids);
				}
			},
			_hintContent: function (flight, i18n, valueAccessor) {
				var ret = '';

				if (flight) {
					for (var i = 0; i < flight.warnings.length; i++) {
						switch (flight.warnings[i].type) {
							case 'stopovers':
								ret += '<p class="nemo-flights-results__flightsWarnings__item">';
								ret += i18n('FlightsSearchResults','flightsGroup__flightWarnings__stopovers')
									.replace(
									'[%-count-%]',
									flight.warnings[i].data.count +
									' ' +
									i18n(
										'FlightsSearchResults',
										'flightsGroup__flightWarnings__stopovers__stop_' + helpers.getNumeral(flight.warnings[i].data.count, 'one', 'twoToFour', 'fourPlus')
									)
								);
								ret += '</p>';
								break;
							default:
								ret += '<p class="nemo-flights-results__flightsWarnings__item">' + i18n('FlightsSearchResults','') + '</p>';
								break;
						}
					}
				}

				return '<div class="nemo-flights-results__flightsWarnings">' + ret + '</div>';
			},
			init: function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var $element = $(element),
					touchmoveOccured = false,
					isClickEmultated = false;

				$element.on('touchstart', function (e) {
					touchmoveOccured = false;
				});

				$element.on('touchend', function (e) {
					if (!touchmoveOccured) {
						e.stopPropagation();
						e.preventDefault();

						try {
							$element.popup('destroy');
						} catch (e) {/* do nothing */}

						if (valueAccessor().controller.flights[valueAccessor().ids[0]].warnings.length) {
							if (!$element.data('ui-popup')) {
								$element.popup({
									closeOnOverlayClick: false,
									contentType: 'html',
									modal: true,
									draggable: false,
									closeText: bindingContext.$root.i18n('common', 'popup_closeText'),
									width: 'auto',
									height: 'auto',
									title: bindingContext.$root.i18n('FlightsSearchResults', 'flightsGroup__flightWarningsHeader'),
									contentData: ko.bindingHandlers.flightsResultsBuyButtonFlightCheck._hintContent(
										valueAccessor().controller.flights[valueAccessor().ids[0]],
										bindingContext.$root.i18n,
										valueAccessor
									),
									buttons: [
										{
											text: bindingContext.$root.i18n('FlightsSearchResults', 'flightsGroup__flightWarningsReturn'),
											click: function () {
												try {
													$element.popup('close');
												}
												catch(e){}
											},
											'class': 'ui-button_pseudoLink ui-button_secondary'
										},
										{
											text: bindingContext.$root.i18n('FlightsSearchResults', 'flightsGroup__flightWarningsContinue'),
											click: function () {
												try {
													$element.popup('close');
												}
												catch(e){}

												ko.bindingHandlers.flightsResultsBuyButtonFlightCheck._worker ($element, valueAccessor);
											}
										}
									]
								});
							}
							else {
								$element.popup('open');
							}
						}
						else {
							ko.bindingHandlers.flightsResultsBuyButtonFlightCheck._worker ($element, valueAccessor);
						}
					}

					isClickEmultated = true;
					setTimeout(function () {isClickEmultated = false;}, 100);
				});

				$element.on('touchmove', function (e) {
					touchmoveOccured = true;
				});

				$element.on('click', function (e) {
					if (!isClickEmultated) {
						ko.bindingHandlers.flightsResultsBuyButtonFlightCheck._worker($element, valueAccessor);
					}
				});

				ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
					try{
						$(element).tooltipster('destroy');
					}
					catch (e) {/* do nothing */}
					try{
						$(element).popup('destroy');
					}
					catch (e) {/* do nothing */}
				});
			},
			update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
				var data = valueAccessor(),
					$element = $(element);

				// Setting tooltip (for desktops)
				if (data.ids.length && data.controller.flights[data.ids[0]].warnings.length) {
					var tooltipContent = ko.bindingHandlers.flightsResultsBuyButtonFlightCheck._hintContent(
						data.ids.length ? data.controller.flights[data.ids[0]] : null,
						bindingContext.$root.i18n,
						valueAccessor
					);

					if ($element.data('tooltipsterNs')) {
						$element.tooltipster('content', tooltipContent);
					}
					else {
						$element.tooltipster({
							offsetX: 0,
							offsetY: 0,
							contentAsHTML: true,
							touchDevices: false,
							content: '<div class="tooltipster-header">' +
								bindingContext.$root.i18n('FlightsSearchResults', 'flightsGroup__flightWarningsHeader') +
								'</div>' +
								tooltipContent
						});
					}
				}
				else {
					try{
						$(element).tooltipster('destroy');
					}
					catch (e) {/* do nothing */}
				}

				if (data.controller.bookingCheckInProgress() && $element.data('nemo-flights-results__bookingCheckInProgress')) {
					if (data.fixWidth) {
						$element.css('width', $element.outerWidth() + 'px');
					}

					$element.addClass(data.addClass);
				}
				else if ($element.data('nemo-flights-results__bookingCheckInProgress')) {
					$element.removeClass(data.addClass);

					$element.data('nemo-flights-results__bookingCheckInProgress',false);

					$element.css('width', '');
				}
			}
		};

		ko.bindingHandlers.flightsResultsClassByLuminocity = {
			init:function(element, valueAccessor, allBindingsAccessor, viewModel, bindingContext){
				var data = valueAccessor();

				if (!data.color) {
					return;
				}

				if (ko.bindingHandlers.flightsResultsClassByLuminocity.getLuminocity(data.color) > data.luma) {
					$(element).addClass(data.className);
				}
			},
			getLuminocity: function (color) {
				var rgb, r, g, b, luma;

				rgb = parseInt(color.replace('#', ''), 16); // convert #rrggbb to decimal
				r = (rgb >> 16) & 0xff;                          // extract red
				g = (rgb >>  8) & 0xff;                          // extract green
				b = (rgb >>  0) & 0xff;                          // extract blue
				luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;     // per ITU-R BT.709

				return luma
			}
		};
	}
);
