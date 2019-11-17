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

	get_record () {
		return {
			fights: this.get_fights_all()
		};
	}

	get_fights_all () {
		var all = [];
		for (var i = 0; i <= player.depth; i++) {
			all.push(this.get_fights(i));
		}
		return all;
	}

	get_fights (depth) {
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
				if (debug) {
					fight.id = c.id;
				}
				fight.dname = c.dname;
				if (debug) {
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
