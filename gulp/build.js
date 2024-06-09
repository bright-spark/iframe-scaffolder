'use strict';

var gulp = require('gulp');

var $ = require('gulp-load-plugins')({
  pattern: ['gulp-*', 'uglify-save-license', 'del']
});

function handleError(err) {
  console.error(err.toString());
  this.emit('end');
}

gulp.task('styles', function () {
  return gulp.src('src/app/index.less')
    .pipe($.less({
      paths: [
        '.',
        'src/app',
        'src/components'
      ]
    }))
    .on('error', handleError)
    .pipe($.autoprefixer('last 1 version'))
    .pipe($.flatten())
    .pipe(gulp.dest('.tmp/app'))
    .pipe($.size());
});

gulp.task('scripts', function () {
  return gulp.src('src/{app,components}/**/*.js')
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'))
    .pipe($.size());
});

gulp.task('partials', function () {
  return gulp.src('src/{app,components}/**/*.html')
    .pipe($.minifyHtml({
      empty: true,
      spare: true,
      quotes: true
    }))
    .pipe($.ngHtml2js({
      moduleName: 'iframeScaffolder'
    }))
    .pipe(gulp.dest('.tmp'))
    .pipe($.size());
});

gulp.task('html', ['styles', 'scripts', 'partials'], function () {
  var htmlFilter = $.filter('*.html');
  var jsFilter = $.filter('**/*.js');
  var cssFilter = $.filter('**/*.css');
  var assets;

  return gulp.src('src/*.html')
    .pipe($.inject(gulp.src('.tmp/{app,components}/**/*.js'), {
      read: false,
      starttag: '<!-- inject:partials -->',
      addRootSlash: false,
      addPrefix: '../'
    }))
    .pipe(assets = $.useref.assets())
    .pipe($.rev())
    .pipe(jsFilter)
    .pipe($.ngAnnotate())
    .pipe($.replace('%%FACEBOOK_APP_ID%%', require('../package.json').facebookAppId))
    .pipe($.replace('bower_components/zeroclipboard/dist/','./assets/swf/'))
    .pipe($.uglify({preserveComments: $.uglifySaveLicense}))
    .pipe(jsFilter.restore())
    .pipe(cssFilter)
    .pipe($.replace('bower_components/bootstrap/fonts','fonts'))
    .pipe($.replace('../assets','assets'))
    .pipe($.csso())
    .pipe(cssFilter.restore())
    .pipe(assets.restore())
    .pipe($.useref())
    .pipe($.revReplace())
    .pipe(htmlFilter)
    .pipe($.minifyHtml({
      empty: true,
      spare: true,
      quotes: true
    }))
    .pipe(htmlFilter.restore())
    .pipe(gulp.dest('dist'))
    .pipe($.size());
});

gulp.task('images', function () {
  return gulp.src('src/assets/images/**/*')
      .pipe($.imagemin({
        optimizationLevel: 3,
        progressive: true,
        interlaced: true
      }))
      .pipe(gulp.dest('dist/assets/images'))
      .pipe($.size());
});

gulp.task('swf', [], function () {
  return gulp.src('node_modules/@bower_components/**/*.swf')
    .pipe($.flatten())
    .pipe(gulp.dest('dist/assets/swf'))
    .pipe($.size());
});
gulp.task('misc', ['swf'], function () {
  return gulp.src('src/**/*.{ico,json}')
    .pipe($.flatten())
    .pipe(gulp.dest('dist/assets'))
    .pipe($.size());
});

gulp.task('clean', function (done) {
  $.del(['.tmp', 'dist'], done);
});

gulp.task('deploy', ['build'], function() {
  return gulp.src('./dist/**/*').pipe($.ghPages({
    remoteUrl: require('../package.json').staticRemote
  }));
});

gulp.task('build', ['html', 'images', 'misc']);


gulp.task('default', ['clean'], function () { 
  gulp.start('build');
}   
);

gulp.task('watch', ['build'], function () {
      
    // Watch for changes in `app` folder
    gulp.watch([
      'src/*.html',
      'src/{app,components}/**/*.js',
      'src/assets/images/**/*',
      'src/assets/**/*.{ico,json}'
    ], ['build']);
  
    gulp.watch('src/{app,components}/**/*.less', ['styles']);
    gulp.watch('src/{app,components}/**/*.html', ['partials']);
  } 
);
