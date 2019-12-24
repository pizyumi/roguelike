var _ = require('underscore');
var pg = require('pg');

var obj = {};

obj = _.extend(obj, {
    connect: async (config) => {
        var db = new pg.Pool(config.db);
        db.on('error', (err) => {
            console.error(err);
            process.exit(1);
        });
        return db;
    },
    disconnect: async (db) => {
        await db.end();
    }
});

module.exports = obj;
