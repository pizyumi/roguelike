var _ = require('underscore');
var bluebird = require('bluebird');
var bodyparser = require('body-parser');
var co = require('co');
var express = require('express');
var morgan = require('morgan');
var sanitizefilename = require("sanitize-filename");

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
        app.use('/roguelike', express.static('web'));
        app.use('/roguelike', express.static('release'));
        app.use('/roguelike', express.static('release/0.1'));
        app.use('/lib', express.static('lib'));
        app.use('/img', express.static('img'));
        app.use('/mp3', express.static('mp3'));
        app.use('/dev', express.static('dev'));
        app.get('/get-versions', (req, res, next) => {
          co(function* () {
            var p = 'record';
            var versions = (yield common.load_folders_from_path(p)).map((i) => path.basename(i));
            yield common.send_res_with_json(res, versions);
          }).catch(next);
        });
        app.get('/get-names', (req, res, next) => {
          co(function* () {
            var data = req.query;
            var p = path.join('record', data.version);
            var names = (yield common.load_folders_from_path(p)).map((i) => path.basename(i));
            yield common.send_res_with_json(res, names);
          }).catch(next);
        });
        app.get('/get-records', (req, res, next) => {
          co(function* () {
            var data = req.query;
            var p = path.join('record', data.version, data.name);
            var records = (yield common.load_files_from_path(p)).map((i) => path.basename(i, path.extname(i)));
            yield common.send_res_with_json(res, records);
          }).catch(next);
        });
        app.get('/get-record', (req, res, next) => {
          co(function* () {
            var data = req.query;
            var p = path.join('record', data.version, data.name, data.record + '.json');
            var record = yield common.load_json_from_path(p);
            yield common.send_res_with_json(res, record);
          }).catch(next);
        });
        app.get('/get-summary', (req, res, next) => {
          co(function* () {
            var data = req.query;
            var p = path.join('record', data.version, data.name);
            var files = yield common.load_files_from_path(p);
            var fights = [];
            var dies = [];
            for (var i = 0; i < files.length; i++) {
              var record = yield common.load_json_from_path(files[i]);
              for (var j = 0; j < record.fights.length; j++) {
                var c = fights[j];
                if (c) {
                  fights[j] = fights[j].concat(record.fights[j]);
                }
                else {
                  fights[j] = record.fights[j];
                }
              }
              dies.push(record.die);
            }
            var fights_summary = [];
            for (var i = 0; i < fights.length; i++) {
              fights_summary[i] = calculate_fights_summary(fights[i]);
            }
            var summary = {
              fights: fights_summary, 
              dies: calculate_dies_summary(dies)
            };
            yield common.send_res_with_json(res, summary);
          }).catch(next);
        });
        app.use(bodyparser.json());
        app.post('/add-record', (req, res, next) => {
          co(function* () {
            var record = req.body;
            if (record.name === 'anonymous') {
              record.name = get_ip(req);
            }
            var p = path.join('record', record.version, sanitizefilename(record.name), record.id + '.json');
            yield common.save_json_to_path(p, record);
            yield common.send_res_with_json(res, {});
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
        var server = app.listen(process.env.PORT || 80, () => {
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

function get_ip (req) {
  if (req.headers['x-forwarded-for']) {
    return req.headers['x-forwarded-for'];
  }
  if (req.connection && req.connection.remoteAddress) {
    return req.connection.remoteAddress;
  }
  if (req.connection.socket && req.connection.socket.remoteAddress) {
    return req.connection.socket.remoteAddress;
  }
  if (req.socket && req.socket.remoteAddress) {
    return req.socket.remoteAddress;
  }
  return '0.0.0.0';
}

function calculate_stats (ds) {
	var sum = 0;
	var min = 65535;
	var max = 0;
	if (ds.length === 0) {
		return {
      len: ds.length, 
			sum: 0,
			min: NaN,
			max: NaN,
			avg: NaN
		};
	}
	else {
		for (var i = 0; i < ds.length; i++) {
			sum += ds[i];
			if (ds[i] < min) {
				min = ds[i];
			}
			if (ds[i] > max) {
				max = ds[i];
			}
		}
		var avg = sum / ds.length;
		return {
      len: ds.length, 
			sum: sum,
			min: min,
			max: max,
			avg: avg
		};
	}
}

function calculate_distribution (ds, span) {
  var distribution = [];
  for (var i = 0; i < ds.length; i++) {
    var index = Math.floor(ds[i] / span);
    if (distribution[index]) {
      distribution[index]++;
    }
    else {
      distribution[index] = 1;
    }
  }
  return {
    span: span, 
    distribution: distribution
  };
}

function calculate_dies_summary (dies) {
	var depths = [];
	var levels = [];
	var hps = [];
	var energies = [];
	var atks = [];
	var defs = [];
  var exps = [];
  for (var i = 0; i < dies.length; i++) {
		depths.push(dies[i].depth);
		levels.push(dies[i].level);
		hps.push(dies[i].hp);
		energies.push(dies[i].energy);
		atks.push(dies[i].atk);
		defs.push(dies[i].def);
		exps.push(dies[i].exp);
	}
	return {
		depth: _.extend(calculate_stats(depths), calculate_distribution(depths, 1)), 
		level: _.extend(calculate_stats(levels), calculate_distribution(levels, 1)), 
		hp: _.extend(calculate_stats(hps), calculate_distribution(hps, 10)), 
		energy: _.extend(calculate_stats(energies), calculate_distribution(energies, 100)), 
		atk: _.extend(calculate_stats(atks), calculate_distribution(atks, 10)), 
		def: _.extend(calculate_stats(defs), calculate_distribution(defs, 10)), 
		exp: _.extend(calculate_stats(exps), calculate_distribution(exps, 100))
	};
}

function calculate_fights_summary (fights) {
	var levels = [];
	var exps = [];
	var plens = [];
	var clens = [];
	var cpdiffs = [];
	var psums = [];
	var csums = [];
	var ps = [];
	var cs = [];
	for (var i = 0; i < fights.length; i++) {
		levels.push(fights[i].level);
		exps.push(fights[i].exp);
		plens.push(fights[i].plen);
		clens.push(fights[i].clen);
		cpdiffs.push(fights[i].clen - fights[i].plen);
		psums.push(fights[i].psum);
		csums.push(fights[i].csum);
		Array.prototype.push.apply(ps, fights[i].ps);
		Array.prototype.push.apply(cs, fights[i].cs);
	}
	return {
		level: calculate_stats(levels), 
		exp: calculate_stats(exps), 
		plen: calculate_stats(plens), 
		clen: calculate_stats(clens), 
		cpdiff: calculate_stats(cpdiffs), 
		psum: calculate_stats(psums), 
		csum: calculate_stats(csums), 
		p: calculate_stats(ps), 
		c: calculate_stats(cs)
	};
}

module.exports = obj;
