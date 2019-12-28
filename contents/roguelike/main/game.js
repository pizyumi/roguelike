var query = get_query();

var version = '0.1';
var debug = query.debug ? true : version.substring(0, 3) === 'dev';

var img_player = new Image();
img_player.src = '/img/女性b.png';
var img_field = new Image();
img_field.src = '/img/Dungeon_B_Freem7.png';
var img_item = new Image();
img_item.src = '/img/fighting_fantasy_icons.png';
var img_bat = new Image();
img_bat.src = '/img/pipo-enemy001.png';
var img_slime = new Image();
img_slime.src = '/img/pipo-enemy009.png';

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
	axios.get('readme.md', {}).then((res) => {
		$('#readme').html(marked(res.data));
	}).catch((err) => {
	});

	var canvas = document.getElementById('game');
	con = canvas.getContext('2d');

	var keyl = false;
	var keyu = false;
	var keyr = false;
	var keyd = false;

	env = {
		diagonal: false
	};

	var c = $(canvas);
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
		e.preventDefault();
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
				if (debug && e.keyCode === 65) {
					autof = !autof;
					auto_forever();
					draw();
					return;
				}
			}

			if (e.keyCode === 17) {
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
				if (e.ctrlKey) {
					if (keyl && keyu) {
						if (e.shiftKey) {
							p = turn_up_left();
						}
						else {
							p = up_left();
						}
					}
					else if (keyr && keyu) {
						if (e.shiftKey) {
							p = turn_up_right();
						}
						else {
							p = up_right();
						}
					}
					else if (keyl && keyd) {
						if (e.shiftKey) {
							p = turn_down_left();
						}
						else {
							p = down_left();							
						}
					}
					else if (keyr && keyd) {
						if (e.shiftKey) {
							p = turn_down_right();
						}
						else {
							p = down_right();
						}
					}
					else {
						return;
					}
				}
				else if (e.shiftKey) {
					if (e.keyCode === 37) {
						p = turn_left();
					}
					else if (e.keyCode === 38) {
						p = turn_up();
					}
					else if (e.keyCode === 39) {
						p = turn_right();
					}
					else if (e.keyCode === 40) {
						p = turn_down();
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
					screen = SCREEN_GAME;
					invactf = !invactf;

					var p = actions[invactindex].exec(item);

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
		if (e.keyCode === 17) {
			if (env.diagonal) {
				env.diagonal = false;

				draw();
			}
		}
	});
	c.on('blur', function (e) {
		if (env.diagonal) {
			env.diagonal = false;

			draw();
		}
	});

	draw();
});

