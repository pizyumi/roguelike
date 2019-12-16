function init () {
	time = Date.now();
	seed = time.toString(10);

	invindex = 0;
	invoffset = 0;
	invactf = false;
	invactindex = 0;
	autof = false;
	gameover = false;
	waiting = false;

	fields = [];
	fields[0] = create_field(0, [], seed);
	player = new Player();
	player.maps[0] = new FMap(fields[0]);
	player.maps[0].update(player.x, player.y);
	messages = [{
		text: MSG_INIT,
		type: 'special'
	}];
	statistics = new Statistics();
}

function add_message (message) {
	var l = messages[messages.length - 1];
	if (message.text === l.text && message.type === l.type) {
		if (!l.repeat) {
			l.repeat = 2;
		}
		else {
			l.repeat++;
		}
	}
	else {
		messages.push(message);
		while (messages.length > NUM_MESSAGE) {
			messages.shift();
		}
	}
}

async function turn_up () {
	player.direction = DIR_UP;
	draw();
	return true;
}

async function turn_down () {
	player.direction = DIR_DOWN;
	draw();
	return true;
}

async function turn_left () {
	player.direction = DIR_LEFT;
	draw();
	return true;
}

async function turn_right () {
	player.direction = DIR_RIGHT;
	draw();
	return true;
}

async function turn_up_left () {
	player.direction = DIR_UP_LEFT;
	draw();
	return true;
}

async function turn_up_right () {
	player.direction = DIR_UP_RIGHT;
	draw();
	return true;
}

async function turn_down_left () {
	player.direction = DIR_DOWN_LEFT;
	draw();
	return true;
}

async function turn_down_right () {
	player.direction = DIR_DOWN_RIGHT;
	draw();
	return true;
}

async function up () {
	return await attack_up().nullthen((r) => move_up());
}

async function down () {
	return await attack_down().nullthen((r) => move_down());
}

async function left () {
	return await attack_left().nullthen((r) => move_left());
}

async function right () {
	return await attack_right().nullthen((r) => move_right());
}

async function up_left () {
	return await attack_up_left().nullthen((r) => move_up_left());
}

async function up_right () {
	return await attack_up_right().nullthen((r) => move_up_right());
}

async function down_left () {
	return await attack_down_left().nullthen((r) => move_down_left());
}

async function down_right () {
	return await attack_down_right().nullthen((r) => move_down_right());
}

async function move_up () {
	player.direction = DIR_UP;
	return await move_one_block(0, -1);
}

async function move_down () {
	player.direction = DIR_DOWN;
	return await move_one_block(0, 1);
}

async function move_left () {
	player.direction = DIR_LEFT;
	return await move_one_block(-1, 0);
}

async function move_right () {
	player.direction = DIR_RIGHT;
	return await move_one_block(1, 0);
}

async function move_up_left () {
	player.direction = DIR_UP_LEFT;
	return await move_one_block(-1, -1);
}

async function move_up_right () {
	player.direction = DIR_UP_RIGHT;
	return await move_one_block(1, -1);
}

async function move_down_left () {
	player.direction = DIR_DOWN_LEFT;
	return await move_one_block(-1, 1);
}

async function move_down_right () {
	player.direction = DIR_DOWN_RIGHT;
	return await move_one_block(1, 1);
}

async function move_one_block (xd, yd) {
	var x = player.x + xd;
	var y = player.y + yd;
	var nx = fields[player.depth].nx;
	var ny = fields[player.depth].ny;
	if (x < 0 || y < 0 || x > nx - 1 || y > ny - 1) {
		return null;
	}
	if ((xd + yd) % 2 === 0) {
		var block1 = fields[player.depth].blocks[x][player.y];
		var block2 = fields[player.depth].blocks[player.x][y];
		if (!B_CAN_STAND[block1.base] || !B_CAN_STAND[block2.base]) {
			return null;
		}
	}
	return await move(x, y);
}

