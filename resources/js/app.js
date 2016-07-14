


var mainScenario = PF((done, fail) => {
    GLOBALEVENT.click.add((ev) => console.log('Click!'));
    
    window.VARS = {}
    
    
    slack.req('auth.test').then(resp=> {
    if ( resp.ok ) {
        
        // slack.req('channels.list', null, {
            // autofetch: true
        // });
        // slack.when_ready(()=>{ console.log('All done!', slack.db.channel, slack.db.user); })
        
        ON('slack/read/message', (data, ev) => {
            console.log('slack/message', data);
        });
        
        //- mirror
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
                console.log('Got RTM!', resp);
                VARS.latestTs = Date.now();
                
                window.sock = WEBSOCKETCLIENT.slackChat;
                sock.reconnect(resp.url);
            }
        });
        
        }
    });
    
    
    done();
});

var failScenario = PF(done => {
    console.error('Aborting application runtime...');
});


// Start

PAGE = {
    loadSettings     : PF(done => { loadJson('config.json', done); }),
    loadLocale       : PF(done => { loadJson(['locale/',config.locale,'.json'].join(''), done); }),
    declareInstances : PF(done => {
        for ( var name in MODEL ) {
            MODEL[name].declare.forEach(worker => worker());
        }
        done();
    }),
    loadDB           : PF(done => { STORAGE.db.onready(done); })
}

PAGE.loadSettings()
    .then(PAGE.loadLocale)
    .then(PAGE.declareInstances)
    .then(PAGE.loadDB)
    .catch(err => {
        console.error('Failed to initialize\n\t',err);
        return Promise.reject();
    })
    .then(
        mainScenario,
        failScenario
    )
    .catch(err => {
        console.error('Failed during uptime\n\t',err);
        failScenario();
        return Promise.reject();
    });


/*
window.PAGE = new Scenario('page');
PAGE.addNode('loadSettings', [], (done)=>{ loadJson('config.json', done); });
PAGE.addNode('loadLocale', ['loadSettings'], (done)=>{ loadJson(['locale/',config.locale,'.json'].join(''), done); });

PAGE.addNode('declareInstances', ['loadSettings'], (done)=>{
    for ( var name in MODEL ) {
        MODEL[name].declare.forEach(worker => worker());
    }
    done();
});
PAGE.addNode('loadDB', ['declareInstances'], (done)=>{ STORAGE.db.onready(done); });
PAGE.addNode('start',['loadDB'], mainScenario);

PAGE.run();
*/
