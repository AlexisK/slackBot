function ajaxRequest(method, path, data, todo) {
    if ( typeof(data) == 'function' ) {
        todo = data;
        data = {};
    }
	data = data || {};
	todo = todo || function(data) {
		console.log(data);
	}
	
	var r = new XMLHttpRequest();
	r.onreadystatechange = (ev) => {
		if ( r.readyState == 4 ) {
			let reqData;
			try {
				reqData = JSON.parse(r.responseText);
			} catch(err) {
				reqData = r.responseText;
			}
			todo(reqData, r, ev);
		}
	}
	r.open(method, path);
	r.send(JSON.stringify(data));
}
