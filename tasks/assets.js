"use strict";

var gulp  = require('gulp');
var debug = require('gulp-debug');
var newer = require('gulp-newer');

module.exports = function(options) {
  return function() {
    return gulp.src(options.src)
      .pipe(newer(options.dst))
      .pipe(gulp.dest(options.dst));
  };
};
