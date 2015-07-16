<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8"/>
	<title>Nemo Front-End</title>
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
</head>
<body>
<div class="nemo-common-pageWrapper">

	<header class="nemo-common-pageHeader">
		<div class="nemo-common-pageHeader__inner">

			<div class="nemo-common-pageHeader__inner__headerMenuControls nemo-common-pageHeader__inner__headerMenuControls_links">
				<span class="nemo-common-pageHeader__headerMenuControlls__menuButton nemo-common-pageHeader__headerMenuControlls__menuButton_links js-common-pageHeader__menuButton">
					<img class="nemo-common-pageHeader__headerMenuControlls__menuButton__image nemo-common-pageHeader__headerMenuControlls__menuButton__image_links" src="../img/menu-icon.svg" alt="">
				</span>
			</div>

			<a href="/" class="nemo-common-pageHeader__logo">
				<img class="nemo-common-pageHeader__logo__image" src="../img/logo.png" alt="">
			</a>

			<div class="nemo-common-pageHeader__inner__headerLinks">

				<button class="new-ui-button new-ui-button_common new-ui-button_medium nemo-common-pageHeader__inner__headerLinks__item">
					Войти
				</button>

				<a href="#" class="new-ui-pseudoLink new-ui-pseudoLink_blue nemo-common-pageHeader__inner__headerLinks__item">
					Регистрация
				</a>

				<a href="#" class="new-ui-pseudoLink new-ui-link_blue nemo-common-pageHeader__inner__headerLinks__item">
					Состояние заказа
				</a>

			</div>

			<div class="nemo-common-pageHeader__inner__headerRight">
				<div class="nemo-common-pageHeader__inner__headerMenuControls nemo-common-pageHeader__inner__headerMenuControls_selects">
					<span class="nemo-common-pageHeader__headerMenuControlls__menuButton nemo-common-pageHeader__headerMenuControlls__menuButton_selects js-common-pageHeader__menuButton">
						<img class="nemo-common-pageHeader__headerMenuControlls__menuButton__image nemo-common-pageHeader__headerMenuControlls__menuButton__image_selects" src="../img/menu-icon-dots.svg" alt="">
					</span>
				</div>
				<div class="new-ui-dropMenu nemo-common-pageHeader__dropMenu nemo-common-pageHeader__dropMenu_language">

					<div class="new-ui-dropMenu__main">
						<button class="new-ui-button new-ui-button_common nemo-common-pageHeader__dropMenu__button">
							<img class="nemo-common-pageHeader__langSelectImage" src="../img/flag.svg" alt="">
						</button>
					</div>

					<div class="new-ui-dropMenu__drop nemo-common-pageHeader__droplist nemo-common-pageHeader__droplist_language">
						<span class="nemo-common-pageHeader__droplist__header">Валюта поиска и оплаты</span>
						<div class="nemo-common-pageHeader__droplist__option">
							<div class="nemo-common-pageHeader__droplist__option__icon">
								<img class="nemo-common-pageHeader__langSelectImage" src="../img/flag.svg" alt="">
							</div>
							<span class="nemo-common-pageHeader__droplist__option__text">
								English (US)
							</span>
						</div>
						<div class="nemo-common-pageHeader__droplist__option nemo-common-pageHeader__droplist__option_selected">
							<div class="nemo-common-pageHeader__droplist__option__icon">
								<img class="nemo-common-pageHeader__langSelectImage" src="../img/flag.svg" alt="">
							</div>
							<span class="nemo-common-pageHeader__droplist__option__text">
								English (US)
							</span>
						</div>
						<div class="nemo-common-pageHeader__droplist__option">
							<div class="nemo-common-pageHeader__droplist__option__icon">
								<img class="nemo-common-pageHeader__langSelectImage" src="../img/flag.svg" alt="">
							</div>
							<span class="nemo-common-pageHeader__droplist__option__text">
								English (US)
							</span>
						</div>
						<div class="nemo-common-pageHeader__droplist__option">
							<div class="nemo-common-pageHeader__droplist__option__icon">
								<img class="nemo-common-pageHeader__langSelectImage" src="../img/flag.svg" alt="">
							</div>
							<span class="nemo-common-pageHeader__droplist__option__text">
								English (US)
							</span>
						</div>

					</div>


				</div>

				<div class="new-ui-dropMenu nemo-common-pageHeader__dropMenu nemo-common-pageHeader__dropMenu_currency">

					<div class="new-ui-dropMenu__main">
						<button class="new-ui-button new-ui-button_common nemo-common-pageHeader__dropMenu__button">
							$
						</button>
					</div>

					<div class="new-ui-dropMenu__drop nemo-common-pageHeader__droplist">
						<span class="nemo-common-pageHeader__droplist__header">Валюта поиска и оплаты</span>
						<div class="nemo-common-pageHeader__droplist__option">
							<div class="nemo-common-pageHeader__droplist__option__icon">
								$
							</div>
							<span class="nemo-common-pageHeader__droplist__option__text">
								US Dollar
							</span>
						</div>
						<div class="nemo-common-pageHeader__droplist__option nemo-common-pageHeader__droplist__option_selected">
							<div class="nemo-common-pageHeader__droplist__option__icon">
								$
							</div>
							<span class="nemo-common-pageHeader__droplist__option__text">
								US Dollar
							</span>
						</div>
						<div class="nemo-common-pageHeader__droplist__option">
							<div class="nemo-common-pageHeader__droplist__option__icon">
								$
							</div>
							<span class="nemo-common-pageHeader__droplist__option__text">
								US Dollar
							</span>
						</div>
						<div class="nemo-common-pageHeader__droplist__option">
							<div class="nemo-common-pageHeader__droplist__option__icon">
								$
							</div>
							<span class="nemo-common-pageHeader__droplist__option__text">
								US Dollar
							</span>
						</div>

					</div>

				</div>


			</div>
		</div>

	</header>

	<!-- Template override example -->
