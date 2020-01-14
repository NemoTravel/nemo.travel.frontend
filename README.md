<p align="center">
    <img width="200" src="http://demo.nemo.travel/templates/wurst/f2.0/img/nemo.travel.svg">
</p>

# Nemo Search Widget
Nemo Search Widget &mdash; виджет, встраиваемый на сайт и позволяющий совершать поиск авиабилетов с использованием системы бронирования [Nemo.Travel](http://www.nemo.travel/).

* [Установка](#Установка-виджета)
* [Ускорение виджета](#Ускорение-загрузки-виджета)

## Установка виджета
Ниже приведены способы инициализации виджета, при которых файлы виджета загружаются напрямую с домена привязанного к Nemo. 
Это значит, что **нет необходимости скачивать содержимое данного репозитория** и **нет возможности редактировать файлы виджета**.
Данный вариант установки наиболее простой и наименее гибкий.

О том, как ускорить загрузку виджета и как редактировать его содержимое, читайте ниже.

### Без использования PHP
Пример страницы с минимальной конфигурацией виджета, без использования PHP: [example.html](https://github.com/NemoTravel/nemo.travel.frontend/blob/master/example.html)

### С использованием PHP
**Важно**: 
* в коде ниже, необходимо заменить `КОД_ЯЗЫКА` на двузначный код языка, который будет использован в качестве основного языка виджета, например, `ru` (`ISO 639-1`)
* в коде ниже, необходимо заменить `ДОМЕН_ПРИВЯЗАННЫЙ_К_НЕМО` доменным именем (с `http(s)://` префиксом), к которому привязано ваше агентство в Nemo, например, `http://demo.nemo.travel`
* в виджете отсутствует встроенный переключатель языка: этот функционал необходимо реализовать своими силами и передавать в виджет нужный код языка

Пример кода, который необходимо вставить на `PHP`-страницу для работы виджета:
```php
<?php
$language = 'КОД_ЯЗЫКА';
$requestUri = $_SERVER['REQUEST_URI'];
$urlParamPos = strpos($requestUri, 'results');
if (!$urlParamPos) { $urlParamPos = strpos($requestUri, 'search'); }
$urlParamStr = $urlParamPos ? substr($requestUri, $urlParamPos) : '';
$root = str_replace($urlParamStr, '', $requestUri);
$nemoURL = 'ДОМЕН_ПРИВЯЗАННЫЙ_К_НЕМО';
$widgetPartsURL = $nemoURL . '/templates/wurst/f2.0';
?>

<link href="http://fonts.googleapis.com/css?family=Roboto:400,700,500&subset=latin,cyrillic" rel="stylesheet" type="text/css">
<link rel="stylesheet" href="<?php echo $widgetPartsURL; ?>/css/style.css?a=1123">
<!--[if IE 9]>
<link rel="stylesheet" href="<?php echo $widgetPartsURL; ?>/css/ie9.css?a=1123">
<![endif]-->
<link href="<?php echo $widgetPartsURL; ?>/js/lib/lightslider/dist/css/lightslider.min.css" rel="stylesheet">
<link href="<?php echo $widgetPartsURL; ?>/js/lib/fotorama-4.6.4/fotorama.css" rel="stylesheet">
<link href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet">
<div id="js-nemoApp">
    <!-- ko if: component() -->
        <div data-bind="component: {
            name: component,
            params: {
                route: componentRoute(),
                additional: componentAdditionalParams()
            }
        }">
            <div class="nemo-common-appLoader"></div>
        </div>
    <!-- /ko -->

    <!-- ko if: !component() && !globalError() -->
        <div class="nemo-common-appLoader"></div>
    <!-- /ko -->

    <!-- ko if: globalError() -->
        <div class="nemo-common-appError" data-bind="text: globalError"></div>
    <!-- /ko -->
</div>
<script src="<?php echo $widgetPartsURL; ?>/js/lib/requirejs/v.2.1.15/require.js"></script>
<script src="<?php echo $widgetPartsURL; ?>/js/lib/jquery/v.2.1.3/jquery-2.1.3.min.js"></script>
<script src="<?php echo $widgetPartsURL; ?>/js/lib/fotorama-4.6.4/fotorama.min.js"></script>
<script>
    var nemoSourceHost = '<?php echo $widgetPartsURL; ?>';

    require.config({
        urlArgs: '',
        paths: {
            async:         nemoSourceHost+'/js/lib/requirejs/async',
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
            touchpunch:    nemoSourceHost+'/js/lib/jquery.ui.touch-punch/v.0.2.3/jquery.ui.touch-punch.min',
            dotdotdot:     nemoSourceHost+'/js/lib/jquery.dotdotdot-master/jquery.dotdotdot'
        },
        baseUrl: nemoSourceHost,
        enforceDefine: true,
        waitSeconds: 300,
        config: { text: { useXhr: function () { return true; } } }
    });

    require(['AppController'], function (AppController) {
        var controller = new AppController(document.getElementById('js-nemoApp'), {
            controllerSourceURL: nemoSourceHost,
            dataURL: '<?php echo $nemoURL; ?>/api',
            staticInfoURL: '<?php echo $nemoURL; ?>/',
            templateSourceURL: '<?php echo $nemoURL; ?>/frontendStatic/html/wurst/v0/<?php echo $language; ?>/',
            i18nURL: '<?php echo $nemoURL; ?>/frontendStatic/i18n/wurst/v0',
            i18nLanguage: '<?php echo $language; ?>',
            version: 'v0',
            root: '<?php echo $root ?>',
            CORSWithCredentials: true,
            componentsAdditionalInfo: {
                'Flights/SearchForm/Controller': { 
                    forceSelfHostNavigation: true // `true` - для отображения результатов поиска на том же домене; `false` - для редиректа на домен связанный с Nemo.
                },
                'Hotels/SearchForm/Controller': {
                    forceSelfHostNavigation: true
                }
            }
        });
    });
</script>
```

## Ускорение загрузки виджета
Пример страницы с конфигурацией виджета после проведения действий описанных ниже: [example.html](https://github.com/NemoTravel/nemo.travel.frontend/blob/master/example-optimized.html)

### Подключаем минифицированный пакет с файлами виджета
Один из способов увеличения скорости загрузки виджета &mdash; подключение на страницу "пакета" (минифицированный JavaScript-файл), 
в котором в сжатом виде содержатся модули, необходимые для работы виджета (по умолчанию, они загружаются через `RequireJS`, посредством AJAX-запросов).
Подключение пакета позволит существенно сократить количество AJAX-запросов и ускорит первоначальную загрузку формы поиска.

Код, который необходимо вставить **после** подключения `/js/lib/requirejs/v.2.1.15/require.js`:
```html
<script src="ДОМЕН_ПРИВЯЗАННЫЙ_К_НЕМО/templates/wurst/dist/nemo-search-КОД_ЯЗЫКА.js"></script>
```

Обращаем ваше внимание на то, что подключаемый пакет доступен только на трёх языках: русский (`ru`), английский (`en`) и румынский (`ro`). В будущем, список языков может быть расширен.
 
Как отмечалось выше, виджет не имеет встроенного переключателя языка, поэтому, подключать пакет на нужном языке необходимо самостоятельно.

Также, использование пакета исключает возможность редактирования меток перевода на форме поиска (через модуль "Языковые ресурсы" в настройках агентства Nemo).

### Избавляемся от первоначального запроса к Nemo
По умолчанию, при открытии страницы с формой поиска виджета, совершается AJAX-запрос на домен привязанный к Nemo, с целью получить настройки агентства, конфигурацию формы поиска и прочие необходимые для работы виджета параметры.
Для ускорения загрузки виджета, можно избавиться от этого запроса, "подставив" его содержимое в параметры конфигурации виджета:
* переходим на `ДОМЕН_ПРИВЯЗАННЫЙ_К_НЕМО/api/flights/search/formData/?user_language_get_change=КОД_ЯЗЫКА` (пример: `http://demo.nemo.travel/api/flights/search/formData/?user_language_get_change=ru`)
* копируем содержимое страницы
* добавляем в конфиг виджета, в параметр `componentsAdditionalInfo.Flights/SearchForm/Controller` новое поле `formData`
* в качестве значения нового поля `formData` подставляем скопированное ранее содержимое страницы: 
```php
...
controllerSourceURL: nemoSourceHost,
dataURL: '//demo.nemo.travel/api',
staticInfoURL: '//demo.nemo.travel',
version: 'v0',
hostId: document.location.host,
root: '/',
CORSWithCredentials: true,
postParameters: '',
templateSourceURL: '//demo.nemo.travel/frontendStatic/html/wurst.petriktour/v0/ru/',
i18nURL: '//demo.nemo.travel/frontendStatic/i18n/wurst.petriktour/v0',
i18nLanguage: 'ru',
componentsAdditionalInfo: {
	'Flights/SearchForm/Controller': {
		formData: { "guide": { "countries": { "RU": { "code": "RU", "name": "Россия", "nameEn": "Russia" } }, "cities": { "58194": { "IATA": "RTW", "name": "Саратов", "nameEn": "Saratov", "countryCode": "RU", "id": 58194 } }, "airports": { "RTW": { "IATA": "RTW", "cityId": 58194, "isAggregation": false, "airportRating": "29053", "baseType": "airport", "properNameEn": null, "properName": null, "name": "Саратов", "nameEn": "Saratov", "countryCode": "RU" } } }, "flights": { "search": { "request": { "segments": [ { "departure": { "IATA": "RTW", "isCity": true, "cityId": 58194 }, "arrival": null } ], "passengers": [ { "type": "ADT", "count": 1 } ], "parameters": { "searchType": "OW", "direct": false, "aroundDates": 0, "serviceClass": "All", "flightNumbers": [], "airlines": [], "delayed": false, "priceRefundType": null } }, "formData": { "maxLimits": { "passengerCount": { "ADT": "6", "SRC": "6", "YTH": "6", "CLD": "4", "INF": "2", "INS": "2" }, "totalPassengers": "9", "flightSegments": "5" }, "dateOptions": { "minOffset": 2, "maxOffset": 365, "aroundDatesValues": [ 1, 2, 3 ] }, "showCitySwapBtn": true, "scheduleSearchEnable": false, "onFocusAutocomplete": false, "forceAggregationAirports": false, "searchWithoutAdults": false, "hideDirectOnlyCheckbox": false, "highlightDates": false, "disableUnavailableDate": false, "passengersSelect": { "extendedPassengersSelect": false, "passengersSelectAlt": true, "tripType": "select", "fastPassengersSelect": [ { "label": "singleAdult", "set": { "ADT": 1 } }, { "label": "twoAdults", "set": { "ADT": 2 } }, { "label": "twoAdultsWithChild", "set": { "ADT": 2, "CLD": 1 } } ] } } } }, "system": { "info": { "response": { "timestamp": 1571225031.879, "responseTime": 0.0075910091400146 }, "user": { "userID": 61107, "agencyID": 61105, "status": "guest", "isB2B": false, "settings": { "currentLanguage": "ru", "currentCurrency": "RUB", "agencyCurrency": "RUB", "agencyCountry": "RU", "googleMapsApiKey": "AIzaSyB-8D4iRGP1qgLShbdbqIYm-3spSP-bA_w", "googleMapsClientId": "", "showFullFlightsResults": "false" } } } } }
	}
}
...
```
