
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
