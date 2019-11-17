var query = get_query();

var version = 'dev';
var debug = query.debug ? true : version.substring(0, 3) === 'dev';

var option = {
	sound: true
};

var img = new Image();
img.src = '/img/Dungeon_B_Freem7.png';
var img2 = new Image();
img2.src = '/img/fighting_fantasy_icons.png';

var time = null;
var seed = null;
var name = null;

var con = null;
var env = null;

var startf = false;
var invf = false;
var invindex = 0;
var invoffset = 0;
var invactf = false;
var invactindex = 0;
var dataf = false;
var gameover = false;
var waiting = false;

var fields = null;
var player = null;
var messages = null;
var statistics = null;
var stats_elem = null;
var stats_aux_elem = null;

function get_query () {
	var qs = window.location.search.slice(1).split('&');
	var obj = {};
	for (var i = 0; i < qs.length; i++) {
		if (qs[i].includes('=')) {
			var kv = qs[i].split('=');
			obj[kv[0]] = kv[1];
		}
		else {
			obj[qs[i]] = true;
		}
	}
	return obj;
}

function stats_nan_formatter (cell, formatterParams, onRendered) {
	var val = cell.getValue();
	return isNaN(val) || val === null ? '-' : val;
}

$(function () {
	var canvas = document.getElementById('game');
	con = canvas.getContext('2d');

	var keyl = false;
	var keyu = false;
	var keyr = false;
	var keyd = false;

	env = {
		diagonal: false
	};

	var c = $('body');
	c.on('keydown', function (e) {
		if (e.keyCode === 37) {
			keyl = true;
		}
		else if (e.keyCode === 38) {
			keyu = true;
		}
		else if (e.keyCode === 39) {
			keyr = true;
		}
		else if (e.keyCode === 40) {
			keyd = true;
		}
		else {
			keyl = false;
			keyu = false;
			keyr = false;
			keyd = false;
		}
	});
	c.on('keyup', function (e) {
		if (e.keyCode === 37) {
			keyl = false;
		}
		else if (e.keyCode === 38) {
			keyu = false;
		}
		else if (e.keyCode === 39) {
			keyr = false;
		}
		else if (e.keyCode === 40) {
			keyd = false;
		}
	});
	c.on('keydown', function (e) {
		if (!startf) {
			if (e.keyCode === 90) {
				startf = true;

				name = 'anonymous';
				init();

				draw();
			}

			return;
		}

		if (dataf) {
			if (e.keyCode === 68) {
				dataf = !dataf;

				stats_elem.remove();
				stats_elem = null;

				stats_aux_elem.remove();
				stats_aux_elem = null;

				draw();
			}
			else if (e.keyCode === 83) {
				navigator.clipboard.writeText(JSON.stringify(statistics.get_record(debug)));
				stats_aux_elem.text(TEXT_SAVE_CLIPBOARD);
			}

			return;
		}
		else {
			if (e.keyCode === 68) {
				dataf = !dataf;

				stats_elem = $('<div></div>');
				stats_elem.css('position', 'absolute');
				stats_elem.css('top', 64);
				stats_elem.css('left', 64);
				stats_elem.css('width', SCREEN_X - 64 * 2);
				stats_elem.css('height', SCREEN_Y - 64 * 3);
				stats_elem.css('color', 'white');
				stats_elem.css('overflow-y', 'scroll');

				stats_aux_elem = $('<div></div>');
				stats_aux_elem.css('position', 'absolute');
				stats_aux_elem.css('top', SCREEN_Y - 64 * 2 + 16);
				stats_aux_elem.css('left', 64);
				stats_aux_elem.css('width', SCREEN_X - 64 * 2);
				stats_aux_elem.css('height', 64);
				stats_aux_elem.css('color', 'white');
				stats_aux_elem.text(TEXT_GENERATE_STATS);

				$(document.body).prepend(stats_aux_elem);
				$(document.body).prepend(stats_elem);

				var columns = [];
				columns.push({ title: TEXT_KILL, field: 'killed', formatter: 'tickCross'});
				if (debug) {
					columns.push({ title: TEXT_ID, field: 'id'});
				}
				columns.push({ title: TEXT_NAME, field: 'dname'});
				if (debug) {
					columns.push({ title: TEXT_LEVEL, field: 'level'});
				}
				columns.push({ title: TEXT_EXP, field: 'exp'});
				columns.push({ title: TEXT_IN_DAMAGE, field: 'ps'});
				columns.push({ title: TEXT_NUM, field: 'plen'});
				columns.push({ title: TEXT_SUM, field: 'psum'});
				columns.push({ title: TEXT_MIN, field: 'pmin', formatter: stats_nan_formatter});
				columns.push({ title: TEXT_MAX, field: 'pmax', formatter: stats_nan_formatter});
				columns.push({ title: TEXT_AVG, field: 'pavg', formatter: stats_nan_formatter});
				columns.push({ title: TEXT_OUT_DAMAGE, field: 'cs'});
				columns.push({ title: TEXT_NUM, field: 'clen'});
				columns.push({ title: TEXT_SUM, field: 'csum'});
				columns.push({ title: TEXT_MIN, field: 'cmin', formatter: stats_nan_formatter});
				columns.push({ title: TEXT_MAX, field: 'cmax', formatter: stats_nan_formatter});
				columns.push({ title: TEXT_AVG, field: 'cavg', formatter: stats_nan_formatter});

				setTimeout(function () {
					var record = statistics.get_record(debug);
					var h1 = $('<h1>' + TEXT_FIGHT + '</h1>');
					stats_elem.append(h1);
					for (var i = 0; i < record.fights.length; i++) {
						var h2 = $('<h2>' + i + TEXT_DEPTH + '</h2>');
						stats_elem.append(h2);
						var div = $('<div></div>');
						div.attr('id', 'fights' + i);
						stats_elem.append(div);

						var table = new Tabulator('#fights' + i, {
							height: 512,
							data: record.fights[i],
							columns: columns
						});
					}

					stats_aux_elem.text('');
				}, 0);

				draw();

				return;
			}
		}

		if (gameover) {
			if (e.keyCode === 90) {
				var record = statistics.get_record(true);
				record.id = time.toString(10);
				record.version = version;
				record.name = name;

				axios.post('/add-record', record).then((res) => {
				}).catch((err) => {
				});

				startf = false;

				draw();
			}

			return;
		}

		if (e.keyCode === 16) {
			if (!env.diagonal) {
				env.diagonal = true;

				draw();
			}

			return;
		}

		if (waiting) {
			return;
		}

		var p = Promise.resolve(null);

		if (invf) {
			if (invactf) {
				var actions = get_item_actions(player.items.get_item(invindex));
				if (e.keyCode === 38) {
					invactindex--;
					if (invactindex < 0) {
						invactindex = actions.length - 1;
					}
				}
				else if (e.keyCode === 40) {
					invactindex++;
					if (invactindex >= actions.length) {
						invactindex = 0;
					}
				}
				else if (e.keyCode === 88) {
					invactf = !invactf;
				}
				else if (e.keyCode === 90) {
					p = actions[invactindex].exec();

					invactf = !invactf;
					invf = !invf;

					waiting = true;
					p.then((r) => {
						waiting = false;
					});

					return;
				}
			}
			else {
				if (e.keyCode === 38) {
					invindex--;
					if (invindex < 0) {
						invindex = player.items.length - 1;
						if (invoffset + 10 <= invindex) {
							invoffset = invindex - 10 + 1;
						}
					}
					else {
						if (invoffset > invindex) {
							invoffset = invindex;
						}
					}
				}
				else if (e.keyCode === 40) {
					invindex++;
					if (invindex >= player.items.length) {
						invindex = 0;
						if (invoffset > invindex) {
							invoffset = invindex;
						}
					}
					else {
						if (invoffset + 10 <= invindex) {
							invoffset = invindex - 10 + 1;
						}
					}
				}
				else if (e.keyCode === 88) {
					invf = !invf;
				}
				else if (e.keyCode === 90) {
					invactf = !invactf;
					invactindex = 0;
				}
			}

			draw();

			return;
		}
		else {
			if (e.keyCode === 88) {
				if (player.items.length === 0) {
					add_message({
						text: MSG_EMPTY_INV,
						type: 'normal'
					});
				}
				else {
					invf = !invf;
					if (invindex < 0) {
						invindex = 0;
					}
					else if (invindex >= player.items.length) {
						invindex = player.items.length - 1;
					}
				}

				draw();

				return;
			}
		}

		if (e.keyCode >= 37 && e.keyCode <= 40) {
			if (e.shiftKey) {
				if (keyl && keyu) {
					p = attack_up_left().nullthen((r) => move_up_left());
				}
				else if (keyr && keyu) {
					p = attack_up_right().nullthen((r) => move_up_right());
				}
				else if (keyl && keyd) {
					p = attack_down_left().nullthen((r) => move_down_left());
				}
				else if (keyr && keyd) {
					p = attack_down_right().nullthen((r) => move_down_right());
				}
				else {
					return;
				}
			}
			else {
				if (e.keyCode === 37) {
					p = attack_left().nullthen((r) => move_left());
				}
				else if (e.keyCode === 38) {
					p = attack_up().nullthen((r) => move_up());
				}
				else if (e.keyCode === 39) {
					p = attack_right().nullthen((r) => move_right());
				}
				else if (e.keyCode === 40) {
					p = attack_down().nullthen((r) => move_down());
				}
			}
		}
		else if (e.keyCode === 32) {
			p = pickup().nullthen((r) => downstair()).nullthen((r) => rest());
		}
		else {
			return;
		}

		waiting = true;
		p.then((r) => {
			waiting = false;
		});
	});
	c.on('keyup', function (e) {
		if (e.keyCode === 16) {
			if (env.diagonal) {
				env.diagonal = false;

				draw();
			}
		}
	});
	$(window).on('blur', function (e) {
		if (env.diagonal) {
			env.diagonal = false;

			draw();
		}
	});

	draw();
});

