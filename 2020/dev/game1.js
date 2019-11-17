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
			blocks[x][y].items.push(new Item(I_APPLE, I_CAT_FOOD));
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

	var workings = [{
		x1: 1,
		x2: nx - 2,
		y1: 1,
		y2: ny - 2
	}];
	var ps = [1, 1, 1, 1, 1, 1, 0.5, 0.5, 0.5, 0.5];
	var rooms = [];
	while (workings.length > 0 && ps.length > 0) {
		var w = workings.shift();
		var news = split_room(blocks, w, ps.shift(), random);
		for (var i = 0; i < news.length; i++) {
			workings.push(news[i]);
		}
		if (news.length === 0) {
			rooms.push(w);
		}
	}
	while (workings.length > 0) {
		rooms.push(workings.shift());
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
	for (var i = 0; i < rooms.length; i++) {
		var num = random.num(3);
		for (var j = 0; j < num; j++) {
			var x = random.num(rooms[i].x2 - rooms[i].x1) + rooms[i].x1;
			var y = random.num(rooms[i].y2 - rooms[i].y1) + rooms[i].y1;
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
				if (type > 7) {
					type = 7;
				}
				var level = baselevel - type;
				npcs.push(new Enemy(type, x, y, level));
			}
		}

		var num_item = Math.floor(random.fraction() + 0.5);
		for (var j = 0; j < num_item; j++) {
			var x = random.num(rooms[i].x2 - rooms[i].x1) + rooms[i].x1;
			var y = random.num(rooms[i].y2 - rooms[i].y1) + rooms[i].y1;
			if (!blocks[x][y].items) {
				blocks[x][y].items = [];
			}

			var ctable = new Map();
			ctable.set(I_CAT_FOOD, 20);
			ctable.set(I_CAT_POTION, 50);
			if (depth >= 2) {
				ctable.set(I_CAT_WEAPON, 15);
				ctable.set(I_CAT_ARMOR, 15);
			}
			var cat = random.select(ctable);
			if (cat === I_CAT_FOOD) {
				var itable = new Map();
				itable.set(I_APPLE, 80);
				itable.set(I_HP_GRASS, 20);
				var type = random.select(itable);
				blocks[x][y].items.push(new Item(type, cat));
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
				blocks[x][y].items.push(new HealthPotion(type, cat, level));
			}
			else if (cat === I_CAT_WEAPON) {
				var itable = new Map();
				itable.set(I_DAGGER, 1);
				if (depth >= 5) {
					itable.set(I_SHORT_SWORD, 1);
				}
				if (depth >= 7) {
					itable.set(I_RAPIER, 1);
				}
				if (depth >= 9) {
					itable.set(I_FALCHION, 1);
				}
				if (depth >= 11) {
					itable.set(I_LONG_SWORD, 1);
				}
				var type = random.select(itable);
				var e = I_INFO[type];
				var baselevel = Math.ceil(depth / 2);
				var ltable = new Map();
				ltable.set(random.num(baselevel) + 1, 75);
				ltable.set(baselevel + 1, 20);
				ltable.set(baselevel + 2, 5);
				var level = Math.max(random.select(ltable) - e.level, 0);
				blocks[x][y].items.push(new Weapon(type, cat, level));
			}
			else if (cat === I_CAT_ARMOR) {
				var itable = new Map();
				itable.set(I_LEATHER_ARMOR, 1);
				if (depth >= 5) {
					itable.set(I_RIVET_ARMOR, 1);
				}
				if (depth >= 7) {
					itable.set(I_SCALE_ARMOR, 1);
				}
				if (depth >= 9) {
					itable.set(I_CHAIN_MAIL, 1);
				}
				if (depth >= 11) {
					itable.set(I_PLATE_ARMOR, 1);
				}
				var type = random.select(itable);
				var e = I_INFO[type];
				var baselevel = Math.ceil(depth / 2);
				var ltable = new Map();
				ltable.set(random.num(baselevel) + 1, 75);
				ltable.set(baselevel + 1, 20);
				ltable.set(baselevel + 2, 5);
				var level = Math.max(random.select(ltable) - e.level, 0);
				blocks[x][y].items.push(new Armor(type, cat, level));
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
		rooms: rooms,
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

class FMap {
	constructor (field) {
		var blocks = [];
		for (var i = 0; i < field.nx; i++) {
			blocks[i] = [];
			for (var j = 0; j < field.ny; j++) {
				blocks[i][j] = M_UNKNOWN;
			}
		}
		this.field = field;
		this.nx = field.nx;
		this.ny = field.ny;
		this.blocks = blocks;
		this.room = null;
	}

	update (x, y) {
		for (var i = 0; i < this.field.rooms.length; i++) {
			var room = this.field.rooms[i];
			if (within_room(x, y, room)) {
				room.items = [];
				for (var j = room.x1 - 1; j <= room.x2 + 1; j++) {
					for (var k = room.y1 - 1; k <= room.y2 + 1; k++) {
						var block = this.field.blocks[j][k];
						this.blocks[j][k] = block.base;
						if (block.items) {
							for (var l = 0; l < block.items.length; l++) {
								var item = block.items[l];
								item.x = j;
								item.y = k;
								room.items.push(item);
							}
						}
					}
				}
				room.npcs = [];
				for (var j = 0; j < this.field.npcs.length; j++) {
					var c = this.field.npcs[j];
					if (within_room(c.x, c.y, room)) {
						room.npcs.push(c);
					}
				}
				this.room = room;
				return;
			}
		}
		this.blocks[x][y] = this.field.blocks[x][y].base;
		this.blocks[x - 1][y] = this.field.blocks[x - 1][y].base;
		this.blocks[x + 1][y] = this.field.blocks[x + 1][y].base;
		this.blocks[x][y - 1] = this.field.blocks[x][y - 1].base;
		this.blocks[x][y + 1] = this.field.blocks[x][y + 1].base;
		this.blocks[x - 1][y - 1] = this.field.blocks[x - 1][y - 1].base;
		this.blocks[x + 1][y - 1] = this.field.blocks[x + 1][y - 1].base;
		this.blocks[x - 1][y + 1] = this.field.blocks[x - 1][y + 1].base;
		this.blocks[x + 1][y + 1] = this.field.blocks[x + 1][y + 1].base;
		this.room = null;
	}
}

class Items {
	constructor () {
		this.items = [];
		this.citems = [];
	}

	get_items () {
		return this.citems;
	}

	get_item (cindex) {
		return this.citems[cindex];
	}

	get length () {
		return this.citems.length;
	}

	add_item (item) {
		this.items.push(item);
		this.items.sort(function(a, b) {
			if (a.type !== b.type) {
				return a.type - b.type;
			}
			else if (a.level !== b.level) {
				return a.level - b.level;
			}
			else if (a.equipped) {
				return -1;
			}
			else if (b.equipped) {
				return 1;
			}
			else {
				return 0;
			}
		});
		this.citems = Items.compress_items(this.items);
	}

	delete_item (item) {
		this.items = this.items.filter((i) => i !== item);
		this.citems = Items.compress_items(this.items);
	}
}

Items.compress_items = function (items) {
	var citems = [];
	var prev = null;
	for (var item of items) {
		item.num = 0;
		if (prev === null || item.type !== prev.type || item.level !== prev.level || item.equipped !== prev.equipped) {
			citems.push(item);
			prev = item;
		}
		prev.num++;
	}
	return citems;
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

		this.weapon = null;
		this.armor = null;

		this.items = new Items();
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
		return this.atkbase + this.atkext + (this.weapon === null ? 0 : this.weapon.atk);
	}

	get def () {
		return this.defbase + this.defext + (this.armor === null ? 0 : this.armor.def);
	}

	increase_energy (max) {
		var old = this.energy;
		this.energy += max;
		if (this.energy >= this.energyfull) {
			this.energy = this.energyfull;
			this.energy_turn = 0;
		}
		return this.energy - old;
	}
}

class Enemy {
	constructor (type, x, y, level) {
		var e = E_INFO[type];

		this.id = Enemy.index++;
		this.otype = OBJ_ENEMY;
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

class Item {
	constructor (type, cat) {
		this.id = Item.index++;
		this.otype = OBJ_ITEM;
		this.type = type;
		this.cat = cat;

		this.info = I_INFO[type];
		this.dnamebase = this.info.dname;
		this.weight = this.info.weight;
	}

	get dname () {
		return this.dnamebase;
	}
}

Item.index = 0;

class HealthPotion extends Item {
	constructor (type, cat, level) {
		super(type, cat);

		this.level = level;
	}

	get dname () {
		return this.dnamebase + this.level * 10;
	}
}

class Weapon extends Item {
	constructor (type, cat, level) {
		super(type, cat);

		this.level = level;
		this.atkbase = this.info.atk;
		this.equipped = false;
	}

	get dname () {
		return this.dnamebase + (this.level === 0 ? '' : '+' + this.level);
	}

	get atk () {
		return this.atkbase + this.level;
	}
}

class Armor extends Item {
	constructor (type, cat, level) {
		super(type, cat);

		this.level = level;
		this.defbase = this.info.def;
		this.equipped = false;
	}

	get dname () {
		return this.dnamebase + (this.level === 0 ? '' : '+' + this.level);
	}

	get def () {
		return this.defbase + this.level;
	}
}
