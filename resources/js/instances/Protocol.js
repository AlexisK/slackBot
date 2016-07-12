
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
