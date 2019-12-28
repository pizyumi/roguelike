var _ = require('underscore');
var co = require('co');
var connectflash = require('connect-flash');
var connectredis = require('connect-redis');
var expresssession = require('express-session');
var express = require('express');
var morgan = require('morgan');
var passport = require('passport');
var passportlocal = require('passport-local');
var redis = require('redis');

var common = require('./common');

var MSG_NAME = 'ユーザーIDを入力してください。';
var MSG_PASSWORD = 'パスワードを入力してください。';
var MSG_WRONG_ID_PASSWORD = 'ユーザーIDかパスワードが間違っています。';

var obj = {};

obj = _.extend(obj, {
    get: async (config, routers) => {
        passport.use(new passportlocal.Strategy({
            usernameField: 'name',
            passwordField: 'password',
            passReqToCallback: true
        }, (req, name, password, done) => {
            if (name === '') {
                done(null, false, { message: MSG_NAME });
            }
            else if (password === '') {
                done(null, false, { message: MSG_PASSWORD });
            }
            else {
                co(function* () {
                    var user = yield common.get_item(d, 't_user', { name });
                    if (user === null) {
                        done(null, false, { message: MSG_WRONG_ID_PASSWORD });
                    }
                    else {
                        if (password !== user.password) {
                            done(null, false, { message: MSG_WRONG_ID_PASSWORD });
                        }
                        else {
                            done(null, user);
                        }
                    }
                }).catch(done);
            }
        }));
        passport.serializeUser((user, done) => {
            done(null, user.id);
        });
        passport.deserializeUser((id, done) => {
            co(function* () {
                var user = yield common.get_item(d, 't_user', { id });
                if (user === null) {
                    done(null, {});
                }
                else {
                    done(null, user);
                }
            }).catch(done);
        });

        var RedisStore = connectredis(expresssession);

        var app = express();
        app.set('x-powered-by', false);
        app.set('case sensitive routing', true);
        app.set('strict routing', true);
        app.use(morgan('dev'));
        app.use(expresssession({
            store: new RedisStore({ client: redis.createClient() }),
            secret: config.session.secret,
            resave: false,
            saveUninitialized: false
        }));
        app.use(connectflash());
        app.use(passport.initialize());
        app.use(passport.session());
        app.use((req, res, next) => {
            req.roles = [];
            if (req.user) {
                req.roles.push('login');
                if (req.user.id === 1) {
                    req.roles.push('administrator');
                }
            }
            next();
        });
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
