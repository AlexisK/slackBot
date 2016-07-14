
function sendAsBot(resp, msg, botname) {
    slack.req('chat.postMessage', {
        channel: resp.channel,
        text: msg.replace('&', '&amp;')
                 .replace('<', '&lt;')
                 .replace('>', '&gt;'),
        as_user: false,
        username: botname||'R2Dbot'
    });
}


function parseMessage() {
    var base = Array.prototype.splice.call(arguments, 0, 1)[0].trim().split(/[\s\,]+/g);
    var result = {};
    for ( var i = 0, len = Math.min(arguments.length, base.length); i < len; i++ ) {
        def(arguments[i]) && (result[arguments[i]] = base[i]);
    }
    if ( base.length > arguments.length ) {
        result.args = base.slice(arguments.length);
    }
    return result;
}



MODEL.MessageHandler.declare.push(()=>{
    
    new MessageHandler('status', (self, t, user, resp)=> {
        sendAsBot(resp, `${user.name}`,'STATUS');
    });
    
    new MessageHandler(/(^|\W)(hello|hi|yo)($||W)/gi, (self, text, user, resp) => {
        sendAsBot(resp, `Hi, ${user.name}`);
    } );
    
    new MessageHandler(/(^|\W)tasks\s+([\d\w ]+)\s*$/gi, (self, text, user, slackResp) => {
        var req = parseMessage(text, null, 'name', 'status');
        req.status = req.status || 'available';
        
        PROTOCOL.jira.write('userIssues', req, resp => {
            console.log(resp);
            sendAsBot(slackResp, `${req.name}: tasks with status ${req.status}`);
            resp.issues.forEach(issue => {
                sendAsBot(slackResp, `${issue.key} ${issue.fields.status.name} : ${issue.fields.summary}`);
            });
        });
    } );
    
    
    
});
