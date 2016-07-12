function $AD(obj, path, params) {
    params = params || {};
    
    if ( !def(obj) ) { return null; }
    if ( typeof(path) == 'string' ) { path = path.split('.'); }
    
    if ( path.length > 0 ) {
        
        if ( !def(obj[path[0]]) && def(params.autocreate) ) {
            obj[path[0]] = CO(params.autocreate);
        }
        if ( !def(obj[path[0]]) ) {
            if ( def(params.autocreate) ) {
                obj[path[0]] = CO(params.autocreate);
            } else if ( def(params.onnull) ) {
                obj[path[0]] = params.onnull(obj, path[0], path);
            }
        }
        
        if ( path.length == 1 ) {
            if ( params.del ) {
                var o = obj[path[0]];
                delete obj[path[0]];
                return o;
            } else if ( def(params.setVal) ) {
                obj[path[0]] = params.setVal;
            }
        }
        
        
        return $AD(obj[path.splice(0,1)[0]], path, params);
    }
    
    return obj;
}
