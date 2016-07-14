
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
