var _ = require('underscore');
var co = require('co');

var config = require('./config');
var db = require('./db');
var roguelike = require('./contents/roguelike/roguelike');
var web = require('./web');
var server = require('./server');

module.exports = async () => {
    var c = await config.get();
    var d = await db.connect(c);
    var w = await web.get(c, [
        await roguelike.get('')
    ]);
    var s = await server.start(c, w);
    var end_server_once = _.once(server.end);
    var disconnect_db_once = _.once(db.disconnect);

    console.log('press enter key to exit.');
    process.on('SIGTERM', () => {
        co(function* () {
            yield end_server_once(s);
            yield disconnect_db_once(d);
            process.exit(0);
        });
    });
    process.stdin.on('data', (data) => {
        if (data.indexOf('\n') !== -1) {
            co(function* () {
                yield end_server_once(s);
                yield disconnect_db_once(d);
                process.exit(0);
            });
        }
    });
};

async function main() {
    await module.exports();
}

if (module.parent === null) {
    main().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
