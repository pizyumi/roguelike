var query = get_query();

var version = 'dev';
var debug = query.debug ? true : version.substring(0, 3) === 'dev';

var img = new Image();
img.src = '/img/Dungeon_B_Freem7.png';
var img2 = new Image();
img2.src = '/img/fighting_fantasy_icons.png';

var time = null;
var seed = null;
var settings = null;
var name = null;

var con = null;
var env = null;

var title_choices = get_title_choices();
var ai_choices = get_ai_choices();

var SCREEN_TITLE = 0;
var SCREEN_AI_SELECTION = 1;
var SCREEN_GAME = 2;
var SCREEN_ITEM = 3;
var SCREEN_DATA = 4;

var screen = SCREEN_TITLE;
var titleindex = 0;
var aiindex = 0;
var invindex = 0;
var invoffset = 0;
var invactf = false;
var invactindex = 0;
var autof = false;
var aif = false;
var aicount = 0;
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

function get_title_choices () {
	var choices = [];
	choices.push({ text: TEXT_START, exec: () => manual() });
	if (debug) {
		choices.push({ text: TEXT_START_AI, exec: () => ai_selection() });
	}
	return choices;
}

function get_ai_choices () {
	var options = [{
		energy: true, 
		energy_level: 0.2
	}, {
		energy: true, 
		energy_level: 0.2, 
		rest: true, 
		rest_level: 0.5
	}, {
		energy: true, 
		energy_level: 0.2, 
		rest: true, 
		rest_level: 0.7
	}, {
		energy: true, 
		energy_level: 0.2, 
		rest: true, 
		rest_level: 0.9
	}];

	return options.map((item, index) => {
		return { text: (index + 1), exec: () => ai(item, index) };
	});
}

async function ai_selection () {
	screen = SCREEN_AI_SELECTION;
	draw();
}

async function manual () {
	screen = SCREEN_GAME;
	settings = new Settings(debug);
	settings.mode = MODE_MANUAL;
	name = 'anonymous';
	init();
	draw();
}

async function ai (option, id) {
	screen = SCREEN_GAME;
	settings = new Settings(debug);
	settings.mode = MODE_AI;
	name = 'ai-' + id;

	aicount = 0;
	while (aicount < settings.ai_count) {
		aicount++;
		init();
		draw();
	
		aif = true;
		while (aif) {
			var r = await auto(option);
			if (r === null || !r) {
				throw new Error('ai error.');
			}
			await sleep(settings.auto_sleep);
			if (gameover) {
				aif = !aif;
				await finish();
			}
		}
	}

	screen = SCREEN_TITLE;
	titleindex = 0;
	draw();
}

