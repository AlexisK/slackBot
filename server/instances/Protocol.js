var jiraApi = require('jira').JiraApi;

function connect_jira() {
    var jira = new jiraApi('https', config.jira.host, config.jira.port, config.jira.user, config.jira.password, '2');
    global.jira = jira;
    console.log('Connected Jira');
}

MODEL.Protocol.declare.push(() => {
    
    new Protocol('slack', {
        read: (self, data, path, done) => {
            done(data);
            EMIT('slack/'+path.split('.').join('/'), path, data);
        },
        write: (self, path, data, todo) => {
            todo = todo || function(resp) { console.log(resp); };
            data = data || {};
            
            if ( config.slack && config.slack.token ) {
                data.token = config.slack.token;
            }
            
            var query = [];
            for ( var k in data ) {
                query.push(encodeURIComponent(k)+'='+encodeURIComponent(data[k]));
            }
            
            ajaxRequest('GET','https://slack.com/api/'+[path,query.join('&')].join('?'), (resp)=> {
                self.read(resp, path, todo);
            });
        }
    });
    
    new Protocol('jira', {
        read: (self, data, path, done) => {
            done(data);
            EMIT('jira/'+path.split('.').join('/'), path, data);
        },
        write: (self, path, data, todo) => {
            todo = todo || function(resp) { console.log(resp); };
            data = data || {};
            if ( typeof(data) == 'string' ) { data = {name:data}; }
            
            self.options.handlers[path] && self.options.handlers[path](data, (resp)=> {
                self.read(resp, path, todo);
            });
            
        },
        handlers: {
            'project': function (req, todo) {
                global.jira.getProject(req.name, (error, issue) => { todo(issue); });
            },
            'issue': function (req, todo) {
                global.jira.findIssue(req.name, (error, issue) => { todo(issue); });
            },
            'search': function (req, todo) {
                global.jira.searchJira(req.name, req.options, (error, issue) => { todo(issue); });
            },
            'userIssues': function (req, todo) {
                global.jira.searchJira(`status in (${config.jira.status[req.status]}) AND assignee in (${req.name}) order by updated DESC`, req.options, (error, issue) => { todo(issue); });
            },
            'user': function (req, todo) {
                global.jira.searchUsers(req.name, 0, 1, true, true, (error, issue) => { todo(issue); });
            }
        }
    });
    
});
