var TITLE = 'シンプルローグライク';

var SCREEN_X = 1600;
var SCREEN_Y = 800;

var startf = false;

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
	}
}
