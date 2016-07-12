


var mainScenario = PF((done, fail) => {
    // GLOBALEVENT.click.add((ev) => console.log('Click!'));
    
    
    slack.req('auth.test').then(data=> console.log(data));
    slack.req('channels.list').then(data=>{
        console.log(data);
    });
    slack.when_ready(()=>{ console.log('All done!', slack.db.channel, slack.db.user); })
    
    
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
