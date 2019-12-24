var path = require('path');

var common = require('../common');
var config = require('../config');
var db = require('../db');

module.exports = async (f) => {
    var c = await config.get();
    var d = await db.connect(c);

    var p = path.join(__dirname, 'sql', f);
    var sql = await common.load_text_from_path(p);
    await common.execute_sql(d, sql);

    await db.disconnect(d);
};

async function main() {
    if (process.argv[2]) {
        await module.exports(process.argv[2]);
    }
    else {
        console.error('specify sql file name to execute.');
    }
}

if (module.parent === null) {
    main().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
