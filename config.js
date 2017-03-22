module.exports = require('yargs')
    .option('s', {
        alias: 'script-dir',
        default: '/etc/waldorf/scripts'
    })
    .option('u', {
        alias: 'url',
        demandOption: true,
        default: 'http://127.0.0.1:8065/hooks/'
    })
    .option('c', {
        alias: 'channel',
        demandOption: true,
        description: '<channel-token>:<channel-name> (may be repeated)'
    })
    .option('v', {
        alias: 'verbosity',
        default: 'info'
    })
    .option('t', {
        alias: 'outgoing-token'
    })
    .option('p', {
        alias: 'listen-port',
        default: 31337
    })
    .option('a', {
        alias: 'listen-address',
        default: '127.0.0.1'
    })
    .option('n', {
        alias: 'nick',
        demandOption: true,
        default: 'waldorf'
    })
    .help()
    .version()
    .argv;
