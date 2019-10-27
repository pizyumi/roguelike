﻿var TITLE = 'シンプルローグライク';

var TEXT_START = 'はじめる';

var SCREEN_X = 1600;
var SCREEN_Y = 800;

var LX = 25;
var LY = 25;
var PX = 32;
var PY = 32;

var B_FLOOR = 0;
var B_WALL = 1;

var B_CAN_STAND = [];
B_CAN_STAND[B_FLOOR] = true;
B_CAN_STAND[B_WALL] = false;

var startf = false;

var field = null;
var player = null;

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

		if (e.keyCode === 16) {
			if (!env.diagonal) {
				env.diagonal = true;

				draw(con, env);
			}

			return;
		}

		if (e.keyCode >= 37 && e.keyCode <= 40) {
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
					if (x === LX - 1 || y === 0) {
						return;
					}
					x++;
					y--;
				}
				else if (keyl && keyd) {
					if (x === 0 || y === LY - 1) {
						return;
					}
					x--;
					y++;
				}
				else if (keyr && keyd) {
					if (x === LX - 1 || y === LY - 1) {
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
					if (x === LX - 1) {
						return;
					}
					x++;
				}
				else if (e.keyCode === 40) {
					if (y === LY - 1) {
						return;
					}
					y++;
				}
			}

			if (x !== player.x || y !== player.y) {
				var block = field.blocks[x][y];
				if (B_CAN_STAND[block.base]) {
					player.x = x;
					player.y = y;
				}
				else {
					return;
				}
			}
			else {
				return;
			}
		}
		else {
			return;
		}

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
	field = create_field();
	player = {
		x: 12,
		y: 17
	};
}

function create_field () {
	var blocks = [];
	for (var i = 0; i < LX; i++) {
		blocks[i] = [];
		for (var j = 0; j < LY; j++) {
			if ((i === 0 || j === 0) || (i === LX -1 || j === LY - 1)) {
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

	return {
		blocks: blocks
	};
}

function draw (con, env) {
	con.fillStyle = 'black';
	con.fillRect(0, 0, SCREEN_X, SCREEN_Y);

	if (!startf) {
		con.textBaseline = 'alphabetic';
		con.textAlign = 'center';
		con.fillStyle = 'white';

		con.font = "48px consolas";
		con.fillText(TITLE, SCREEN_X / 2, SCREEN_Y / 4);

		con.font = "32px consolas";
		con.fillText('> ' + TEXT_START, SCREEN_X / 2, SCREEN_Y / 4 * 3);

		return;
	}

	for (var i = 0; i < LX; i++) {
		for (var j = 0; j < LY; j++) {
			var block = field.blocks[i][j];
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
		}
	}

	con.textBaseline = 'middle';
	con.textAlign = 'center';
	con.fillStyle = 'red';
	con.font = '24px consolas';
	con.fillText('🚶\uFE0E', player.x * PX + (PX / 2), player.y * PY + (PY / 2));

	if (env.diagonal) {
		con.save();

		con.strokeStyle = 'white';
		con.translate(player.x * PX + (PX / 2), player.y * PY + (PY / 2));
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
}
