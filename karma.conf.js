module.exports = function(config) {
    config.set({
        files: [
        ],
        exclude: [
        ],
        preprocessors: {
        },
        plugins: [
            "karma-js-coverage",
            "karma-jasmine",
            "karma-chrome-launcher"
        ],
        frameworks: [
            "jasmine"
        ],
        reporters: [
            "progress",
            "coverage"
        ],
        coverageReporter: {
            type : "html",
            dir: 'coverage/'
        },
        browsers: ["Chrome"],
        proxies: {
            '/assets/': 'http://localhost:8080/test/assets/'
        },
        port: 9876,
        runnerPort: 9100,
        reportSlowerThan: 500,
        captureTimeout: 30000,
        colors: true,
        autoWatch: false,
        singleRun: true,
        logLevel: config.LOG_INFO
    });
};
