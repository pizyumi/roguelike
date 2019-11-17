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
        app.use('/mp3', express.static('../mp3'));
        app.use('/dev', express.static('../dev'));
        app.get('/get-versions', (req, res, next) => {
          co(function* () {
            var p = path.join('..', 'record');
            var versions = (yield common.load_folders_from_path(p)).map((i) => path.basename(i));
            yield common.send_res_with_json(res, versions);
          }).catch(next);
        });
        app.get('/get-names', (req, res, next) => {
          co(function* () {
            var data = req.query;
            var p = path.join('..', 'record', data.version);
            var names = (yield common.load_folders_from_path(p)).map((i) => path.basename(i));
            yield common.send_res_with_json(res, names);
          }).catch(next);
        });
        app.get('/get-records', (req, res, next) => {
          co(function* () {
            var data = req.query;
            var p = path.join('..', 'record', data.version, data.name);
            var records = (yield common.load_files_from_path(p)).map((i) => path.basename(i, path.extname(i)));
            yield common.send_res_with_json(res, records);
          }).catch(next);
        });
        app.get('/get-record', (req, res, next) => {
          co(function* () {
            var data = req.query;
            var p = path.join('..', 'record', data.version, data.name, data.record + '.json');
            var record = yield common.load_json_from_path(p);
            yield common.send_res_with_json(res, record);
          }).catch(next);
        });
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
