
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

