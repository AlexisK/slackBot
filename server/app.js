const Hapi = require('hapi');

// Create a server with a host and port
const server = new Hapi.Server();
server.connection({ 
    host: 'localhost', 
    port: 4001
});

// Add the route
server.route({
    method: 'GET',
    path:'/hello', 
    handler: function (request, reply) {

        return reply('hello world');
    }
});

// Start the server
server.start((err) => {

    if (err) {
        throw err;
    }
    
    
    console.log('Server running at:', server.info.uri);
    
    for ( var name in MODEL ) {
        MODEL[name].declare.forEach(worker => worker());
    }
    
    
    
    
    
    
    global.VARS = {};
    
    connect_jira();
    
    slack.req('auth.test').then(resp=> {
        if ( resp.ok ) {
            console.log('Slack auth ok');
            
            ON('slack/read/message', (data, ev) => {
                console.log('slack/message', data);
            });
            
            //- handling
            ON('slack/read/message', data => {
                data.ts = parseInt(data.ts) * 1000;
                if ( data.subtype != 'bot_message' && VARS.latestTs && data.ts > VARS.latestTs ) {
                    
                    VARS.latestTs = data.ts;
                    var author = slack.db.user[data.user];
                    
                    for ( var k in MESSAGEHANDLER ) {
                        MESSAGEHANDLER[k].handle(data);
                    }
                    
                }
            });
            
            slack.req('rtm.start', null, {
                autofetch: true
            }).then(resp => {
                if ( resp.ok ) {
                    console.log('Got RTM!');
                    VARS.latestTs = Date.now();
                    
                    global.sock = WEBSOCKETCLIENT.slackChat;
                    sock.reconnect(resp.url);
                }
            });
            
        }
    }, data => console.error(data));
    
});
