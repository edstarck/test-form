'use strict';

var gulp = require('gulp');
var plumber = require('gulp-plumber');
var notify = require('gulp-notify');
var debug = require('gulp-debug');
var gulpif = require('gulp-if');
var sourcemaps = require('gulp-sourcemaps');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var rename = require('gulp-rename');
var csso = require('gulp-csso');

// Запуск production NODE_ENV=production gulp styles. По умолчанию development
var isDevelopment =
  !process.env.NODE_ENV || process.env.NODE_ENV == 'development';

module.exports = function(options) {
  return function() {
    return gulp
      .src(options.src)
      .pipe(
        plumber({
          errorHandler: notify.onError(function(err) {
            return {
              title: 'pug',
              message: err.message,
            };
          }),
        })
      )
      .pipe(
        sass({
          includePaths: require('node-bourbon').includePaths,
        })
      )
      .pipe(rename({ suffix: '.min', prefix: '' }))
      .pipe(autoprefixer({ browsers: ['last 2 version', '> 5%'] }))
      .pipe(csso())
      .pipe(gulp.dest(options.dst));
  };
};
