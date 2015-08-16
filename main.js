var d = false;

var dragger = {
	on: false,
	x: 0,
	y: 0,
	dragged: false,

	checkHit: function (x, y) {
		return (x > imagePos.x && x < imagePos.x + (image.width / zoomLevel) &&
			y > imagePos.y && y < imagePos.y + (image.height / zoomLevel));
	},
	mouseMoveHandler: function (e) {
		if (dragger.on) {
			var cursorPos = getCursorPosition(e);

			imagePos.x = clipCoord("x", (imagePos.x + (cursorPos.x - dragger.x)));
			imagePos.y = clipCoord("y", (imagePos.y + (cursorPos.y - dragger.y)));

			dragger.x = cursorPos.x;
			dragger.y = cursorPos.y;

			renderScene();
		}
	},
	mouseDownHandler: function (e) {
		var cursorPos = getCursorPosition(e);

		if (!dragger.on && dragger.checkHit(cursorPos.x, cursorPos.y)) {
			console.log("Dragging");
			dragger.on = true;
			dragger.dragged = true;
			dragger.x = cursorPos.x;
			dragger.y = cursorPos.y;
		}
	},
	endDrag: function (e) {
		dragger.on = false;
	},
	mouseWheelHandler: function (e) {
		var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
		var which = delta === 1 ? "in" : "out";
		zoom(which);
	}
};

var zoomLevel = 1;
var zoomDelta = 0.1;

var ready = false;
var canvas;
var offscreen;
var offContext;

var context;
var image;
var imagePos = {
	x: (canvasWidth / 2),
	y: (canvasHeight / 2)
};

var canvasWidth = 400;
var canvasHeight = 400;

var radius = 75;
var circleX = (canvasWidth / 2);
var circleY = (canvasHeight / 2);

window.onload = function () {
	canvas = document.getElementById("main");
	offscreen = document.getElementById("c-offscreen");
	offContext = offscreen.getContext("2d");
	context = canvas.getContext("2d");
	image = new Image();
	image.crossOrigin = "Anonymous";
	image.src = "http://i.imgur.com/yWWa2be.png";

	imagePos.x = imagePos.y = 0;

	image.addEventListener("load", function () {

		var centerPos = getCenterAlignment();
		imagePos.x = centerPos.x;
		imagePos.y = centerPos.y;

		renderScene();
	});

	canvas.addEventListener("mousedown", dragger.mouseDownHandler.bind(this));
	canvas.addEventListener("mousemove", dragger.mouseMoveHandler.bind(this));
	canvas.addEventListener("mousewheel", dragger.mouseWheelHandler.bind(this), false);

	canvas.addEventListener("mouseup", dragger.endDrag.bind(this));
	canvas.addEventListener("mouseleave", dragger.endDrag.bind(this));
	document.body.addEventListener("mouseup", dragger.endDrag.bind(this));
	document.body.addEventListener("mouseleave", dragger.endDrag.bind(this));
	// Firefox
	canvas.addEventListener("DOMMouseScroll", dragger.mouseWheelHandler, false);
};

function getCenterAlignment() {
	var circleMidpoint = (circleX + radius);
	var hWidth = ((image.width / zoomLevel) / 2);
	var hHeight = ((image.height / zoomLevel) / 2);

	return {
		x: clipCoord("x", (circleMidpoint - hWidth - radius)),
		y: clipCoord("y", (circleMidpoint - hHeight - radius))
	};
}

function clipCoord (which, val) {
	var imageVal = which === "x" ? (image.width / zoomLevel) : (image.height / zoomLevel);

	// note: circleX should === circleY
	// if the left side of the pick
	if (val >= circleX - radius) {
		return circleX - radius;
	} else if ((val + imageVal) <= (circleX + radius)) {
		return (circleX + radius - imageVal);
	} else {
		return val;
	}
};

function getCursorPosition(event) {
	var rect = canvas.getBoundingClientRect();
	return {
		x: event.clientX - rect.left,
		y: event.clientY - rect.top
	};
	}		


function renderScene () {
	context.clearRect(0, 0, canvasWidth, canvasHeight);
	
	context.globalAlpha = 1;
	context.drawImage(image, imagePos.x, imagePos.y, image.width / zoomLevel, image.height / zoomLevel);

	context.save();
  context.globalCompositeOperation = 'destination-in';
  context.beginPath();
  context.arc(circleX, circleY, radius, 0, 2 * Math.PI, false);
  context.fill();

  
  context.restore();

  context.globalAlpha = 0.2;
  context.drawImage(image, imagePos.x, imagePos.y, image.width / zoomLevel, image.height / zoomLevel);

  context.strokeRect(imagePos.x, imagePos.y, image.width / zoomLevel, image.height / zoomLevel);
}

function cropPicture () {
	var finalSize = 150;
	var cDiameter = finalSize;
	var cRadius = cDiameter / 2;

	var cropX = (circleX - (circleX - (imagePos.x - cDiameter - cRadius)));
	var cropY = (circleY - (circleY - (imagePos.y - cDiameter - cRadius)));

	console.log("pos: ", cropX, cropY);
	offContext.clearRect(0, 0, finalSize, finalSize);
		
	offContext.globalAlpha = 1;
	offContext.drawImage(image, cropX, cropY,
		image.width / zoomLevel, image.height / zoomLevel);

	offContext.save();
  offContext.globalCompositeOperation = 'destination-in';
  offContext.beginPath();
  offContext.arc(finalSize / 2, finalSize / 2, cRadius, 0, 2 * Math.PI, false);
  offContext.fill();

  
  offContext.restore();

  var data = offscreen.toDataURL("image/jpeg", 1.0);
  console.log("Out data: ", data);
}

function zoom (which) {
	var oldZoom = zoomLevel;

	if (which === "in") {
		zoomLevel -= zoomDelta;
	} else {
		zoomLevel += zoomDelta;
	}

	if ((image.width / zoomLevel) < (radius * 2) || ((image.height / zoomLevel) < (radius * 2))) {
		zoomLevel = oldZoom;
		return;
	}

	// center align only if they haven't moved it
	if (!dragger.dragged) {
		imagePos = getCenterAlignment();	
	}

	renderScene();
}