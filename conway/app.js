(function() {
  "use strict";
  var app = window.app || {};

  app.BEATS = 4;
  app.SIGNATURE = 4;

  app.WIDTH = app.BEATS * app.SIGNATURE;
  app.HEIGHT = 15;
  app.BPM = 140;

  app.MODE = 2

  app.position = 0;

  app.load = function() {
    app.cells = [];
    for (var x = 0; x < app.WIDTH; x++) {
      app.cells.push([]);
      for (var y = 0; y < app.HEIGHT; y++) {
        app.cells[x].push(Math.random() > 0.8);
      }
    }

    app.rule("1/23");

    app.actx = new AudioContext();
    
    app.samples = [];
    for (var y = 0; y < app.HEIGHT; y++) {
      var audio = new Audio("samples/" + ("00"+y).slice(-2) + ".wav");

      var source = app.actx.createMediaElementSource(audio);
      source.connect(app.actx.destination);

      app.samples.push(audio);
    }

    setInterval(app.beat, ((1000 * 60) / app.BPM) / app.SIGNATURE);
    base.setFPS(20);
  }

  app.update = function(dt) {
  }

  app.draw = function(ctx, w, h, s) {
    var cw = s / app.WIDTH;
    var ch = s / app.HEIGHT;
    var cs = Math.min(cw, ch);

    ctx.save();
    ctx.translate((w / 2) - (s / 2), (h / 2) - (s / 2));

    for (var x = 0; x < app.WIDTH; x++) {
      for (var y = 0; y < app.HEIGHT; y++) {
        var h = (y / app.HEIGHT)*180, s = 0, l = 10;

        if (app.cells[x][y]) {
          l += 40;
          s += 40;
        }
        if (app.position == x) {
          l += 20;
        }
        if (x % 4 == 0) {
          l += 5;
        }

        if (app.MODE == 1 && app.position == 0)
          s += 50;
        else if (app.MODE == 2 && app.position % app.SIGNATURE == 0
          && x < app.position + 4
          && x >= app.position)
          s += 50;
        else if (app.MODE == 3 && app.position == x)
          s += 50;
        else if (app.MODE == 4)
          s += 50;

        ctx.fillStyle = "hsl(" + h + ", " + s + "%, " + l + "%)";
        ctx.fillRect(x * cs, y * cs, cs - 1, cs - 1);
      }
    }

    ctx.fillStyle = "#fff";
    ctx.font = (cs / 2) + "px monospace";
    ctx.fillText("hi", cs/10, cs*15.4);

    ctx.restore();
  }

  app.mousepressed = function(b, x, y) {
    // Coordinate projections suck
    var cx = x - (base.canvas.width / 2);
    var cy = y - (base.canvas.height / 2);
    var s = Math.min(base.canvas.width, base.canvas.height);
    cx = Math.floor((cx + s/2) / Math.min(s / app.WIDTH, s / app.HEIGHT));
    cy = Math.floor((cy + s/2) / Math.min(s / app.WIDTH, s / app.HEIGHT));

    app.cells[cx][cy] = !app.cells[cx][cy];
  }

  app.cell = function(x, y) {
    if (x < 0 || y < 0) return false;
    if (x >= app.WIDTH || y >= app.HEIGHT) return false;
    return app.cells[x][y];
  }

  app.life = function() {
    var ncells = [];

    for (var x = 0; x < app.WIDTH; x++) {
      ncells.push([]);

      for (var y = 0; y < app.HEIGHT; y++) {
        var neighbours = 0;

        neighbours += app.cell(x-1, y-1);
        neighbours += app.cell(x-1, y);
        neighbours += app.cell(x-1, y+1);
        neighbours += app.cell(x, y-1);

        neighbours += app.cell(x, y+1);
        neighbours += app.cell(x+1, y-1);
        neighbours += app.cell(x+1, y);
        neighbours += app.cell(x+1, y+1);

        if (app.cells[x][y])
          ncells[x].push(app.stayrules[neighbours]);
        else
          ncells[x].push(app.beginrules[neighbours]);
      }
    }

    app.cells = ncells;
  }

  app.lifecol = function(x) {
    var ncol = [];

    for (var y = 0; y < app.HEIGHT; y++) {
      var neighbours = 0;

      neighbours += app.cell(x-1, y-1);
      neighbours += app.cell(x-1, y);
      neighbours += app.cell(x-1, y+1);
      neighbours += app.cell(x, y-1);

      neighbours += app.cell(x, y+1);
      neighbours += app.cell(x+1, y-1);
      neighbours += app.cell(x+1, y);
      neighbours += app.cell(x+1, y+1);

      if (app.cells[x][y])
        ncol.push(app.stayrules[neighbours]);
      else
        ncol.push(app.beginrules[neighbours]);
    }

    app.cells[x] = ncol;
  }

  app.beat = function() {
    app.position++;
    if (app.position >= app.WIDTH) {
      app.position = 0;
    }

    if (app.MODE == 1 && app.position == 0) {
      app.life();
    } if (app.MODE == 2 && app.position % app.SIGNATURE == 0) {
      for (var x = app.position; x < app.position + app.SIGNATURE; x++)
        app.lifecol(x);
    } else if (app.MODE == 3) {
      app.lifecol(app.position);
    } else if (app.MODE == 4) {
      app.life();
    }

    var col = app.cells[app.position];
    for (var y = 0; y < app.HEIGHT; y++) {
      if (col[y]) {
        app.samples[y].play();
      }
    }
  }

  app.rule = function(r) {
    var s = r.split("/");

    var begin = [false, false, false, false, false, false, false, false, false];
    var stay = [false, false, false, false, false, false, false, false, false];

    for (var i = 0; i < s[0].length; i++) {
      begin[parseInt(s[0][i])] = true;
    }
    for (var i = 0; i < s[1].length; i++) {
      stay[parseInt(s[1][i])] = true;
    }

    app.beginrules = begin;
    app.stayrules = stay;
  }

  window.app = app;
})();