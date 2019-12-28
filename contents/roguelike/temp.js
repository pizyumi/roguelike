var loginpage = '/roguelike';

app.post('/login', bodyparser.urlencoded({ extended: true }), (req, res, next) => {
    co(function* () {
        if (req.body.name === '') {
            req.flash('error', MSG_NAME);
            res.redirect(loginpage);
        }
        else if (req.body.password === '') {
            req.flash('error', MSG_PASSWORD);
            res.redirect(loginpage);
        }
        else {
            next();
        }
    }).catch(next);
}, passport.authenticate('local', {
    successRedirect: '/dashboard',
    successFlash: '',
    failureRedirect: loginpage,
    failureFlash: true
}));
app.get('/logout', (req, res, next) => {
    req.logout();
    res.redirect(loginpage);
});
app.get(loginpage, (req, res, next) => {
    co(function* () {
        var p = path.join('server', 'roguelike.ejs');
        var data = {
            errors: req.flash('error')
        };
        yield common.send_res_with_html_ejs_from_path(res, p, data);
    }).catch(next);
});
app.get('/dashboard', (req, res, next) => {
    co(function* () {
        if (req.roles.includes('login')) {
            var p = path.join('server', 'dashboard.ejs');
            yield common.send_res_with_html_ejs_from_path(res, p, {});    
        }
        else {
            res.redirect(loginpage);
        }
    }).catch(next);
});
