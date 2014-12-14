
var releaseName = 'canvasfw';

var unminifiedFileName = releaseName + '.js';
var minifiedFileName = releaseName + '.min.js';

var sourceFiles = './src/*.js';
var testFiles = './test/*.test.js';
var testHelperFiles = './test/helpers/*.js';
var imageFiles = './test/assets/*.png';
var unminifiedFile = './build/' + unminifiedFileName;
var minifiedFile = './build/' + minifiedFileName;

var imageLoader = 'bower_components/ImageLoader/build/imageLoader.min.js';

var gulp = require('gulp');
var changed = require('gulp-changed');
var concat = require('gulp-concat');
var stripDebug = require('gulp-strip-debug');
var uglify = require('gulp-uglify');
var connect = require('gulp-connect');
var karma = require('gulp-karma');
var connect = require('gulp-connect');

var karmaSingleRunOptions = { configFile: 'karma.conf.js', action: 'run' };

gulp.task('build', function() {

    gulp.src([sourceFiles])
		.pipe(concat(minifiedFileName))
		.pipe(stripDebug())
		.pipe(uglify())
		.pipe(gulp.dest('./build/'));

	gulp.src([sourceFiles])
		.pipe(concat(unminifiedFileName))
		.pipe(stripDebug())
		.pipe(gulp.dest('./build/'));
});

gulp.task('server:start', function() {
    connect.server({port: 8080});
});

gulp.task('test', function() {

    connect.server({port: 8080});

    return gulp.src([sourceFiles, testHelperFiles, testFiles, imageLoader])
        .pipe(karma(karmaSingleRunOptions))
        .on('end', function () {
            connect.serverClose();
        })
        .on('error', function (err) {
            throw err;
        });
});

gulp.task('test-unminified', function() {

});

gulp.task('test-minified', function() {

});

gulp.task('default', ['scripts'], function() {

});