async function move (x, y) {
	var block = fields[player.depth].blocks[x][y];
	if (!B_CAN_STAND[block.base]) {
		if (block.base === B_WALL) {
			add_message({
				text: MSG_WALL,
				type: 'normal'
			});
		}
		draw();
		return false;
	}
	player.x = x;
	player.y = y;
	statistics.add_action(player.depth, STATS_ACTION_MOVE);
	await execute_turn();
	draw();
	return true;
}

async function attack_up () {
	player.direction = DIR_UP;
	return await attack_next(0, -1);
}

async function attack_down () {
	player.direction = DIR_DOWN;
	return await attack_next(0, 1);
}

async function attack_left () {
	player.direction = DIR_LEFT;
	return await attack_next(-1, 0);
}

async function attack_right () {
	player.direction = DIR_RIGHT;
	return await attack_next(1, 0);
}

async function attack_up_left () {
	player.direction = DIR_UP_LEFT;
	return await attack_next(-1, -1);
}

async function attack_up_right () {
	player.direction = DIR_UP_RIGHT;
	return await attack_next(1, -1);
}

async function attack_down_left () {
	player.direction = DIR_DOWN_LEFT;
	return await attack_next(-1, 1);
}

async function attack_down_right () {
	player.direction = DIR_DOWN_RIGHT;
	return await attack_next(1, 1);
}

async function attack_next (xd, yd) {
	var x = player.x + xd;
	var y = player.y + yd;
	var nx = fields[player.depth].nx;
	var ny = fields[player.depth].ny;
	if (x < 0 || y < 0 || x > nx - 1 || y > ny - 1) {
		return null;
	}
	if ((xd + yd) % 2 === 0) {
		var block1 = fields[player.depth].blocks[x][player.y];
		var block2 = fields[player.depth].blocks[player.x][y];
		if (!B_CAN_STAND[block1.base] || !B_CAN_STAND[block2.base]) {
			return null;
		}
	}
	var index = get_npc_index(x, y);
	if (index === null) {
		return null;
	}
	return await attack(index);
}

async function attack (index) {
	var npcs = fields[player.depth].npcs;
	var c = npcs[index];
	var dam = calculate_damage(player.atk, player.str, c.def);
	c.attacked = true;
	c.hp -= dam;
	add_message({
		text: MSG_PATTACK({name: c.dname, dam}),
		type: 'pattack'
	});
	draw();
	await play_sound('pattack');
	statistics.add_fight(player.depth, c, STATS_FIGHT_OUTBOUND, dam);
	if (c.hp <= 0) {
		npcs.splice(index, 1);
		player.exp += c.exp;
		add_message({
			text: MSG_KILL({name: c.dname, exp: c.exp}),
			type: 'important'
		});
		statistics.add_fight(player.depth, c, STATS_FIGHT_KILLED, 0);

		while (player.levelup()) {
			add_message({
				text: MSG_LEVELUP({level: player.level}),
				type: 'important'
			});
		}
	}
	statistics.add_action(player.depth, STATS_ACTION_ATTACK);
	await execute_turn();
	draw();
	return true;
}

async function pickup () {
	var block = fields[player.depth].blocks[player.x][player.y];
	if (!block.items || block.items.length === 0) {
		return null;
	}
	var item = block.items[0];
	if (player.weight + item.weight > player.weightfull) {
		add_message({
			text: MSG_CANT_PICKUP({name: item.dname}),
			type: 'important'
		});
		draw();
		return false;
	}
	block.items.shift();
	player.items.add_item(item);
	player.weight += item.weight;
	add_message({
		text: MSG_PICKUP({name: item.dname}),
		type: 'normal'
	});
	statistics.add_action(player.depth, STATS_ACTION_PICKUP);
	await execute_turn();
	draw();
	return true;
}

async function downstair () {
	var block = fields[player.depth].blocks[player.x][player.y];
	if (block.base !== B_DOWNSTAIR) {
		return null;
	}
	player.depth++;
	if (!fields[player.depth]) {
		fields[player.depth] = create_field(player.depth, [{
			x: player.x,
			y: player.y
		}], seed);
	}
	if (!player.maps[player.depth]) {
		player.maps[player.depth] = new FMap(fields[player.depth]);
	}
	player.maps[player.depth].update(player.x, player.y);
	add_message({
		text: MSG_DOWNSTAIR,
		type: 'normal'
	});
	statistics.add_action(player.depth, STATS_ACTION_MOVE);
	await execute_turn();
	draw();
	return true;
}

