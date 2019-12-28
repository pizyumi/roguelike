var _ = require('underscore');
var co = require('co');
var express = require('express');
var morgan = require('morgan');

var common = require('./common');

var obj = {};

obj = _.extend(obj, {
    get: async (routers) => {
        var app = express();
        app.set('x-powered-by', false);
        app.set('case sensitive routing', true);
        app.set('strict routing', true);
        app.use(morgan('dev'));
        routers.forEach((v) => app.use('/', v));
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
        return app;
    }
});

module.exports = obj;
