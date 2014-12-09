// This comes from Charlie Loyd [ @vruba ] http://basecase.org/2012/11/diadem/ and
// also some help from the talented Daniel Bader [ @DBader_Org ] at @Mobify

var pi = Math.PI;
var sin = Math.sin;
var floor = Math.floor;
var abs = Math.abs;
var pow = Math.pow;

// Create canvas for favicon
var canvas = document.createElement('canvas');
var ctx = canvas.getContext('2d');
canvas.width = 16;
canvas.height = 16;

var epoch = function() { return new Date().getTime()/600; }

function clip(min, n, max) {
	if (min > n) { return min; }
	if (max < n) { return max; }
	return n;
}

function K(h) {
	h *= -1;
	var r = sin(pi * h);
	var g = sin(pi * (h + 1/3));
	var b = sin(pi * (h + 2/3));
	return [r, g, b].map(function (c) {
		c = c*c;
		c = 0.85 + (c*0.1);
		return floor(c * 255);
	});
}

function recolor(plus) {

	// Cycle colors
	var cycle = ((epoch()/50) + plus) % 1;
	var color = K(cycle);
	color = 'rgb(' + color.join(',') + ')';

	// Set logo color
	$('.logo a').css({'background-color': color});

	// Set favicon color
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	var favicon = document.getElementById('favicon');
	favicon.href = canvas.toDataURL();
}

$(document).ready(function(){
	recolor(0);
	a = function() {
		setInterval(function() { recolor(0) }, 2000);
	}
	a();
});
