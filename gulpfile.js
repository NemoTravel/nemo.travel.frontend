var gulp = require('gulp'),
    cache = require('./gulp-cache'),
	builder = require("./builder");

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
	return new builder();
});