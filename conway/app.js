(function() {
  "use strict";
  var app = window.app || {};

  app.beats = 4;
  app.signature = 4;

  app.ticks = app.beats * app.signature;
  app.samples = new Array(15);

  app.bpm = 140;
  app.mode = 2

  app.width = app.ticks;
  app.height = app.samples.length + 1;
  app.scale = 1;
  app.x = 0;
  app.y = 0;

  app.paused = false;
  app.position = 0;

  app.cells = [];
  app.toolbar = [
    {
      text: app.mode, down: false,
      action: function() {
        app.mode = (app.mode + 1) % 5;
        this.text = app.mode;
      }
    }
  ];

  app.load = function() {
    for (var x = 0; x < app.ticks; x++) {
      app.cells.push([]);
      for (var y = 0; y < app.samples.length; y++) {
        app.cells[x].push(Math.random() > 0.9);
      }
    }

    app.actx = new AudioContext();
    for (var y = 0; y < app.samples.length; y++) {
      var audio = new Audio("samples/" + ("00"+y).slice(-2) + ".wav");

      var source = app.actx.createMediaElementSource(audio);
      source.connect(app.actx.destination);

      app.samples[y] = audio;
    }

    app.setRule("2/1");
    app.resize(base.canvas.width, base.canvas.height);
    base.setFPS(20);
    setInterval(app.tick, ((1000 * 60) / app.bpm) / app.signature);
  }

  app.update = function(dt) {
  }

  app.resize = function(w, h) {
    app.scale = Math.min(
      w / app.width,
      h / app.height
    );

    app.x = (w / 2) - (app.width * app.scale / 2);
    app.y = (h / 2) - (app.height * app.scale / 2);
  }

  app.fromgrid = function(x, y) {
    var sx = (x * app.scale) + app.x;
    var sy = (y * app.scale) + app.y;

    return {x: sx, y: sy};
  }

  app.togrid = function(x, y) {
    var gx = Math.floor((x - app.x) / app.scale);
    var gy = Math.floor((y - app.y) / app.scale);

    return {x: gx, y: gy};
  }

  app.draw = function(ctx, w, h, s) {
    ctx.save();

    for (var x = 0; x < app.ticks; x++) {
      for (var y = 0; y < app.samples.length; y++) {
        var h = (y / app.samples.length)*180, s = 0, l = 10;

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

        if (app.mode == 1 && app.position == 0)
          s += 50;
        else if (app.mode == 2 && app.position % app.SIGNATURE == 0
          && x < app.position + 4
          && x >= app.position)
          s += 50;
        else if (app.mode == 3 && app.position == x)
          s += 50;
        else if (app.mode == 4)
          s += 50;

        var cell = app.fromgrid(x, y);

        ctx.fillStyle = "hsl(" + h + ", " + s + "%, " + l + "%)";
        ctx.fillRect(cell.x, cell.y, app.scale - 1, app.scale - 1);
      }
    }

    for (var x = 0; x < app.toolbar.length; x++) {
      var entry = app.toolbar[x];
      var h = 0, s = 0, l = 20;

      if (entry.down)
        l += 10;

      var cell = app.fromgrid(x, app.height - 1);
      ctx.fillStyle = "hsl(" + h + ", " + s + "%, " + l + "%)";
      ctx.fillRect(cell.x, cell.y, app.scale - 1, app.scale - 1);

      ctx.fillStyle = "#fff";
      ctx.font = Math.floor(app.scale) + "px monospace";
      ctx.fillText(entry.text, cell.x + app.scale*0.2, cell.y + app.scale*0.8);
    }

    ctx.restore();
  }

  app.mousepressed = function(b, x, y) {
    var cell = app.togrid(x, y);
    if (cell.x < 0 || cell.y < 0 || cell.x >= app.width) return false;

    if (cell.y < app.samples.length) {
      app.cells[cell.x][cell.y] = !app.cells[cell.x][cell.y];
    } else if (cell.x < app.toolbar.length && cell.y < app.height) {
      var entry = app.toolbar[cell.x];
      entry.down = true;
    }
  }

  app.mousereleased = function(b, x, y) {
    var cell = app.togrid(x, y);
    if (cell.x < 0 || cell.y < 0 || cell.x >= app.width) return false;

    if (cell.y < app.samples.length) {
      //
    } else if (cell.x < app.toolbar.length && cell.y < app.height) {
      var entry = app.toolbar[cell.x];
      if (entry.down) {
        entry.down = false;
        entry.action.apply(entry);
      }
    }
  }

  app.cell = function(x, y) {
    if (x < 0 || y < 0) return false;
    if (x >= app.ticks || y >= app.samples.length) return false;
    return app.cells[x][y];
  }

  app.life = function() {
    var ncells = [];

    for (var x = 0; x < app.ticks; x++) {
      ncells.push([]);

      for (var y = 0; y < app.samples.length; y++) {
        var neighbours = 0;

        neighbours += app.cell(x-1, y-1);
        neighbours += app.cell(x-1, y);
        neighbours += app.cell(x-1, y+1);
        neighbours += app.cell(x, y-1);

        neighbours += app.cell(x, y+1);
        neighbours += app.cell(x+1, y-1);
        neighbours += app.cell(x+1, y);
        neighbours += app.cell(x+1, y+1);

        if (app.cell(x, y))
          ncells[x].push(app.stayrules[neighbours]);
        else
          ncells[x].push(app.beginrules[neighbours]);
      }
    }

    app.cells = ncells;
  }

  app.lifeColumn = function(x) {
    var ncol = [];

    for (var y = 0; y < app.samples.length; y++) {
      var neighbours = 0;

      neighbours += app.cell(x-1, y-1);
      neighbours += app.cell(x-1, y);
      neighbours += app.cell(x-1, y+1);
      neighbours += app.cell(x, y-1);

      neighbours += app.cell(x, y+1);
      neighbours += app.cell(x+1, y-1);
      neighbours += app.cell(x+1, y);
      neighbours += app.cell(x+1, y+1);

      if (app.cell(x, y))
        ncol.push(app.stayrules[neighbours]);
      else
        ncol.push(app.beginrules[neighbours]);
    }

    app.cells[x] = ncol;
  }

  app.tick = function() {
    if (app.paused)
      return;

    app.position++;
    if (app.position >= app.ticks) {
      app.position = 0;
    }

    if (app.mode == 1 && app.position == 0) {
      app.life();
    } if (app.mode == 2 && app.position % app.signature == 0) {
      for (var x = app.position; x < app.position + app.signature; x++)
        app.lifeColumn(x);
    } else if (app.mode == 3) {
      app.lifeColumn(app.position);
    } else if (app.mode == 4) {
      app.life();
    }

    var column = app.cells[app.position];
    for (var y = 0; y < app.samples.length; y++) {
      if (column[y] && app.samples[y] && app.samples[y].readyState == 4) {
        app.samples[y].currentTime = 0;
        app.samples[y].play();
      }
    }
  }

  app.setRule = function(r) {
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