
var releaseName = 'canvasfw';

var unminifiedFileName = releaseName + '.js';
var minifiedFileName = releaseName + '.min.js';

var sourceFiles = './src/*.js';
var testFiles = './test/*.test.js';
var imageFiles = './test/assets/*.png';
var unminifiedFile = './build/' + unminifiedFileName;
var minifiedFile = './build/' + minifiedFileName;

var gulp = require('gulp');
var changed = require('gulp-changed');
var concat = require('gulp-concat');
var stripDebug = require('gulp-strip-debug');
var uglify = require('gulp-uglify');
var connect = require('gulp-connect');

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


gulp.task('test', function() {

});

gulp.task('test-unminified', function() {

});

gulp.task('test-minified', function() {

});

gulp.task('default', ['scripts'], function() {

});