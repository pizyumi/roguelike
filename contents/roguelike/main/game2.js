var STATS_FIGHT_INBOUND = 0;
var STATS_FIGHT_OUTBOUND = 1;
var STATS_FIGHT_KILLED = 2;

var STATS_ACTION_MOVE = 0;
var STATS_ACTION_ATTACK = 1;
var STATS_ACTION_REST = 2;
var STATS_ACTION_PICKUP = 3;
var STATS_ACTION_HURL = 4;
var STATS_ACTION_PUT = 5;
var STATS_ACTION_USE = 6;

var STATS_DIE_KILLED = 0;
var STATS_DIE_FATAL_STATES = 1;
var STATS_DIE_TRAP = 2;

class Statistics {
	constructor () {
		this.fights = [];
		this.turns = [];
		this.actions = [];
		this.die = null;
	}

	add_fight (depth, c, type, dam) {
		var fs = this.fights[depth];
		if (!fs) {
			fs = this.fights[depth] = new Map();
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

	add_turn (depth) {
		if (!this.turns[depth]) {
			this.turns[depth] = 0;
		}
		this.turns[depth]++;
	}

	add_action (depth, type) {
		var actions = this.actions[depth];
		if (!actions) {
			actions = this.actions[depth] = {};
			actions[STATS_ACTION_MOVE] = 0;
			actions[STATS_ACTION_ATTACK] = 0;
			actions[STATS_ACTION_REST] = 0;
			actions[STATS_ACTION_PICKUP] = 0;
			actions[STATS_ACTION_PUT] = 0;
			actions[STATS_ACTION_USE] = 0;			
		}
		actions[type]++;
	}

	add_die (reason, player) {
		this.die = {
			reason: reason, 
			depth: player.depth, 
			level: player.level, 
			hp: player.hpfull, 
			energy: player.energyfull, 
			atk: player.atkfull, 
			def: player.deffull, 
			exp: player.exp, 
			poison: player.poison, 
			hungry: player.hungry, 
			famine: player.famine
		};
	}

	get_record (secret) {
		return {
			fights: this.get_fights_all(secret), 
			turns: this.turns, 
			actions: this.actions, 
			die: this.die
		};
	}

	get_fights_all (secret) {
		var all = [];
		for (var i = 0; i < this.fights.length; i++) {
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
				fight.pavg = round(pstats.avg, 1);
				fight.cs = cs;
				fight.clen = cs.length;
				fight.csum = cstats.sum;
				fight.cmin = cstats.min;
				fight.cmax = cstats.max;
				fight.cavg = round(cstats.avg, 1);

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

function create_summary_html (parent, summary) {
	var h1_die = $('<h1>' + TEXT_DIE + TEXT_SUMMARY + '</h1>');
	parent.append(h1_die);
	create_die_summary_table(parent, summary.dies);
    var h1_per_depth = $('<h1>' + TEXT_DEPTH + TEXT_PER + TEXT_SUMMARY + '</h1>');
	parent.append(h1_per_depth);
	create_fight_summary_table(parent, summary.fights, 'level', TEXT_LEVEL);
	create_fight_summary_table(parent, summary.fights, 'exp', TEXT_EXP);
	create_fight_summary_table(parent, summary.fights, 'plen', TEXT_IN_DAMAGE + TEXT_NUM);
	create_fight_summary_table(parent, summary.fights, 'clen', TEXT_OUT_DAMAGE + TEXT_NUM);
	create_fight_summary_table(parent, summary.fights, 'cpdiff', TEXT_DIFF);
	create_fight_summary_table(parent, summary.fights, 'psum', TEXT_IN_DAMAGE + TEXT_SUM);
	create_fight_summary_table(parent, summary.fights, 'csum', TEXT_OUT_DAMAGE + TEXT_SUM);
	create_fight_summary_table(parent, summary.fights, 'p', TEXT_IN_DAMAGE);
	create_fight_summary_table(parent, summary.fights, 'c', TEXT_OUT_DAMAGE);
}

var fight_summary_columns = [
	{ dname: TEXT_DEPTH, name: 'depth' }, 
	{ dname: TEXT_MIN, name: 'min', formatter: (value, row) => value === null ? '-' : value }, 
	{ dname: TEXT_MAX, name: 'max', formatter: (value, row) => value === null ? '-' : value }, 
	{ dname: TEXT_AVG, name: 'avg', formatter: (value, row) => value === null ? '-' : round(value, 1) }
];

function create_fight_summary_table (parent, summary, name, text) {
	var data = summary.map((item, index) => _.extend(item[name], { depth: index }));

	var h2 = $('<h2>' + text + '</h2>');
	parent.append(h2);
	var table = create_table(fight_summary_columns, data);
	parent.append(table);
}

var die_summary_columns = [
	{ dname: TEXT_PROPERTY, name: 'prop' }, 
	{ dname: TEXT_MIN, name: 'min', formatter: (value, row) => value === null ? '-' : value }, 
	{ dname: TEXT_MAX, name: 'max', formatter: (value, row) => value === null ? '-' : value }, 
	{ dname: TEXT_AVG, name: 'avg', formatter: (value, row) => value === null ? '-' : round(value, 1) }, 
	{ dname: TEXT_DISTRIBUTION, name: 'distribution' }
];

function create_die_summary_table (parent, summary) {
	var data = [];
	data.push(_.extend({}, summary.depth, {
		prop: TEXT_DEPTH, 
		distribution: create_button(TEXT_DISTRIBUTION, () => show_distribution(summary.depth, TEXT_DEPTH))
	}));
	data.push(_.extend({}, summary.level, {
		prop: TEXT_LEVEL, 
		distribution: create_button(TEXT_DISTRIBUTION, () => show_distribution(summary.level, TEXT_LEVEL))
	}));
	data.push(_.extend({}, summary.hp, {
		prop: TEXT_HP, 
		distribution: create_button(TEXT_DISTRIBUTION, () => show_distribution(summary.hp, TEXT_HP))
	}));
	data.push(_.extend({}, summary.energy, {
		prop: TEXT_ENERGY, 
		distribution: create_button(TEXT_DISTRIBUTION, () => show_distribution(summary.energy, TEXT_ENERGY))
	}));
	data.push(_.extend({}, summary.atk, {
		prop: TEXT_ATK, 
		distribution: create_button(TEXT_DISTRIBUTION, () => show_distribution(summary.atk, TEXT_ATK))
	}));
	data.push(_.extend({}, summary.def, {
		prop: TEXT_DEF, 
		distribution: create_button(TEXT_DISTRIBUTION, () => show_distribution(summary.def, TEXT_DEF))
	}));
	data.push(_.extend({}, summary.exp, {
		prop: TEXT_EXP, 
		distribution: create_button(TEXT_DISTRIBUTION, () => show_distribution(summary.exp, TEXT_EXP))
	}));

	var h2 = $('<h2>' + TEXT_ABSTRACT + '</h2>');
	parent.append(h2);
	var table = create_table(die_summary_columns, data);
	parent.append(table);
}

function create_statistics_html (parent, record, secret, dark) {
	if (record.die) {
		var h1_die = $('<h1>' + TEXT_DIE + '</h1>');
		parent.append(h1_die);
		var dl = $('<dl></dl>');
		parent.append(dl);
		dl.append($('<dt>' + TEXT_DIE_REASON + '</dt>'));
		dl.append($('<dd>' + record.die.reason + '</dd>'));
		dl.append($('<dt>' + TEXT_DEPTH + '</dt>'));
		dl.append($('<dd>' + record.die.depth + '</dd>'));
		dl.append($('<dt>' + TEXT_LEVEL + '</dt>'));
		dl.append($('<dd>' + record.die.level + '</dd>'));
		dl.append($('<dt>' + TEXT_HP + '</dt>'));
		dl.append($('<dd>' + record.die.hp + '</dd>'));
		dl.append($('<dt>' + TEXT_ENERGY + '</dt>'));
		dl.append($('<dd>' + record.die.energy + '</dd>'));
		dl.append($('<dt>' + TEXT_ATK + '</dt>'));
		dl.append($('<dd>' + record.die.atk + '</dd>'));
		dl.append($('<dt>' + TEXT_DEF + '</dt>'));
		dl.append($('<dd>' + record.die.def + '</dd>'));
		dl.append($('<dt>' + TEXT_EXP + '</dt>'));
		dl.append($('<dd>' + record.die.exp + '</dd>'));
		dl.append($('<dt>' + TEXT_POISON + '</dt>'));
		dl.append($('<dd>' + record.die.poison + '</dd>'));
		dl.append($('<dt>' + TEXT_HUNGRY + '</dt>'));
		dl.append($('<dd>' + record.die.hungry + '</dd>'));
		dl.append($('<dt>' + TEXT_FAMINE + '</dt>'));
		dl.append($('<dd>' + record.die.famine + '</dd>'));	
	}

	var acolumns = [];
	acolumns.push({ dname: TEXT_DEPTH, name: 'depth' });
	acolumns.push({ dname: TEXT_MOVE, name: STATS_ACTION_MOVE, formatter: (value, row) => value + '(' + round((value / row.turn * 100), 1) + '%)' });
	acolumns.push({ dname: TEXT_ATTACK, name: STATS_ACTION_ATTACK, formatter: (value, row) => value + '(' + round((value / row.turn * 100), 1) + '%)' });
	acolumns.push({ dname: TEXT_REST, name: STATS_ACTION_REST, formatter: (value, row) => value + '(' + round((value / row.turn * 100), 1) + '%)' });
	acolumns.push({ dname: TEXT_PICKUP, name: STATS_ACTION_PICKUP, formatter: (value, row) => value + '(' + round((value / row.turn * 100), 1) + '%)' });
	acolumns.push({ dname: TEXT_PUT, name: STATS_ACTION_PUT, formatter: (value, row) => value + '(' + round((value / row.turn * 100), 1) + '%)' });
	acolumns.push({ dname: TEXT_USE, name: STATS_ACTION_USE, formatter: (value, row) => value + '(' + round((value / row.turn * 100), 1) + '%)' });
	acolumns.push({ dname: TEXT_SUM, name: 'turn' });

    var h1_actions = $('<h1>' + TEXT_ACTION + TEXT_DETAIL + '</h1>');
	parent.append(h1_actions);
	var actions = [];
	for (var i = 0; i < record.actions.length; i++) {
		actions[i] = _.extend(record.actions[i], {
			depth: i, 
			turn: record.turns[i]
		});
	}
	var table = create_table(acolumns, actions);
	if (dark) {
		table.addClass('table-dark');
	}
	parent.append(table);

	var columns = [];
    columns.push({ dname: TEXT_KILL, name: 'killed', formatter: (value, row) => value ? '' : '×' });
    if (secret) {
        columns.push({ dname: TEXT_ID, name: 'id' });
    }
    columns.push({ dname: TEXT_NAME, name: 'dname' });
    if (secret) {
        columns.push({ dname: TEXT_LEVEL, name: 'level' });
    }
    columns.push({ dname: TEXT_EXP, name: 'exp' });
    columns.push({ dname: TEXT_IN_DAMAGE, name: 'ps', formatter: (value, row) => value.join(',') });
    columns.push({ dname: TEXT_NUM, name: 'plen' });
    columns.push({ dname: TEXT_SUM, name: 'psum' });
    columns.push({ dname: TEXT_MIN, name: 'pmin', formatter: (value, row) => value === null ? '-' : value });
    columns.push({ dname: TEXT_MAX, name: 'pmax', formatter: (value, row) => value === null ? '-' : value });
    columns.push({ dname: TEXT_AVG, name: 'pavg', formatter: (value, row) => value === null ? '-' : value });
    columns.push({ dname: TEXT_OUT_DAMAGE, name: 'cs', formatter: (value, row) => value.join(',') });
    columns.push({ dname: TEXT_NUM, name: 'clen' });
    columns.push({ dname: TEXT_SUM, name: 'csum' });
    columns.push({ dname: TEXT_MIN, name: 'cmin', formatter: (value, row) => value === null ? '-' : value });
    columns.push({ dname: TEXT_MAX, name: 'cmax', formatter: (value, row) => value === null ? '-' : value });
    columns.push({ dname: TEXT_AVG, name: 'cavg', formatter: (value, row) => value === null ? '-' : value });

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

var distribution_columns = [
	{ dname: TEXT_VALUE, name: 'value', formatter: (value, row) => value + (row.span > 1 ? '-' + (value + row.span - 1) : '') }, 
	{ dname: TEXT_NUM, name: 'num', formatter: (value, row) => value === null ? '0' : value }, 
	{ dname: TEXT_PERCENTAGE, name: 'percentage', formatter: (value, row) => round(value * 100, 1) + '%' }
];

function show_distribution (summary, title) {
	var data = summary.distribution.map((item, index) => {
		return {
			value: index * summary.span, 
			span: summary.span, 
			num: item, 
			percentage: item / summary.len
		};
	});

	$('#distribution_title').text(title);
	$('#distribution_body').empty().append(create_table(distribution_columns, data));
	$('#distribution').modal({});
}

function create_button (name, click) {
	var button = $('<button>' + name + '</button>');
	button.addClass('btn btn-primary');
	button.click(click);
	return button;
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
				d = columns[j].formatter(d, data[i]);
			}
			var td = $('<td></td>');
			if (d instanceof jQuery) {
				td.append(d);
			}
			else {
				td.text(d);
			}
			tbodyr.append(td);
		}
	}
	return table;
}

function find_route (map, x, y, range, condition) {
	var checked = initialize_2d_array(map.nx, map.ny, (x, y) => false);
	checked[x][y] = true;
	var queue = [{
		x: x, 
		y: y, 
		route: []
	}];
	while (queue.length > 0) {
		var p = queue.shift();
		if (condition(map, p.x, p.y)) {
			return p.route;
		}
		var ns = [];
		ns.pushrandom({ x: p.x, y: p.y - 1 });
		ns.pushrandom({ x: p.x, y: p.y + 1 });
		ns.pushrandom({ x: p.x - 1, y: p.y });
		ns.pushrandom({ x: p.x + 1, y: p.y });
		for (var i = 0; i < ns.length; i++) {
			if (range(map, ns[i].x, ns[i].y) && !checked[ns[i].x][ns[i].y]) {
				checked[ns[i].x][ns[i].y] = true;
				queue.push({
					x: ns[i].x, 
					y: ns[i].y, 
					route: p.route.concat([{ x: ns[i].x, y: ns[i].y }])
				});
			}
		}
	}
	return null;
}

function initialize_2d_array (nx, ny, initializer) {
	var array = [];
	for (var i = 0; i < nx; i++) {
		array[i] = [];
		for (var j = 0; j < ny; j++) {
			array[i][j] = initializer(i, j);
		}
	}
	return array;
}

function round (val, level) {
	var n = 10 ** level;
	return Math.round(val * n) / n;
}

function randomselect (table) {
	var sum = 0;
	for (var i of table.entries()) {
		sum += i[1];
	}
	var num = Math.floor(Math.random() * sum);
	var sum2 = 0;
	for (var i of table.entries()) {
		sum2 += i[1];
		if (num < sum2) {
			return i[0];
		}
	}
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
