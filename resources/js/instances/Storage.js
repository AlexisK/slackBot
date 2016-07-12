
MODEL.Storage.declare.push(() => {
    
    new Storage('db', {
        load: (self, done) => {
            var data;
            try {
                data = JSON.parse(localStorage.jF809ga);
            } catch(err) { data = {}; }
            done(data);
        },
        save: (self, done) => {
            localStorage.jF809ga = JSON.stringify(self.storage);
            done();
        }
    });
    
    $P(window,'DB',STORAGE.db.get);
    
    
});
