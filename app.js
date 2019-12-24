var _ = require('underscore');
var co = require('co');

var path = require('path');

var common = require('./common');
var server = require('./server');

module.exports = async () => {
  var configp = path.join('config', 'config.json');
  var config = await common.load_json_from_path(configp);

  var s = await server.start();
  var end_server_once = _.once(server.end);

  console.log('http server is running...press enter key to exit.');
  process.on('SIGTERM', () => {
    co(function* () {
      yield end_server_once(s);
      process.exit(0);
    });
  });
  process.stdin.on('data', (data) => {
    if (data.indexOf('\n') !== -1) {
      co(function* () {
        yield end_server_once(s);
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
