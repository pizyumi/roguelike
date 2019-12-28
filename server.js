var _ = require('underscore');
var bluebird = require('bluebird');
var co = require('co');

var obj = {};

obj = _.extend(obj, {
    start: (config, web) => {
        return new bluebird((resolve, reject) => {
            co(function* () {
                var port = 3000;
                if (config.server && config.server.port) {
                    port = config.server.port;
                }
                else if (process.env.PORT) {
                    port = process.env.PORT;
                }
                var server = web.listen(port, () => {
                    console.log('http server is running...');
                    resolve(server);
                });
                server.on('error', (err) => {
                    console.error(err);
                    process.exit(1);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    },
    end: (server) => {
        return new bluebird((resolve, reject) => {
            console.log('http server is closing...');
            server.close(() => {
                console.log('http server closed.');
                resolve(server);
            });
        });
    }
});

module.exports = obj;
