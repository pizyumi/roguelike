function create_field (depth, upstairs, base_seed) {
	var random = new Random(base_seed + ',' + depth.toString(10));

	var nx = 15;
	var ny = 15;
	if (depth > 0) {
		nx = 25;
		ny = 25;
	}

	var blocks = [];
	for (var i = 0; i < nx; i++) {
		blocks[i] = [];
		for (var j = 0; j < ny; j++) {
			if ((i === 0 || j === 0) || (i === nx - 1 || j === ny - 1)) {
				blocks[i][j] = {
					base: B_WALL
				};
			}
			else {
				blocks[i][j] = {
					base: B_FLOOR
				};
			}
		}
	}

	if (depth === 0) {
		blocks[7][5] = {
			base: B_DOWNSTAIR
		};

		for (var i = 0; i < 2; i++) {
			var x = random.num(nx - 2 - 1) + 1;
			var y = random.num(ny - 2 - 1) + 1;
			if (!blocks[x][y].items) {
				blocks[x][y].items = [];
			}
			var e = I_INFO[I_APPLE];
			blocks[x][y].items.push({
				dname: e.dname,
				type: I_APPLE,
				cat: I_CAT_FOOD,
				weight: e.weight
			});
		}

		return {
			nx: nx,
			ny: ny,
			blocks: blocks,
			rooms: [{
				x1: 1,
				x2: nx - 2,
				y1: 1,
				y2: ny - 2
			}],
			npcs: []
		};
	}

	var rs = [{
		x1: 1,
		x2: nx - 2,
		y1: 1,
		y2: ny - 2
	}];
	var ers = [];
	var dps = [1, 1, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5];
	while (rs.length > 0 && dps.length > 0) {
		var r = rs.shift();
		var nrs = split_room(blocks, r, dps.shift(), random);
		for (var i = 0; i < nrs.length; i++) {
			rs.push(nrs[i]);
		}
		if (nrs.length === 0) {
			ers.push(r);
		}
	}
	while (rs.length > 0) {
		ers.push(rs.shift());
	}

	var nds = 1;
	while (nds > 0) {
		var x = random.num(nx - 2) + 1;
		var y = random.num(ny - 2) + 1;
		var f = true;
		for (var i = 0; i < upstairs.length; i++) {
			if (x === upstairs[i].x && y === upstairs[i].y) {
				f = false;
				break;
			}
		}
		if (f) {
			blocks[x][y].base = B_DOWNSTAIR;
			nds--;
		}
	}

	var npcs = [];
	for (var i = 0; i < ers.length; i++) {
		var num = random.num(3);
		for (var j = 0; j < num; j++) {
			var x = random.num(ers[i].x2 - ers[i].x1) + ers[i].x1;
			var y = random.num(ers[i].y2 - ers[i].y1) + ers[i].y1;
			var f = true;
			for (var k = 0; k < upstairs.length; k++) {
				if (x === upstairs[k].x && y === upstairs[k].y) {
					f = false;
					break;
				}
			}
			if (f) {
				var ltable = new Map();
				ltable.set(random.num(depth), 3);
				ltable.set(depth, 60);
				ltable.set(depth + 1, 30);
				ltable.set(depth + 2, 4);
				ltable.set(depth + 3, 3);
				var baselevel = random.select(ltable);
				var type = Math.floor(random.num(depth + 1) / 2);
				if (type > 8) {
					type = 8;
				}
				var level = baselevel - type;
				npcs.push(new Enemy(type, x, y, level));
			}
		}

		var num_item = Math.floor(random.fraction() + 0.5);
		for (var j = 0; j < num_item; j++) {
			var x = random.num(ers[i].x2 - ers[i].x1) + ers[i].x1;
			var y = random.num(ers[i].y2 - ers[i].y1) + ers[i].y1;
			if (!blocks[x][y].items) {
				blocks[x][y].items = [];
			}

			var ctable = new Map();
			ctable.set(I_CAT_FOOD, 20);
			ctable.set(I_CAT_POTION, 80);
			var cat = random.select(ctable);
			if (cat === I_CAT_FOOD) {
				var type = I_APPLE;
				var e = I_INFO[type];
				blocks[x][y].items.push({
					dname: e.dname,
					type: type,
					cat: cat,
					weight: e.weight
				});
			}
			else if (cat === I_CAT_POTION) {
				var type = I_HEALTH_POTION;
				var e = I_INFO[type];
				var baselevel = Math.ceil(depth / 4);
				var ltable = new Map();
				ltable.set(random.num(baselevel) + 1, 75);
				ltable.set(baselevel + 1, 20);
				ltable.set(baselevel + 2, 5);
				var level = random.select(ltable);
				blocks[x][y].items.push({
					dname: e.dname + level * 10,
					type: type,
					cat: cat,
					level: level,
					weight: e.weight
				});
			}
		}
	}

	for (var i = 0; i < upstairs.length; i++) {
		if (blocks[upstairs[i].x][upstairs[i].y].base = B_WALL) {
			blocks[upstairs[i].x][upstairs[i].y].base = B_FLOOR;
		}
	}

	return {
		nx: nx,
		ny: ny,
		blocks: blocks,
		rooms: ers,
		npcs: npcs
	};
}

