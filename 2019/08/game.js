var TITLE = 'シンプルローグライク';

var TEXT_START = 'はじめる';
var TEXT_DEPTH = '階';
var TEXT_LEVEL = 'レベル';
var TEXT_HP = 'HP';
var TEXT_ENERGY = '満腹度';
var TEXT_WEIGHT = 'アイテム重量';
var TEXT_ATK = '攻撃力';
var TEXT_DEF = '防御力';
var TEXT_EXP = '経験値';

var MSG_INIT = 'あなたは目覚めました。';
var MSG_DOWNSTAIR = '下り階段を降りました。';
var MSG_WALL = '壁に阻まれました。';
var MSG_PATTACK = ({name, dam}) => `${name}に${dam}のダメージを与えました。`;
var MSG_EATTACK = ({name, dam}) => `${name}から${dam}のダメージを受けました。`;
var MSG_KILL = ({name, exp}) => `${name}を倒しました。${exp}の経験値を得ました。`;
var MSG_DIE = 'あなたは倒れました。';
var MSG_LEVELUP = ({level}) => `おめでとうございます。あなたはレベル${level}になりました。`;
var MSG_ENERGY20 = 'お腹が減ってきました。';
var MSG_ENERGY10 = 'お腹がペコペコです。';
var MSG_ENERGY0 = 'お腹が減って死にそうです。';
var MSG_PICKUP = ({name}) => `${name}を拾いました。`;
var MSG_CANT_PICKUP = ({name}) => `${name}を拾おうとしましたが、持ちきれませんでした。`;

var E_RAT_NAME = 'ラット';

var I_APPLE_NAME = 'リンゴ';
var I_HEALTH_POTION_NAME = '回復薬';

var SCREEN_X = 1600;
var SCREEN_Y = 800;

var SX = 25;
var SY = 25;
var PX = 32;
var PY = 32;

var E_RAT = 0;

var E_INFO = [];
E_INFO[E_RAT] = {
	dname: E_RAT_NAME,
	level: 1,
	hp: 4,
	atk: 3,
	def: 3,
	exp: 1
};

var B_FLOOR = 0;
var B_WALL = 1;
var B_DOWNSTAIR = 2;

var B_CAN_STAND = [];
B_CAN_STAND[B_FLOOR] = true;
B_CAN_STAND[B_WALL] = false;
B_CAN_STAND[B_DOWNSTAIR] = true;

var I_APPLE = 0;
var I_HEALTH_POTION = 1;

var I_INFO = [];
I_INFO[I_APPLE] = {
	dname: I_APPLE_NAME,
	weight: 0.1
};
I_INFO[I_HEALTH_POTION] = {
	dname: I_HEALTH_POTION_NAME,
	weight: 0.1
};

var I_CAT_FOOD = 0;
var I_CAT_POTION = 1;

var NUM_MESSAGE = 8;

var img = new Image();
img.src = 'Dungeon_B_Freem7.png';
var img2 = new Image();
img2.src = 'fighting_fantasy_icons.png';

var seed = Date.now().toString(10);

var startf = false;
var invoffset = 0;
var gameover = false;

var fields = null;
var player = null;
var messages = null;

