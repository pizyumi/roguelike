var STATS_FIGHT_INBOUND = 0;
var STATS_FIGHT_OUTBOUND = 1;
var STATS_FIGHT_KILLED = 2;

class Statistics {
	constructor () {
		this.fights = [];
	}

	add_fight (c, type, dam) {
		var fs = this.fights[player.depth];
		if (!fs) {
			fs = this.fights[player.depth] = new Map();
		}
		var f = fs.get(c.id);
		if (!f) {
			f = {
				c: c,
				dams: []
			};
			fs.set(c.id, f);
		}
		f.dams.push({
			type: type,
			dam: dam
		});
	}

	get_record (secret) {
		return {
			fights: this.get_fights_all(secret)
		};
	}

	get_fights_all (secret) {
		var all = [];
		for (var i = 0; i <= player.depth; i++) {
			all.push(this.get_fights(i, secret));
		}
		return all;
	}

	get_fights (depth, secret) {
		var fights = [];
		var fs = this.fights[depth];
		if (fs) {
			for (var i of fs.entries()) {
				var c = i[1].c;
				var killed = false;
				var ps = [];
				var cs = [];
				for (var j = 0; j < i[1].dams.length; j++) {
					var dam = i[1].dams[j];
					if (dam.type === STATS_FIGHT_INBOUND) {
						ps.push(dam.dam);
					}
					else if (dam.type === STATS_FIGHT_OUTBOUND) {
						cs.push(dam.dam);
					}
					else if (dam.type === STATS_FIGHT_KILLED) {
						killed = true;
					}
				}
				var pstats = calculate_stats(ps);
				var cstats = calculate_stats(cs);

				var fight = {};
				if (secret) {
					fight.id = c.id;
				}
				fight.dname = c.dname;
				if (secret) {
					fight.level = c.level;
				}
				fight.exp = c.exp;
				fight.killed = killed;
				fight.ps = ps;
				fight.plen = ps.length;
				fight.psum = pstats.sum;
				fight.pmin = pstats.min;
				fight.pmax = pstats.max;
				fight.pavg = Math.round(pstats.avg * 10) / 10;
				fight.cs = cs;
				fight.clen = cs.length;
				fight.csum = cstats.sum;
				fight.cmin = cstats.min;
				fight.cmax = cstats.max;
				fight.cavg = Math.round(cstats.avg * 10) / 10;

				fights.push(fight);
			}
		}
		return fights;
	}
}

function calculate_stats (ds) {
	var sum = 0;
	var min = 65535;
	var max = 0;
	if (ds.length === 0) {
		return {
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
			sum: sum,
			min: min,
			max: max,
			avg: avg
		};
	}
}

function create_statistics_html (parent, record, secret, dark) {
	var columns = [];
    columns.push({ dname: TEXT_KILL, name: 'killed', formatter: (value) => value ? '' : '×' });
    if (secret) {
        columns.push({ dname: TEXT_ID, name: 'id' });
    }
    columns.push({ dname: TEXT_NAME, name: 'dname' });
    if (secret) {
        columns.push({ dname: TEXT_LEVEL, name: 'level' });
    }
    columns.push({ dname: TEXT_EXP, name: 'exp' });
    columns.push({ dname: TEXT_IN_DAMAGE, name: 'ps', formatter: (value) => value.join(',') });
    columns.push({ dname: TEXT_NUM, name: 'plen' });
    columns.push({ dname: TEXT_SUM, name: 'psum' });
    columns.push({ dname: TEXT_MIN, name: 'pmin', formatter: (value) => value === null ? '-' : value });
    columns.push({ dname: TEXT_MAX, name: 'pmax', formatter: (value) => value === null ? '-' : value });
    columns.push({ dname: TEXT_AVG, name: 'pavg', formatter: (value) => value === null ? '-' : value });
    columns.push({ dname: TEXT_OUT_DAMAGE, name: 'cs', formatter: (value) => value.join(',') });
    columns.push({ dname: TEXT_NUM, name: 'clen' });
    columns.push({ dname: TEXT_SUM, name: 'csum' });
    columns.push({ dname: TEXT_MIN, name: 'cmin', formatter: (value) => value === null ? '-' : value });
    columns.push({ dname: TEXT_MAX, name: 'cmax', formatter: (value) => value === null ? '-' : value });
    columns.push({ dname: TEXT_AVG, name: 'cavg', formatter: (value) => value === null ? '-' : value });

    var h1_fights = $('<h1>' + TEXT_FIGHT + TEXT_DETAIL + '</h1>');
    parent.append(h1_fights);
    for (var i = 0; i < record.fights.length; i++) {
        var h2 = $('<h2>' + i + TEXT_DEPTH + '</h2>');
		parent.append(h2);
		var table = create_table(columns, record.fights[i]);
		if (dark) {
			table.addClass('table-dark');
		}
		parent.append(table);
    }
}

