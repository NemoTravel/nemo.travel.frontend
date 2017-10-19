var gulp = require('gulp'),
    cache = require('./gulp-cache'),
	requirejs = require('requirejs'),
//	buildConfig = require('build.config');
	webpackStream = require('webpack-stream'),
	webpackInstance = require('webpack'),
	getWebpackConfig = require('./webpack-config');

gulp.task('default', ['cache']);

var options = {
    readFiles: ['./html/partials/*.html', './i18n/**/*.json'],
    outputFileName: '__cache.js',
    outputDirectory: './js/vm/Common/Cache',
    removeFromPath: __dirname
};

// generates js file and put into js object contained all translations and views
gulp.task('cache', function () {
    gulp.src(options.readFiles)
        .pipe(cache(options.outputFileName, options.removeFromPath))
        .pipe(gulp.dest(options.outputDirectory));
});

// generates empty cache file
gulp.task('cache:empty', function () {
    gulp.src([])
        .pipe(cache(options.outputFileName, options.removeFromPath))
        .pipe(gulp.dest(options.outputDirectory));
});

gulp.task('watch', function () {
    gulp.watch(options.readFiles, ['cache']);
});


gulp.task('build', function () {
	console.log('hello!');
	const config = {
		"baseUrl": "./",
		"paths": {
			"domReady":      "js/lib/requirejs/domReady",
			"text":          "js/lib/requirejs/text",
			"knockout":      "js/lib/knockout/v.3.2.0/knockout-3.2.0",
			"AppController": "js/NemoFrontEndController",
			"jquery":        "js/lib/jquery/v.2.1.3/jquery-2.1.3",
			"jqueryUI":      "js/lib/jqueryUI/v.1.11.4/jquery-ui",
			"jsCookie":      "js/lib/js.cookie/v.2.0.0/js.cookie",
			"tooltipster":   "js/lib/tooltipster/jquery.tooltipster.min",
			"numeralJS":     "js/lib/numeral.js/v.1.5.3/numeral.min",
			"mousewheel":    "js/lib/jquery.mousewheel/jquery.mousewheel.min",
			"touchpunch":    "js/lib/jquery.ui.touch-punch/v.0.2.3/jquery.ui.touch-punch.min",
			"html/FlightsSearchForm": "html/FlightsSearchForm.html"
		},
		"deps": [
			"js/vm/BaseDynamicModel",
			"js/vm/BaseStaticModel",
			"js/vm/BaseI18nizedModel",
			"js/vm/BaseControllerModel",
			"js/bindings/common",
			"js/vm/Flights/Common/Airline",
			"js/lib/jquery.pickmeup/jquery.pickmeup",
			"js/bindings/FlightsSearchForm",
			"js/vm/mobileDetect",
			"js/lib/jquery.chosen/v.1.4.2/chosen.jquery.min",
			"js/lib/mobile.detect.js/mobileDetect",
			"js/vm/Flights/SearchForm/Controller",
			"js/vm/Flights/SearchForm/Segment",
			"js/vm/Common/Date",
			"js/vm/Flights/Common/Geo",

			"domReady",
			"knockout",
			"AppController",
			"jquery",
			"jqueryUI",
			"jsCookie",
			"numeralJS",
			"mousewheel",
			"touchpunch",
		],

		"inlineText": true,
		"optimize": "uglify2",
		"name": "AppController",
		"out": "./dist/nemo-search.js",
		"preserveLicenseComments": false,
		"generateSourceMaps": false
	};
	requirejs.optimize(config);
});