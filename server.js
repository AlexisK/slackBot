
global.config = {
    locale: "en-US",
    slack: {
        token: "xoxp-58448061859-58491578132-59749251990-710cb5e6c6"
    },
    version: {
        db: 2
    },
    reconnect_timeout: 5000,
    jira: {
        host: 'alexisktestingspace.atlassian.net',
        port: '443',
        user: 'oleksii.kaliuzhnyi@skywindgroup.com',
        password: 'kernel13Adv',
        status: (function(obj) {
            obj.available = [obj.pending, obj.current].join(', ')
            return obj;
        })({
            current: '"In Progress"',
            pending: '"To Do"',
            done: '"Done"'
        })
    }
}


function def(val) { return typeof(val) != 'undefined' && val !== null; }

function S(query, target) {
    if (query[0] == '#') { return document.getElementById(query.slice(1)); }
    target = target || document;
    if ( query[0] == '.' ) { return target.getElementsByClassName(query.slice(1)); }
    return target.getElementsByTagName(query);
}

function cr(tag, cls, parent) {
    var elem = document.createElement(tag);
    if ( def(cls) ) { elem.className = cls; }
    if ( def(parent) ) { parent.appendChild(elem); }
    return elem;
}

function loadJson(path, todo) {
    var newNode = cr('script');// loading json with 'script' tag in order to work directly from fs
    newNode.onload = todo;
    newNode.src = path;
    document.body.appendChild(newNode);
}

function mergeObjects() {
    if ( !arguments.length ) { return {}; }
    arguments[0] = arguments[0] || {};
    return Array.prototype.reduce.call(arguments, (base, obj)=> {
        for ( var k in obj ) {
            base[k] = obj[k];
        }
        return base;
    });
}

function $P(obj, key, getter, setter) {
    if ( Object.__defineGetter__ ) {
        if ( def(getter) ) { obj.__defineGetter__(key, getter); }
        if ( def(setter) ) { obj.__defineSetter__(key, setter); }
    } else {
        var DO = {
            enumerable: true,
            configurable: true
        }
        
        if ( def(getter) ) { DO['get'] = getter; }
        if ( def(setter) ) { DO['set'] = setter; }
        
        Object.defineProperty(obj, key, DO);
    }
}

function tm(todo,tmr) {
    tmr = tmr || 1;
    return setTimeout(todo,tmr);
}


function PF(todo) {
    var cache;
    return () => { return cache || (cache = new Promise(todo)); };
}


var MODEL = {};

function inherit(ref, args) {
    if ( !this._inherits || this._inherits.indexOf(ref) != -1 ) { return 0; }
    ref.apply(this, args);
    this._inherits.push(ref);
    
}

function newModel(name, fabric) {
    MODEL[name] = {
        declare: [],
        fabric: fabric
    };
    if ( fabric ) {
        global[name] = fabric;
        global[name.toUpperCase()] = {};
    }
}

function getSelf(ref, key) {
    ref._inherits = ref._inherits||[];
    
    ref.inherit = inherit;
    
    if ( key && MODEL[key] ) {
        MODEL[key].lastInstance = ref;
    }
    
    return ref;
}


newModel('BaseModel', function() {
    var self = getSelf(this);
    
    self.init = function() {
        
    }
    
    self.init();
});









newModel('MessageHandler', function(pattern, parser, options) {
    var self = getSelf(this, 'GlobalEvent');
    self.inherit(BaseModel);
    
    self.init = () => {
        
        self.pattern = pattern;
        self.parser = parser;
        self.options = mergeObjects({
            
        }, options);
        
        if ( self.pattern.constructor == 'String' ) {
            self.is_match = function(val) { return val == self.pattern; }
        } else {
            self.is_match = function(val) { return (new RegExp(self.pattern)).test(val); }
        }
        
        MESSAGEHANDLER[pattern] = self;
    }
    
    self.handle = function(resp) {
        if ( self.is_match(resp.text) ) {
            self.parser(self, resp.text, slack.db.user[resp.user], resp);
        }
    }
    
    self.init();
    
});


newModel('Protocol',function(name, options) {
    var self = getSelf(this, 'Protocol');
    self.inherit(BaseModel);
    
    self.init = function() {
        self.name = name;
        
        self.options = mergeObjects({
            write: (self,todo) => { self.read(todo); },
            read: (self,todo) => { todo(); }
        }, options);
        
        PROTOCOL[name] = self;
    }
    
    self.write = function() {
        Array.prototype.splice.call(arguments,0,0,self);
        self.options.write.apply(self, arguments);
    }
    
    self.read = function() {
        Array.prototype.splice.call(arguments,0,0,self);
        self.options.read.apply(self, arguments);
    }
    
    self.init();
});

var W3CWebSocket = require('websocket').w3cwebsocket;