$(function(){
	var canvas = document.getElementById('game');
	var con = canvas.getContext('2d');

	var keyl = false;
	var keyu = false;
	var keyr = false;
	var keyd = false;

	var env = {
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

				init();

				draw(con, env);
			}

			return;
		}

		if (gameover) {
			if (e.keyCode === 90) {
				startf = false;

				draw(con, env);
			}

			return;
		}

		if (e.keyCode === 16) {
			if (!env.diagonal) {
				env.diagonal = true;

				draw(con, env);
			}

			return;
		}

		if (e.keyCode >= 37 && e.keyCode <= 40) {
			var nx = fields[player.depth].nx;
			var ny = fields[player.depth].ny;
			var x = player.x;
			var y = player.y;
			if (e.shiftKey) {
				if (keyl && keyu) {
					if (x === 0 || y === 0) {
						return;
					}
					x--;
					y--;
				}
				else if (keyr && keyu) {
					if (x === nx - 1 || y === 0) {
						return;
					}
					x++;
					y--;
				}
				else if (keyl && keyd) {
					if (x === 0 || y === ny - 1) {
						return;
					}
					x--;
					y++;
				}
				else if (keyr && keyd) {
					if (x === nx - 1 || y === ny - 1) {
						return;
					}
					x++;
					y++;
				}
				else {
					return;
				}
			}
			else {
				if (e.keyCode === 37) {
					if (x === 0) {
						return;
					}
					x--;
				}
				else if (e.keyCode === 38) {
					if (y === 0) {
						return;
					}
					y--;
				}
				else if (e.keyCode === 39) {
					if (x === nx - 1) {
						return;
					}
					x++;
				}
				else if (e.keyCode === 40) {
					if (y === ny - 1) {
						return;
					}
					y++;
				}
			}

			if (x !== player.x || y !== player.y) {
				var npcs = fields[player.depth].npcs;
				var c = undefined;
				var index = 0;
				for (var i = 0; i < npcs.length; i++) {
					if (npcs[i].x === x && npcs[i].y === y) {
						c = npcs[i];
						index = i;
						break;
					}
				}
				if (c) {
					var dam = calculate_damage(player.atk, c.def);
					c.hp -= dam;
					add_message({
						text: MSG_PATTACK({name: c.dname, dam}),
						type: 'pattack'
					});
					if (c.hp <= 0) {
						npcs.splice(index, 1);
						player.exp += c.exp;
						add_message({
							text: MSG_KILL({name: c.dname, exp: c.exp}),
							type: 'important'
						});

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
				}
				else {
					var block = fields[player.depth].blocks[x][y];
					if (B_CAN_STAND[block.base]) {
						player.x = x;
						player.y = y;
					}
					else {
						if (block.base === B_WALL) {
							add_message({
								text: MSG_WALL,
								type: 'normal'
							});

							draw(con, env);
						}

						return;
					}
				}
			}
			else {
				return;
			}
		}
		else if (e.keyCode === 32) {
			var block = fields[player.depth].blocks[player.x][player.y];
			if (block.items && block.items.length > 0) {
				var item = block.items[0];
				if (player.weight + item.weight <= player.weightfull) {
					block.items.shift();
					player.items.push(item);
					player.weight += item.weight;
					add_message({
						text: MSG_PICKUP({name: item.dname}),
						type: 'normal'
					});
				}
				else {
					add_message({
						text: MSG_CANT_PICKUP({name: item.dname}),
						type: 'important'
					});
				}
			}
			else if (block.base === B_DOWNSTAIR) {
				player.depth++;
				if (!fields[player.depth]) {
					fields[player.depth] = create_field(player.depth, [{
						x: player.x,
						y: player.y
					}], seed);
				}
				add_message({
					text: MSG_DOWNSTAIR,
					type: 'normal'
				});
			}
			else {
				return;
			}
		}
		else {
			return;
		}

		execute_turn();

		draw(con, env);
	});
	c.on('keyup', function (e) {
		if (e.keyCode === 16) {
			if (env.diagonal) {
				env.diagonal = false;

				draw(con, env);
			}
		}
	});
	$(window).on('blur', function (e) {
		if (env.diagonal) {
			env.diagonal = false;

			draw(con, env);
		}
	});

	draw(con, env);
});

