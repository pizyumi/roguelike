var _ = require('underscore');
var bluebird = require('bluebird');
var bodyparser = require('body-parser');
var co = require('co');
var express = require('express');
var morgan = require('morgan');

var path = require('path');

var common = require('./common');

var obj = {};

obj = _.extend(obj, {
  start: () => {
    return new bluebird((resolve, reject) => {
      co(function* () {
        var app = express();
        app.set('x-powered-by', false);
        app.set('case sensitive routing', true);
        app.set('strict routing', true);
        app.use(morgan('dev'));
        app.use('/', express.static('../public'));
        app.use('/lib', express.static('../lib'));
        app.use('/img', express.static('../img'));
        app.use('/dev', express.static('../dev'));
        app.use(bodyparser.json());
        app.post('/add-record', (req, res, next) => {
          co(function* () {
            var record = req.body;
            var p = path.join('..', 'record', record.version, record.name, record.id + '.json');
            yield common.save_json_to_path(p);
          }).catch(next);
        });
        app.get('*', (req, res, next) => next({ status: 404 }));
        app.post('*', (req, res, next) => next({ status: 404 }));
        app.all('*', (req, res, next) => next({ status: 405 }));
        app.use((err, req, res, next) => {
          co(function* () {
            if (err.status) {
              yield common.send_res_with_message(res, err.status, err.message);
            }
            else {
              yield common.send_res_with_message(res, 500);

              console.error(err);
            }
          }).catch(next);
        });
        var server = app.listen(3000, () => {
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
