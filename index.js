#!/usr/bin/env node

const pkg =             require('./package.json');
const log =             require('yalm');
const request =         require('request');
const express =         require('express');
const bodyParser =      require('body-parser');
const fs =              require('fs');
const path =            require('path');
const vm =              require('vm');
const domain =          require('domain');
const scheduler =       require('node-schedule');

let config =            require('./config.js');

log.setLevel(config.verbosity);
log.info(pkg.name, 'version', pkg.version, 'starting');

const modules = {
    fs:                 fs,
    path:               path,
    vm:                 vm,
    domain:             domain,
    'node-schedule':    scheduler,
    request:            request,
    express:            express,
    bodyParser:         bodyParser
};

let scripts =           {};
let _global =           {};
let channels =          {};
let callbacks =         {};
let callbackId =        0;

if (typeof config.channel !== 'object') config.channel = [config.channel];
config.channel.forEach(function (channel) {
    let [token, channelName] = channel.split(/:(.*)/);
    channels[channelName] = token;
});

const app =             express();

app.use(bodyParser.json());
const server = app.listen(config.listenPort, config.listenAddress, () => {
    log.info('server listening on', config.listenAddress + ':' + config.listenPort);
});

app.post('/', (req, res) => {
    if (config.outgoingToken && req.body.token === config.outgoingToken) {
        log.debug('<', req.body.channel_name, req.body.user_name, req.body.text)
        msg(req.body.text, req.body.user_name, req.body.channel_name);
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

function msg(text, user, channel) {
    Object.keys(callbacks).forEach(key => {
        if (typeof callbacks[key].rx === 'object') {
            if (callbacks[key].rx.test(text)) callbacks[key].cb(text.match(callbacks[key].rx), user, channel);
        } else {
            if (callbacks[key].rx === text) callbacks[key].cb(text, user, channel);
        }
    });
}

function nextId() {
    let id = ('00000000' + callbackId.toString(16)).slice(-8);
    callbackId += 1;
    return id;
}

function runScript(script, name) {

    let scriptDir = path.dirname(path.resolve(name));

    log.debug(name, 'creating domain');
    let scriptDomain = domain.create();

    log.debug(name, 'creating sandbox');

    let Sandbox = {

        global:         _global,

        setTimeout:     setTimeout,
        setInterval:    setInterval,
        clearTimeout:   clearTimeout,
        clearInterval:  clearInterval,

        Buffer:         Buffer,

        require: function Sandbox_require(md) {
            if (modules[md]) return modules[md];
            try {
                let tmp;
                if (md.match(/^\.\//) || md.match(/^\.\.\//)) {
                    tmp = './' + path.relative(__dirname, path.join(scriptDir, md));
                } else {
                    tmp = md;
                    if (fs.existsSync(path.join(scriptDir, 'node_modules', md, 'package.json'))) {
                        tmp = './' + path.relative(__dirname, path.join(scriptDir, 'node_modules', md));
                        tmp = path.resolve(tmp);
                    }
                }
                Sandbox.log.debug('require', tmp);
                modules[md] = require(tmp);
                return modules[md];

            } catch (e) {
                let lines = e.stack.split('\n');
                let stack = [];
                for (let i = 6; i < lines.length; i++) {
                    if (lines[i].match(/runInContext/)) break;
                    stack.push(lines[i]);
                }
                log.error(name + ': ' + e.message + '\n' + stack);
            }
        },

        /**
         * @class log
         * @classdesc Log to stdout/stderr. Messages are prefixed with a timestamp and the calling scripts path.
         */
        log: {
            /**
             * Log a debug message
             * @memberof log
             * @method debug
             * @param {...*}
             */
            debug: function Sandbox_log_debug() {
                let args = Array.prototype.slice.call(arguments);
                args.unshift(name + ':');
                log.debug.apply(log, args);
            },
            /**
             * Log an info message
             * @memberof log
             * @method info
             * @param {...*}
             */
            info: function Sandbox_log_info() {
                let args = Array.prototype.slice.call(arguments);
                args.unshift(name + ':');
                log.info.apply(log, args);
            },
            /**
             * Log a warning message
             * @memberof log
             * @method warn
             * @param {...*}
             */
            warn: function Sandbox_log_warn() {
                let args = Array.prototype.slice.call(arguments);
                args.unshift(name + ':');
                log.warn.apply(log, args);
            },
            /**
             * Log an error message
             * @memberof log
             * @method error
             * @param {...*}
             */
            error: function Sandbox_log_error() {
                let args = Array.prototype.slice.call(arguments);
                args.unshift(name + ':');
                log.error.apply(log, args);
            }
        },
        /**
         *
         * @param channel
         * @param text
         */
        pub: function Sandbox_pub(channel, text) {
            if (!channels[channel]) {
                Sandbox.log.error('unknown channel', channel);
                return;
            }
            let payload = {
                username: config.nick,
                text: text
            };
            request({
                method: 'POST',
                url: config.url + channels[channel],
                form: {'payload': JSON.stringify(payload)}
            }, function (err) {
                if (err) {
                    Sandbox.log.error(err);
                } else {
                    Sandbox.log.debug('>', text);
                }
            });
        },
        /**
         * @param rx
         * @param callback
         * @returns {id}
         */
        sub: function Sandbox_sub(rx, callback) {
            let id = nextId();
            callbacks[id] = {
                rx: rx,
                cb: callback
            };
            return id;
        },
        /**
         * @param id
         */
        unsub: function Sandbox_unsub(id) {
            if (!callbacks[id]) {
                Sandbox.log.debug('subscription', id, 'not found');
                return false;
            }
            delete callbacks[id];
            return true;
        },
        /**
         * Schedule recurring and one-shot events
         * @method schedule
         * @param {(string|Date|Object|mixed[])} pattern - pattern or array of patterns. May be cron style string, Date object or node-schedule object literal. See {@link https://github.com/tejasmanohar/node-schedule/wiki}
         * @param {Object} [options]
         * @param {number} [options.random] - random delay execution in seconds. Has to be positive
         * @param {function} callback - is called with no arguments
         * @example // every full Hour.
         * schedule('0 * * * *', callback);
         *
         * // Monday till friday, random between 7:30am an 8:00am
         * schedule('30 7 * * 1-5', {random: 30 * 60}, callback);
         *
         * // once on 21. December 2018 at 5:30am
         * schedule(new Date(2018, 12, 21, 5, 30, 0), callback);
         *
         * // every Sunday at 2:30pm
         * schedule({hour: 14, minute: 30, dayOfWeek: 0}, callback);
         * @see {@link sunSchedule} for scheduling based on sun position.
         */
        schedule: function Sandbox_schedule(pattern, /* optional */ options, callback) {

            if (arguments.length === 2) {
                if (typeof arguments[1] !== 'function') throw new Error('callback is not a function');
                callback = arguments[1];
                options = {};
            } else if (arguments.length === 3) {
                if (typeof arguments[2] !== 'function') throw new Error('callback is not a function');
                options = arguments[1] || {};
                callback = arguments[2];
            } else {
                throw(new Error('wrong number of arguments'));
            }

            if (typeof pattern === 'object' && pattern.length) {
                pattern = Array.prototype.slice.call(topic);
                pattern.forEach(function (pt) {
                    Sandbox.sunSchedule(pt, options, callback);
                });
                return;
            }

            log.debug('schedule()', pattern, options, typeof callback);

            if (options.random) {
                scheduler.scheduleJob(pattern, function () {
                    setTimeout(scriptDomain.bind(callback), (parseFloat(options.random) || 0) * 1000 * Math.random());
                });
            } else {
                scheduler.scheduleJob(pattern, scriptDomain.bind(callback));
            }


        }
    };

    Sandbox.console = {
        log: Sandbox.log.info,
        error: Sandbox.log.error
    };

    log.debug(name, 'contextifying sandbox');
    let context = vm.createContext(Sandbox);

    scriptDomain.on('error', function (e) {
        if (!e.stack) {
            log.error.apply(log, [name + ' unkown exception']);
            return;
        }
        let lines = e.stack.split('\n');
        let stack = [];
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].match(/\[as runInContext\]/)) break;
            stack.push(lines[i]);
        }

        log.error.apply(log, [name + ' ' + stack.join('\n')]);
    });

    scriptDomain.run(function () {
        log.debug(name, 'running');
        script.runInContext(context);
    });
}

function loadScript(file) {
    if (scripts[file]) {
        log.error(file, 'already loaded?!');
        return;
    }
    log.info(file, 'loading');
    fs.readFile(file, function (err, src) {
        if (err && err.code === 'ENOENT') {
            log.error(file, 'not found');
        } else if (err) {
            log.error(file, err);
        } else {
            scripts[file] = createScript(src, file);
            if (scripts[file]) runScript(scripts[file], file);
        }
    });
}

function loadDir(dir) {
    fs.readdir(dir, function (err, data) {
        if (err) {
            if (err.errno = 34) {
                log.error('directory ' + path.resolve(dir) + ' not found');
            } else {
                log.error('readdir', dir, err);
            }
        } else {
            data.sort().forEach(function (file) {
                if (file.match(/\.(js|coffee)$/)) {
                    loadScript(path.join(dir, file));
                }
            });
        }
    });
}

function createScript(source, name) {
    log.debug(name, 'compiling');
    try {
        if (!process.versions.node.match(/^0\.10\./)) {
            // Node.js >= 0.12, io.js
            return new vm.Script(source, {filename: name});
        } else {
            // Node.js 0.10.x
            return vm.createScript(source, name);
        }
    } catch (e) {
        log.error(name, e.name + ':', e.message);
        return false;
    }
}

log.info('loading scripts from', config.scriptDir);
loadDir(config.scriptDir);