async function rest () {
	var room = player.maps[player.depth].room;
	if (player.hp >= player.hpfull * 0.9) {
		add_message({
			text: MSG_SUFFICIENT_HP,
			type: 'important'
		});
		draw();
		return false;
	}
	add_message({
		text: MSG_REST,
		type: 'normal'
	});
	statistics.add_action(player.depth, STATS_ACTION_REST);
	await execute_turn();
	draw();
	return true;
}

function get_item_actions (item) {
	if (item.cat === I_CAT_FOOD) {
		return [
			{ name: 'eat', dname: ACTION_EAT, exec: async (i) => await eat(i) },
			{ name: 'put', dname: ACTION_PUT, exec: async (i) => await put(i) }
		];
	}
	else if (item.cat === I_CAT_POTION) {
		return [
			{ name: 'quaff', dname: ACTION_QUAFF, exec: async (i) => await quaff(i) },
			{ name: 'put', dname: ACTION_PUT, exec: async (i) => await put(i) }
		];
	}
	else if (item.cat === I_CAT_WEAPON) {
		var actions = [];
		if (item !== player.weapon) {
			actions.push({ name: 'equip', dname: ACTION_EQUIP, exec: async (i) => await equip_weapon(i) });
			actions.push({ name: 'put', dname: ACTION_PUT, exec: async (i) => await put(i) });
		}
		else {
			actions.push({ name: 'unequip', dname: ACTION_UNEQUIP, exec: async (i) => await unequip_weapon(i) });
		}
		return actions;
	}
	else if (item.cat === I_CAT_ARMOR) {
		var actions = [];
		if (item !== player.armor) {
			actions.push({ name: 'equip', dname: ACTION_EQUIP, exec: async (i) => await equip_armor(i) });
			actions.push({ name: 'put', dname: ACTION_PUT, exec: async (i) => await put(i) });
		}
		else {
			actions.push({ name: 'unequip', dname: ACTION_UNEQUIP, exec: async (i) => await unequip_armor(i) });
		}
		return actions;
	}
	else if (item.cat === I_CAT_SCROLL) {
		return [
			{ name: 'read', dname: ACTION_READ, exec: async (i) => await read(i) },
			{ name: 'put', dname: ACTION_PUT, exec: async (i) => await put(i) }
		];
	}
	else {
		throw new Error('not supported.');
	}
}

async function put (item) {
	consume_item(item);
	var block = fields[player.depth].blocks[player.x][player.y];
	if (!block.items) {
		block.items = [];
	}
	block.items.push(item);
	add_message({
		text: MSG_PUT({name: item.dname}),
		type: 'normal'
	});
	statistics.add_action(player.depth, STATS_ACTION_PUT);
	await execute_turn();
	draw();
	return true;
}

async function eat (item) {
	consume_item(item);
	if (item.type === I_APPLE) {
		var diff = player.increase_energy(50);
		add_message({
			text: MSG_EAT_FOOD({name: item.dname, diff}),
			type: 'normal'
		});
	}
	else {
		throw new Error('not supported.');
	}
	statistics.add_action(player.depth, STATS_ACTION_USE);
	await execute_turn();
	draw();
	return true;
}

