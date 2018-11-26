'use strict';

var gulp = require('gulp');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var csso = require('gulp-csso');

module.exports = function(options) {
  return function() {
    return gulp
      .src(options.src)
      .pipe(concat('vendor.css'))
      .pipe(csso())
      .pipe(rename({ suffix: '.min', prefix: '' }))
      .pipe(gulp.dest(options.dst));
  };
};
