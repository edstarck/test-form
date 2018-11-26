'use strict';

const gulp = require('gulp');
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const pug = require('gulp-pug');
const debug = require('gulp-debug');
const gulpif = require('gulp-if');
const pugInheritance = require('yellfy-pug-inheritance');
const emitty = require('emitty').setup('app', 'pug');

var pugInheritanceCache = {};

function lazyRequireTask(taskName, path, options) {
  options = options || {};
  options.taskName = taskName;
  gulp.task(taskName, function(callback) {
    let task = require(path).call(this, options);
    return task(callback);
  });
}

gulp.task(
  'templates',
  () =>
    new Promise((resolve, reject) => {
      emitty.scan(global.emittyChangedFile).then(() => {
        gulp
          .src('app/pug/pages/*.pug')
          .pipe(gulpif(global.watch, emitty.filter(global.emittyChangedFile)))
          .pipe(debug({ title: 'Template:' }))
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
          .pipe(pug({ pretty: true }))
          .pipe(gulp.dest('build'))
          .on('end', resolve)
          .on('error', reject);
      });
    })
);

lazyRequireTask('styles', './tasks/styles', {
  src: 'app/sass/main.scss',
  dst: 'build/css/',
});

lazyRequireTask('scripts', './tasks/scripts', {
  src: ['app/blocks/**/*.js', 'app/assets/scripts/**/*.js'],
  dst: 'build/js/',
});

lazyRequireTask('sprite', './tasks/sprite', {
  src: 'app/icons/*.svg',
  dst: 'build/icons/',
});

lazyRequireTask('vendor_styles', './tasks/vendor_styles', {
  src: [
    'app/vendor/css/normalize.css',
    'app/vendor/css/flatpickr.min.css',
    'app/vendor/css/flatpickr_theme.css',
  ],
  dst: 'build/css',
});

lazyRequireTask('vendor_scripts', './tasks/vendor_scripts', {
  src: [
    'app/vendor/js/moment.js',
    'app/vendor/js/imask.js',
    'app/vendor/js/validate.min.js',
    'app/vendor/js/flatpickr.js',
    'app/vendor/js/flatpickr_ru.js',
  ],
  dst: 'build/js/',
});

lazyRequireTask('clean', './tasks/clean', {
  dst: 'build/',
});

lazyRequireTask('assets', './tasks/assets', {
  src: 'app/assets/**/*.*',
  dst: 'build',
});

lazyRequireTask('serve', './tasks/serve', {
  src: 'build/',
});

gulp.task(
  'build',
  gulp.series(
    'clean',
    gulp.parallel(
      'templates',
      'styles',
      'scripts',
      'sprite',
      'vendor_scripts',
      'vendor_styles',
      'assets'
    )
  )
);

gulp.task(
  'default',
  gulp.series([
    'templates',
    'styles',
    'scripts',
    'sprite',
    'vendor_scripts',
    'vendor_styles',
    'assets',
  ])
);
gulp.task('ss', gulp.parallel(['styles', 'scripts', 'vendor_scripts']));

gulp.task('watch', () => {
  // Shows that run "watch" mode
  global.watch = true;
  gulp
    .watch('app/**/*.pug', gulp.series('templates'))
    .on('all', (event, filepath) => {
      global.emittyChangedFile = filepath;
    });
  gulp.watch('app/**/*.scss', gulp.series('styles'));
  gulp.watch('app/assets/**/*.*', gulp.series('assets'));
  gulp.watch(
    ['app/blocks/**/*.js', 'app/assets/scripts/**/*.js'],
    gulp.series('scripts')
  );
  gulp.watch('app/icons/*.svg', gulp.series('sprite'));
});

gulp.task('dev', gulp.series('build', gulp.parallel('watch', 'serve')));
