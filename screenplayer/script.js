var $intro, $canvas;
var canvas, ctx;
var midifile, player;
var mouse = {top: 0, down: 0, left: 0, right: 0, down: false};

function render(note) {
    var freq = 440 * Math.pow(2, (note - 12 * 3) / 12);
    var barheight = 35187 * Math.pow(1 / freq, 0.93802);
    var pitch = note / 5;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    var w = canvas.width, h = canvas.height;
    for (var y = 0; y < h; y += barheight) {
        ctx.fillRect(0, y, w, barheight / 2);
    }
}

var channel = {};
channel.noteOn = function(note, velocity) {
  render(note);
}
channel.noteOff = function(note, velocity) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
channel.setProgram = function() {
  //
}
var channels = [];
for (var i = 0; i < 16; i++) {
  channels[i] = channel;
}

$(function() {
    $canvas = $("#canvas");

    canvas = $canvas[0];

    if (!canvas.getContext) return;
    ctx = canvas.getContext("2d");

    $(window).bind("resize", function(e) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var req = new XMLHttpRequest();
		req.open("GET", "nightofknights-mono.mid");
		req.overrideMimeType("text/plain; charset=x-user-defined");
		req.onreadystatechange = function() {
  			if(this.readyState == 4 && this.status == 200) {
  				var t = this.responseText || "" ;
  				var ff = [];
  				var mx = t.length;
  				var scc= String.fromCharCode;
  				for (var z = 0; z < mx; z++) {
  					ff[z] = scc(t.charCodeAt(z) & 255);
  				}
  				midifile = new MidiFile(ff.join(""));
          player = new Replayer(midifile, channels);
          setInterval(function() {
            player.replay(10 / 1000);
          }, 10);
  			}
		}
		req.send();
});
