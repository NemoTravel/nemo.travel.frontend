define(
	['jquery', 'jsCookie'],
	function ($, Cookie) {
		(function($) {
			$.fn.currencyConverter = function(o) {
				var $scope = this,
					defoptions = {
						/**
						 * Elements selector
						 * @var {String}
						 */
						selector: 'money',

						/**
						 * Obligatory default currency: currency that is a base for conversion table
						 * @var {String}
						 */
						defaultCurrency: null,

						/**
						 * Obligatory conversion table from defaultCurrency to other currencies
						 * @var {Object}
						 */
						conversionTable: null,

						/**
						 * Flag that determines whether we use elements caching
						 * @var {Boolean}
						 */
						useCache: true,

						/**
						 * String that determines a default format for elements that have none
						 * @var {String}
						 */
						defaultFormat: '0,0.00 $',

						/**
						 * Currency display type
						 * @var {String}
						 */
						currencyType: 'code', // name, code, symbol

						/**
						 * Object that contains crrency symbols by their codes
						 * @var {Object}
						 */
						currencySymbols: {
							USD: '$',
							UAH: '₴',
							EUR: '€',
							JPY: '¥',
							GBP: '£',
							ILS: '₪',
							PLN: 'zł',
							RUB: 'руб',
							BYR: 'p.',
							AZN: '&#8380;'
						},

						/**
						 * The format of these currencies is static
						 * @var {Object}
						 */
						currencyFixedFormat: {
							EUR: '0,0.00 $',
							USD: '0,0.00 $',
							GBP: '0,0.00 $',
							AZN: '0,0.00 $',
							GEL: '0,0.00 $',
							BYR: '0,0 $',
							KZT: '0,0 $',
							UZS: '0,0 $'
						},

						/**
						 * Object that contains currency names by their codes
						 * @var {Object}
						 */
						currencyNames: {},

						/**
						 * Function that rounds last digit (used for numeral)
						 * @var {function}
						 */
						roundingFunction: Math.ceil,

						thousandsDelimiter: ' ',

						decimalDelimiter: '.',

						/**
						 * Name of numeral locale
						 * @var {String}
						 */
						numeralLocaleName: 'currencyConverter-CUSTOM',

						/**
						 * Flag that determines debugging output
						 * @var {Boolean}
						 */
						debug: false
					},
					options = $.extend(defoptions, o || {}),
					$cache = null,
					numeralLocale = {
						delimiters: {
							thousands: options.thousandsDelimiter,
							decimal  : options.decimalDelimiter
						},
						abbreviations: {
							thousand: 'k',
							million : 'm',
							billion : 'b',
							trillion: 't'
						},
						ordinal: function (a) {
							var b = a % 10;
							return 1 === ~~(a % 100 / 10) ? "th" : 1 === b ? "st" : 2 === b ? "nd" : 3 === b ? "rd" : "th";
						},
						currency: {
							symbol: ''
						}
					},
					currentCurrency = Cookie.get('ccCurrency');

				log ('Initializing on', $scope, 'Options:', options);

				// Checking options
				// Checking default currency
				if (options.defaultCurrency == null) {
					error('No default currency defined! Terminating.', options);
					return;
				}

				// Checking (and fixing if needed) conversion table
				if (options.conversionTable == null) {
					error('No conversion table defined! Terminating.', options);
					return;
				}

				if (typeof options.conversionTable[options.defaultCurrency] == "undefined") {
					options.conversionTable[options.defaultCurrency] = 1;
				}

				log('All looks OK', options, 'Binding handlers');

				// Binding handlers
				$scope
					.on('cc:updated',function (e) {
						log('Setting locale for numeral');
						numeral.language(options.numeralLocaleName, numeralLocale);
						numeral.language(options.numeralLocaleName);

						processElement($(e.target), currentCurrency);
					})
					.on('cc:changeCurrency',function (e, eventData) {
						console.log(eventData);

						currentCurrency = null;

						if (typeof eventData != 'undefined' && typeof eventData.currency != 'undefined') {
							currentCurrency = eventData.currency;
						}

						log('Changing currency to', currentCurrency);

						Cookie.set('ccCurrency', currentCurrency, { expires: 365 });

						init();
					})
					.on('cc:reInit',function (e) {
						init(true);
					});

				log('Handlers bound. Triggering init event');

				$scope.eq(0).trigger('cc:reInit');

				// Auxiliary functions
				function init (repopulateCache) {
					var elements,
						i;

					log('Setting locale for numeral');
					numeral.language(options.numeralLocaleName, numeralLocale);
					numeral.language(options.numeralLocaleName);

					if (repopulateCache) {
						$cache = null;
					}
					getElements();

					for (i = 0; i < $cache.length; i++) {
						processElement($cache.eq(i), currentCurrency);
					}
				}

				function processElement ($element, currency) {
					var amount = parseFloat($element.attr('amount'), 10),
						originalCurrency = $element.attr('currency'),
						forceCurrency = $element.attr('force-currency'),
						currencyClass = $element.attr('currency-class'),
						format = $.trim($element.attr('format')) || options.defaultFormat,
						roundingFunction = options.roundingFunction,
						eltRoundType = $element.attr('round'),
						result;

					if (originalCurrency == null) {
						return;
					}
					
					if (typeof forceCurrency != "undefined") {
						currency = forceCurrency;
					}

					if (currency == null && originalCurrency in options.currencyFixedFormat) {
						format = options.currencyFixedFormat[originalCurrency];
					}

					if( currency in options.currencyFixedFormat && format != '$' ) {
						format = options.currencyFixedFormat[currency]; //
					}

					// Dynamic conversion
					if(currency && originalCurrency && currency !== originalCurrency){
						eltRoundType = 'normal';
					}

					originalCurrency = originalCurrency.toUpperCase();

					log('Processing element', $element, 'conversion to', currency);

					if (isNaN(amount)) {
						amount = 0;
						error('Amount of element is NaN! Setting to 0');
					}

					// If we have no currency or there's a no-translation flag - currency remains as set in tag
					if (typeof currency == "undefined" || currency == null) {
						currency = originalCurrency;
						log('No translation set! Currency is set to', currency);
					}
					else {
						// Checking whether we can convert currency: we need conversion rates from current and destination currencies
						if (typeof options.conversionTable[originalCurrency] != 'undefined') {
							if (typeof options.conversionTable[currency] != 'undefined') {
								amount = convertAmount(amount, originalCurrency, currency);
							}
							else {
								currency = originalCurrency;
								error('WANRING!!! Can not convert currency: no conversion data on OUTPUT CURRENCY', currency, $element);
							}
						}
						else {
							currency = originalCurrency;
							error('WANRING!!! Can not convert currency: no conversion data on ORIGINAL CURRENCY', originalCurrency, $element);
						}
					}

					currency = currency.toUpperCase();

					// Checking possible rounding function
					if (eltRoundType) {
						switch (eltRoundType.toLowerCase()) {
							case 'up':
								roundingFunction = Math.ceil;
								break;
							case 'down':
								roundingFunction = Math.floor;
								break;
							case 'normal':
								roundingFunction = Math.round;
								break;
						}
					}

					// Formatting
					result = getFormatted(amount, currency, format, roundingFunction, currencyClass);

					// Setting as HTML to element
					$element.html(result);
				}

				function convertAmount (amount, inCurrency, outCurrency) {
					if (inCurrency.toUpperCase() != outCurrency.toUpperCase()) {
						// Converting to desired currency
						amount /= options.conversionTable[inCurrency];
						amount *= options.conversionTable[outCurrency];
					}

					return amount;
				}

				function getFormatted (amount, currency, format, roundingFunction, currencyClass) {
					var currencyText = currency;

					log ('Formatting:', amount, currency, format);

					// Deciding how we're gonna display a currency
					// if we don't have an appropriate name or symbol, we fall back to code
					if (options.currencyType == 'name' && typeof options.currencyNames[currency] != 'undefined') {
						currencyText = options.currencyNames[currency];
					}
					else if (options.currencyType == 'symbol' && typeof options.currencySymbols[currency] != 'undefined') {
						currencyText = options.currencySymbols[currency];
					}

					numeralLocale.currency.symbol = '<currency type="'+options.currencyType+'" currency="'+currency+'"' + (currencyClass ? ' class="' + currencyClass + '"' : '') + '>'+currencyText+'</currency>';

					if ($.trim(format) == '$') {
						return numeralLocale.currency.symbol;
					}

					return numeral(amount).format(format, roundingFunction);
				}

				function getElements () {
					if ($cache == null || !options.useCache) {
						log('Repopulating cache');

						// Repopulating cache
						$cache = $scope.find(options.selector);
					}

					return $cache;
				}

				function log () {
					if (options.debug && typeof console != "undefined" && typeof console.log == "function") {
						console.log.apply(console,arguments);
					}
				}

				function error () {
					if (options.debug && typeof console != "undefined" && typeof console.error == "function") {
						console.error.apply(console,arguments);
					}
				}
			}
		})($);
	}
);
