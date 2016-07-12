
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
