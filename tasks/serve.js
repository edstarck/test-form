"use strict";

var gulp         = require('gulp');
var browserSync  = require('browser-sync').create();

module.exports = function(options) {
  return function() {
    browserSync.init({
      server: options.src,
      notify: false
    });
    browserSync.watch('build/**/*.*').on('change', browserSync.reload);
  };

};