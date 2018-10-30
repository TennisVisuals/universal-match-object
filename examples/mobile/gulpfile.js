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

gulp.task('compress-css', ['concat-css'], function() {
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

gulp.task('copy-lib', 
   ['copy-assets', 'copy-icons'],
   function() {
      return gulp.src([ 
            '../components/minimized/d3.v4.min.js',
            '../components/minimized/awesomplete.min.js',
            '../components/minimized/clipboard.min.js',
            '../components/minimized/socket.io.min.1.7.2.js',

            '../components/ugly/aip.min.js',
            '../components/ugly/matchObject.min.js',
            '../components/ugly/pulseCircle.min.js',
            '../components/ugly/UUID.min.js',
            '../components/ugly/browserStorage.min.js',
            '../components/ugly/simpleChart.min.js',
            '../components/ugly/touchManager.min.js',
            '../components/ugly/SwipeList.min.js',
            '../components/ugly/gameFish.min.js',
            '../components/ugly/gameTree.min.js',
            '../components/ugly/ptsChart.min.js',
         ])
         .pipe(concat('lib_bundle.js'))
         .pipe(gulp.dest(pkg.destination + '/lib'));
   });

gulp.task('babili-src', function (cb) {
   let efx = 'node /Users/posiwid/Development/Projects/node/AiP/v3/node_modules/babili/bin/babili.js src/courtHive.js > minimized/courtHive.min.js';
  exec(efx, function (err, stdout, stderr) { cb(err); });
})

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

gulp.task('copy-src', ['ugly-src'], function() {
	return gulp.src([
         'ugly/courtHive.min.js',
      ])
		.pipe(header(banner))
		.pipe(gulp.dest(pkg.destination));
});

gulp.task('default', ['bundle-sw']);
gulp.task('bundle-sw', [
      'copy-manifest',
      'copy-src',
      'compress-html',
      'compress-css',
      'copy-lib'
   ], () => {
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
   }
)

gulp.task('watch', ['bundle-sw'], () => {
  gulp.watch('src/**/*.js', [/* do some linting etc., */ 'copy-src']);
  gulp.watch('*.manifest', [/* do some linting etc., */ 'copy-manifest']);
  gulp.watch('*.html', [/* do some linting etc., */ 'compress-html']);
  gulp.watch('src/css/*.css', [/* do some linting etc., */ 'compress-css']);
});
