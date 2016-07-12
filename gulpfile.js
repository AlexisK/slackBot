
var gulp   = require('gulp');
var runSequence = require('run-sequence');
var concat = require('gulp-concat');
var csso   = require('gulp-csso');
var less   = require('gulp-less');
var uglify = require('gulp-uglify');



gulp.task('build_css', function(done) {
    
    gulp.src(['./resources/css/config.less','./resources/css/**/*'])
    .on('error', ()=>{ console.error('css/src'); })
    .pipe(concat('compiled.css'))
    .on('error', ()=>{ console.error('css/concat'); })
    .pipe(less())
    .on('error', ()=>{ console.error('css/less'); })
    .pipe(csso())
    .on('error', ()=>{ console.error('css/csso'); })
    .pipe(gulp.dest('./build'))
    .on('error', ()=>{ console.error('css/write'); });
    
    done();
});


gulp.task('observe_css', function() {
    runSequence('build_css');
    gulp.watch('./resources/**/*.less',['build_css']);
});



gulp.task('build_js', function(done) {
    
    gulp.src([
        './resources/js/wrap.js',
        './resources/js/storage.js',
        './resources/js/model/**/*',
        './resources/js/service/**/*',
        './resources/js/instances/**/*',
        './resources/js/app.js'
    ])
    .on('error', ()=>{ console.error('js/src'); })
    .pipe(concat('compiled.js'))
    .on('error', ()=>{ console.error('js/concat'); })
    //.pipe(uglify())
    //.on('error', ()=>{ console.error('js/uglify'); })
    .pipe(gulp.dest('./build'))
    .on('error', ()=>{ console.error('js/write'); });
    
    gulp.src('./resources/locale/*').pipe(gulp.dest('./build/locale'));
    
    done();
});


gulp.task('observe_js', function() {
    runSequence('build_js');
    gulp.watch('./resources/**/*.js',['build_js']);
});



gulp.task('build_html', function(done) {
    
    gulp.src('./resources/index.html')
    .on('error', ()=>{ console.error('html/src'); })
    .pipe(gulp.dest('./build'))
    .on('error', ()=>{ console.error('html/write'); });
    
    done();

});


gulp.task('observe_html', function() {
    runSequence('build_html');
    gulp.watch('./resources/**/*.html',['build_html']);
});



gulp.task('build', function() {
    runSequence('build_css','build_js','build_html');
});

gulp.task('observe', function() {
    runSequence('observe_css','observe_js','observe_html');
});


gulp.task('default', function() {
    runSequence('observe');
});


