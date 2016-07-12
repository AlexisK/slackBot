
window.MODEL = {};

function inherit(ref, args) {
    if ( !this._inherits || this._inherits.indexOf(ref) != -1 ) { return 0; }
    ref.apply(this, args);
    this._inherits.push(ref);
    
}

function newModel(name, fabric) {
    MODEL[name] = {
        declare: [],
        fabric: fabric
    };
    if ( fabric ) {
        window[name] = fabric;
        window[name.toUpperCase()] = {};
    }
}

function getSelf(ref, key) {
    ref._inherits = ref._inherits||[];
    
    ref.inherit = inherit;
    
    if ( key && MODEL[key] ) {
        MODEL[key].lastInstance = ref;
    }
    
    return ref;
}


newModel('BaseModel', function() {
    var self = getSelf(this);
    
    self.init = function() {
        
    }
    
    self.init();
});