newModel('WebSocketClient', function(name, options) {
    
    var self = getSelf(this);
    self.inherit(BaseModel);
    
    self.init = function() {
        self.name = name;
        
        self.options = mergeObjects({
            path: null,
            write: (self, data) => { self.socket.send(data); return new Promise(done => done()); },
            read : (self, data, ev) => { return new Promise(done => done(data)); },
            open : (self) => { return new Promise(done => done()); },
            close: (self) => { return new Promise(done => {
                tm(self.reconnect, config.reconnect_timeout);
            }) },
            error: (self) => { return new Promise(done => done()); }
        }, options);
        
        WEBSOCKETCLIENT[name] = self;
        
        //-self.reconnect();
    }
    
    self.read  = function() { Array.prototype.splice.call(arguments, 0, 0, self); return self.options.read.apply(self, arguments); }
    self.write = function() { Array.prototype.splice.call(arguments, 0, 0, self); return self.options.write.apply(self, arguments); }
    
    self.reconnect = function(path) {
        if ( def(path) ) { self.options.path = path; }
        
        var socket = new W3CWebSocket(self.options.path);
        console.log('WebSocket Client Created ', self.options.path);
        socket.onerror = ev => console.log('Error! ',ev);
        socket.onclose = ev => console.log('Close! ',ev);
        socket.onopen = ev => {
            console.log('WebSocket Client Connected');
            self.options.open(self, ev).then(() => {
                console.log('WebSocket Client options loaded');
                socket.onclose = ev => { console.error('Socket closed'); return self.options.close(self, ev); }
                socket.onerror = ev => { console.error('Socket caught error!'); return self.options.error(self, ev); }
                socket.onmessage = ev => { return self.options.read(self, ev.data, ev); }
            });
        }
        
        self.socket = socket;
    }
    
    self.init();
    
});

function $AD(obj, path, params) {
    params = params || {};
    
    if ( !def(obj) ) { return null; }
    if ( typeof(path) == 'string' ) { path = path.split('.'); }
    
    if ( path.length > 0 ) {
        
        if ( !def(obj[path[0]]) && def(params.autocreate) ) {
            obj[path[0]] = CO(params.autocreate);
        }
        if ( !def(obj[path[0]]) ) {
            if ( def(params.autocreate) ) {
                obj[path[0]] = CO(params.autocreate);
            } else if ( def(params.onnull) ) {
                obj[path[0]] = params.onnull(obj, path[0], path);
            }
        }
        
        if ( path.length == 1 ) {
            if ( params.del ) {
                var o = obj[path[0]];
                delete obj[path[0]];
                return o;
            } else if ( def(params.setVal) ) {
                obj[path[0]] = params.setVal;
            }
        }
        
        
        return $AD(obj[path.splice(0,1)[0]], path, params);
    }
    
    return obj;
}

var XMLHttpRequest = require('xhr2');

function ajaxRequest(method, path, data, todo) {
    if ( typeof(data) == 'function' ) {
        todo = data;
        data = {};
    }
	data = data || {};
	todo = todo || function(data) {
		console.log(data);
	}
	
	var r = new XMLHttpRequest();
	r.onreadystatechange = (ev) => {
		if ( r.readyState == 4 ) {
			var reqData;
			try {
				reqData = JSON.parse(r.responseText);
			} catch(err) {
				reqData = r.responseText;
			}
			todo(reqData, r, ev);
		}
	}
	r.open(method, path);
	r.send(JSON.stringify(data));
}



global.EMITON = {
    listeners: {}
}

function EMIT() {
    var keys = Array.prototype.splice.call(arguments,0,1)[0];
    if ( typeof(keys) == 'string' ) { keys = keys.split('/'); }
    
    for ( ; keys.length; keys.pop() ) {
        var key = keys.join('/');
        if ( EMITON.listeners[key] ) {
            EMITON.listeners[key].forEach(todo=>todo.apply(todo,arguments));
        }
    }
}

function ON(key, todo) {
    if ( typeof(key) != 'string' ) {
        key = key.join('/');
    }
    EMITON.listeners[key] = EMITON.listeners[key] || [];
    EMITON.listeners[key].push(todo);
    
}


global.slack = {
    
    db: {},
    models: {
        user: {
            mapping: ['users','members'],
            multiple: 'users'
        },
        channel: {
            mapping: ['channels'],
            multiple: 'channels'
        }
    },
    
    queue: [],
    ignore_ids: [],
    
    req(path, data, params) {
        params = mergeObjects({
            autofetch: false
        }, params);
        
        var pms = new Promise(done => {
            PROTOCOL.slack.write(path, data ,resp => {
                if ( params.autofetch && resp.ok ) {
                    this.search_refs(resp);
                }
                done(resp);
            });
        });
        this.queue.push(pms);
        return pms;
    },
    
    search_refs(resp) {
        
        // search for model item
        for ( var model in this.models ) {
            if ( resp[model] && resp[model].id ) {
                this.store(model,resp[model]);
            }
        }
        
        // search for items list
        for ( var key in this.mapping ) {
            var model = this.mapping[key];
            
            if ( resp[key] && resp[key].constructor === Array ) {
                resp[key].forEach(obj => {
                    var id = obj.id || obj[model+'_id'] || obj;
                    this.getItem(model, id, { autofetch: true });
                });
            }
        }
    },
    
    store(model,item) {
        this.db[model][item.id] = item;
        this.search_refs(item);
    },
    
    getItem(model, id, params) {
        var req = {};
        req[model] = id;
        if ( this.ignore_ids.indexOf(id) >= 0 ) { return Promise.resolve(); }
        this.ignore_ids.push(id);
        
        var pms = new Promise(done => { slack.req(this.models[model].multiple+'.info', req, params).then(done); });
        this.queue.push(pms);
        return pms;
    },
    
    when_ready(todo) {
        var len = this.queue.length;
        Promise.all(this.queue).then(()=> {
            if ( this.queue.length == len ) {
                this.queue.length = 0;
                todo();
            } else {
                this.when_ready(todo);
            }
        });
    }
    
};