async function auto_forever () {
	while (autof) {
		var r = await auto({
			energy: true, 
			energy_level: 0.2, 
			rest: true, 
			rest_level: 0.9
		});
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

function draw () {
	con.fillStyle = 'black';
	con.fillRect(0, 0, SCREEN_X, SCREEN_Y);

	if (screen === SCREEN_TITLE) {
		con.textBaseline = 'alphabetic';
		con.textAlign = 'center';
		con.fillStyle = 'white';

		con.font = '48px consolas';
		con.fillText(TITLE, SCREEN_X / 2, SCREEN_Y / 4);

		con.font = '24px consolas';
		con.fillText(TEXT_VERSION + version, SCREEN_X / 2, SCREEN_Y / 4 + 48);

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
						con.drawImage(img_field, 4 * 32, 5 * 32, 32, 32, i * PX, j * PY, PX, PY);
					}

					con.fillStyle = 'red';
					con.strokeStyle = 'red';
					if (block.trap) {
						if (block.trap.activated) {
							con.beginPath();
							con.moveTo(i * PX + (PX / 8 * 3), j * PY + (PY / 8 * 3));
							con.lineTo(i * PX + (PY / 8 * 5), j * PY + (PY / 8 * 5));
							con.moveTo(i * PX + (PY / 8 * 5), j * PY + (PY / 8 * 3));
							con.lineTo(i * PX + (PX / 8 * 3), j * PY + (PY / 8 * 5));
							con.closePath();
							con.stroke();
						}
					}
	
					if (block.items) {
						for (var k = 0; k < block.items.length; k++) {
							var item = block.items[k];
							if (item.cat === I_CAT_FOOD) {
								if (item.type === I_APPLE) {
									con.drawImage(img_item, 0 * 32, 0 * 32, 32, 32, i * PX, j * PY, PX, PY);
								}
								else {
									throw new Error('not supported.');
								}
							}
							else if (item.cat === I_CAT_POTION) {
								if (item.type === I_HEALTH_POTION) {
									con.drawImage(img_item, 7 * 32, 4 * 32, 32, 32, i * PX, j * PY, PX, PY);
								}
								else if (item.type === I_HP_UP_POTION) {
									con.drawImage(img_item, 7 * 32, 0 * 32, 32, 32, i * PX, j * PY, PX, PY);
								}
								else if (item.type === I_POISON_POTION || item.type === I_ANTIDOTE_POTION) {
									con.drawImage(img_item, 7 * 32, 3 * 32, 32, 32, i * PX, j * PY, PX, PY);
								}
								else {
									throw new Error('not supported.');
								}
							}
							else if (item.cat === I_CAT_WEAPON) {
								con.drawImage(img_item, 2 * 32, 10 * 32, 32, 32, i * PX, j * PY, PX, PY);
							}
							else if (item.cat === I_CAT_ARMOR) {
								con.drawImage(img_item, 10 * 32, 7 * 32, 32, 32, i * PX, j * PY, PX, PY);
							}
							else if (item.cat === I_CAT_SCROLL) {
								con.drawImage(img_item, 6 * 32, 4 * 32, 32, 32, i * PX, j * PY, PX, PY);
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
						con.drawImage(img_bat, 28, 24, 64, 64, (npcs[i].x - ox) * PX - ((64 - PX) / 2), (npcs[i].y - oy) * PY - ((64 - PY) / 2), 64, 64);
					}
					else if (npcs[i].type === E_SLIME) {
						con.drawImage(img_slime, 28, 64, 64, 64, (npcs[i].x - ox) * PX - ((64 - PX) / 2), (npcs[i].y - oy) * PY - ((64 - PY) / 2), 64, 64);
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
	
		if (player.direction === DIR_UP) {
			con.drawImage(img_player, 24, 120, 24, 40, px * PX + ((PX - 36) /2), py * PY - (60 - PX), 36, 60);
		}
		else if (player.direction === DIR_DOWN) {
			con.drawImage(img_player, 24, 0, 24, 40, px * PX + ((PX - 36) /2), py * PY - (60 - PX), 36, 60);
		}
		else if (player.direction === DIR_LEFT) {
			con.drawImage(img_player, 24, 40, 24, 40, px * PX + ((PX - 36) /2), py * PY - (60 - PX), 36, 60);
		}
		else if (player.direction === DIR_RIGHT) {
			con.drawImage(img_player, 24, 80, 24, 40, px * PX + ((PX - 36) /2), py * PY - (60 - PX), 36, 60);
		}
		else if (player.direction === DIR_UP_LEFT) {
			con.drawImage(img_player, 96, 80, 24, 40, px * PX + ((PX - 36) /2), py * PY - (60 - PX), 36, 60);
		}
		else if (player.direction === DIR_UP_RIGHT) {
			con.drawImage(img_player, 96, 120, 24, 40, px * PX + ((PX - 36) /2), py * PY - (60 - PX), 36, 60);
		}
		else if (player.direction === DIR_DOWN_LEFT) {
			con.drawImage(img_player, 96, 0, 24, 40, px * PX + ((PX - 36) /2), py * PY - (60 - PX), 36, 60);
		}
		else if (player.direction === DIR_DOWN_RIGHT) {
			con.drawImage(img_player, 96, 40, 24, 40, px * PX + ((PX - 36) /2), py * PY - (60 - PX), 36, 60);
		}
	
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
						con.drawImage(img_item, 0 * 32, 0 * 32, 32, 32, 8 + 12, (24 + 6) * (i - invoffset) - (32 / 2) - 2, 32, 32);
					}
					else {
						throw new Error('not supported.');
					}
				}
				else if (items[i].cat === I_CAT_POTION) {
					if (items[i].type === I_HEALTH_POTION) {
						con.drawImage(img_item, 7 * 32, 4 * 32, 32, 32, 8 + 12, (24 + 6) * (i - invoffset) - (32 / 2) - 2, 32, 32);
					}
					else if (items[i].type === I_HP_UP_POTION) {
						con.drawImage(img_item, 7 * 32, 0 * 32, 32, 32, 8 + 12, (24 + 6) * (i - invoffset) - (32 / 2) - 2, 32, 32);
					}
					else if (items[i].type === I_POISON_POTION || items[i].type === I_ANTIDOTE_POTION) {
						con.drawImage(img_item, 7 * 32, 3 * 32, 32, 32, 8 + 12, (24 + 6) * (i - invoffset) - (32 / 2) - 2, 32, 32);
					}
					else {
						throw new Error('not supported.');
					}
				}
				else if (items[i].cat === I_CAT_WEAPON) {
					con.drawImage(img_item, 2 * 32, 10 * 32, 32, 32, 8 + 12, (24 + 6) * (i - invoffset) - (32 / 2) - 2, 32, 32);
				}
				else if (items[i].cat === I_CAT_ARMOR) {
					con.drawImage(img_item, 10 * 32, 7 * 32, 32, 32, 8 + 12, (24 + 6) * (i - invoffset) - (32 / 2) - 2, 32, 32);
				}
				else if (items[i].cat === I_CAT_SCROLL) {
					con.drawImage(img_item, 6 * 32, 4 * 32, 32, 32, 8 + 12, (24 + 6) * (i - invoffset) - (32 / 2) - 2, 32, 32);
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
					if (block.trap && block.trap.activated) {
						con.fillStyle = 'gray';
					}
					else if (block.items && block.items.length > 0) {
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
