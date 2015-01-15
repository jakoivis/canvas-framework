
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
var util = require('gulp-util');

var releaseName = 'canvasfw';

var unminifiedFileName = releaseName + '.js';
var minifiedFileName = releaseName + '.min.js';

var mainSourceFile = './src/canvasfw.js';
var sourceFiles = './src/*.js';
var testFiles = './test/*.test.js';
var testHelperFiles = './test/helpers/*.js';
var exampleFiles = './examples/**/*.html';
var imageFiles = './test/assets/*.png';

var buildFolder = './build/';
var coverageFolder = './coverage/';

var imageLoader = './bower_components/ImageLoader/build/imageloader.min.js';

var karmaOptions = { configFile: './karma.conf.js', action: 'run' };
var istanbulOptions = {
    ignore: [
        "**/bower_components/**",
        "**/node_modules/**",
        "**/test/**",
        "**/tests/**"
    ],
    defaultIgnore: false
};
var browserifyTestOptions = {
    entries: [
        mainSourceFile,
        imageLoader,
        glob.sync(testHelperFiles),
        glob.sync(testFiles)
    ],
    debug: true,
    insertGlobals: true
};

var isLiveReloading = false;

gulp.task('startLiveServer', function() {
    isLiveReloading = true;
    connect.server({port: 8080, livereload: true});
});

gulp.task('startSingleRunServer', function() {
    if(!isLiveReloading) {
        connect.server({port: 8080, livereload: false});
    }
});

function serverStop() {
    if(!isLiveReloading) {
        connect.serverClose();
    }
}

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
        .pipe(gulp.dest(buildFolder))
        .pipe(connect.reload());
});

gulp.task('test', ['startSingleRunServer'], function() {

    return browserify(browserifyTestOptions)
        .transform(istanbul(istanbulOptions))
        .bundle()
        .pipe(source('testbundle.js'))
        .pipe(buffer())
        .pipe(gulp.dest(coverageFolder))
        .pipe(karma(karmaOptions))
        .on('end', function() {
            serverStop();
        })
        .on('error', function() {
            serverStop();
        })
});

gulp.task('watch', ['startLiveServer'], function() {

    gulp.watch(sourceFiles, ['test', 'build']);

    gulp.watch([testFiles, testHelperFiles], ['test']);

    gulp.watch(exampleFiles, function(event) {
        return gulp.src(event.path)
            .pipe(connect.reload());
    });
});