async function finish () {
	var record = statistics.get_record(true);
	record.id = time.toString(10);
	record.version = version;
	record.name = name;

	axios.post('/add-record', record).then((res) => {
	}).catch((err) => {
	});
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
		if (screen === SCREEN_TITLE) {
			if (e.keyCode === 38) {
				titleindex--;
				if (titleindex < 0) {
					titleindex = title_choices.length - 1;
				}
			}
			else if (e.keyCode === 40) {
				titleindex++;
				if (titleindex >= title_choices.length) {
					titleindex = 0;
				}
			}
			else if (e.keyCode === 90) {
				title_choices[titleindex].exec();
				return;
			}
			draw();
		}
		else if (screen === SCREEN_AI_SELECTION) {
			if (e.keyCode === 38) {
				aiindex--;
				if (aiindex < 0) {
					aiindex = ai_choices.length - 1;
				}
			}
			else if (e.keyCode === 40) {
				aiindex++;
				if (aiindex >= ai_choices.length) {
					aiindex = 0;
				}
			}
			else if (e.keyCode === 90) {
				ai_choices[aiindex].exec();
				return;
			}
			draw();
		}
		else if (screen === SCREEN_GAME) {
			if (aif) {
				if (e.keyCode === 38) {
					settings.auto_rate_shift++;
				}
				else if (e.keyCode === 40) {
					settings.auto_rate_shift--;
				}
				return;
			}

			if (gameover) {
				if (e.keyCode === 90) {
					finish();
					screen = SCREEN_TITLE;
					titleindex = 0;
					draw();
				}
				return;
			}

			if (autof) {
				if (e.keyCode === 65) {
					autof = !autof;
					draw();
				}
				else if (e.keyCode === 38) {
					settings.auto_rate_shift++;
				}
				else if (e.keyCode === 40) {
					settings.auto_rate_shift--;
				}
				return;
			}
			else {
				if (e.keyCode === 65) {
					autof = !autof;
					auto_forever();
					draw();
					return;
				}
			}

			if (e.keyCode === 16) {
				if (!env.diagonal) {
					env.diagonal = true;
					draw();
				}
				return;
			}

			if (e.keyCode === 68) {
				screen = SCREEN_DATA;

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

				setTimeout(function () {
					create_statistics_html(stats_elem, statistics.get_record(debug), debug, true);
					stats_aux_elem.text('');
				}, 0);

				draw();
				return;
			}

			if (waiting) {
				return;
			}
			
			if (e.keyCode === 88) {
				if (player.items.length === 0) {
					add_message({
						text: MSG_EMPTY_INV,
						type: 'normal'
					});
				}
				else {
					screen = SCREEN_ITEM;
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

			var p = Promise.resolve(null);
			if (e.keyCode >= 37 && e.keyCode <= 40) {
				if (e.shiftKey) {
					if (keyl && keyu) {
						p = up_left();
					}
					else if (keyr && keyu) {
						p = up_right();
					}
					else if (keyl && keyd) {
						p = down_left();
					}
					else if (keyr && keyd) {
						p = down_right();
					}
					else {
						return;
					}
				}
				else {
					if (e.keyCode === 37) {
						p = left();
					}
					else if (e.keyCode === 38) {
						p = up();
					}
					else if (e.keyCode === 39) {
						p = right();
					}
					else if (e.keyCode === 40) {
						p = down();
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
		}
		else if (screen === SCREEN_ITEM) {
			if (invactf) {
				var item = player.items.get_item(invindex);
				var actions = get_item_actions(item);
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
					var p = actions[invactindex].exec(item);

					screen = SCREEN_GAME;
					invactf = !invactf;

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
					screen = SCREEN_GAME;
				}
				else if (e.keyCode === 90) {
					invactf = !invactf;
					invactindex = 0;
				}
			}
			draw();
			return;
		}
		else if (screen === SCREEN_DATA) {
			if (e.keyCode === 68) {
				screen = SCREEN_GAME;

				stats_elem.remove();
				stats_aux_elem.remove();
				draw();
			}
			else if (e.keyCode === 83) {
				navigator.clipboard.writeText(JSON.stringify(statistics.get_record(debug)));
				stats_aux_elem.text(TEXT_SAVE_CLIPBOARD);
			}
		}
		else {
			throw new Error('not supported.');
		}
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
			var dam = calculate_damage(c.atk, player.def);
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

async function auto_forever () {
	while (autof) {
		var r = await auto({});
		if (r === null || !r || gameover) {
			autof = !autof;
			draw();
			return false;
		}
		await sleep(settings.auto_sleep);
	}
}

async function auto (option) {
	if (player.maps[player.depth].room === null) {
		return await move_to_unknown_room().nullthen((r) => move_to_uncleared_passage().nullthen((r) => act_to_downstair()));
	}
	else {
		var r = await search_in_room();
		if (r) {
			return r;
		}
		else {
			if (option.energy && player.energy < Math.ceil(player.energyfull * option.energy_level)) {
				var food = player.items.get_item_cat(I_CAT_FOOD);
				if (food) {
					return await eat(food);
				}
			}
			if (option.rest && player.hp < Math.ceil(player.hpfull * option.rest_level)) {
				return await rest();
			}
			return await move_to_uncleared_passage().nullthen((r) => act_to_downstair());
		}
	}
}

async function move_to_unknown_room () {
	var route = find_unknown_room(player.maps[player.depth], player.x, player.y);
	if (route === null) {
		return null;
	}
	else {
		return await move_to_target(route[0]);
	}
}

async function search_in_room () {
	var route = find_object_in_room(player.maps[player.depth], player.x, player.y);
	if (route === null) {
		return null;
	}
	else if (route.length === 0) {
		return await pickup();
	}
	else {
		return await move_to_target(route[0]);
	}
}

async function move_to_uncleared_passage () {
	var route = find_uncleared_passage(player.maps[player.depth], player.x, player.y);
	if (route === null) {
		return null;
	}
	else {
		return await move_to_target(route[0]);
	}
}

async function act_to_downstair () {
	var route = find_downstair(player.maps[player.depth], player.x, player.y);
	if (route === null) {
		return null;
	}
	else if (route.length === 0) {
		return await downstair();
	}
	else {
		return await move_to_target(route[0]);
	}
}

async function move_to_target (target) {
	if (player.x > target.x) {
		return await left();
	}
	else if (player.x < target.x) {
		return await right();
	}
	if (player.y > target.y) {
		return await up();
	}
	else if (player.y < target.y) {
		return await down();
	}
	return false;
}

function find_unknown_room (map, x, y) {
	return find_route(map, x, y, (map, x, y) => {
		return within_player_surrounding(x, y) && B_CAN_STAND[map.blocks[x][y]];
	}, (map, x, y) => {
		if (x === player.x && y === player.y) {
			return false;
		}
		var f = true;
		for (var i = 0; i < map.rooms.length; i++) {
			if (within_room_surrounding(x, y, map.rooms[i])) {
				f = false;
				break;
			}
		}
		return f;
	});
}

function find_object_in_room (map, x, y) {
	return find_route(map, x, y, (map, x, y) => {
		return within_room_surrounding(x, y, map.room);
	}, (map, x, y) => {
		for (var i = 0; i < map.room.items.length; i++) {
			var item = map.room.items[i];
			if (x === item.x && y === item.y) {
				return true;
			}
		}
		for (var i = 0; i < map.room.npcs.length; i++) {
			var c = map.room.npcs[i];
			if (x === c.x && y === c.y) {
				return true;
			}
		}
		return false;
	});
}

function find_uncleared_passage (map, x, y) {
	return find_route(map, x, y, (map, x, y) => {
		return B_CAN_STAND[map.blocks[x][y]];
	}, (map, x, y) => {
		for (var i = 0; i < map.rooms.length; i++) {
			var room = map.rooms[i];
			if (is_room_surrounding(x, y, room)) {
				for (var j = 0; j < room.passages.length; j++) {
					var passage = room.passages[j];
					if (x === passage.x && y === passage.y && (!passage.to || !passage.to.clear)) {
						var block = null;
						if (passage.direction === DIR_UP) {
							block = map.blocks[passage.x][passage.y - 1];
						}
						else if (passage.direction === DIR_DOWN) {
							block = map.blocks[passage.x][passage.y + 1];
						}
						else if (passage.direction === DIR_LEFT) {
							block = map.blocks[passage.x - 1][passage.y];
						}
						else if (passage.direction === DIR_RIGHT) {
							block = map.blocks[passage.x + 1][passage.y];
						}
						if (block === M_UNKNOWN || B_CAN_STAND[block]) {
							return true;
						}
					}
				}
				return false;
			}
		}
		return false;
	});
}

function find_downstair (map, x, y) {
	return find_route(map, x, y, (map, x, y) => {
		return B_CAN_STAND[map.blocks[x][y]];
	}, (map, x, y) => {
		return x === map.downstair.x && y === map.downstair.y;
	});
}

function find_route (map, x, y, range, condition) {
	var checked = [];
	for (var i = 0; i < map.nx; i++) {
		checked[i] = [];
		for (var j = 0; j < map.ny; j++) {
			checked[i][j] = false;
		}
	}
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
				var route = p.route.concat([{ x: ns[i].x, y: ns[i].y }])
				queue.push({
					x: ns[i].x, 
					y: ns[i].y, 
					route: route
				});
			}
		}
	}
	return null;
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
	statistics.add_action(player.depth, STATS_ACTION_MOVE);
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
	statistics.add_fight(player.depth, c, STATS_FIGHT_OUTBOUND, dam);
	if (c.hp <= 0) {
		npcs.splice(index, 1);
		player.exp += c.exp;
		add_message({
			text: MSG_KILL({name: c.dname, exp: c.exp}),
			type: 'important'
		});
		statistics.add_fight(player.depth, c, STATS_FIGHT_KILLED, 0);

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

function draw () {
	con.fillStyle = 'black';
	con.fillRect(0, 0, SCREEN_X, SCREEN_Y);

	if (screen === SCREEN_TITLE) {
		con.textBaseline = 'alphabetic';
		con.textAlign = 'center';
		con.fillStyle = 'white';

		con.font = '48px consolas';
		con.fillText(TITLE, SCREEN_X / 2, SCREEN_Y / 4);

		con.font = '32px consolas';
		for (var i = 0; i < title_choices.length; i++) {
			con.fillText((titleindex === i ? '> ' : '  ') + title_choices[i].text, SCREEN_X / 2, SCREEN_Y / 4 * 3 + (32 + 8) * i);
		}
	}
	else if (screen === SCREEN_AI_SELECTION) {
		con.textBaseline = 'alphabetic';
		con.textAlign = 'center';
		con.fillStyle = 'white';
		con.font = '32px consolas';
		for (var i = 0; i < ai_choices.length; i++) {
			con.fillText((aiindex === i ? '> ' : '  ') + ai_choices[i].text, SCREEN_X / 2, SCREEN_Y / 4 + (32 + 8) * i);
		}
	}
	else if (screen === SCREEN_GAME || screen === SCREEN_ITEM || screen === SCREEN_DATA) {
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
							if (item.cat === I_CAT_FOOD) {
								if (item.type === I_APPLE) {
									con.drawImage(img2, 0 * 32, 0 * 32, 32, 32, i * PX, j * PY, PX, PY);
								}
								else {
									throw new Error('not supported.');
								}
							}
							else if (item.cat === I_CAT_POTION) {
								if (item.type === I_HEALTH_POTION) {
									con.drawImage(img2, 7 * 32, 4 * 32, 32, 32, i * PX, j * PY, PX, PY);
								}
								else if (item.type === I_HP_UP_POTION) {
									con.drawImage(img2, 7 * 32, 0 * 32, 32, 32, i * PX, j * PY, PX, PY);
								}
								else if (item.type === I_POISON_POTION || item.type === I_ANTIDOTE_POTION) {
									con.drawImage(img2, 7 * 32, 3 * 32, 32, 32, i * PX, j * PY, PX, PY);
								}
								else {
									throw new Error('not supported.');
								}
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

		var states = [];
		var color = 'white';
		if (player.hungry) {
			states.push(TEXT_HUNGRY);
			color = 'yellow';
		}
		else if (player.famine) {
			states.push(TEXT_FAMINE);
			color = 'red';
		}
		else if (player.poison) {
			states.push(TEXT_POISON);
			color = 'red';
		}
	
		con.save();
		con.textBaseline = 'top';
		con.textAlign = 'left';
		con.font = '24px consolas';
		con.fillStyle = color;
		con.translate(SX * PX, 0);
		con.fillText(player.depth + TEXT_DEPTH, 8, (24 + 6) * 0 + 8);
		con.fillText(TEXT_LEVEL + '：' + player.level, 8, (24 + 6) * 1 + 8);
		con.fillText(TEXT_HP + '：' + player.hp + '/' + player.hpfull, 8, (24 + 6) * 2 + 8);
		con.fillText(TEXT_ENERGY + '：' + player.energy + '/' + player.energyfull, 8, (24 + 6) * 3 + 8);
		con.fillText(TEXT_WEIGHT + '：' + round(player.weight, 1) + '/' + player.weightfull, 8, (24 + 6) * 4 + 8);
		con.fillText(TEXT_ATK + '：' + player.atk + '/' + player.atkfull, 8, (24 + 6) * 5 + 8);
		con.fillText(TEXT_DEF + '：' + player.def + '/' + player.deffull, 8, (24 + 6) * 6 + 8);
		con.fillText(TEXT_EXP + '：' + player.exp + '/' + player.expfull, 8, (24 + 6) * 7 + 8);
		con.fillText(TEXT_STATES + '：' + states.join(','), 8 + 256, (24 + 6) * 1 + 8);
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
				if (items[i].cat === I_CAT_FOOD) {
					if (items[i].type === I_APPLE) {
						con.drawImage(img2, 0 * 32, 0 * 32, 32, 32, 8 + 12, (24 + 6) * (i - invoffset) - (32 / 2) - 2, 32, 32);
					}
					else {
						throw new Error('not supported.');
					}
				}
				else if (items[i].cat === I_CAT_POTION) {
					if (items[i].type === I_HEALTH_POTION) {
						con.drawImage(img2, 7 * 32, 4 * 32, 32, 32, 8 + 12, (24 + 6) * (i - invoffset) - (32 / 2) - 2, 32, 32);
					}
					else if (items[i].type === I_HP_UP_POTION) {
						con.drawImage(img2, 7 * 32, 0 * 32, 32, 32, 8 + 12, (24 + 6) * (i - invoffset) - (32 / 2) - 2, 32, 32);
					}
					else if (items[i].type === I_POISON_POTION || items[i].type === I_ANTIDOTE_POTION) {
						con.drawImage(img2, 7 * 32, 3 * 32, 32, 32, 8 + 12, (24 + 6) * (i - invoffset) - (32 / 2) - 2, 32, 32);
					}
					else {
						throw new Error('not supported.');
					}
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
				if (screen === SCREEN_ITEM && i === invindex) {
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
	
		if (autof) {
			con.save();
			con.textBaseline = 'bottom';
			con.textAlign = 'right';
			con.font = '24px consolas';
			con.fillStyle = 'white';
			con.translate(SCREEN_X, SCREEN_Y);
			con.fillText(TEXT_AUTO + (settings.auto_rate === 1 ? '' : (settings.auto_rate + TEXT_SPEED)), 0, 0);
			con.restore();
		}

		if (aif) {
			con.save();
			con.textBaseline = 'bottom';
			con.textAlign = 'right';
			con.font = '24px consolas';
			con.fillStyle = 'white';
			con.translate(SCREEN_X, SCREEN_Y);
			con.fillText(TEXT_AI + aicount + TEXT_COUNT + (settings.auto_rate === 1 ? '' : (settings.auto_rate + TEXT_SPEED)), 0, 0);
			con.restore();
		}
	
		if (screen === SCREEN_DATA) {
			con.fillStyle = 'rgba(0, 0, 0, 0.75)';
			con.fillRect(32, 32, SCREEN_X - 32 * 2, SCREEN_Y - 32 * 2);
		}	
	}
	else {
		throw new Error('not supported.');
	}
}

async function play_sound (name) {
	return new Promise((resolve) => {
		if (settings.sound) {
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

async function sleep (msec) {
	return new Promise((resolve) => {
		setTimeout(function () {
			resolve(true);
		}, msec);
	});
}
