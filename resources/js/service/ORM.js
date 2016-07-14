


window.ORM = new (function() {
    var self = getSelf(this);
    
    self.init = function() {
        self.db = {};
        
    }
    
    self.registerModel = function(name, params) {
        
    }
    
    self.init();
    
})();

ORM.registerModel('user', {
    api: {
        slack: {
            parse: obj => {
                return {
                    slack_id: obj.id,
                    color: obj.color,
                    is_bot: obj.is_bot,
                    slack_name: obj.name,
                    email: obj.profile.email
                }
            }
        },
        jira: {
            parse: obj => {
                return 1;
            }
        }
    }
});