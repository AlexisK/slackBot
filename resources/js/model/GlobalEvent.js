
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
