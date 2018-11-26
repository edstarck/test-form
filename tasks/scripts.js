'use strict';

var gulp = require('gulp');
var concat = require('gulp-concat');
var minify = require('gulp-minify');

// Запуск production NODE_ENV=production gulp styles. По умолчанию development
var isDevelopment =
  !process.env.NODE_ENV || process.env.NODE_ENV == 'development';

module.exports = function(options) {
  return function() {
    return gulp
      .src(options.src)
      .pipe(concat('common.js'))
      .pipe(gulp.dest(options.dst));
  };
};
