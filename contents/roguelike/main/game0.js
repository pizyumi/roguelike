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
	fields[0] = create_field(0, seed);
	player = new Player(TEXT_PLAYER);
	player.x = fields[0].x;
	player.y = fields[0].y;
	player.maps[0] = new FMap(fields[0]);
	player.maps[0].update(player.x, player.y);
	messages = [{
		text: MSG_INIT({name: player.dname}),
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
	return await move_one_block();
}

async function move_down () {
	player.direction = DIR_DOWN;
	return await move_one_block();
}

async function move_left () {
	player.direction = DIR_LEFT;
	return await move_one_block();
}

async function move_right () {
	player.direction = DIR_RIGHT;
	return await move_one_block();
}

async function move_up_left () {
	player.direction = DIR_UP_LEFT;
	return await move_one_block();
}

async function move_up_right () {
	player.direction = DIR_UP_RIGHT;
	return await move_one_block();
}

async function move_down_left () {
	player.direction = DIR_DOWN_LEFT;
	return await move_one_block();
}

async function move_down_right () {
	player.direction = DIR_DOWN_RIGHT;
	return await move_one_block();
}

async function move_one_block () {
	var { dx, dy } = direction_to_delta(player.direction);
	var x = player.x + dx;
	var y = player.y + dy;
	var nx = fields[player.depth].nx;
	var ny = fields[player.depth].ny;
	if (x < 0 || y < 0 || x > nx - 1 || y > ny - 1) {
		return null;
	}
	if (!can_action_diagonal(player.x, player.y, dx, dy)) {
		return null;
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
	return await attack_next();
}

async function attack_down () {
	player.direction = DIR_DOWN;
	return await attack_next();
}

async function attack_left () {
	player.direction = DIR_LEFT;
	return await attack_next();
}

async function attack_right () {
	player.direction = DIR_RIGHT;
	return await attack_next();
}

async function attack_up_left () {
	player.direction = DIR_UP_LEFT;
	return await attack_next();
}

async function attack_up_right () {
	player.direction = DIR_UP_RIGHT;
	return await attack_next();
}

async function attack_down_left () {
	player.direction = DIR_DOWN_LEFT;
	return await attack_next();
}

async function attack_down_right () {
	player.direction = DIR_DOWN_RIGHT;
	return await attack_next();
}

async function attack_next () {
	var { dx, dy } = direction_to_delta(player.direction);
	var x = player.x + dx;
	var y = player.y + dy;
	var nx = fields[player.depth].nx;
	var ny = fields[player.depth].ny;
	if (x < 0 || y < 0 || x > nx - 1 || y > ny - 1) {
		return null;
	}
	if (!can_action_diagonal(player.x, player.y, dx, dy)) {
		return null;
	}
	var index = get_npc_index(x, y);
	if (index === null) {
		return null;
	}
	return await attack(index, player.atk);
}

async function attack (index, atk) {
	add_message({
		text: MSG_ATTACK({name: player.dname}),
		type: 'normal'
	});
	var npcs = fields[player.depth].npcs;
	var c = npcs[index];
	var dam = calculate_damage(atk, player.str, c.def);
	c.hp -= dam;
	add_message({
		text: MSG_DAMAGE({name: c.dname, dam}),
		type: 'pattack'
	});
	draw();
	await play_sound('pattack');
	statistics.add_fight(player.depth, c, STATS_FIGHT_OUTBOUND, dam);
	if (c.hp <= 0) {
		npcs.splice(index, 1);
		player.exp += c.exp;
		add_message({
			text: MSG_DIE({name: c.dname}),
			type: 'important'
		});
		add_message({
			text: MSG_EXP({name: player.dname, exp: c.exp}),
			type: 'normal'
		});
		statistics.add_fight(player.depth, c, STATS_FIGHT_KILLED, 0);
		while (player.levelup()) {
			add_message({
				text: MSG_LEVELUP({name: player.dname, level: player.level}),
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
			text: MSG_CANT_PICKUP({iname: item.dname}),
			type: 'important'
		});
		draw();
		return false;
	}
	add_message({
		text: MSG_PICKUP({name: player.dname, iname: item.dname}),
		type: 'normal'
	});
	block.items.shift();
	player.items.add_item(item);
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
	add_message({
		text: MSG_DOWNSTAIR({name: player.dname}),
		type: 'normal'
	});
	player.depth++;
	if (player.eye) {
		player.eye = false;
		add_message({
			text: MSG_EYE_DISAPPEARANCE({name: player.dname}),
			type: 'normal'
		});
	}
	if (!fields[player.depth]) {
		fields[player.depth] = create_field(player.depth, seed);
	}
	if (!player.maps[player.depth]) {
		player.maps[player.depth] = new FMap(fields[player.depth]);
	}
	player.x = fields[player.depth].x;
	player.y = fields[player.depth].y;
	player.maps[player.depth].update(player.x, player.y);
	statistics.add_action(player.depth, STATS_ACTION_MOVE);
	await execute_turn();
	draw();
	return true;
}

async function rest () {
	add_message({
		text: MSG_REST({name: player.dname}),
		type: 'normal'
	});
	statistics.add_action(player.depth, STATS_ACTION_REST);
	await execute_turn();
	draw();
	return true;
}

function get_item_actions (item) {
	var actions = [];
	if (item.cat === I_CAT_FOOD) {
		actions.push({ name: 'eat', dname: ACTION_EAT, exec: async (i) => await eat(i) });
	}
	else if (item.cat === I_CAT_POTION) {
		actions.push({ name: 'quaff', dname: ACTION_QUAFF, exec: async (i) => await quaff(i) });
	}
	else if (item.cat === I_CAT_WEAPON) {
		if (item !== player.weapon) {
			actions.push({ name: 'equip', dname: ACTION_EQUIP, exec: async (i) => await equip_weapon(i) });
		}
		else {
			actions.push({ name: 'unequip', dname: ACTION_UNEQUIP, exec: async (i) => await unequip_weapon(i) });
			return actions;
		}
	}
	else if (item.cat === I_CAT_ARMOR) {
		if (item !== player.armor) {
			actions.push({ name: 'equip', dname: ACTION_EQUIP, exec: async (i) => await equip_armor(i) });
		}
		else {
			actions.push({ name: 'unequip', dname: ACTION_UNEQUIP, exec: async (i) => await unequip_armor(i) });
			return actions;
		}
	}
	else if (item.cat === I_CAT_SCROLL) {
		actions.push({ name: 'read', dname: ACTION_READ, exec: async (i) => await read(i) });
	}
	else {
		throw new Error('not supported.');
	}
	actions.push({ name: 'hurl', dname: ACTION_HURL, exec: async (i) => await hurl(i) });	
	actions.push({ name: 'put', dname: ACTION_PUT, exec: async (i) => await put(i) });
	return actions;
}

async function hurl (item) {
	add_message({
		text: MSG_HURL({name: player.dname, iname: item.dname}),
		type: 'normal'
	});
	player.items.delete_item(item);
	var blocks = fields[player.depth].blocks;
	var max = Math.floor(5 * (1 + player.str * 0.02));
	var { dx, dy } = direction_to_delta(player.direction);
	var x = player.x;
	var y = player.y;
	for (var i = 1; i <= max; i++) {
		if (B_CAN_STAND[blocks[x + dx][y + dy].base]) {
			var index = get_npc_index(x + dx, y + dy);
			if (index === null) {
				x += dx;
				y += dy;
			}
			else {
				if (item.cat === I_CAT_FOOD) {
					return await attack(index, item.weight * 10 + 4);
				}
				else if (item.cat === I_CAT_POTION) {
					var c = fields[player.depth].npcs[index];				
					if (item.type === I_HEALTH_POTION) {
						var old = c.hp;
						c.hp += item.level * 10;
						if (c.hp >= c.hpfull) {
							c.hp = c.hpfull;
							c.hp_fraction = 0;
						}
						add_message({
							text: MSG_HP_RECOVERY({name: c.dname, diff: c.hp - old}),
							type: 'normal'
						});
					}
					else if (item.type === I_HP_UP_POTION) {
						var old = c.hpfull;
						c.hpext += Math.ceil(c.hpfull * 0.1);
						add_message({
							text: MSG_HP_UP({name: c.dname, diff: c.hpfull - old}),
							type: 'normal'
						});
					}
					else if (item.type === I_POISON_POTION) {
						if (c.poison) {
							add_message({
								text: MSG_NO_EFFECT,
								type: 'important'
							});
						}
						else {
							c.poison = true;
							add_message({
								text: MSG_POISON({name: c.dname}),
								type: 'normal'
							});	
						}				
					}
					else if (item.type === I_ANTIDOTE_POTION) {
						if (c.poison) {
							c.poison = false;
							add_message({
								text: MSG_POISON_RECOVERY({name: c.dname}),
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
				else if (item.cat === I_CAT_WEAPON) {
					return await attack(index, item.atk + 4);
				}
				else if (item.cat === I_CAT_ARMOR) {
					return await attack(index, item.def + 4);
				}
				else if (item.cat === I_CAT_SCROLL) {
					return await attack(index, item.weight * 10 + 4);
				}
				else {
					throw new Error('not supported.');
				}
			}
		}
		else {
			break;
		}
	}
	var block = blocks[x][y];
	if (!block.items) {
		block.items = [];
	}
	block.items.push(item);
	statistics.add_action(player.depth, STATS_ACTION_HURL);
	await execute_turn();
	draw();
	return true;
}

async function put (item) {
	add_message({
		text: MSG_PUT({name: player.dname, iname: item.dname}),
		type: 'normal'
	});
	player.items.delete_item(item);
	var block = fields[player.depth].blocks[player.x][player.y];
	if (!block.items) {
		block.items = [];
	}
	block.items.push(item);
	statistics.add_action(player.depth, STATS_ACTION_PUT);
	await execute_turn();
	draw();
	return true;
}

async function eat (item) {
	add_message({
		text: MSG_EAT({name: player.dname, iname: item.dname}),
		type: 'normal'
	});
	player.items.delete_item(item);
	if (item.type === I_APPLE) {
		var diff = player.increase_energy(50);
		add_message({
			text: MSG_ENEGY_RECOVERY({name: player.dname, diff}),
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
	add_message({
		text: MSG_QUAFF({name: player.dname, iname: item.dname}),
		type: 'normal'
	});
	player.items.delete_item(item);
	if (item.type === I_HEALTH_POTION) {
		var diff = player.increase_hp(item.level * 10);
		add_message({
			text: MSG_HP_RECOVERY({name: player.dname, diff}),
			type: 'normal'
		});
	}
	else if (item.type === I_HP_UP_POTION) {
		var old = player.hpfull;
		player.hpext += Math.ceil(player.hpfull * 0.1);
		add_message({
			text: MSG_HP_UP({name: player.dname, diff: player.hpfull - old}),
			type: 'important'
		});
	}
	else if (item.type === I_POISON_POTION) {
		if (player.poison) {
			add_message({
				text: MSG_NO_EFFECT,
				type: 'important'
			});
		}
		else {
			player.poison = true;
			add_message({
				text: MSG_POISON({name: player.dname}),
				type: 'normal'
			});	
		}
	}
	else if (item.type === I_ANTIDOTE_POTION) {
		if (player.poison) {
			player.poison = false;
			add_message({
				text: MSG_POISON_RECOVERY({name: player.dname}),
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
	else if (item.type === I_EYE_POTION) {
		if (player.eye) {
			add_message({
				text: MSG_NO_EFFECT,
				type: 'important'
			});
		}
		else {
			player.eye = true;
			add_message({
				text: MSG_EYE({name: player.dname}),
				type: 'normal'
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
		add_message({
			text: MSG_UNEQUIP({name: player.dname, iname: old.dname}),
			type: 'normal'
		});
		player.weapon.equipped = false;
		player.weapon = null;
		add_message({
			text: MSG_ATK_DECREASE({name: player.dname, diff: old.atk}),
			type: 'normal'
		});
	}
	add_message({
		text: MSG_EQUIP({name: player.dname, iname: item.dname}),
		type: 'normal'
	});
	player.weapon = item;
	player.weapon.equipped = true;
	add_message({
		text: MSG_ATK_INCREASE({name: player.dname, diff: item.atk}),
		type: 'normal'
	});
	statistics.add_action(player.depth, STATS_ACTION_USE);
	await execute_turn();
	draw();
	return true;
}

async function unequip_weapon (item) {
	var old = player.weapon;
	add_message({
		text: MSG_UNEQUIP({name: player.dname, iname: old.dname}),
		type: 'normal'
	});
	player.weapon.equipped = false;
	player.weapon = null;
	add_message({
		text: MSG_ATK_DECREASE({name: player.dname, diff: old.atk}),
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
		add_message({
			text: MSG_UNEQUIP({name: player.dname, iname: old.dname}),
			type: 'normal'
		});	
		player.armor.equipped = false;
		player.armor = null;
		add_message({
			text: MSG_DEF_DECREASE({name: player.dname, diff: old.def}),
			type: 'normal'
		});
	}
	add_message({
		text: MSG_EQUIP({name: player.dname, iname: item.dname}),
		type: 'normal'
	});
	player.armor = item;
	player.armor.equipped = true;
	add_message({
		text: MSG_DEF_INCREASE({name: player.dname, diff: item.def}),
		type: 'normal'
	});
	statistics.add_action(player.depth, STATS_ACTION_USE);
	await execute_turn();
	draw();
	return true;
}

async function unequip_armor (item) {
	var old = player.armor;
	add_message({
		text: MSG_UNEQUIP({name: player.dname, iname: old.dname}),
		type: 'normal'
	});	
	player.armor.equipped = false;
	player.armor = null;
	add_message({
		text: MSG_DEF_DECREASE({name: player.dname, diff: old.def}),
		type: 'normal'
	});
	statistics.add_action(player.depth, STATS_ACTION_USE);
	await execute_turn();
	draw();
	return true;
}

async function read (item) {
	add_message({
		text: MSG_READ({name: player.dname, iname: item.dname}),
		type: 'normal'
	});
	player.items.delete_item(item);
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
				text: MSG_EQUIPPED_WEAPON_UP({name: player.dname, diff}),
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
				text: MSG_EQUIPPED_ARMOR_UP({name: player.dname, diff}),
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

async function enemy_action (c) {
	var room = player.maps[player.depth].room;
	if (room && within_room(c.x, c.y, room)) {
		c.discovered = true;
	}
	var route = find_route(fields[player.depth], c.x, c.y, (field, x, y) => {
		return B_CAN_STAND[field.blocks[x][y].base] && get_npc_index(x, y) === null;
	}, (field, x, y) => {
		return x === player.x && y === player.y;
	}, (field, x, y, px, py) => {
		return can_action_diagonal(px, py, x - px, y - py);
	}, true);
	if (route && route.length === 1) {
		return await enemy_attack(c);
	}
	if (!route || !c.discovered) {
		var room = get_room(c.x, c.y);
		route = find_route(fields[player.depth], c.x, c.y, (field, x, y) => {
			if (room && !within_room(x, y, room)) {
				return false;
			}
			return B_CAN_STAND[field.blocks[x][y].base] && get_npc_index(x, y) === null;
		}, (field, x, y) => {
			return x !== c.x || y !== c.y;
		}, (field, x, y, px, py) => {
			return can_action_diagonal(px, py, x - px, y - py);
		}, true);
	}
	if (route !== null) {
		var r = await enemy_move_one_block(c, route[0].x - c.x, route[0].y - c.y);
		if (!r) {
			throw new Error('enemy cant move.');
		}
		return r;
	}
	return null;
}

async function enemy_move_one_block (c, dx, dy) {
	var x = c.x + dx;
	var y = c.y + dy;
	var nx = fields[player.depth].nx;
	var ny = fields[player.depth].ny;
	if (x < 0 || y < 0 || x > nx - 1 || y > ny - 1) {
		return null;
	}
	if (!can_action_diagonal(c.x, c.y, dx, dy)) {
		return null;
	}
	return await enemy_move(c, x, y);
}

async function enemy_move (c, x, y) {
	c.x = x;
	c.y = y;
	return true;
}

async function enemy_attack (c) {
	var table = new Map();
	for (var i = 0; i < c.attacks.length; i++) {
		table.set(c.attacks[i].type, c.attacks[i].p);
	}
	var type = randomselect(table);
	if (type === ATTACK_NORMAL) {
		add_message({
			text: MSG_ATTACK({name: c.dname}),
			type: 'normal'
		});
	}
	else if (type === ATTACK_POISON) {
		add_message({
			text: MSG_POISON_ATTACK({name: c.dname}),
			type: 'normal'
		});
	}
	var dam = calculate_damage(c.atk, 10, player.def);
	player.hp -= dam;
	add_message({
		text: MSG_DAMAGE({name: player.dname, dam}),
		type: 'eattack'
	});
	if (type === ATTACK_NORMAL) {
	}
	else if (type === ATTACK_POISON) {
		player.poison = true;
		add_message({
			text: MSG_POISON({name: player.dname}),
			type: 'normal'
		});
	}
	draw();
	await play_sound('eattack');
	statistics.add_fight(player.depth, c, STATS_FIGHT_INBOUND, dam);
	if (player.hp <= 0) {
		player.hp = 0;
		add_message({
			text: MSG_DIE({name: player.dname}),
			type: 'special'
		});
		statistics.add_die(STATS_DIE_KILLED, player);
		gameover = true;
		finish();
		return false;
	}
	return true;
}

async function execute_turn () {
	statistics.add_turn(player.depth);

	player.maps[player.depth].update(player.x, player.y);

	var block = fields[player.depth].blocks[player.x][player.y];
	if (block.trap) {
		block.trap.activated = true;
		add_message({
			text: MSG_TRAP({name: player.dname, tname: block.trap.dname}),
			type: 'normal'
		});
		if (block.trap.type === T_HP_RECOVERY) {
			var diff = player.increase_hp(Math.floor(Math.random() * 30) + 1);
			add_message({
				text: MSG_HP_RECOVERY({name: player.dname, diff}),
				type: 'normal'
			});
		}
		else if (block.trap.type === T_DAMAGE) {
			var dam = Math.floor(Math.random() * 10) + 1;
			player.hp -= dam;
			add_message({
				text: MSG_DAMAGE({name: player.dname, dam}),
				type: 'eattack'
			});
			if (player.hp <= 0) {
				player.hp = 0;
				add_message({
					text: MSG_DIE({name: player.dname}),
					type: 'special'
				});
				statistics.add_die(STATS_DIE_TRAP, player);
				gameover = true;
				finish();
				return;
			}
		}
		else if (block.trap.type === T_ENERGY_DECREASE) {
			var diff = player.decrease_energy(Math.floor(Math.random() * 30) + 1);
			add_message({
				text: MSG_ENEGY_DECREASE({name: player.dname, diff}),
				type: 'normal'
			});
		}
		if (Math.random() < block.trap.break) {
			var old = block.trap.dname;
			block.trap = undefined;
			add_message({
				text: MSG_TRAP_BREAK({tname: old}),
				type: 'normal'
			});
		}
	}

	var npcs = fields[player.depth].npcs;
	for (var i = 0; i < npcs.length; i++) {
		await enemy_action(npcs[i]);
	}

	player.next_hp();
	if (player.hp <= 0) {
		player.hp = 0;
		add_message({
			text: MSG_DIE({name: player.dname}),
			type: 'special'
		});
		statistics.add_die(STATS_DIE_FATAL_STATES, player);
		gameover = true;
		finish();
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
				text: MSG_POISON_RECOVERY({name: player.dname}),
				type: 'normal'
			});
		}
	}

	if (player.eye) {
		var room = player.maps[player.depth].room;
		if (room !== null) {
			for (var i = room.x1; i <= room.x2; i++) {
				for (var j = room.y1; j <= room.y2; j++) {
					var block = fields[player.depth].blocks[i][j];
					if (block.trap) {
						block.trap.activated = true;
					}			
				}
			}
		}	
	}

	var dies = [];
	for (var i = 0; i < npcs.length; i++) {
		var c = npcs[i];
		var damages = c.next_hp();
		if (damages.poison > 0) {
			add_message({
				text: MSG_POISON_DAMAGE({name: c.dname, dam: damages.poison}),
				type: 'normal'
			});
		}
		if (c.hp <= 0) {
			dies.push(c);
			player.exp += c.exp;
			add_message({
				text: MSG_DIE({name: c.dname}),
				type: 'important'
			});
			add_message({
				text: MSG_EXP({name: player.dname, exp: c.exp}),
				type: 'normal'
			});
			statistics.add_fight(player.depth, c, STATS_FIGHT_KILLED, 0);	
			while (player.levelup()) {
				add_message({
					text: MSG_LEVELUP({level: player.level}),
					type: 'important'
				});
			}
			continue;
		}
		if (c.poison) {
			if (Math.random() < c.poison_remedy) {
				c.poison = false;
				add_message({
					text: MSG_POISON_RECOVERY({name: c.dname}),
					type: 'normal'
				});
			}
		}
	}
	for (var i = 0; i < dies.length; i++) {
		npcs.splice(npcs.indexOf(dies[i]), 1);
	}
}

function calculate_damage (atk, str, def) {
	var dam = Math.ceil((atk * 1.1 - def * 0.4) * Math.random() * (1 + str * 0.01));
	if (dam <= 0) {
		dam = 1;
	}
	return dam;
}

function can_action_diagonal (cx, cy, dx, dy) {
	if ((dx + dy) % 2 === 0) {
		var block1 = fields[player.depth].blocks[cx + dx][cy];
		var block2 = fields[player.depth].blocks[cx][cy + dy];
		if (!B_CAN_STAND[block1.base] || !B_CAN_STAND[block2.base]) {
			return false;
		}
	}
	return true;
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

function get_room (x, y) {
	var rooms = fields[player.depth].rooms;
	for (var i = 0; i < rooms.length; i++) {
		if (within_room(x, y, rooms[i])) {
			return rooms[i];
		}
	}
	return null;
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

function direction_to_delta (dir) {
	var dx = 0;
	if (dir === DIR_LEFT || dir === DIR_UP_LEFT || dir === DIR_DOWN_LEFT) {
		dx = -1;
	}
	else if (dir === DIR_RIGHT || dir === DIR_UP_RIGHT || dir === DIR_DOWN_RIGHT) {
		dx = 1;
	}
	var dy = 0;
	if (dir === DIR_UP || dir === DIR_UP_LEFT || dir === DIR_UP_RIGHT) {
		dy = -1;
	}
	else if (dir === DIR_DOWN || dir === DIR_DOWN_LEFT || dir === DIR_DOWN_RIGHT) {
		dy = 1;		
	}
	return { dx, dy };
}
