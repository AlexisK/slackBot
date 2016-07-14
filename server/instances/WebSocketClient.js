
MODEL.WebSocketClient.declare.push(()=>{
    
    new WebSocketClient('slackChat', {
        
        read: (self, data, ev) => {
            data = JSON.parse(data);
            if ( data.type ) {
                EMIT(['slack','read', data.type], data, ev);
                return new Promise(done => done(data));
            }
        }
    });
    
});