function init () {
	time = Date.now();
	seed = time.toString(10);

	invf = false;
	invindex = 0;
	invoffset = 0;
	invactf = false;
	invactindex = 0;
	dataf = false;
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

async function execute_turn () {
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
			var dam = calculate_damage(c.atk, player.def);
			player.hp -= dam;
			add_message({
				text: MSG_EATTACK({name: c.dname, dam}),
				type: 'eattack'
			});
			draw();
			await play_sound('eattack');
			statistics.add_fight(c, STATS_FIGHT_INBOUND, dam);
			if (player.hp <= 0) {
				player.hp = 0;
				gameover = true;
				add_message({
					text: MSG_DIE,
					type: 'special'
				});
				return;
			}
		}
		else {
			var ps = [];
			var room = player.maps[player.depth].room;
			var same = room && within_room(c.x, c.y, room);
			if (same && c.type >= 3) {
				if (c.x > player.x && cl) {
					ps.splice(Math.floor(Math.random() * (ps.length + 1)), 0, {
						x: c.x - 1,
						y: c.y,
						p: 1.0
					});
				}
				else if (c.x < player.x && cr) {
					ps.splice(Math.floor(Math.random() * (ps.length + 1)), 0, {
						x: c.x + 1,
						y: c.y,
						p: 1.0
					});
				}
				if (c.y > player.y && cu) {
					ps.splice(Math.floor(Math.random() * (ps.length + 1)), 0, {
						x: c.x,
						y: c.y - 1,
						p: 1.0
					});
				}
				else if (c.y < player.y && cd) {
					ps.splice(Math.floor(Math.random() * (ps.length + 1)), 0, {
						x: c.x,
						y: c.y + 1,
						p: 1.0
					});
				}
				if (c.x > player.x && c.y > player.y && cl && cu && clu) {
					ps.unshift({
						x: c.x - 1,
						y: c.y - 1,
						p: 1.0
					});
				}
				else if (c.x < player.x && c.y > player.y && cr && cu && cru) {
					ps.unshift({
						x: c.x + 1,
						y: c.y - 1,
						p: 1.0
					});
				}
				else if (c.x > player.x && c.y < player.y && cl && cd && cld) {
					ps.unshift({
						x: c.x - 1,
						y: c.y + 1,
						p: 1.0
					});
				}
				else if (c.x < player.x && c.y < player.y && cr && cd && crd) {
					ps.unshift({
						x: c.x + 1,
						y: c.y + 1,
						p: 1.0
					});
				}
			}
			else {
				if (cl) {
					ps.splice(Math.floor(Math.random() * (ps.length + 1)), 0, {
						x: c.x - 1,
						y: c.y,
						p: 0.5
					});
				}
				if (cu) {
					ps.splice(Math.floor(Math.random() * (ps.length + 1)), 0, {
						x: c.x,
						y: c.y - 1,
						p: 0.5
					});
				}
				if (cr) {
					ps.splice(Math.floor(Math.random() * (ps.length + 1)), 0, {
						x: c.x + 1,
						y: c.y,
						p: 0.5
					});
				}
				if (cd) {
					ps.splice(Math.floor(Math.random() * (ps.length + 1)), 0, {
						x: c.x,
						y: c.y + 1,
						p: 0.5
					});
				}
				if (clu && cl && cu) {
					ps.splice(Math.floor(Math.random() * (ps.length + 1)), 0, {
						x: c.x - 1,
						y: c.y - 1,
						p: 0.5
					});
				}
				if (cru && cr && cu) {
					ps.splice(Math.floor(Math.random() * (ps.length + 1)), 0, {
						x: c.x + 1,
						y: c.y - 1,
						p: 0.5
					});
				}
				if (cld && cl && cd) {
					ps.splice(Math.floor(Math.random() * (ps.length + 1)), 0, {
						x: c.x - 1,
						y: c.y + 1,
						p: 0.5
					});
				}
				if (crd && cr && cd) {
					ps.splice(Math.floor(Math.random() * (ps.length + 1)), 0, {
						x: c.x + 1,
						y: c.y + 1,
						p: 0.5
					});
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

	var delta = player.hpfull * 0.005;
	if (player.energy === 0) {
		player.energy_turn = 0;
		player.hp_fraction -= delta;
		if (player.hp_fraction <= -1) {
			player.hp--;
			player.hp_fraction += 1;
		}
		if (player.hp <= 0) {
			player.hp = 0;
			gameover = true;
			add_message({
				text: MSG_DIE,
				type: 'special'
			});
			return;
		}
	}
	else {
		player.energy_turn++;
		if (player.energy_turn === 10) {
			player.energy_turn = 0;
			player.energy--;
			if (player.energy === 20) {
				add_message({
					text: MSG_ENERGY20,
					type: 'normal'
				});
			}
			else if (player.energy === 10) {
				add_message({
					text: MSG_ENERGY10,
					type: 'normal'
				});
			}
			else if (player.energy === 0) {
				add_message({
					text: MSG_ENERGY0,
					type: 'important'
				});
			}
		}

		if (player.hp < player.hpfull) {
			player.hp_fraction += delta;
			if (player.hp_fraction >= 1) {
				player.hp++;
				player.hp_fraction -= 1;
			}
		}
		else {
			player.hp_fraction = 0;
		}
	}

	player.maps[player.depth].update(player.x, player.y);
}

function calculate_damage (atk, def) {
	var dam = Math.ceil((atk * 1.1 - def * 0.4) * Math.random());
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

function consume_item () {
	var item = player.items.get_item(invindex);
	player.items.delete_item(item);
	player.weight -= item.weight;
	return item;
}

async function move_up () {
	return await move_one_block(0, -1);
}

async function move_down () {
	return await move_one_block(0, 1);
}

async function move_left () {
	return await move_one_block(-1, 0);
}

async function move_right () {
	return await move_one_block(1, 0);
}

async function move_up_left () {
	return await move_one_block(-1, -1);
}

async function move_up_right () {
	return await move_one_block(1, -1);
}

async function move_down_left () {
	return await move_one_block(-1, 1);
}

async function move_down_right () {
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
	await execute_turn();
	draw();
	return true;
}

async function attack_up () {
	return await attack_next(0, -1);
}

async function attack_down () {
	return await attack_next(0, 1);
}

async function attack_left () {
	return await attack_next(-1, 0);
}

async function attack_right () {
	return await attack_next(1, 0);
}

async function attack_up_left () {
	return await attack_next(-1, -1);
}

async function attack_up_right () {
	return await attack_next(1, -1);
}

async function attack_down_left () {
	return await attack_next(-1, 1);
}

async function attack_down_right () {
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
	var dam = calculate_damage(player.atk, c.def);
	c.attacked = true;
	c.hp -= dam;
	add_message({
		text: MSG_PATTACK({name: c.dname, dam}),
		type: 'pattack'
	});
	draw();
	await play_sound('pattack');
	statistics.add_fight(c, STATS_FIGHT_OUTBOUND, dam);
	if (c.hp <= 0) {
		npcs.splice(index, 1);
		player.exp += c.exp;
		add_message({
			text: MSG_KILL({name: c.dname, exp: c.exp}),
			type: 'important'
		});
		statistics.add_fight(c, STATS_FIGHT_KILLED, 0);

		while (player.exp >= player.expfull) {
			player.level++;
			player.hpbase = Math.ceil(player.hpbase * 1.2);
			player.atkbase = Math.ceil(player.atkbase * 1.1);
			player.defbase = Math.ceil(player.defbase * 1.1);
			player.expfull = Math.ceil(player.expfull * 2.4);
			add_message({
				text: MSG_LEVELUP({level: player.level}),
				type: 'important'
			});
		}
	}
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
	if (player.energy <= 10) {
		add_message({
			text: MSG_CANT_REST_ENERGY,
			type: 'important'
		});
		draw();
		return false;
	}
	if (room === null) {
		add_message({
			text: MSG_CANT_REST_PASSAGE,
			type: 'important'
		});
		draw();
		return false;
	}
	if (npcs_within_room(room)) {
		add_message({
			text: MSG_CANT_REST_ENEMY,
			type: 'important'
		});
		draw();
		return false;
	}
	add_message({
		text: MSG_REST,
		type: 'normal'
	});
	await execute_turn();
	draw();
	return true;
}

function get_item_actions (item) {
	if (item.cat === I_CAT_FOOD) {
		return [
			{ name: 'eat', dname: ACTION_EAT, exec: async () => await eat() },
			{ name: 'put', dname: ACTION_PUT, exec: async () => await put() }
		];
	}
	else if (item.cat === I_CAT_POTION) {
		return [
			{ name: 'quaff', dname: ACTION_QUAFF, exec: async () => await quaff() },
			{ name: 'put', dname: ACTION_PUT, exec: async () => await put() }
		];
	}
	else if (item.cat === I_CAT_WEAPON) {
		var actions = [];
		if (item !== player.weapon) {
			actions.push({ name: 'equip', dname: ACTION_EQUIP, exec: async () => await equip_weapon() });
			actions.push({ name: 'put', dname: ACTION_PUT, exec: async () => await put() });
		}
		else {
			actions.push({ name: 'unequip', dname: ACTION_UNEQUIP, exec: async () => await unequip_weapon() });
		}
		return actions;
	}
	else if (item.cat === I_CAT_ARMOR) {
		var actions = [];
		if (item !== player.armor) {
			actions.push({ name: 'equip', dname: ACTION_EQUIP, exec: async () => await equip_armor() });
			actions.push({ name: 'put', dname: ACTION_PUT, exec: async () => await put() });
		}
		else {
			actions.push({ name: 'unequip', dname: ACTION_UNEQUIP, exec: async () => await unequip_armor() });
		}
		return actions;
	}
	else if (item.cat === I_CAT_SCROLL) {
		return [
			{ name: 'read', dname: ACTION_READ, exec: async () => await read() },
			{ name: 'put', dname: ACTION_PUT, exec: async () => await put() }
		];
	}
	else {
		throw new Error('not supported.');
	}
}

async function put () {
	var item = consume_item();
	var block = fields[player.depth].blocks[player.x][player.y];
	if (!block.items) {
		block.items = [];
	}
	block.items.push(item);
	add_message({
		text: MSG_PUT({name: item.dname}),
		type: 'normal'
	});
	await execute_turn();
	draw();
	return true;
}

async function eat () {
	var item = consume_item();
	if (item.type === I_APPLE) {
		var diff = player.increase_energy(50);
		add_message({
			text: MSG_EAT_FOOD({name: item.dname, diff}),
			type: 'normal'
		});
	}
	else if (item.type === I_HP_GRASS) {
		var hpold = player.hpfull;
		player.hpext += Math.ceil(player.hpfull * 0.1);
		var hpdiff = player.hpfull - hpold;
		var ediff = player.increase_energy(10);
		add_message({
			text: MSG_EAT_HP_GRASS({name: item.dname, hpdiff, ediff}),
			type: 'important'
		});
	}
	else {
		throw new Error('not supported.');
	}
	await execute_turn();
	draw();
	return true;
}

async function quaff () {
	var item = consume_item();
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
	else {
		throw new Error('not supported.');
	}
	await execute_turn();
	draw();
	return true;
}

async function equip_weapon () {
	if (player.weapon !== null) {
		var old = player.weapon;
		player.weapon.equipped = false;
		player.weapon = null;
		add_message({
			text: MSG_UNEQUIP_WEAPON({name: old.dname, diff: old.atk}),
			type: 'normal'
		});
	}
	player.weapon = player.items.get_item(invindex);
	player.weapon.equipped = true;
	add_message({
		text: MSG_EQUIP_WEAPON({name: player.weapon.dname, diff: player.weapon.atk}),
		type: 'normal'
	});
	await execute_turn();
	draw();
	return true;
}

async function unequip_weapon () {
	var old = player.weapon;
	player.weapon.equipped = false;
	player.weapon = null;
	add_message({
		text: MSG_UNEQUIP_WEAPON({name: old.dname, diff: old.atk}),
		type: 'normal'
	});
	await execute_turn();
	draw();
	return true;
}

async function equip_armor () {
	if (player.armor !== null) {
		var old = player.armor;
		player.armor.equipped = false;
		player.armor = null;
		add_message({
			text: MSG_UNEQUIP_ARMOR({name: old.dname, diff: old.def}),
			type: 'normal'
		});
	}
	player.armor = player.items.get_item(invindex);
	player.armor.equipped = true;
	add_message({
		text: MSG_EQUIP_ARMOR({name: player.armor.dname, diff: player.armor.def}),
		type: 'normal'
	});
	await execute_turn();
	draw();
	return true;
}

async function unequip_armor () {
	var old = player.armor;
	player.armor.equipped = false;
	player.armor = null;
	add_message({
		text: MSG_UNEQUIP_ARMOR({name: old.dname, diff: old.def}),
		type: 'normal'
	});
	await execute_turn();
	draw();
	return true;
}

async function read () {
	var item = consume_item();
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
	await execute_turn();
	draw();
	return true;
}

function draw () {
	con.fillStyle = 'black';
	con.fillRect(0, 0, SCREEN_X, SCREEN_Y);

	if (!startf) {
		con.textBaseline = 'alphabetic';
		con.textAlign = 'center';
		con.fillStyle = 'white';

		con.font = '48px consolas';
		con.fillText(TITLE, SCREEN_X / 2, SCREEN_Y / 4);

		con.font = '32px consolas';
		con.fillText('> ' + TEXT_START, SCREEN_X / 2, SCREEN_Y / 4 * 3);

		return;
	}

	var nx = fields[player.depth].nx;
	var ny = fields[player.depth].ny;

	var ox = 0;
	if (player.x <= Math.floor(SX / 2)) {
		ox = 0;
	}
	else if (player.x >= nx - Math.floor(SX / 2)) {
		ox = nx - SX;
	}
	else {
		ox = player.x - Math.floor(SX / 2);
	}

	var oy = 0;
	if (player.y <= Math.floor(SY / 2)) {
		oy = 0;
	}
	else if (player.y >= ny - Math.floor(SY / 2)) {
		oy = ny - SY;
	}
	else {
		oy = player.y - Math.floor(SY / 2);
	}

	var npcs = fields[player.depth].npcs;
	var room = player.maps[player.depth].room;

	for (var i = 0; i < SX; i++) {
		for (var j = 0; j < SY; j++) {
			var block = fields[player.depth].blocks[ox + i][oy + j];
			var mblock = player.maps[player.depth].blocks[ox + i][oy + j];
			if (mblock !== M_UNKNOWN) {
				if ((room !== null && within_room_surrounding(ox + i, oy + j, room)) || (room === null && within_player_surrounding(ox + i, oy + j))) {
					con.fillStyle = 'white';
					con.strokeStyle = 'white';
				}
				else {
					con.fillStyle = 'gray';
					con.strokeStyle = 'gray';
				}

				if (block.base === B_FLOOR) {
					con.beginPath();
					con.arc((i + 0.5) * PX, (j + 0.5) * PY, 1, 0, Math.PI * 2);
					con.closePath();
					con.fill();
				}
				else if (block.base === B_WALL) {
					con.strokeRect(i * PX, j * PY, PX, PY);
					con.beginPath();
					con.moveTo(i * PX, j * PY);
					con.lineTo((i + 1) * PX, (j + 1) * PY);
					con.moveTo((i + 1) * PX, j * PY);
					con.lineTo(i * PX, (j + 1) * PY);
					con.closePath();
					con.stroke();
				}
				else if (block.base === B_DOWNSTAIR) {
					con.drawImage(img, 4 * 32, 5 * 32, 32, 32, i * PX, j * PY, PX, PY);
				}

				if (block.items) {
					for (var k = 0; k < block.items.length; k++) {
						var item = block.items[k];
						if (item.type === I_APPLE) {
							con.drawImage(img2, 0 * 32, 0 * 32, 32, 32, i * PX, j * PY, PX, PY);
						}
						else if (item.type === I_HP_GRASS) {
							con.drawImage(img2, 1 * 32, 1 * 32, 32, 32, i * PX, j * PY, PX, PY);
						}
						else if (item.cat === I_CAT_POTION) {
							con.drawImage(img2, 7 * 32, 4 * 32, 32, 32, i * PX, j * PY, PX, PY);
						}
						else if (item.cat === I_CAT_WEAPON) {
							con.drawImage(img2, 2 * 32, 10 * 32, 32, 32, i * PX, j * PY, PX, PY);
						}
						else if (item.cat === I_CAT_ARMOR) {
							con.drawImage(img2, 10 * 32, 7 * 32, 32, 32, i * PX, j * PY, PX, PY);
						}
						else if (item.cat === I_CAT_SCROLL) {
							con.drawImage(img2, 6 * 32, 4 * 32, 32, 32, i * PX, j * PY, PX, PY);
						}
						else {
							throw new Error('not supported.');
						}
					}
				}
			}
		}
	}

	con.textBaseline = 'middle';
	con.textAlign = 'center';
	con.fillStyle = 'gray';
	con.font = '24px consolas';
	for (var i = 0; i < npcs.length; i++) {
		if (npcs[i].x >= ox && npcs[i].x < ox + SX && npcs[i].y >= oy && npcs[i].y < oy + SY) {
			if ((room !== null && within_room_surrounding(npcs[i].x, npcs[i].y, room)) || (room === null && within_player_surrounding(npcs[i].x, npcs[i].y))) {
				if (npcs[i].type === E_RAT) {
					con.fillText('🐀\uFE0E', (npcs[i].x - ox) * PX + (PX / 2), (npcs[i].y - oy) * PY + (PY / 2));
				}
				else if (npcs[i].type === E_BAT) {
					con.fillText('🦇\uFE0E', (npcs[i].x - ox) * PX + (PX / 2), (npcs[i].y - oy) * PY + (PY / 2));
				}
				else if (npcs[i].type === E_SLIME) {
					con.fillText('s', (npcs[i].x - ox) * PX + (PX / 2), (npcs[i].y - oy) * PY + (PY / 2));
				}
				else if (npcs[i].type === E_SPIDER) {
					con.fillText('🕷️\uFE0E', (npcs[i].x - ox) * PX + (PX / 2), (npcs[i].y - oy) * PY + (PY / 2));
				}
				else if (npcs[i].type === E_SNAKE) {
					con.fillText('🐍\uFE0E', (npcs[i].x - ox) * PX + (PX / 2), (npcs[i].y - oy) * PY + (PY / 2));
				}
				else if (npcs[i].type === E_CARACAL) {
					con.fillText('🐈\uFE0E', (npcs[i].x - ox) * PX + (PX / 2), (npcs[i].y - oy) * PY + (PY / 2));
				}
				else if (npcs[i].type === E_WOLF) {
					con.fillText('ϝ', (npcs[i].x - ox) * PX + (PX / 2), (npcs[i].y - oy) * PY + (PY / 2));
				}
				else if (npcs[i].type === E_GOBLIN) {
					con.fillText('g', (npcs[i].x - ox) * PX + (PX / 2), (npcs[i].y - oy) * PY + (PY / 2));
				}
				else {
					throw new Error('not supported.');
				}
			}
		}
	}

	var px = player.x - ox;
	var py = player.y - oy;

	con.textBaseline = 'middle';
	con.textAlign = 'center';
	con.fillStyle = 'red';
	con.font = '32px consolas';
	con.fillText('🚶\uFE0E', px * PX + (PX / 2), py * PY + (PY / 2));

	if (env.diagonal) {
		con.save();
		con.strokeStyle = 'white';
		con.translate(px * PX + (PX / 2), py * PY + (PY / 2));
		con.rotate(Math.PI / 4);
		con.beginPath();
		con.moveTo((PX / 2) + 4, -4);
		con.lineTo((PX / 2) + 4 + 8, -4);
		con.lineTo((PX / 2) + 4 + 8, -4 - 4);
		con.lineTo((PX / 2) + 4 + 8 + 8, 0);
		con.lineTo((PX / 2) + 4 + 8, 4 + 4);
		con.lineTo((PX / 2) + 4 + 8, 4);
		con.lineTo((PX / 2) + 4, 4);
		con.closePath();
		con.stroke();
		con.rotate(Math.PI / 4 * 2);
		con.beginPath();
		con.moveTo((PX / 2) + 4, -4);
		con.lineTo((PX / 2) + 4 + 8, -4);
		con.lineTo((PX / 2) + 4 + 8, -4 - 4);
		con.lineTo((PX / 2) + 4 + 8 + 8, 0);
		con.lineTo((PX / 2) + 4 + 8, 4 + 4);
		con.lineTo((PX / 2) + 4 + 8, 4);
		con.lineTo((PX / 2) + 4, 4);
		con.closePath();
		con.stroke();
		con.rotate(Math.PI / 4 * 2);
		con.beginPath();
		con.moveTo((PX / 2) + 4, -4);
		con.lineTo((PX / 2) + 4 + 8, -4);
		con.lineTo((PX / 2) + 4 + 8, -4 - 4);
		con.lineTo((PX / 2) + 4 + 8 + 8, 0);
		con.lineTo((PX / 2) + 4 + 8, 4 + 4);
		con.lineTo((PX / 2) + 4 + 8, 4);
		con.lineTo((PX / 2) + 4, 4);
		con.closePath();
		con.stroke();
		con.rotate(Math.PI / 4 * 2);
		con.beginPath();
		con.moveTo((PX / 2) + 4, -4);
		con.lineTo((PX / 2) + 4 + 8, -4);
		con.lineTo((PX / 2) + 4 + 8, -4 - 4);
		con.lineTo((PX / 2) + 4 + 8 + 8, 0);
		con.lineTo((PX / 2) + 4 + 8, 4 + 4);
		con.lineTo((PX / 2) + 4 + 8, 4);
		con.lineTo((PX / 2) + 4, 4);
		con.closePath();
		con.stroke();
		con.restore();
	}

	con.save();
	con.textBaseline = 'top';
	con.textAlign = 'left';
	con.font = '24px consolas';
	con.fillStyle = 'white';
	con.translate(SX * PX, 0);
	con.fillText(player.depth + TEXT_DEPTH, 8, (24 + 6) * 0 + 8);
	con.fillText(TEXT_LEVEL + '：' + player.level, 8, (24 + 6) * 1 + 8);
	con.fillText(TEXT_HP + '：' + player.hp + '/' + player.hpfull, 8, (24 + 6) * 2 + 8);
	con.fillText(TEXT_ENERGY + '：' + player.energy + '/' + player.energyfull, 8, (24 + 6) * 3 + 8);
	con.fillText(TEXT_WEIGHT + '：' + (Math.round(player.weight * 10) / 10) + '/' + player.weightfull, 8, (24 + 6) * 4 + 8);
	con.fillText(TEXT_ATK + '：' + player.atk, 8, (24 + 6) * 5 + 8);
	con.fillText(TEXT_DEF + '：' + player.def, 8, (24 + 6) * 6 + 8);
	con.fillText(TEXT_EXP + '：' + player.exp + '/' + player.expfull, 8, (24 + 6) * 7 + 8);
	con.restore();

	con.save();
	con.textBaseline = 'middle';
	con.textAlign = 'left';
	con.font = '24px consolas';
	con.fillStyle = 'white';
	con.translate(SX * PX, 284);
	if (!invactf) {
		var items = player.items.get_items();
		for (var i = invoffset; i < invoffset + 10 && i < items.length; i++) {
			if (items[i].type === I_APPLE) {
				con.drawImage(img2, 0 * 32, 0 * 32, 32, 32, 8 + 12, (24 + 6) * (i - invoffset) - (32 / 2) - 2, 32, 32);
			}
			else if (items[i].type === I_HP_GRASS) {
				con.drawImage(img2, 1 * 32, 1 * 32, 32, 32, 8 + 12, (24 + 6) * (i - invoffset) - (32 / 2) - 2, 32, 32);
			}
			else if (items[i].cat === I_CAT_POTION) {
				con.drawImage(img2, 7 * 32, 4 * 32, 32, 32, 8 + 12, (24 + 6) * (i - invoffset) - (32 / 2) - 2, 32, 32);
			}
			else if (items[i].cat === I_CAT_WEAPON) {
				con.drawImage(img2, 2 * 32, 10 * 32, 32, 32, 8 + 12, (24 + 6) * (i - invoffset) - (32 / 2) - 2, 32, 32);
			}
			else if (items[i].cat === I_CAT_ARMOR) {
				con.drawImage(img2, 10 * 32, 7 * 32, 32, 32, 8 + 12, (24 + 6) * (i - invoffset) - (32 / 2) - 2, 32, 32);
			}
			else if (items[i].cat === I_CAT_SCROLL) {
				con.drawImage(img2, 6 * 32, 4 * 32, 32, 32, 8 + 12, (24 + 6) * (i - invoffset) - (32 / 2) - 2, 32, 32);
			}
			else {
				throw new Error('not supported.');
			}
			con.fillText(items[i].dname + (items[i].num > 1 ? 'x' + items[i].num : '') + (items[i].equipped ? '[' + TEXT_EQUIPPED + ']' : ''), 8 + 12 + 32 + 4, (24 + 6) * (i - invoffset));
			if (invf && i === invindex) {
				con.fillText('>', 8, (24 + 6) * (i - invoffset));
			}
		}
	}
	else {
		var actions = get_item_actions(player.items.get_item(invindex));
		for (var i = 0; i < actions.length; i++) {
			con.fillText(actions[i].dname, 8 + 12, (24 + 6) * i);
			if (i === invactindex) {
				con.fillText('>', 8, (24 + 6) * i);
			}
		}
	}
	con.restore();

	con.save();
	con.textBaseline = 'top';
	con.textAlign = 'left';
	con.font = '16px consolas';
	con.translate(SX * PX, SCREEN_Y - ((16 + 6) * NUM_MESSAGE + 8 * 2));
	for (var i = 0; i < messages.length; i++) {
		if (messages[i].type === 'normal') {
			con.fillStyle = 'white';
		}
		else if (messages[i].type === 'special') {
			con.fillStyle = 'yellow';
		}
		else if (messages[i].type === 'important') {
			con.fillStyle = 'pink';
		}
		else if (messages[i].type === 'pattack') {
			con.fillStyle = 'yellowgreen';
		}
		else if (messages[i].type === 'eattack') {
			con.fillStyle = 'aqua';
		}
		else {
			throw new Error('not supported.');
		}
		var text = messages[i].text;
		if (messages[i].repeat) {
			text += '（' + 'x' + messages[i].repeat + '）';
		}
		con.fillText(text, 8, (16 + 6) * i + 8);
	}
	con.restore();

	con.save();
	var nx = player.maps[player.depth].nx;
	var ny = player.maps[player.depth].nx;
	var px = Math.floor(MAP_WIDTH / nx);
	var py = Math.floor(MAP_HEIGHT / ny);
	con.translate(SCREEN_X - nx * px, 0);
	for (var i = 0; i < nx; i++) {
		for (var j = 0; j < ny; j++) {
			var block = fields[player.depth].blocks[i][j];
			var mblock = player.maps[player.depth].blocks[i][j];
			if (mblock === M_UNKNOWN) {
				con.fillStyle = 'gray';
			}
			else if (mblock === B_FLOOR) {
				if (block.items && block.items.length > 0) {
					con.fillStyle = 'yellow';
				}
				else if (room !== null && within_room_surrounding(i, j, room)) {
					con.fillStyle = 'dodgerblue';
				}
				else if (room === null && within_player_surrounding(i, j)) {
					con.fillStyle = 'dodgerblue';
				}
				else {
					con.fillStyle = 'royalblue';
				}
			}
			else if (mblock === B_WALL) {
				con.fillStyle = 'black';
			}
			else if (mblock === B_DOWNSTAIR) {
				con.fillStyle = 'yellowgreen';
			}
			con.fillRect(i * px, j * py, px, py);
		}
	}
	for (var i = 0; i < npcs.length; i++) {
		if ((room !== null && within_room_surrounding(npcs[i].x, npcs[i].y, room)) || (room === null && within_player_surrounding(npcs[i].x, npcs[i].y))) {
			con.fillStyle = 'red';
			con.fillRect(npcs[i].x * px, npcs[i].y * py, px, py);
		}
	}
	con.fillStyle = 'pink';
	con.fillRect(player.x * px, player.y * py, px, py);
	con.restore();

	if (dataf) {
		con.fillStyle = 'rgba(0, 0, 0, 0.75)';
		con.fillRect(32, 32, SCREEN_X - 32 * 2, SCREEN_Y - 32 * 2);
	}
}

async function play_sound (name) {
	return new Promise((resolve) => {
		if (option.sound) {
			var audio = document.getElementById('se_' + name);
			audio.play();
			audio.addEventListener('ended', function() {
				resolve(true);
			}, false);
		}
		else {
			resolve(true);
		}
	});
}
