var _ = require('underscore');
var bluebird = require('bluebird');
var colors = require('colors');
var ejs = require('ejs');
var fsextra = bluebird.promisifyAll(require('fs-extra'));
var piteration = require('p-iteration');
var stripbom = require('strip-bom');

var fs = bluebird.promisifyAll(require('fs'));
var http = require('http');
var path = require('path');

var obj = {};

obj = _.extend(obj, {
    load_files_folders_from_path: async (p) => {
        return _(await fs.readdirAsync(p)).map((v) => path.join(p, v));
    },
    load_files_from_path: async (p) => {
        return piteration.filterSeries(await obj.load_files_folders_from_path(p), async (v) => (await fs.statAsync(v)).isFile());
    },
    load_folders_from_path: async (p) => {
        return piteration.filterSeries(await obj.load_files_folders_from_path(p), async (v) => (await fs.statAsync(v)).isDirectory());
    },
    load_text_from_path: async (p) => {
        return stripbom(await fs.readFileAsync(p, 'utf-8'));
    },
    load_json_from_path: async (p) => {
        return JSON.parse(await obj.load_text_from_path(p));
    },
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
    },
    send_res_with_json: async (res, json) => {
        res.json(json);
    },
    send_res_with_html: async (res, html) => {
        res.type('text/html; charset=utf-8');
        res.status(200);
        res.send(html);
    },
    send_res_with_html_ejs: async (res, template, data) => {
        var html = ejs.render(template, data);
        await obj.send_res_with_html(res, html);
    },
    send_res_with_html_ejs_from_path: async (res, p, data) => {
        var template = await obj.load_text_from_path(p);
        await obj.send_res_with_html_ejs(res, template, data);
    }
});

obj = _.extend(obj, {
    get_item: async (db, table, ids) => {
        var wobj = _.extend({}, ids, { delete_date: null });
        var sql = obj.create_select_sql(table, wobj);
        return await obj.select_one_by_sql(db, sql, ids);
    }
});

obj = _.extend(obj, {
    create_where_sql_clause: (wobj) => {
        return _(Object.keys(wobj)).map((v) => {
            if (wobj[v] === null) {
                return v + ' is ' + 'null';
            }
            else {
                return v + ' = ' + '@' + v;
            }
        }).join(' and ');
    },
    create_select_sql: (table, wobj) => {
        var where = obj.create_where_sql_clause(wobj);
        if (_.isEmpty(wobj)) {
            return `select * from ${table}`;
        }
        else {
            return `select * from ${table} where ${where}`;
        }
    }
});

obj = _.extend(obj, {
    execute_sql: async (db, sql) => {
        console.log(sql.yellow);

        return await db.query(sql);
    },
    execute_sql_with_params: async (db, sql, params) => {
        var { s, ps } = transform_params(sql, params);

        console.log(s.yellow);
        console.log(ps);

        return await db.query(s, ps);
    },
    select_by_sql: async (db, sql, params) => {
        return (await obj.execute_sql_with_params(db, sql, params)).rows;
    },
    select_one_by_sql: async (db, sql, params) => {
        var rows = await obj.select_by_sql(db, sql, params);
        if (rows.length === 0) {
            return null;
        }
        else if (rows.length === 1) {
            return rows[0];
        }
        else {
            throw new Error('more than one records.');
        }
    }
});

function transform_params(sql, params) {
    var s = sql;
    var ps = [];
    var c = 0;

    _(Object.keys(params)).each((v) => {
        var p1 = '@' + v;
        var p2 = '$' + (c + 1);

        if (s.indexOf(p1) !== -1) {
            s = s.replace(p1, p2);
            ps.push(params[v]);
            c++;
        }
    });

    return { s, ps };
}

module.exports = obj;
