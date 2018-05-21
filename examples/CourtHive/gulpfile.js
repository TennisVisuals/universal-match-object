var gulp = require('gulp');
var babel = require("gulp-babel");
var htmlmin = require('gulp-htmlmin');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var minify = require('gulp-minify');
var header = require('gulp-header');
var concat = require('gulp-concat-util');
var compress = require('gulp-minify-css');
var exec = require('child_process').exec;

const wbBuild = require('workbox-build');

var banner = "// CourtHive Mobile\n";

let pkg = {
   source: 'source',
   min: 'minimized',
   destination: '/Users/charlesallen/Development/node/CourtHive/app/static/mobile',
}

gulp.task('compress-css', function() {
	return gulp.src(['css/*.css'])
		.pipe(compress())
		.pipe(rename({ suffix: '.min' }))
		.pipe(gulp.dest(pkg.min));
});

gulp.task('concat-css', function() {
	return gulp.src([ 'minimized/*.css', ])
      .pipe(concat('style.css'))
		.pipe(header(banner))
		.pipe(gulp.dest(pkg.destination + '/css'));
});

gulp.task('concat-js', function() {
	return gulp.src([ 
         './minimized/d3.v4.min.js',
         './minimized/awesomplete.min.js',
         './minimized/clipboard.min.js',
         './minimized/socket.io.min.1.7.2.js',

         './ugly/aip.min.js',
         './ugly/matchObject.min.js',
         './ugly/pulseCircle.min.js',
         './ugly/UUID.min.js',
         './ugly/browserStorage.min.js',
         './ugly/simpleChart.min.js',
         './ugly/touchManager.min.js',
         './ugly/SwipeList.min.js',
         './ugly/gameFish.min.js',
         './ugly/gameTree.min.js',
         './ugly/ptsChart.min.js',
      ])
      .pipe(concat('lib_bundle.js'))
		.pipe(gulp.dest(pkg.destination + '/lib'));
});

gulp.task('ugly-src', function() {
	return gulp.src([ 'src/courtHive.js', ])
      .pipe(babel())
      .pipe(uglify())
      .pipe(rename({ suffix: '.min' }))
		.pipe(gulp.dest('./ugly'));
});

gulp.task('copy-manifest', function() {
   return gulp.src(['./*.manifest', 'manifest.json'])
      .pipe(gulp.dest(pkg.destination));
});

gulp.task('copy-icons', function() {
   return gulp.src(['./icons/*'])
      .pipe(gulp.dest(pkg.destination + '/icons'));
});

gulp.task('copy-assets', function() {
   return gulp.src(['./assets/*'])
      .pipe(gulp.dest(pkg.destination + '/assets'));
});

gulp.task('copy-icons', function() {
   return gulp.src(['./icons/*'])
      .pipe(gulp.dest(pkg.destination + '/icons'));
});

gulp.task('compress-html', function() {
  return gulp.src('production.html')
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(rename('index.html'))
    .pipe(gulp.dest(pkg.destination));
});

gulp.task('copy-src', function() {
	return gulp.src([
         'ugly/courtHive.min.js',
      ])
		.pipe(header(banner))
		.pipe(gulp.dest(pkg.destination));
});

gulp.task('bundle-sw', () => {
  return wbBuild.generateSW({
    globDirectory: '/Users/charlesallen/Development/node/CourtHive/app/static/mobile/',
    swDest: '/Users/charlesallen/Development/node/CourtHive/app/static/mobile/sw.js',
    globPatterns: ['**\/*.{html,js,css,png,mp3,json}'],
    globIgnores: ['admin.html'],
  })
  .then(() => {
    console.log('Service worker generated.');
  })
  .catch((err) => {
    console.log('[ERROR] This happened: ' + err);
  });
})

gulp.task('copy-external', gulp.parallel('copy-assets', 'copy-icons'));
gulp.task('copy', gulp.series('concat-js', 'copy-external'));
gulp.task('css', gulp.series('compress-css', 'concat-css'));
gulp.task('js', gulp.series('ugly-src', 'copy-src'));
gulp.task('code', gulp.parallel('copy-manifest', 'js'));
gulp.task('html', gulp.parallel('compress-html', 'css'));

gulp.task('build', gulp.parallel('code', gulp.parallel('html', 'copy')));
gulp.task('default', gulp.series('build', 'bundle-sw'));
