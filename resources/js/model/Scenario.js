

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
