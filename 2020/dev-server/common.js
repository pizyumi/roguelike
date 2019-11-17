var _ = require('underscore');
var bluebird = require('bluebird');
var fsextra = bluebird.promisifyAll(require('fs-extra'));

var fs = bluebird.promisifyAll(require('fs'));
var http = require('http');
var path = require('path');

var obj = {};

obj = _.extend(obj, {
  save_text_to_path: async (p, text) => {
    await fsextra.mkdirsAsync(path.dirname(p));
    await fs.writeFileAsync(p, text, 'utf-8');
  }, 
  save_json_to_path: async (p, json) => {
    await obj.save_text_to_path(p, JSON.stringify(json));
  }
});

obj = _.extend(obj, {
	send_res_with_message: async (res, status, message) => {
    res.type('text/plain; charset=utf-8');
    res.status(status);
    res.send((message ? message : http.STATUS_CODES[status]) + '\r\n');
	}
});

module.exports = obj;
