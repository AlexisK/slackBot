
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
        var socket = new WebSocket(self.options.path);
        socket.onopen = ev => {
            self.options.open(self, ev).then(() => {
                socket.onclose = ev => { return self.options.close(self, ev); }
                socket.onerror = ev => { return self.options.error(self, ev); }
                socket.onmessage = ev => {return self.options.read(self, ev.data, ev); }
            });
        }
        
        self.socket = socket;
    }
    
    self.init();
    
});