async function quaff (item) {
	consume_item(item);
	if (item.type === I_HEALTH_POTION) {
		var old = player.hp;
		player.hp += item.level * 10;
		if (player.hp >= player.hpfull) {
			player.hp = player.hpfull;
			player.hp_fraction = 0;
		}
		add_message({
			text: MSG_QUAFF_HPOTION({name: item.dname, diff: player.hp - old}),
			type: 'normal'
		});
	}
	else if (item.type === I_HP_UP_POTION) {
		var old = player.hpfull;
		player.hpext += Math.ceil(player.hpfull * 0.1);
		add_message({
			text: MSG_QUAFF_HUP_POTION({name: item.dname, diff: player.hpfull - old}),
			type: 'important'
		});
	}
	else if (item.type === I_POISON_POTION) {
		player.poison = true;
		add_message({
			text: MSG_QUAFF_POISON_POTION({name: item.dname}),
			type: 'normal'
		});
	}
	else if (item.type === I_ANTIDOTE_POTION) {
		if (player.poison) {
			player.poison = false;
			add_message({
				text: MSG_QUAFF_ANTEDOTE_POTION({name: item.dname}),
				type: 'normal'
			});
		}
		else {
			add_message({
				text: MSG_NO_EFFECT,
				type: 'important'
			});
		}
	}
	else {
		throw new Error('not supported.');
	}
	statistics.add_action(player.depth, STATS_ACTION_USE);
	await execute_turn();
	draw();
	return true;
}

async function equip_weapon (item) {
	if (player.weapon !== null) {
		var old = player.weapon;
		player.weapon.equipped = false;
		player.weapon = null;
		add_message({
			text: MSG_UNEQUIP_WEAPON({name: old.dname, diff: old.atk}),
			type: 'normal'
		});
	}
	player.weapon = item;
	player.weapon.equipped = true;
	add_message({
		text: MSG_EQUIP_WEAPON({name: player.weapon.dname, diff: player.weapon.atk}),
		type: 'normal'
	});
	statistics.add_action(player.depth, STATS_ACTION_USE);
	await execute_turn();
	draw();
	return true;
}

async function unequip_weapon (item) {
	var old = player.weapon;
	player.weapon.equipped = false;
	player.weapon = null;
	add_message({
		text: MSG_UNEQUIP_WEAPON({name: old.dname, diff: old.atk}),
		type: 'normal'
	});
	statistics.add_action(player.depth, STATS_ACTION_USE);
	await execute_turn();
	draw();
	return true;
}

async function equip_armor (item) {
	if (player.armor !== null) {
		var old = player.armor;
		player.armor.equipped = false;
		player.armor = null;
		add_message({
			text: MSG_UNEQUIP_ARMOR({name: old.dname, diff: old.def}),
			type: 'normal'
		});
	}
	player.armor = item;
	player.armor.equipped = true;
	add_message({
		text: MSG_EQUIP_ARMOR({name: player.armor.dname, diff: player.armor.def}),
		type: 'normal'
	});
	statistics.add_action(player.depth, STATS_ACTION_USE);
	await execute_turn();
	draw();
	return true;
}

async function unequip_armor (item) {
	var old = player.armor;
	player.armor.equipped = false;
	player.armor = null;
	add_message({
		text: MSG_UNEQUIP_ARMOR({name: old.dname, diff: old.def}),
		type: 'normal'
	});
	statistics.add_action(player.depth, STATS_ACTION_USE);
	await execute_turn();
	draw();
	return true;
}

async function read (item) {
	consume_item(item);
	if (item.type === I_WEAPON_SCROLL) {
		if (player.weapon === null) {
			add_message({
				text: MSG_NO_EFFECT,
				type: 'important'
			});
		}
		else {
			var diff = player.weapon.levelup(1);
			add_message({
				text: MSG_READ_WEAPON_SCROLL({name: item.dname, diff}),
				type: 'important'
			});
		}
	}
	else if (item.type === I_ARMOR_SCROLL) {
		if (player.armor === null) {
			add_message({
				text: MSG_NO_EFFECT,
				type: 'important'
			});
		}
		else {
			var diff = player.armor.levelup(1);
			add_message({
				text: MSG_READ_ARMOR_SCROLL({name: item.dname, diff}),
				type: 'important'
			});
		}
	}
	else {
		throw new Error('not supported.');
	}
	statistics.add_action(player.depth, STATS_ACTION_USE);
	await execute_turn();
	draw();
	return true;
}