function create_table (columns, data) {
	var table = $('<table class="table table-striped"></table>');
	var thead = $('<thead></thead>');
	table.append(thead);
	var theadr = $('<tr></tr>');
	thead.append(theadr);
	for (var i = 0; i < columns.length; i++) {
		theadr.append($('<th>' + columns[i].dname + '</th>'));
	}
	var tbody = $('<tbody></tbody>');
	table.append(tbody);
	for (var i = 0; i < data.length; i++) {
		var tbodyr = $('<tr></tr>');
		tbody.append(tbodyr);
		for (var j = 0; j < columns.length; j++) {
			var d = data[i][columns[j].name];
			if (columns[j].formatter) {
				d = columns[j].formatter(d);
			}
			tbodyr.append($('<td>' + d + '</td>'));
		}
	}
	return table;
}

class Random {
	constructor (seed) {
		this.seed = seed;
		this.hash = hash(seed);
		this.pointer = 0;
	}

	byte () {
		if (this.pointer === 64) {
			this.hash = hash(this.hash);
			this.pointer = 0;
		}
		var value = this.hash.substring(this.pointer, this.pointer + 2);
		this.pointer += 2;
		return parseInt(value, 16);
	}

	twobytes () {
		return this.byte() * 256 + this.byte();
	}

	num (max) {
		if (max <= 0) {
			throw new Error('max of random.num must be positive.');
		}
		else if (max <= 128) {
			return this.byte() % max;
		}
		else if (max <= 32768) {
			return this.twobytes() % max;
		}
		else {
			throw new Error('not supported.');
		}
	}

	fraction () {
		return this.byte() / 256;
	}

	select (table) {
		var sum = 0;
		for (var i of table.entries()) {
			sum += i[1];
		}
		var num = this.num(sum);
		var sum2 = 0;
		for (var i of table.entries()) {
			sum2 += i[1];
			if (num < sum2) {
				return i[0];
			}
		}
	}
}

function hash (seed) {
	var sha256 = new jsSHA('SHA-256', 'TEXT');
	sha256.update(seed);
	return sha256.getHash('HEX');
}

function test_random_class_byte () {
	var a = [68, 9, 150, 66, 71, 184, 42, 152,
		84, 31, 148, 195, 79, 121, 253, 235,
		87, 142, 108, 87, 64, 95, 18, 186,
		184, 92, 200, 43, 179, 155, 117, 136,
		209, 241, 173, 107, 190, 11, 178, 50];
	var r = new Random('yurina');
	for (var i = 0; i < a.length; i++) {
		if (r.byte() !== a[i]) {
			throw new Error('test_random_class_byte');
		}
	}
}

function test_random_class_twobytes () {
	var a = [17417, 38466, 18360, 10904, 21535, 38083, 20345, 65003];
	var r = new Random('yurina');
	for (var i = 0; i < a.length; i++) {
		if (r.twobytes() !== a[i]) {
			throw new Error('test_random_class_twobytes');
		}
	}
}

function test_random_class_num () {
	var a = [0, 1, 0, 2, 1, 4, 0, 0, 3, 1, 5, 3, 1, 9, 13, 11];
	var r = new Random('yurina');
	for (var i = 0; i < a.length; i++) {
		if (r.num(i + 1) !== a[i]) {
			throw new Error('test_random_class_num');
		}
	}
}

function test_random_class_num2 () {
	var a = [2, 116, 20, 80, 122, 27, 95, 131];
	var r = new Random('yurina');
	for (var i = 0; i < a.length; i++) {
		if (r.num(i + 129) !== a[i]) {
			throw new Error('test_random_class_num2');
		}
	}
}

function test_random_class_select () {
	var table = new Map();
	table.set('a', 5);
	table.set('b', 15);
	table.set('c', 20);
	table.set('d', 10);
	table.set('e', 30);
	table.set('f', 20);

	var a = ['e', 'b', 'e', 'e', 'e', 'f', 'd', 'e',
	  'f', 'c', 'd', 'f', 'e', 'c', 'e', 'c',
		'f', 'd', 'b', 'f', 'e', 'f', 'b', 'f',
		'f', 'f', 'a', 'd', 'e', 'e', 'b', 'c'];
	var r = new Random('yurina');
	for (var i = 0; i < a.length; i++) {
		if (r.select(table) !== a[i]) {
			throw new Error('test_random_class_select');
		}
	}
}

Array.prototype.pushrandom = function (item) {
	this.splice(Math.floor(Math.random() * (this.length + 1)), 0, item);
}

Promise.prototype.nullthen = function (next) {
	return this.then((r) => {
		if (r === null) {
			return next(r);
		}
		else {
			return r;
		}
	});
}
