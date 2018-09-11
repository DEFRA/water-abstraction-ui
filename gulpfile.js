const gulp = require('gulp');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const standard = require('gulp-standard');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const runSequence = require('gulp-run-sequence');
const del = require('del');

const paths = {
  public: 'public/',
  govukModules: 'govuk_modules/'
};

gulp.task('clean', () => del([paths.public, paths.govukModules]));

// Copy govuk files
gulp.task('copy-govuk-toolkit', () => {
  return gulp.src(['node_modules/govuk_frontend_toolkit/**/*.*'])
    .pipe(gulp.dest(paths.govukModules + 'govuk_frontend_toolkit/'));
});

gulp.task('copy-govuk-template', () => {
  return gulp.src(['node_modules/govuk_template_mustache/**/*.*'])
    .pipe(gulp.dest(paths.govukModules + 'govuk_template_mustache/'));
});

gulp.task('copy-govuk-elements-sass', () => {
  return gulp.src(['node_modules/govuk-elements-sass/public/sass/**'])
    .pipe(gulp.dest(paths.govukModules + '/govuk-elements-sass/'));
});

gulp.task('copy-govuk-files', done => runSequence(
  'copy-govuk-toolkit',
  'copy-govuk-template',
  'copy-govuk-elements-sass',
  done
));

// Install the govuk files into our application

gulp.task('copy-template-assets', () => {
  return gulp
    .src(paths.govukModules + '/govuk_template_mustache/assets/{images/**/*.*,javascripts/**/*.*,stylesheets/**/*.*}')
    .pipe(gulp.dest(paths.public));
});

gulp.task('copy-frontend-toolkit-assets', () => {
  return gulp
    .src(paths.govukModules + '/govuk_frontend_toolkit/{images/**/*.*,javascripts/**/*.*}')
    .pipe(gulp.dest(paths.public));
});

gulp.task('copy-template-view', () => {
  return gulp
    .src('node_modules/govuk_template_mustache/views/**/*.*')
    .pipe(gulp.dest('views/govuk_template_mustache'));
});

gulp.task('install-govuk-files', done => runSequence(
  'copy-template-assets',
  'copy-template-view',
  'copy-frontend-toolkit-assets',
  done
));

gulp.task('combine-minify-js', () => {
  // All JS files that are required by front end in order
  const files = [
    './public/javascripts/vendor/polyfills/bind.js',
    './public/javascripts/govuk/shim-links-with-button-role.js',
    './public/javascripts/govuk/show-hide-content.js',
    './src/public/javascripts/govuk/details.polyfill.js',
    './src/public/javascripts/application.js'
  ];

  return gulp.src(files)
    .pipe(concat('application.all.min.js'))
    .pipe(uglify({ ie8: true }))
    .pipe(gulp.dest('./public/javascripts'));
});

gulp.task('copy-static-assets-orig', () => {
  // copy images and javascript to public
  return gulp
    .src('src/public/{images/**/*.*,javascripts/**/*.*,stylesheets/**/*.*,data/**/*.*}')
    .pipe(gulp.dest(paths.public));
});

gulp.task('copy-static-assets', done => runSequence(
  'copy-static-assets-orig',
  'combine-minify-js',
  done
));

// Build the sass-proto
gulp.task('sass', () => {
  return gulp.src('src/assets/sass/**/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'expanded',
      includePaths: [
        'govuk_modules/govuk_frontend_toolkit/stylesheets',
        'govuk_modules/govuk_template_mustache/assets/stylesheets',
        'govuk_modules/govuk-elements-sass',
        'govuk_modules/govuk-elements-sass/public/sass',
        'govuk_modules'
      ]
    }).on('error', sass.logError))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.public + 'stylesheets/'));
});

gulp.task('sass:watch', () => {
  return gulp.watch('src/assets/sass/**/*.scss', ['sass']);
});

// Run StardardJS checks
gulp.task('standard', () => {
  return gulp.src(['src/**/*.js'])
    .pipe(standard())
    .pipe(standard.reporter('default', {
      breakOnError: true,
      quiet: true
    }));
});

// Build task
gulp.task('build', done => runSequence(
  'clean',
  'copy-govuk-files',
  'install-govuk-files',
  'copy-static-assets',
  'sass',
  done
));

// Default task
gulp.task('default', ['build']);
