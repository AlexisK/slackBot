
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


window.MODEL = {};

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
        window[name] = fabric;
        window[name.toUpperCase()] = {};
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









window.EVENTDATA = {};

newModel('GlobalEvent', function(trigger, options) {
    var self = getSelf(this, 'GlobalEvent');
    self.inherit(BaseModel);
    
    self.queue = [];
    
    self.init = () => {
        
        if ( trigger.constructor == Array ) {
            trigger.forEach(t=>new GlobalEvent(t, options));
            return false;
        }
        
        self.trigger = trigger;
        
        self.options = mergeObjects({
            initiator: document,
            worker: ()=>{},
            init_with: null
        }, options);
        
        GLOBALEVENT[trigger] = self;
        
        self.start();
    }
    
    self.start = () => {
        self.options.initiator.addEventListener(self.trigger, self._worker);
    }
    
    self._worker = (ev) => {
        self.options.worker(ev, EVENTDATA, self);
        self.queue.forEach((todo)=>{
            todo(ev, EVENTDATA, self);
        });
    }
    
    self.add = todo => { self.queue.push(todo); }
    
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



newModel('Scenario', function(name) {
    
    var self = getSelf(this);
    self.inherit(BaseModel);
    
    self.init = function() {
        self.req = {
            straight: {},
            reverced: {},
            todos: {}
        }
    }
    
    self.addNode = function(name, reqirement, todo) {
        self.req.todos[name] = todo;
        self.req.straight[name] = self.req.straight[name] || [];
        self.req.straight[name] = self.req.straight[name].concat(reqirement);
        
        reqirement = reqirement || [];
        reqirement.forEach(req => {
            self.req.reverced[req] = self.req.reverced[req] || [];
            self.req.reverced[req].push(name);
        });
    }
    
    self.markDone = function(name) {
        var todos = self.req.reverced[name];
        self.req.reverced[name] = [];
        if ( todos ) {
            todos.forEach(key => {
                let reqs = self.req.straight[key];
                let ind = reqs.indexOf(name);
                if ( ind >= 0 ) {
                    reqs.splice(ind, 1);
                    if ( reqs.length == 0 ) {
                        self.run(key);
                    }
                }
            });
        }
    }
    
    self.run = function(name) {
        if ( name ) {
            //console.log(name);
            delete self.req.straight[name];
            self.req.todos[name](()=>{ self.markDone(name); });
        } else {
            for ( var key in self.req.straight ) {
                let reqs = self.req.straight[key];
                if ( reqs.length == 0 ) { self.run(key); }
            }
        }
    }
    
    self.init();
    
});


newModel('Storage', function(name, options, db) {
    
    var self = getSelf(this);
    self.inherit(BaseModel);
    
    self.queue = [];
    self.storage = {};
    self.ready = false;
    
    self.init = function() {
        self.name = name;
        
        self.options = mergeObjects({
            init: (self, done) => done(),
            save: (self, done) => done(),
            load: (self, done) => done()
        }, options);
        
        self.db = db || {};
        
        self.options.init(self,self.load);
        
        STORAGE[name] = self;
    }
    
    self.save = function(todo) {
        todo = todo || function(){};
        self.options.save(self, todo);
    }
    self.load = function(todo) {
        self.ready = false;
        self.options.load(self, (data)=>{
            self.storage = data;
            self.ready = true;
            self.queue.forEach(todo=>todo(data));
            self.queue = [];
        });
    }
    
    self.get = function() {
        tm(self.save);
        return self.storage;
    }
    
    self.onready = function(todo) {
        if ( self.ready ) { todo(self.storage); return true; }
        self.queue.push(todo);
        return false;
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
			let reqData;
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



window.EMITON = {
    listeners: {}
}

function EMIT() {
    let keys = Array.prototype.splice.call(arguments,0,1)[0];
    if ( typeof(keys) == 'string' ) { keys = keys.split('/'); }
    
    for ( ; keys.length; keys.pop() ) {
        let key = keys.join('/');
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


window.slack = {
    
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
    
    req(path, data) {
        if ( typeof(data) == 'function' ) { todo = data; data = null; }
        
        var pms = new Promise(done => {
            PROTOCOL.slack.write(path, data ,resp => {
                if ( resp.ok ) {
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
            let model = this.mapping[key];
            
            if ( resp[key] && resp[key].constructor === Array ) {
                resp[key].forEach(obj => {
                    var id = obj.id || obj[model+'_id'] || obj;
                    this.getItem(model, id);
                });
            }
        }
    },
    
    store(model,item) {
        this.db[model][item.id] = item;
        this.search_refs(item);
    },
    
    getItem(model, id) {
        var req = {};
        req[model] = id;
        if ( this.ignore_ids.indexOf(id) >= 0 ) { return Promise.resolve(); }
        this.ignore_ids.push(id);
        
        var pms = new Promise(done => { slack.req(this.models[model].multiple+'.info', req).then(done); });
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



MODEL.GlobalEvent.declare.push(() => {
    
    let keyHandler = (key,ev,db) => {
        db[key] = mergeObjects(db[key],{
            ctrl: ev.ctrlKey,
            shift: ev.shiftKey,
            alt: ev.altKey,
            meta: ev.metaKey,
            target:ev.target
        });
    }
    let cursorHandler = (key,ev,db) => {
        db[key] = mergeObjects(db[key],{
            x: ev.clientX,
            y: ev.clientY,
            sx: ev.screenX,
            sy: ev.screenY,
            target:ev.target
        });
    }
    
    new GlobalEvent('mousemove', {
        initiator: window,
        worker: (ev, db) => {
            cursorHandler('cursor',ev,db);
        }
    });
    cursorHandler('cursor',{},EVENTDATA);
    
    new GlobalEvent(['keydown','keyup','keypress'], {
        worker: (ev,db) => {
            keyHandler('key',ev,db);
        }
    });
    keyHandler('key',{},EVENTDATA);
    
    new GlobalEvent(['click','mousedown','mouseup'], { worker: (ev,db, ref) => {
        keyHandler(ref.trigger,ev,db);
        cursorHandler(ref.trigger,ev,db)
    } });
    
    keyHandler(    'click'     ,{}, EVENTDATA );
    cursorHandler( 'click'     ,{}, EVENTDATA );
    keyHandler(    'mousedown' ,{}, EVENTDATA );
    cursorHandler( 'mousedown' ,{}, EVENTDATA );
    keyHandler(    'mouseup'   ,{}, EVENTDATA );
    cursorHandler( 'mouseup'   ,{}, EVENTDATA );
    
    new GlobalEvent('resize', {
        initiator: window,
        worker: (ev,db) => {
            db.size = {
                x: Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
                y: Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
            }
        }
    });
    GLOBALEVENT.resize.options.worker({},EVENTDATA);
    
    new GlobalEvent('scroll', {
        worker: (ev,db) => {
            db.scroll = {
                x: window.pageXOffset || document.documentElement.scrollLeft,
                y: window.pageYOffset || document.documentElement.scrollTop
            }
        }
    });
    GLOBALEVENT.scroll.options.worker({},EVENTDATA);
    
});


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
                query.push(k+'='+data[k]);
            }
            
            ajaxRequest('GET','https://slack.com/api/'+[path,query.join('&')].join('?'), (resp)=> {
                self.read(resp, path, todo);
            });
        }
    });
    
});


MODEL.Scenario.declare.push(() => {
    
});


MODEL.Storage.declare.push(() => {
    
    new Storage('db', {
        load: (self, done) => {
            var data;
            try {
                data = JSON.parse(localStorage.jF809ga);
            } catch(err) { data = {}; }
            done(data);
        },
        save: (self, done) => {
            localStorage.jF809ga = JSON.stringify(self.storage);
            done();
        }
    });
    
    $P(window,'DB',STORAGE.db.get);
    
    
});




var mainScenario = PF((done, fail) => {
    // GLOBALEVENT.click.add((ev) => console.log('Click!'));
    
    
    slack.req('auth.test').then(data=> console.log(data));
    slack.req('channels.list').then(data=>{
        console.log(data);
    });
    slack.when_ready(()=>{ console.log('All done!', slack.db.channel, slack.db.user); })
    
    
    done();
});

var failScenario = PF(done => {
    console.error('Aborting application runtime...');
});


// Start

PAGE = {
    loadSettings     : PF(done => { loadJson('config.json', done); }),
    loadLocale       : PF(done => { loadJson(['locale/',config.locale,'.json'].join(''), done); }),
    declareInstances : PF(done => {
        for ( var name in MODEL ) {
            MODEL[name].declare.forEach(worker => worker());
        }
        done();
    }),
    loadDB           : PF(done => { STORAGE.db.onready(done); })
}

PAGE.loadSettings()
    .then(PAGE.loadLocale)
    .then(PAGE.declareInstances)
    .then(PAGE.loadDB)
    .catch(err => {
        console.error('Failed to initialize\n\t',err);
        return Promise.reject();
    })
    .then(
        mainScenario,
        failScenario
    )
    .catch(err => {
        console.error('Failed during uptime\n\t',err);
        failScenario();
        return Promise.reject();
    });


/*
window.PAGE = new Scenario('page');
PAGE.addNode('loadSettings', [], (done)=>{ loadJson('config.json', done); });
PAGE.addNode('loadLocale', ['loadSettings'], (done)=>{ loadJson(['locale/',config.locale,'.json'].join(''), done); });

PAGE.addNode('declareInstances', ['loadSettings'], (done)=>{
    for ( var name in MODEL ) {
        MODEL[name].declare.forEach(worker => worker());
    }
    done();
});
PAGE.addNode('loadDB', ['declareInstances'], (done)=>{ STORAGE.db.onready(done); });
PAGE.addNode('start',['loadDB'], mainScenario);

PAGE.run();
*/
