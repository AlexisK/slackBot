
global.config = {
    locale: "en-US",
    slack: {
        token: "xoxp-58448061859-58491578132-59749251990-710cb5e6c6"
    },
    version: {
        db: 2
    },
    reconnect_timeout: 5000,
    jira: {
        host: 'alexisktestingspace.atlassian.net',
        port: '443',
        user: 'oleksii.kaliuzhnyi@skywindgroup.com',
        password: 'kernel13Adv',
        status: (function(obj) {
            obj.available = [obj.pending, obj.current].join(', ')
            return obj;
        })({
            current: '"In Progress"',
            pending: '"To Do"',
            done: '"Done"'
        })
    }
}
