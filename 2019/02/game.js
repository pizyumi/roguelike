var TITLE = 'シンプルローグライク';

var SCREEN_X = 1600;
var SCREEN_Y = 800;

var LX = 25;
var LY = 25;
var PX = 32;
var PY = 32;

var B_FLOOR = 0;
var B_WALL = 1;

var startf = false;

var field = null;
var player = null;

$(function(){
	var canvas = document.getElementById('game');
	var con = canvas.getContext('2d');

	var c = $('body');
	c.on('keydown', function (e) {
		if (!startf) {
			if (e.keyCode === 90) {
				startf = true;

				init();

				draw(con);
			}
		}
	});

	draw(con);
});

function init () {
	field = create_field();
	player = {
		x: 12,
		y: 17
	};
}

function create_field () {
	var f = [];
	for (var i = 0; i < LX; i++) {
		f[i] = [];
		for (var j = 0; j < LY; j++) {
			if ((i === 0 || j === 0) || (i === LX -1 || j === LY - 1)) {
				f[i][j] = {
					base: B_WALL
				};
			}
			else {
				f[i][j] = {
					base: B_FLOOR
				};
			}
		}
	}

	return f;
}

function draw (con) {
	con.fillStyle = 'black';
	con.fillRect(0, 0, SCREEN_X, SCREEN_Y);

	if (!startf) {
		con.textBaseline = 'alphabetic';
		con.textAlign = 'center';
		con.fillStyle = 'white';

		con.font = "48px consolas";
		con.fillText(TITLE, SCREEN_X / 2, SCREEN_Y / 4);

		con.font = "32px consolas";
		con.fillText('> はじめる', SCREEN_X / 2, SCREEN_Y / 4 * 3);

		return;
	}

	for (var i = 0; i < LX; i++) {
		for (var j = 0; j < LY; j++) {
			if (field[i][j].base === B_FLOOR) {
				con.fillStyle = 'white';
				con.beginPath();
				con.arc((i + 0.5) * PX, (j + 0.5) * PY, 1, 0, Math.PI * 2);
				con.closePath();
				con.fill();
			}
			else if (field[i][j].base === B_WALL) {
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
	con.fillText('🚶\uFE0E', player.x * PX + (PX / 2), player.y * PY + (PY / 2));
}
