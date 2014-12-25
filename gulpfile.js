
var releaseName = 'canvasfw';

var unminifiedFileName = releaseName + '.js';
var minifiedFileName = releaseName + '.min.js';

var mainSourceFile = './src/canvasfw.js';
var sourceFiles = './src/*.js';
var testFiles = './test/*.test.js';
var testHelperFiles = './test/helpers/*.js';
var imageFiles = './test/assets/*.png';
var buildFolder = './build/';

var imageLoader = './bower_components/ImageLoader/build/imageloader.min.js';

var gulp = require('gulp');
var glob = require('glob');
var stripDebug = require('gulp-strip-debug');
var uglify = require('gulp-uglify');
var karma = require('gulp-karma');
var connect = require('gulp-connect');
var browserify = require('browserify');
var istanbul = require('browserify-istanbul');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');



var karmaSingleRunOptions = { configFile: 'karma.conf.js', action: 'run' };

gulp.task('build', function() {

    // build minified filename
    browserify(mainSourceFile)
        .bundle()
        // Pass desired output filename to vinyl-source-stream
        .pipe(source(minifiedFileName))
        // Convert streaming vinyl files to use buffers
        .pipe(buffer())
        .pipe(stripDebug())
        .pipe(uglify())
        // Start piping stream to tasks!
        .pipe(gulp.dest(buildFolder));

    // build unminified file
    browserify(mainSourceFile)
        .bundle()
        .pipe(source(unminifiedFileName))
        .pipe(buffer())
        .pipe(stripDebug())
        .pipe(gulp.dest(buildFolder));
});

gulp.task('server:start', function() {
    connect.server({port: 8080});
});

gulp.task('test', function() {

    var browserifyOptions = {
        entries: [
            './src/canvasfw.js',
            imageLoader,
            glob.sync('./test/helpers/*.js'),
            glob.sync('./test/*.js')
        ],
        debug: true,
        insertGlobals: true
    };

    var istanbulOptions = {
        ignore: [
            "**/bower_components/**",
            "**/node_modules/**",
            "**/test/**",
            "**/tests/**"
        ],
        defaultIgnore: false
    };

    var karmaOptions = {
        configFile: './karma.conf.js',
        action: "run"
    };

    connect.server({port: 8080});

    return browserify(browserifyOptions)
        .transform(istanbul(istanbulOptions))
        .bundle()
        .pipe(source('testbundle.js'))
        .pipe(buffer())
        .pipe(gulp.dest('./coverage'))
        .pipe(karma(karmaOptions))
        .on('end', function () {
            connect.serverClose();
        });
});

gulp.task('default', ['scripts'], function() {

});
