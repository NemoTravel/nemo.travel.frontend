<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8"/>
	<title>Nemo Front-End</title>
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
</head>
<body>
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

<?php $host = 'http'.(isset($_SERVER['HTTPS']) ? 's' : '').'://'.$_SERVER['HTTP_HOST']; ?>
<link href='http://fonts.googleapis.com/css?family=Roboto:400,700,500&subset=latin,cyrillic' rel='stylesheet' type='text/css'>
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
					dataURL: 'http://conchita.mlsd.ru/api',
					staticInfoURL: 'http://conchita.mlsd.ru',
					root: '/',
//						    verbose: true,
					i18nLanguage: 'ru',
					postParameters: {},

					// Passing additional parametes to components
					componentsAdditionalInfo: {
						'Flights/SearchForm/Controller': {
							forceSelfHostNavigation: true
			                /*delayed: false,
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
							}*/
						}
					}
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

</body>
</html>