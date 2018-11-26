"use strict";

var gulp      = require('gulp');
var svgSprite = require('gulp-svg-sprites');

module.exports = function(options) {
  return function() {
    return gulp.src(options.src)
      .pipe(svgSprite({
        mode: "symbols",
        preview: false,
        svg: {
          symbols: "icons.svg"
        }
      }))
      .pipe(gulp.dest(options.dst));
  };

};