async function execute_turn () {
	statistics.add_turn(player.depth);

	var npcs = fields[player.depth].npcs;
	for (var i = 0; i < npcs.length; i++) {
		var c = npcs[i];

		var attack = true;
		if (c.type === 0) {
			if (c.attacked) {
				c.attacked = false;
			}
			else {
				attack = false;
			}
		}
		else if (c.type === 1) {
			if (!c.attacked) {
				attack = false;
			}
		}

		var cl = B_CAN_STAND[fields[player.depth].blocks[c.x - 1][c.y].base];
		var cu = B_CAN_STAND[fields[player.depth].blocks[c.x][c.y - 1].base];
		var cr = B_CAN_STAND[fields[player.depth].blocks[c.x + 1][c.y].base];
		var cd = B_CAN_STAND[fields[player.depth].blocks[c.x][c.y + 1].base];
		var clu = B_CAN_STAND[fields[player.depth].blocks[c.x - 1][c.y - 1].base];
		var cru = B_CAN_STAND[fields[player.depth].blocks[c.x + 1][c.y - 1].base];
		var cld = B_CAN_STAND[fields[player.depth].blocks[c.x - 1][c.y + 1].base];
		var crd = B_CAN_STAND[fields[player.depth].blocks[c.x + 1][c.y + 1].base];

		var l = player.x === c.x - 1 && player.y === c.y;
		var u = player.x === c.x && player.y === c.y - 1;
		var r = player.x === c.x + 1 && player.y === c.y;
		var d = player.x === c.x && player.y === c.y + 1;
		var lu = player.x === c.x - 1 && player.y === c.y - 1;
		var ru = player.x === c.x + 1 && player.y === c.y - 1;
		var ld = player.x === c.x - 1 && player.y === c.y + 1;
		var rd = player.x === c.x + 1 && player.y === c.y + 1;
		if (attack && (l || u || r || d || (lu && cl && cu) || (ru && cr && cu) || (ld && cl && cd) || (rd && cr && cd))) {
			var table = new Map();
			for (var j = 0; j < c.attacks.length; j++) {
				table.set(c.attacks[j].type, c.attacks[j].p);
			}
			var type = randomselect(table);
			var dam = calculate_damage(c.atk, 10, player.def);
			player.hp -= dam;
			if (type === ATTACK_NORMAL) {
				add_message({
					text: MSG_EATTACK({name: c.dname, dam}),
					type: 'eattack'
				});
			}
			else if (type === ATTACK_POISON) {
				player.poison = true;
				add_message({
					text: MSG_EATTACK_POISON({name: c.dname, dam}),
					type: 'eattack'
				});
			}
			draw();
			await play_sound('eattack');
			statistics.add_fight(player.depth, c, STATS_FIGHT_INBOUND, dam);
			if (player.hp <= 0) {
				player.hp = 0;
				gameover = true;
				add_message({
					text: MSG_DIE,
					type: 'special'
				});
				statistics.add_die(STATS_DIE_KILLED, player);
				return;
			}
		}
		else {
			var ps = [];
			var room = player.maps[player.depth].room;
			var same = room && within_room(c.x, c.y, room);
			if (same && c.type >= 3) {
				if (c.x > player.x && cl) {
					ps.pushrandom({ x: c.x - 1, y: c.y, p: 1.0 });
				}
				else if (c.x < player.x && cr) {
					ps.pushrandom({ x: c.x + 1, y: c.y, p: 1.0 });
				}
				if (c.y > player.y && cu) {
					ps.pushrandom({ x: c.x, y: c.y - 1, p: 1.0 });
				}
				else if (c.y < player.y && cd) {
					ps.pushrandom({ x: c.x, y: c.y + 1, p: 1.0 });
				}
				if (c.x > player.x && c.y > player.y && cl && cu && clu) {
					ps.unshift({ x: c.x - 1, y: c.y - 1, p: 1.0 });
				}
				else if (c.x < player.x && c.y > player.y && cr && cu && cru) {
					ps.unshift({ x: c.x + 1, y: c.y - 1, p: 1.0 });
				}
				else if (c.x > player.x && c.y < player.y && cl && cd && cld) {
					ps.unshift({ x: c.x - 1, y: c.y + 1, p: 1.0 });
				}
				else if (c.x < player.x && c.y < player.y && cr && cd && crd) {
					ps.unshift({ x: c.x + 1, y: c.y + 1, p: 1.0 });
				}
			}
			else {
				if (cl) {
					ps.pushrandom({ x: c.x - 1, y: c.y, p: 0.5 });
				}
				if (cu) {
					ps.pushrandom({ x: c.x, y: c.y - 1, p: 0.5 });
				}
				if (cr) {
					ps.pushrandom({ x: c.x + 1, y: c.y, p: 0.5 });
				}
				if (cd) {
					ps.pushrandom({ x: c.x, y: c.y + 1, p: 0.5 });
				}
				if (clu && cl && cu) {
					ps.pushrandom({ x: c.x - 1, y: c.y - 1, p: 0.5 });
				}
				if (cru && cr && cu) {
					ps.pushrandom({ x: c.x + 1, y: c.y - 1, p: 0.5 });
				}
				if (cld && cl && cd) {
					ps.pushrandom({ x: c.x - 1, y: c.y + 1, p: 0.5 });
				}
				if (crd && cr && cd) {
					ps.pushrandom({ x: c.x + 1, y: c.y + 1, p: 0.5 });
				}
			}
			for (var j = 0; j < ps.length; j++) {
				if (get_npc_index(ps[j].x, ps[j].y) === null && (ps[j].x !== player.x || ps[j].y !== player.y)) {
					if (Math.random() < ps[j].p) {
						c.x = ps[j].x;
						c.y = ps[j].y;
					}
					break;
				}
			}
		}
	}

	player.next_hp();
	if (player.hp <= 0) {
		player.hp = 0;
		gameover = true;
		add_message({
			text: MSG_DIE,
			type: 'special'
		});
		statistics.add_die(STATS_DIE_FATAL_STATES, player);
		return;
	}

	var old = player.energy;
	player.next_energy();
	if (old > 20 && player.energy === 20) {
		add_message({
			text: MSG_ENERGY20,
			type: 'normal'
		});
	}
	else if (old > 10 && player.energy === 10) {
		add_message({
			text: MSG_ENERGY10,
			type: 'normal'
		});
	}
	else if (old > 0 && player.energy === 0) {
		add_message({
			text: MSG_ENERGY0,
			type: 'important'
		});
	}

	if (player.poison) {
		if (Math.random() < player.poison_remedy) {
			player.poison = false;
			add_message({
				text: MSG_POISON_REMEDY,
				type: 'normal'
			});
		}
	}

	player.maps[player.depth].update(player.x, player.y);
}

