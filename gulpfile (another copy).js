
var gulp    = require('gulp');
var browserSync = require('browser-sync');
var runSequence = require('run-sequence');
var concat  = require('gulp-concat');
var csso    = require('gulp-csso');
var less    = require('gulp-less');
var uglify  = require('gulp-uglify');
var nodemon = require('gulp-nodemon');
var jiraApi = require('jira').JiraApi;



var config = {
    jira: {
        host: 'alexisktestingspace.atlassian.net',
        port: '443',
        user: 'oleksii.kaliuzhnyi@skywindgroup.com',
        password: 'kernel13Adv'
    },
    status: (function(obj) {
        obj.available = [obj.pending, obj.current].join(', ')
        return obj;
    })({
        current: '"In Progress"',
        pending: '"To Do"',
        done: '"Done"'
    })
}



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

gulp.task('build_node_js', function(done) {
    
    gulp.src([
        './server/config.js',
        './server/wrap.js',
        './server/model/**/*',
        './server/service/**/*',
        './server/instances/**/*',
        './server/app.js'
    ])
    .on('error', ()=>{ console.error('node_js/src'); })
    .pipe(concat('server.js'))
    .on('error', ()=>{ console.error('node_js/concat'); })
    .pipe(gulp.dest('./'))
    .on('error', ()=>{ console.error('node_js/write'); });
    
    done();
});


gulp.task('build_html', function(done) {
    
    gulp.src('./resources/index.html')
    .on('error', ()=>{ console.error('html/src'); })
    .pipe(gulp.dest('./build'))
    .on('error', ()=>{ console.error('html/write'); });
    
    done();

});


gulp.task('build', function() {
    runSequence('build_css','build_node_js','build_js','build_html');
});




var REF = {};

 function connect_jira() {
    var jira = new jiraApi('https', config.jira.host, config.jira.port, config.jira.user, config.jira.password, '2');
    REF.jira = jira;
    console.log('Connected Jira');
}

function getData(req) {
    var parsed = require("url").parse(req.url).query;
    parsed && (parsed = parsed.split('&')) || (parsed = null);
    var data = {};
    parsed && parsed.forEach(v=>{ v = v.split('='); data[v[0]]=v[1]; });
    return data;
}

function sendData(res) {
    return function(error, issue) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify(issue));
    };
}




gulp.task('observe', ['build'], function() {
    
    var bs1 = browserSync.create("frontend");
    var bs2 = browserSync.create("backend");
    
    bs1.init({
        notify: false,
        open: false,
        port: 3000,
        server: {
            baseDir: ['./build']
        }
    });
    
    bs2.init({
        notify: false,
        open: false,
        port: 3002,
        ui: {
            port: 3004
        },
        proxy: {
            target: 'localhost:3002',
            middleware: [
                
                {
                    route: '/jira/project',
                    handle: function (req, res, next) {
                        REF.jira.getProject(getData(req).name, sendData(res));
                    }
                },
                {
                    route: '/jira/issue',
                    handle: function (req, res, next) {
                        REF.jira.findIssue(getData(req).name, sendData(res));
                    }
                },
                {
                    route: '/jira/search',
                    handle: function (req, res, next) {
                        var data = getData(req);
                        REF.jira.searchJira(data.name, data.options, sendData(res));
                    }
                },
                {
                    route: '/jira/userIssues',
                    handle: function (req, res, next) {
                        var data = getData(req);
                        REF.jira.searchJira(`status in (${config.status[data.status]}) AND assignee in (${data.name}) order by updated DESC`, data.options, sendData(res));
                    }
                },
                {
                    route: '/jira/user',
                    handle: function (req, res, next) {
                        var data = getData(req);
                        REF.jira.searchUsers(data.name, 0, 1, true, true, sendData(res));
                    }
                }
                
            ]
        }
    });
    
    connect_jira();

    gulp.watch(['./resources/**/*.less'], ['build_css', bs1.reload]);
    gulp.watch(['./resources/**/*.js']  , ['build_js', bs1.reload]);
    gulp.watch(['./resources/**/*.html'], ['build_html', bs1.reload]);
    
    
    nodemon({ script: 'server.js',
        ext: 'js',
        tasks: ['build_node_js'],
        watch: ['./server']
    })
});


gulp.task('default', ['observe']);


