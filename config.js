var _ = require('underscore');

var path = require('path');

var common = require('./common');

var obj = {};

obj = _.extend(obj, {
    get: async () => {
        var p = path.join(__dirname, 'config', 'config.json');
        var config = await common.load_json_from_path(p);
        return config;
    }
});

module.exports = obj;
