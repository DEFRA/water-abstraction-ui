const gulp = require('gulp')
const sass = require('gulp-sass')
const sourcemaps = require('gulp-sourcemaps');

const paths = {
  assetPath: 'public/'
}

// Copy files
gulp.task('copy-govuk-template', () => {
  //copy govuk template images and javascript to public
  gulp
    .src('node_modules/govuk_frontend_toolkit/{images/**/*.*,javascripts/**/*.*}')
    .pipe(gulp.dest(paths.assetPath))
})

gulp.task('copy-govuk-template-mustache', () => {
  //copy images and javascript to public
  gulp
    .src('node_modules/govuk_template_mustache/assets/{images/**/*.*,javascripts/**/*.*,stylesheets/**/*.*}')
    .pipe(gulp.dest(paths.assetPath+'govuk_template/'))
})

gulp.task('copy-static-assets', () => {
  //copy images and javascript to public
  gulp
    .src('src/public/{images/**/*.*,javascripts/**/*.*,stylesheets/**/*.*,data/**/*.*}')
    .pipe(gulp.dest(paths.assetPath))
})

gulp.task('copy-govuk-template-mustache-views', () => {
  gulp
    .src('node_modules/govuk_template_mustache/views/**/*.*')
    .pipe(gulp.dest('views/govuk_template_mustache'))
})

// Compile our scss files



gulp.task('sass', () => {
  return gulp.src('src/sass/**/*.scss')
    .pipe(sass({
      includePaths: [
        'node_modules/govuk_frontend_toolkit/stylesheets', // 1
        'node_modules/govuk-elements-sass/public/sass'     // 2
      ]
    }).on('error', sass.logError))
    .pipe(sass().on('error', sass.logError))
    .pipe(sourcemaps.write())

    .pipe(gulp.dest(paths.assetPath + 'stylesheets'));
})

gulp.task('copy-files', [], () => {
  gulp.run(['copy-govuk-template', 'copy-govuk-template-mustache', 'copy-govuk-template-mustache-views','copy-static-assets'])
})

// Default task
gulp.task('default', [], () => {
  gulp.run(['sass', 'copy-files'])
})
