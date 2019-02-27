//TODO
//1. iframe + popup scrolling
//2. draggable + popup scrolling
define(
	['jquery', 'jqueryUI'],
	function (jQuery) {
		!function (window, document, $, undefined) {
			function getScrollbarWidth() {
				var outer = document.createElement("div");
				outer.style.visibility = "hidden";
				outer.style.width = "100px";
				outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps

				document.body.appendChild(outer);

				var widthNoScroll = outer.offsetWidth;
				// force scrollbars
				outer.style.overflow = "scroll";

				// add innerdiv
				var inner = document.createElement("div");
				inner.style.width = "100%";
				outer.appendChild(inner);

				var widthWithScroll = inner.offsetWidth;

				// remove divs
				outer.parentNode.removeChild(outer);

				return widthNoScroll - widthWithScroll;
			}
			$.widget('ui.popup', $.ui.dialog, {
				//override default dialog options
				options: {
					autoOpen: true,
					resizable: false,
					minHeight: 'auto',
					minWidth: 'auto',
					modal: true,
					closeOnOverlayClick: true,
					loaderText: '',
					closeButton: true,
					loaderClass: '',
					dialogClass: '',
					contentClass: '',
					buttonPaneClass: '',
					headerClass: '',
					wrapperClass: '',
					overlayClass: '',
					draggable: false,
					url: '',
					cache: true,
					contentType: '', // iframe, ajax, html
					contentData: '',
					ajaxMethod: 'POST',
					ajaxDataType: 'html', //format of data response from server
					ajaxSendData: '', // data that send to server
					//callbacks
					ajaxFail: function (e) {
						console.error('Error: can\'t load data via AJAX:', e);
					},

					ajaxDone: function (data, status) {
						if (data != "") {
							this.element.html(data);
						}
					},
					ajaxAlways: function () {
						this.loaderElement.remove();
					}
				},

				firstCreate: true,

				_create: function () {
					var that = this,
						dataOption = eval('(' + this.element.attr('data-popup') + ')');

					//extend default options(last element more important)
					this.options = $.widget.extend({},
						this.options,
						dataOption
					);

					if (this._isCreateNewContainer()) {
						//cache original element
						this.originalElement = that.element;
						this.element = $('<div>');
					}

					if (this._isDynamicContent()) {
						// setup url
						this.options.url = this.options.url || this.originalElement.attr('href');

						// element that will indicate loading of content
						this.loaderElement = $('<div class="ui-dialog__loader">'+ (this.options.loaderText != '' ? this.options.loaderText : 'Loading...') +'</div>');

						//add custom class to loader
						if (this.options.loaderClass) {
							this.loaderElement.addClass(this.options.loaderClass);
						}
					}

					//call parent create function
					this._super('_create');

					this._createDialogWrapper();

					this.uiDialogTitle = this.uiDialogTitlebar.find('.ui-dialog-title');

					//remove default event
					this.uiDialogTitlebar.unbind('mousedown');

					//add class to dialog
					this.uiDialog.addClass(this.options.dialogClass);

					//add class to content element
					this.element.addClass(this.options.contentClass);

					//add class to button pane
					this.uiDialogButtonPane.addClass(this.options.buttonPaneClass);

					//add class to header element
					this.uiDialogTitlebar.addClass(this.options.headerClass);

					//add class to dialog wrapper
					this.uiWrapper.addClass(this.options.wrapperClass);

					this.reposition = this.reposition.bind(this);

					if (!this.options.closeButton) {
						this.uiDialogTitlebar.find('.ui-dialog-titlebar-close').remove();
					}
				},

				_init: function () {
					var maxHeight = $(window).height() * 0.8;
					if (this.options.height > maxHeight) {
						this.options.height = maxHeight;
					}

					this._super('_init');
				},

				open: function () {
					var that = this;

					//if init first time or cache set up false
					if (this.firstCreate || !this.options.cache) {
						this.firstCreate = false;

						if (this._isDynamicContent()) {
							//remove all from content container
							this.element.empty();

							//add loader to content
							this.loaderElement
								.appendTo(this.element);
						}

						if (this.options.contentType == 'iframe') {
							this._loadIframeContent();
						}

						if (this.options.contentType == 'ajax') {
							this._loadAjaxContent();
						}

						if (this.options.contentType == 'html') {
							this.element.html(this.options.contentData);
							this.element.data('ui-popup__close',function () {
								that.close();
							});
						}
					}

					this._addBodyClass();

					this.uiWrapper.show();

					this._super('open');
					this._resizeIframe();

					var dialogZIndex = parseInt(this.uiDialog.css('z-index'));
					this.uiWrapper.zIndex(dialogZIndex);

					if (this._isDynamicContent()) {
						this.loaderElement.height(this.element.height());
					}

					// Setting reposition
					$(window).on('resize orientationchange', this.reposition);

					if(document.body.scrollHeight > document.body.clientHeight) {
						$('body').css({
							'padding-right':getScrollbarWidth()
						})
					}
				},

				close: function () {
					if (!this.options.cache) {
						this.element.html('');
					}

					//remove class from body
					this._removeBodyClass();

					this.uiWrapper.hide();

					this._super('close');

					// Removing reposition
					$(window).off('resize orientationchange', this.reposition);
				},

				reposition: function () {
					this._position();
				},

				_destroy: function () {
					if (this._isCreateNewContainer()) {
						//remove data rom jquery storage
						this.originalElement
							.removeData(this.widgetFullName)
							.removeData(this.widgetName);
					}

					//remove dialog wrapper
					this.uiWrapper.remove();
					this._removeBodyClass();

					this._super('_destroy');

					if (this._isCreateNewContainer()) {
						this.element.remove();
					}
				},

				_setOptions: function (options) {
					this._super(options);
					this._resizeIframe();
				},

				_createDialogWrapper: function () {
					var that = this;

					if (this.options.modal) {
						this.uiWrapper = $('<div>')
						.addClass('ui-dialog__wrapper')
						.hide()
						.appendTo($('body'));

						if (this.options.closeOnOverlayClick) {
							this.uiWrapper.on('click', function (e) {
								if($(this).is($(e.target))) {
									that.close();
								}
							});
						}

						this.uiDialog.appendTo(this.uiWrapper);
					}
					else {
						this.uiWrapper = $();
					}

				},

				_createOverlay: function() {
					var that = this;

					this._super('_createOverlay');

					this.overlay.addClass(this.options.overlayClass);

					if (this.options.closeOnOverlayClick) {
						this.overlay.on('click', function (e) {
							if($(this).is($(e.target))) {
								that.close();
							}
						});
					}
				},

				_addBodyClass: function () {
					if (!this.document.data('ui-dialog__open')) {
						var scrollBarWidth = this._scrollBarWidth();
					}

					if (this.options.modal) {
						if(/iPhone|iPod/.test(navigator.userAgent)) {
							$('body').attr('top-pos', $(window).scrollTop());
							$('html')
								.addClass('ui-dialog__open_iphone');
						}
						$('body')
							.addClass('ui-dialog__open')
							.css({'padding-right': scrollBarWidth});
					}

					this.document.data('ui-dialog__open',
						(this.document.data('ui-dialog__open') > 0 ? this.document.data('ui-dialog__open') : 0) + 1);
				},

				_removeBodyClass: function () {
					if (this.document.data('ui-dialog__open') == 1) {
						$('body')
							.removeClass('ui-dialog__open')
							.css({'padding-right': 0});
						$('html')
							.removeClass('ui-dialog__open_iphone');
						if($('body').attr('top-pos')) {
							$(window).scrollTop($('body').attr('top-pos'));
						}
					}

					this.document.data('ui-dialog__open',
						(this.document.data('ui-dialog__open') > 0 ? this.document.data('ui-dialog__open') : 1) - 1);
				},

				_loadAjaxContent: function () {
					var that = this;
					//add class to ajax container
					this.element.addClass('ui-dialog-content_ajax');

					$.ajax({
						url: this.options.url,
						type: this.options.ajaxMethod,
						data: this.options.ajaxSendData,
						dataType: this.options.ajaxDataType
					})
						.done(function () {
							that.options.ajaxDone.apply(that, arguments);
						})
						.fail(function () {
							that.options.ajaxFail.apply(that, arguments);
						})
						.always(function () {

							that.options.ajaxAlways.apply(that, arguments);
						});
				},

				_loadIframeContent: function () {
					var that = this;
					this.iframeElement = $('<iframe></iframe>'),
						//iframe css
						iframeCss = {
							'margin-left': -1 * parseInt(that.element.css('padding-left')),
							'margin-right': -1 * parseInt(that.element.css('padding-right')),
							'margin-top': -1 * parseInt(that.element.css('padding-top')),
							'margin-bottom': -1 * parseInt(that.element.css('padding-bottom'))
						};

					//add class to iframe container
					this.element.addClass('ui-dialog-content_iframe');

					that.options.url += '&iframePopupMode=1';

					//set up iframe
					this.iframeElement
						.addClass('ui-dialog__iframe')
						.attr('src', that.options.url)
						.appendTo(that.element)
						.css(iframeCss)
						.hide();

					this.iframeElement.on('load', function (e) {
						that.loaderElement.remove();

						that.iframeElement
							.height(that.element.outerHeight())
							.width(that.element.outerWidth())
							.show();
					});
				},

				_focusTabbable: function () {
				},
				_keepFocus: function () {
				},

				_resizeIframe: function () {
					if (this.iframeElement) {
						this.iframeElement
							.height(this.element.outerHeight())
							.width(this.element.outerWidth())
					}
				},

				_scrollBarWidth: function () {
					var scrollDiv = document.createElement('div');
					scrollDiv.className = 'ui-dialog__scrollbarMeasure';
					$(document.body).append(scrollDiv);
					var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
					$(document.body)[0].removeChild(scrollDiv);
					return scrollbarWidth;
				},

				_isDynamicContent: function () {
					return this.options.contentType == 'ajax'
						|| this.options.contentType == 'iframe';
				},

				_isCreateNewContainer: function () {
					return this.options.contentType == 'ajax'
						|| this.options.contentType == 'iframe'
						|| this.options.contentType == 'html';
				},

				_position: function() {
					// Need to show the dialog to get the actual offset in the position plugin
					var isVisible = this.uiDialog.is( ":visible" );
					if ( !isVisible ) {
						this.uiDialog.show();
					}

					this.options.position.of = this.uiWrapper;

					// We need this only for horisontal position
					this.uiDialog.position( this.options.position );

					var wh = this.uiWrapper.outerHeight(),
						dh = this.uiDialog.outerHeight(),
						position = 0;

					if (dh < wh) {
						position = (wh - dh) / 2;
					}

					this.uiDialog.css('top', position + 'px');

					this.uiWrapper.scrollTop(0);

					if ( !isVisible ) {
						this.uiDialog.hide();
					}
				}
			});
		}(window, document, jQuery);
	}
);