function init () {
	invoffset = 0;
	gameover = false;

	fields = [];
	fields[0] = create_field(0, [], seed);
	player = new Player();
	messages = [{
		text: MSG_INIT,
		type: 'special'
	}];
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

function execute_turn () {
	var npcs = fields[player.depth].npcs;
	for (var i = 0; i < npcs.length; i++) {
		var c = npcs[i];

		var l = player.x === c.x - 1 && player.y === c.y;
		var u = player.x === c.x && player.y === c.y - 1;
		var r = player.x === c.x + 1 && player.y === c.y;
		var d = player.x === c.x && player.y === c.y + 1;
		var lu = player.x === c.x - 1 && player.y === c.y - 1;
		var ru = player.x === c.x + 1 && player.y === c.y - 1;
		var ld = player.x === c.x - 1 && player.y === c.y + 1;
		var rd = player.x === c.x + 1 && player.y === c.y + 1;
		if (l || u || r || d || lu || ru || ld || rd) {
			var dam = calculate_damage(c.atk, player.def);
			player.hp -= dam;
			add_message({
				text: MSG_EATTACK({name: c.dname, dam}),
				type: 'eattack'
			});
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
			var m = Math.random();
			if (m < 0.5) {
				var dir = Math.floor(Math.random() * 8);
				var x = c.x;
				var y = c.y;
				if (dir === 0) {
					x--;
				}
				else if (dir === 1) {
					y--;
				}
				else if (dir === 2) {
					x++;
				}
				else if (dir === 3) {
					y++;
				}
				else if (dir === 4) {
					x--;
					y--;
				}
				else if (dir === 5) {
					x++;
					y--;
				}
				else if (dir === 6) {
					x--;
					y++;
				}
				else if (dir === 7) {
					x++;
					y++;
				}
				var block = fields[player.depth].blocks[x][y];
				var c2 = undefined;
				for (var j = 0; j < npcs.length; j++) {
					if (npcs[j].x === x && npcs[j].y === y) {
						c2 = npcs[j];
						break;
					}
				}
				if (B_CAN_STAND[block.base] && !c2 && (player.x !== x || player.y !== y)) {
					c.x = x;
					c.y = y;
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
}

function calculate_damage (atk, def) {
	var dam = Math.ceil((atk * 1.1 - def * 0.4) * Math.random());
	if (dam <= 0) {
		dam = 1;
	}
	return dam;
}

function create_field (depth, upstairs, base_seed) {
	var random = new Random(base_seed + ',' + depth.toString(10));

	var nx = 25;
	var ny = 25;
	if (depth > 0) {
		nx = 50;
		ny = 50;
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
		blocks[12][5] = {
			base: B_DOWNSTAIR
		};

		return {
			nx: nx,
			ny: ny,
			blocks: blocks,
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
				var type = E_RAT;
				var level = depth + random.num(depth) + random.num(2);

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

function draw (con, env) {
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

	for (var i = 0; i < SX; i++) {
		for (var j = 0; j < SY; j++) {
			var block = fields[player.depth].blocks[ox + i][oy + j];
			if (block.base === B_FLOOR) {
				con.fillStyle = 'white';
				con.beginPath();
				con.arc((i + 0.5) * PX, (j + 0.5) * PY, 1, 0, Math.PI * 2);
				con.closePath();
				con.fill();
			}
			else if (block.base === B_WALL) {
				con.strokeStyle = 'white';
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
					if (block.items[k].type === I_APPLE) {
						con.drawImage(img2, 0 * 32, 0 * 32, 32, 32, i * PX, j * PY, PX, PY);
					}
					else if (block.items[k].cat === I_CAT_POTION) {
						con.drawImage(img2, 7 * 32, 4 * 32, 32, 32, i * PX, j * PY, PX, PY);
					}
				}
			}
		}
	}

	con.textBaseline = 'middle';
	con.textAlign = 'center';
	var npcs = fields[player.depth].npcs;
	for (var i = 0; i < npcs.length; i++) {
		if (npcs[i].x >= ox && npcs[i].x < ox + SX && npcs[i].y >= oy && npcs[i].y < oy + SY) {
			if (npcs[i].type === E_RAT) {
				con.fillStyle = 'yellow';
				con.font = '16px consolas';
				con.fillText('🐀\uFE0E', (npcs[i].x - ox) * PX + (PX / 2), (npcs[i].y - oy) * PY + (PY / 2));
			}
		}
	}

	var px = player.x - ox;
	var py = player.y - oy;

	con.textBaseline = 'middle';
	con.textAlign = 'center';
	con.fillStyle = 'red';
	con.font = '24px consolas';
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
	for (var i = invoffset; i < invoffset + 10 && i < player.items.length; i++) {
		var item = player.items[i];
		if (item.type === I_APPLE) {
			con.drawImage(img2, 0 * 32, 0 * 32, 32, 32, 8 + 12, (24 + 6) * (i - invoffset) - (32 / 2) - 2, 32, 32);
		}
		else if (item.cat === I_CAT_POTION) {
			con.drawImage(img2, 7 * 32, 4 * 32, 32, 32, 8 + 12, (24 + 6) * (i - invoffset) - (32 / 2) - 2, 32, 32);
		}
		con.fillText(item.dname, 8 + 12 + 32 + 4, (24 + 6) * (i - invoffset));
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
			con.fillStyle = 'red';
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
}

class Player {
	constructor () {
		this.depth = 0;
		this.x = 12;
		this.y = 17;

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
			this.exp = Math.ceil(this.exp * 1.4);
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

function hash (seed) {
	var sha256 = new jsSHA('SHA-256', 'TEXT');
	sha256.update(seed);
	return sha256.getHash('HEX');
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

	num (max) {
		if (max <= 0) {
			throw new Error('max of random.num must be positive.');
		}
		else if (max <= 256) {
			return this.byte() % max;
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

function test_random_class_num () {
	var a = [0, 1, 0, 2, 1, 4, 0, 0, 3, 1, 5, 3, 1, 9, 13, 11];
	var r = new Random('yurina');
	for (var i = 0; i < a.length; i++) {
		if (r.num(i + 1) !== a[i]) {
			throw new Error('test_random_class_num');
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