<!--	<script id="nemo-koTemplate-FlightsResults-Group" type="text/html">-->
<!--		<div>Overridden Flights Results Group template <span data-bind="text: id"></span></div>-->
<!--	</script>-->

	<div class="nemo-root nemo-widget nemo-widget_flights js-nemoApp" data-bind="moneyInit: $data">
		<!-- ko if: component() -->
		<div style="display: none;" data-bind="attr:{style: ''}">
			<div class="" data-bind="component: {
					name: component,
					params: {
						route: componentRoute(),
						additional: componentAdditionalParams()
					}
				}">
				<div class="nemo-common-appLoader"></div>
			</div>
		</div>
		<!-- /ko -->
		<!-- ko if: !component() && !globalError() -->
		<div class="nemo-common-appLoader"></div>
		<!-- /ko -->
		<!-- ko if: globalError() -->
		<div class="nemo-common-appError" data-bind="text: globalError"></div>
		<!-- /ko -->
	</div>

	<!-- TODO incorporate in our css -->
	<!--<link rel="stylesheet" href="/js/lib/jqueryUI/v.1.11.4/jquery-ui.min.css">-->
	<!--<link rel="stylesheet" href="/js/lib/jqueryUI/v.1.11.4/jquery-ui.css">-->
	<?php $host = 'http'.(isset($_SERVER['HTTPS']) ? 's' : '').'://'.$_SERVER['HTTP_HOST']; ?>

	<link rel="stylesheet" href="<?php echo $host; ?>/css/style.css?a=1123">
	<!--[if IE 9]>
		<link rel="stylesheet" href="<?php echo $host; ?>/css/ie9.css?a=1123">
	<![endif]-->
	<script src="<?php echo $host; ?>/js/lib/requirejs/v.2.1.15/require.js"></script>
	<script>
		var nemoSourceHost = '<?php echo $host; ?>';
		require.config({
			// This should be deleted
			urlArgs: "bust=" + (new Date()).getTime(),

			// Common libraries
			paths: {
				domReady:      nemoSourceHost+'/js/lib/requirejs/domReady',
				text:          nemoSourceHost+'/js/lib/requirejs/text',
				knockout:      nemoSourceHost+'/js/lib/knockout/v.3.2.0/knockout-3.2.0',
				AppController: nemoSourceHost+'/js/NemoFrontEndController',
				jquery:        nemoSourceHost+'/js/lib/jquery/v.2.1.3/jquery-2.1.3.min',
				jqueryUI:      nemoSourceHost+'/js/lib/jqueryUI/v.1.11.4/jquery-ui.min',
				jsCookie:      nemoSourceHost+'/js/lib/js.cookie/v.2.0.0/js.cookie',
				tooltipster:   nemoSourceHost+'/js/lib/tooltipster/jquery.tooltipster.min',
				numeralJS:     nemoSourceHost+'/js/lib/numeral.js/v.1.5.3/numeral.min',
				mousewheel:    nemoSourceHost+'/js/lib/jquery.mousewheel/jquery.mousewheel.min',
				touchpunch:    nemoSourceHost+'/js/lib/jquery.ui.touch-punch/v.0.2.3/jquery.ui.touch-punch.min'
			},

			baseUrl: nemoSourceHost,
			enforceDefine: true,
			waitSeconds: 300,

			// Overriding requirejs.text so templates will ALWAYS be fetched via XHR request
			// RTFM: https://github.com/requirejs/text#xhr-restrictions
			config: {
				text: {
					useXhr: function (url, protocol, hostname, port) {
						// Override function for determining if XHR should be used.
						// Return true means "use xhr", return false means "fetch the .js version of this resource".
						return true;
					}
				}
			}
		});

		require (
				['AppController'],
				function (AppController) {
					var controller = new AppController(
							document.getElementsByClassName('js-form')[0],
							{
								sourceURL: nemoSourceHost,
								dataURL: 'http://demo.mlsd.ru/api',
								staticInfoURL: 'http://demo.mlsd.ru',
								root: '/',
//						verbose: true,
								i18nLanguage: 'ru',
								postParameters: {}/*,

								// Passing additional parametes to components
								componentsAdditionalInfo: {
									'Flights/SearchForm/Controller': {
										delayed: false,
										init: {
											direct: true,
											serviceClass: 'Business',
											vicinityDates: true,
											passengers: {
												ADT: 2,
												INF: 1,
												CLD: 2
											},
											segments: [
												[
													'KBP',
													'LON',
													'2015-05-31',
													false,
													true
												],
												[
													'DME',
													'IEV',
													'2015-06-01',
													false,
													true
												],
												[
													'LON',
													'IEV',
													'2015-06-07',
													true,
													false
												]
											]
										}
									}
								}*/
							}
					);
				}
		);

		// Extensions example
		/*require (
			['AppController', 'knockout'],
			function (AppController, ko) {
				// Models extension
				AppController.prototype.extend('FlightsSearchForm/FlightsSearchFormController', function () {
					var self = this;

					// Example of adding/changing parameters
					this.extended = 'some value';
					this.extendedObservable = ko.observable(0);
					setInterval(function(){self.extendedObservable(self.extendedObservable() + 1)}, 1000);

					// Example of overriding of prototype function
					this.getUsedModels = function () {
						var tmp = this.$$usedModels;

						tmp.push(this.extended);

						return tmp;
					}
				});

				// i18n extension
				AppController.prototype.i18nExtend(
					{
						'FlightsSearchForm':{'test_i18n_variable':'Extended i18n', 'new':'New i18n var'},
						'newSegment':{'test_i18n_variable':'Var from new segment'}
					}
				);
			}
		);*/
	</script>
</div>

<footer class="nemo-common-footer">
	<div class="nemo-common-footer__footerInner">
		<div class="nemo-common-footer__left">
			<div class="nemo-common-footer__footerMenu">
				<a href="#" class="nemo-common-footer__footerMenu__item">
					Помощь
				</a>
				<a href="#" class="nemo-common-footer__footerMenu__item">
					Обратная связь
				</a>
			</div>
			<div class="nemo-common-footer__copyRight">
				© nemo.travel
			</div>
		</div>
		<div class="nemo-common-footer__right">
			<div class="nemo-common-footer__companyLogo">
				<img src="../img/nemo-logo.svg" alt="">
			</div>
			<div class="nemo-common-footer__companyLogo">
				<img src="../img/mute-lab-logo.svg" alt="">
			</div>
		</div>
	</div>
</footer>
</body>
</html>