(function() {
    slack.mapping = {};
    
    for ( var model in slack.models ) {
        var conf = slack.models[model];
        
        slack.db[model] = {};
        conf.mapping.forEach(key => slack.mapping[key] = model );
    }
})();



function sendAsBot(resp, msg, botname) {
    slack.req('chat.postMessage', {
        channel: resp.channel,
        text: msg.replace('&', '&amp;')
                 .replace('<', '&lt;')
                 .replace('>', '&gt;'),
        as_user: false,
        username: botname||'R2Dbot'
    });
}


function parseMessage() {
    var base = Array.prototype.splice.call(arguments, 0, 1)[0].trim().split(/[\s\,]+/g);
    var result = {};
    for ( var i = 0, len = Math.min(arguments.length, base.length); i < len; i++ ) {
        def(arguments[i]) && (result[arguments[i]] = base[i]);
    }
    if ( base.length > arguments.length ) {
        result.args = base.slice(arguments.length);
    }
    return result;
}



MODEL.MessageHandler.declare.push(()=>{
    
    new MessageHandler('status', (self, t, user, resp)=> {
        sendAsBot(resp, `${user.name}`,'STATUS');
    });
    
    new MessageHandler(/(^|\W)(hello|hi|yo)($||W)/gi, (self, text, user, resp) => {
        sendAsBot(resp, `Hi, ${user.name}`);
    } );
    
    new MessageHandler(/(^|\W)tasks\s+([\d\w ]+)\s*$/gi, (self, text, user, slackResp) => {
        var req = parseMessage(text, null, 'name', 'status');
        req.status = req.status || 'available';
        
        PROTOCOL.jira.write('userIssues', req, resp => {
            console.log(resp);
            sendAsBot(slackResp, `${req.name}: tasks with status ${req.status}`);
            resp.issues.forEach(issue => {
                sendAsBot(slackResp, `${issue.key} ${issue.fields.status.name} : ${issue.fields.summary}`);
            });
        });
    } );
    
    
    
});

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


MODEL.WebSocketClient.declare.push(()=>{
    
    new WebSocketClient('slackChat', {
        
        read: (self, data, ev) => {
            data = JSON.parse(data);
            if ( data.type ) {
                EMIT(['slack','read', data.type], data, ev);
                return new Promise(done => done(data));
            }
        }
    });
    
});

const Hapi = require('hapi');

// Create a server with a host and port
const server = new Hapi.Server();
server.connection({ 
    host: 'localhost', 
    port: 4001
});

// Add the route
server.route({
    method: 'GET',
    path:'/hello', 
    handler: function (request, reply) {

        return reply('hello world');
    }
});

// Start the server
server.start((err) => {

    if (err) {
        throw err;
    }
    
    
    console.log('Server running at:', server.info.uri);
    
    for ( var name in MODEL ) {
        MODEL[name].declare.forEach(worker => worker());
    }
    
    
    
    
    
    
    global.VARS = {};
    
    connect_jira();
    
    slack.req('auth.test').then(resp=> {
        if ( resp.ok ) {
            console.log('Slack auth ok');
            
            ON('slack/read/message', (data, ev) => {
                console.log('slack/message', data);
            });
            
            //- handling
            ON('slack/read/message', data => {
                data.ts = parseInt(data.ts) * 1000;
                if ( data.subtype != 'bot_message' && VARS.latestTs && data.ts > VARS.latestTs ) {
                    
                    VARS.latestTs = data.ts;
                    var author = slack.db.user[data.user];
                    
                    for ( var k in MESSAGEHANDLER ) {
                        MESSAGEHANDLER[k].handle(data);
                    }
                    
                }
            });
            
            slack.req('rtm.start', null, {
                autofetch: true
            }).then(resp => {
                if ( resp.ok ) {
                    console.log('Got RTM!');
                    VARS.latestTs = Date.now();
                    
                    global.sock = WEBSOCKETCLIENT.slackChat;
                    sock.reconnect(resp.url);
                }
            });
            
        }
    }, data => console.error(data));
    
});
