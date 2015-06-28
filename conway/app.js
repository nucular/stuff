(function() {
  "use strict";
  var app = window.app || {};

  app.BEATS = 4;
  app.SIGNATURE = 4;

  app.WIDTH = app.BEATS * app.SIGNATURE;
  app.HEIGHT = 15;
  app.BPM = 100;

  app.position = 0;

  app.load = function() {
    app.cells = [];
    for (var x = 0; x < app.WIDTH; x++) {
      app.cells.push([]);
      for (var y = 0; y < app.HEIGHT; y++) {
        app.cells[x].push(Math.random() >= 0.8);
      }
    }
    app.rule("23/3");

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

        ctx.fillStyle = "hsl(" + h + ", " + s + "%, " + l + "%)";
        ctx.fillRect(x * cs, y * cs, cs - 1, cs - 1);
      }
    }

    ctx.restore();
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
          ncells[x].push(!app.deathrules[neighbours]);
        else
          ncells[x].push(app.birthrules[neighbours]);
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
        ncol.push(!app.deathrules[neighbours]);
      else
        ncol.push(app.birthrules[neighbours]);
    }

    app.cells[x] = ncol;
  }

  app.beat = function() {
    app.position++;
    if (app.position >= app.WIDTH) {
      app.position = 0;
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

    var death = [true, true, true, true, true, true, true, true, true];
    var birth = [false, false, false, false, false, false, false, false, false];

    for (var i = 0; i < s[0].length; i++)
      death[parseInt(s[0][i])] = false;
    for (var i = 0; i < s[1].length; i++)
      birth[parseInt(s[1][i])] = true;

    app.deathrules = death;
    app.birthrules = birth;
  }

  window.app = app;
})();