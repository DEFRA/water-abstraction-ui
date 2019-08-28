const gulp = require('gulp');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
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

gulp.task('copy-govuk-files', gulp.series(
  'copy-govuk-toolkit',
  'copy-govuk-template',
  'copy-govuk-elements-sass',
  done => done()
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

gulp.task('install-govuk-files', gulp.series(
  'copy-template-assets',
  'copy-frontend-toolkit-assets',
  done => done()
));

const combineMinifyJs = (files, destination) => {
  return gulp.src(files)
    .pipe(concat(destination))
    .pipe(uglify({ ie8: true }))
    .pipe(gulp.dest('./public/javascripts'));
};

gulp.task('combine-minify-js', () => {
  // All JS files that are required by front end in order
  const files = [
    './public/javascripts/vendor/polyfills/bind.js',
    './public/javascripts/govuk/shim-links-with-button-role.js',
    './public/javascripts/govuk/show-hide-content.js',
    './src/shared/public/javascripts/govuk/details.polyfill.js',
    './src/shared/public/javascripts/application.js',
    './node_modules/iframe-resizer/js/iframeResizer.min.js'
  ];

  return combineMinifyJs(files, 'application.all.min.js');
});

gulp.task('combine-minify-js-nunjucks', () => {
  // All JS files that are required by front end in order
  const files = [
    './node_modules/govuk-frontend/all.js',
    './node_modules/iframe-resizer/js/iframeResizer.min.js',
    './src/shared/public/javascripts/jquery-3.3.1.min.js',
    './src/shared/public/javascripts/abstraction-reform.js',
    './src/shared/public/javascripts/v2/json-forms-toggle.js',
    './src/shared/public/javascripts/v2/abstraction-reform.js',
    './src/shared/public/javascripts/v2/clickable-rows.js',
    './src/shared/public/javascripts/v2/toggle-visibility.js',
    './src/shared/public/javascripts/v2/back-link.js'
  ];

  return combineMinifyJs(files, 'application-v2.all.min.js');
});

gulp.task('copy-static-assets-orig', () => {
  // copy images and javascript to public
  return gulp
    .src('src/shared/public/{images/**/*.*,javascripts/**/*.*,stylesheets/**/*.*,data/**/*.*}')
    .pipe(gulp.dest(paths.public));
});

/**
 * Copies assets from the sources to the public/javascripts folder.
 *
 * These assets are not combined with other scripts to allow some scripts
 * to be used in one page without the application.js having to increase for
 * all pages.
 */
gulp.task('copy-static-javascript', () => {
  return gulp
    .src([
      'node_modules/accessible-autocomplete/dist/accessible-autocomplete.min.js'
    ])
    .pipe(gulp.dest(paths.public + '/javascripts'));
});

/**
 * Copies assets from the sources to the public/stylesheets folder.
 *
 * These assets are not combined with other stylesheers to allow some stylesheers
 * to be used in one page without the application.css having to increase for
 * all pages.
 */
gulp.task('copy-static-styles', () => {
  return gulp
    .src([
      'node_modules/accessible-autocomplete/dist/accessible-autocomplete.min.css'
    ])
    .pipe(gulp.dest(paths.public + '/stylesheets'));
});

gulp.task('copy-static-assets', gulp.series(
  'copy-static-assets-orig',
  'combine-minify-js',
  'combine-minify-js-nunjucks',
  'copy-static-javascript',
  'copy-static-styles',
  done => done()
));

// Build the sass-proto
gulp.task('sass', () => {
  return gulp.src('src/shared/assets/sass/**/*.scss')
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'expanded',
      includePaths: [
        'govuk_modules/govuk_frontend_toolkit/stylesheets',
        'govuk_modules/govuk_template_mustache/assets/stylesheets',
        'govuk_modules/govuk-elements-sass',
        'govuk_modules/govuk-elements-sass/public/sass',
        'govuk_modules',
        'node_modules'
      ]
    }).on('error', sass.logError))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.public + 'stylesheets/'));
});

gulp.task('sass:watch', () => {
  return gulp.watch('src/shared/assets/sass/**/*.scss', gulp.series('sass'));
});

// Build task
gulp.task('build', gulp.series(
  'clean',
  'copy-govuk-files',
  'install-govuk-files',
  'copy-static-assets',
  'sass',
  done => done()
));

// Default task
gulp.task('default', gulp.series('build'));