function calculate_damage (atk, str, def) {
	var dam = Math.ceil((atk * 1.1 - def * 0.4) * Math.random() * (1 + str * 0.01));
	if (dam <= 0) {
		dam = 1;
	}
	return dam;
}

function within_room (x, y, room) {
	return x >= room.x1 && x <= room.x2 && y >= room.y1 && y <= room.y2;
}

function within_room_surrounding (x, y, room) {
	return x >= room.x1 - 1 && x <= room.x2 + 1 && y >= room.y1 - 1 && y <= room.y2 + 1;
}

function is_room_surrounding (x, y, room) {
	return (x >= room.x1 - 1 && x <= room.x2 + 1 && (y === room.y1 - 1 || y === room.y2 + 1)) || (y >= room.y1 - 1 && y <= room.y2 + 1 && (x === room.x1 - 1 || x === room.x2 + 1));
}

function within_player_surrounding (x, y) {
	return x >= player.x - 1 && x <= player.x + 1 && y >= player.y - 1 && y <= player.y + 1;
}

function npcs_within_room (room) {
	var npcs = fields[player.depth].npcs;
	for (var i = 0; i < npcs.length; i++) {
		if (within_room(npcs[i].x, npcs[i].y, room)) {
			return true;
		}
	}
	return false;
}

function get_npc_index (x, y) {
	var npcs = fields[player.depth].npcs;
	for (var i = 0; i < npcs.length; i++) {
		if (npcs[i].x === x && npcs[i].y === y) {
			return i;
		}
	}
	return null;
}

function consume_item (item) {
	player.items.delete_item(item);
	player.weight -= item.weight;
}
