var gulp = require('gulp');
var htmlmin = require('gulp-htmlmin');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var minify = require('gulp-minify');
var header = require('gulp-header');
var concat = require('gulp-concat-util');
var compress = require('gulp-minify-css');
var exec = require('child_process').exec;

var banner = "// CourtHive Scores\n";

let pkg = {
   min: 'minimized',
   name: 'scores',
   destination: '/Users/charlesallen/Development/node/CourtHive/app/static/scores',
}

gulp.task('uglify', function() {
	return gulp.src(['scores.js'])
		.pipe(uglify())
		.pipe(rename({ suffix: '.min' }))
		.pipe(gulp.dest(pkg.min));
});

gulp.task('compress-css', function() {
	return gulp.src(['css/scores.css'])
		.pipe(compress())
		.pipe(rename({ suffix: '.min' }))
		.pipe(gulp.dest(pkg.destination + '/css'));
});

gulp.task('concat', function() {
	return gulp.src([ 'minimized/*.js', ])
      .pipe(concat(pkg.name + '.lib.js'))
		.pipe(header(banner))
		.pipe(gulp.dest(pkg.destination));
});

gulp.task('compress-html', function() {
  return gulp.src('production.html')
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(rename('index.html'))
    .pipe(gulp.dest(pkg.destination));
});

gulp.task('code', gulp.series('uglify', 'concat'));
gulp.task('html', gulp.parallel('compress-css', 'compress-html'));

gulp.task('default', gulp.parallel('code', 'html'));
