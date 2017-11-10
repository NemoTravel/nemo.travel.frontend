<p align="center">
    <img width="200" src="http://mjolnir.com.ua/kcfinder/upload/images/logo.jpg">
</p>

# Nemo Search Widget
Nemo Search Widget &mdash; виджет, встраиваемый на сайт и позволяющий совершать поиск авиабилетов с использованием системы бронирования [Nemo.Travel](http://www.nemo.travel/).

## Установка виджета
Ниже приведены способы инициализации виджета, при которых файлы виджета загружаются напрямую с домена привязанного к Nemo. 
Это значит, что **нет необходимости скачивать содержимое данного репозитория** и **нет возможности редактировать файлы виджета**.
Данный вариант установки наиболее простой и наименее гибкий.

О том, как ускорить виджет и как редактировать его содержимое, читайте ниже.

### Без использования PHP
Пример минимальной конфигурации, без использования PHP: [example.html](https://github.com/NemoTravel/nemo.travel.frontend/blob/master/example.html)

### С использованием PHP
**Важно**: 
* в коде ниже, необходимо заменить `КОД_ЯЗЫКА` на двузначный код языка, который будет использован в качестве основного языка виджета, например, `ru`
* в коде ниже, необходимо заменить `ДОМЕН_ПРИВЯЗАННЫЙ_К_НЕМО` доменным именем c (`http(s)://` префиксом), к которому привязано ваше агентство в Nemo, например, `http://demo.nemo.travel`
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
$bundleURL = $nemoURL . '/templates/wurst/dist/nemo-search-' . $language . '.js';
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
<script src="<?php echo $widgetPartsURL; ?>/js/lib/fotorama/fotorama.min.js"></script>
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
            root: '/',
            i18nLanguage: 'en',
            CORSWithCredentials: true,
            componentsAdditionalInfo: {
                'Flights/SearchForm/Controller': { 
                    forceSelfHostNavigation: true // `true` - для отображения результатов поиска авиабилетов на том же домене; `false` - для редиректа на домен связанный с Nemo.
                },
                'Hotels/SearchForm/Controller': {
                    forceSelfHostNavigation: true // `true` - для отображения результатов поиска отелей на том же домене; `false` - для редиректа на домен связанный с Nemo.
                }
            }
        });
    });
</script>

```