function split_room (blocks, r, dp, random) {
	var ap = random.fraction();
	if (ap <= dp) {
		var dir = random.num(2);
		if (r.x2 - r.x1 > (r.y2 - r.y1) * 2) {
			dir = 0;
		}
		else if ((r.x2 - r.x1) * 2 < r.y2 - r.y1) {
			dir = 1;
		}

		if (dir === 0) {
			if (r.x2 - r.x1 <= 6) {
				return [];
			}

			var x = random.num(r.x2 - r.x1 - 6) + 3 + r.x1;
			if (blocks[x][r.y1 - 1].base !== B_WALL) {
				return [];
			}
			if (blocks[x][r.y2 + 1].base !== B_WALL) {
				return [];
			}
			var y = random.num(r.y2 - r.y1) + r.y1;
			for (var i = r.y1; i <= r.y2; i++) {
				if (i !== y) {
					blocks[x][i].base = B_WALL;
				}
			}

			var r1 = {
				x1: r.x1,
				x2: x - 1,
				y1: r.y1,
				y2: r.y2
			};
			var r2 = {
				x1: x + 1,
				x2: r.x2,
				y1: r.y1,
				y2: r.y2
			};
			var ord = random.num(2);
			if (ord === 0) {
				return [r1, r2];
			}
			else {
				return [r2, r1];
			}
		}
		else if (dir === 1) {
			if (r.y2 - r.y1 <= 6) {
				return [];
			}

			var y = random.num(r.y2 - r.y1 - 6) + 3 + r.y1;
			if (blocks[r.x1 - 1][y].base !== B_WALL) {
				return [];
			}
			if (blocks[r.x2 + 1][y].base !== B_WALL) {
				return [];
			}
			var x = random.num(r.x2 - r.x1) + r.x1;
			for (var i = r.x1; i <= r.x2; i++) {
				if (i !== x) {
					blocks[i][y].base = B_WALL;
				}
			}

			var r1 = {
				x1: r.x1,
				x2: r.x2,
				y1: r.y1,
				y2: y - 1
			};
			var r2 = {
				x1: r.x1,
				x2: r.x2,
				y1: y + 1,
				y2: r.y2
			};
			var ord = random.num(2);
			if (ord === 0) {
				return [r1, r2];
			}
			else {
				return [r2, r1];
			}
		}
	}
	return [];
}

function init_map (field) {
	var nx = field.nx;
	var ny = field.ny;
	var blocks = [];
	for (var i = 0; i < nx; i++) {
		blocks[i] = [];
		for (var j = 0; j < ny; j++) {
			blocks[i][j] = M_UNKNOWN;
		}
	}
	return {
		nx: nx,
		ny: ny,
		blocks: blocks,
		room: null
	};
}

function update_map (map, field, x, y) {
	for (var i = 0; i < field.rooms.length; i++) {
		var room = field.rooms[i];
		if (within_room(x, y, room)) {
			for (var j = room.x1 - 1; j <= room.x2 + 1; j++) {
				for (var k = room.y1 - 1; k <= room.y2 + 1; k++) {
					map.blocks[j][k] = field.blocks[j][k].base;
				}
			}
			map.room = room;
			return;
		}
	}
	map.blocks[x][y] = field.blocks[x][y].base;
	map.blocks[x - 1][y] = field.blocks[x - 1][y].base;
	map.blocks[x + 1][y] = field.blocks[x + 1][y].base;
	map.blocks[x][y - 1] = field.blocks[x][y - 1].base;
	map.blocks[x][y + 1] = field.blocks[x][y + 1].base;
	map.blocks[x - 1][y - 1] = field.blocks[x - 1][y - 1].base;
	map.blocks[x + 1][y - 1] = field.blocks[x + 1][y - 1].base;
	map.blocks[x - 1][y + 1] = field.blocks[x - 1][y + 1].base;
	map.blocks[x + 1][y + 1] = field.blocks[x + 1][y + 1].base;
	map.room = null;
}

class Player {
	constructor () {
		this.depth = 0;
		this.x = 7;
		this.y = 9;

		this.level = 1;
		this.hpbase = 16;
		this.hpext = 0;
		this.energybase = 100;
		this.energyext = 0;
		this.weightbase = 10.0;
		this.weightext = 0.0;
		this.atkbase = 4;
		this.atkext = 0;
		this.defbase = 4;
		this.defext = 0;
		this.expfull = 4;

		this.hp = this.hpfull;
		this.hp_fraction = 0;
		this.energy = this.energyfull;
		this.energy_turn = 0;
		this.weight = 0.0;
		this.exp = 0;

		this.items = [];
		this.maps = [];
	}

	get hpfull () {
		return this.hpbase + this.hpext;
	}

	get energyfull () {
		return this.energybase + this.energyext;
	}

	get weightfull () {
		return this.weightbase + this.weightext;
	}

	get atk () {
		return this.atkbase + this.atkext;
	}

	get def () {
		return this.defbase + this.defext;
	}
}

class Enemy {
	constructor (type, x, y, level) {
		var e = E_INFO[type];

		this.id = Enemy.index++;
		this.type = type;
		this.x = x;
		this.y = y;

		this.dname = e.dname;

		this.level = e.level;
		this.hpbase = e.hp;
		this.hpext = 0;
		this.atkbase = e.atk;
		this.atkext = 0;
		this.defbase = e.def;
		this.defext = 0;
		this.exp = e.exp;

		while (level > this.level) {
			this.level++;
			this.hpbase = Math.ceil(this.hpbase * 1.2);
			this.atkbase = Math.ceil(this.atkbase * 1.1);
			this.defbase = Math.ceil(this.defbase * 1.1);
			this.exp = Math.ceil(this.exp * 1.5);
		}

		this.hp = this.hpfull;
		this.atk = this.atkfull;
		this.def = this.deffull;
	}

	get hpfull () {
		return this.hpbase + this.hpext;
	}

	get atkfull () {
		return this.atkbase + this.atkext;
	}

	get deffull () {
		return this.defbase + this.defext;
	}
}
Enemy.index = 0;