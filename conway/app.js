(function() {
  "use strict";
  var app = window.app || {};

  app.beats = 4;
  app.signature = 4;

  app.ticks = app.beats * app.signature;
  app.samples = new Array(15);

  app.bpm = 140;
  app.mode = 0;

  app.width = app.ticks;
  app.height = app.samples.length + 1;
  app.scale = 1;
  app.x = 0;
  app.y = 0;

  app.paused = false;
  app.position = 0;
  app.interval = null;

  app.cells = [];
  app.toolbar = [
    {
      text: "\uf04c", fa: true, down: false,
      action: function() {
        app.paused = !app.paused;
        this.text = app.paused ? "\uf04b" : "\uf04c";
      }
    },
    {
      text: app.mode, down: false,
      action: function() {
        app.mode = (app.mode + 1) % 5;
        this.text = app.mode;
      }
    },
    {
      text: "R", down: false,
      action: function() {
        app.setRule(prompt(
          "Enter a Game Of Life ruleset in the form 'begin-neighbours/stay-neighbours':",
          app.getRule()
        ));
      }
    },
    {
      text: "C", down: false,
      action: function() {
        for (var x = 0; x < app.ticks; x++) {
          app.cells[x] = app.cells[x] || [];
          for (var y = 0; y < app.samples.length; y++) {
            app.cells[x][y] = false;
          }
        }
      }
    },
    {spacer: true},
    {
      text: app.signature, down: false,
      action: function() {
        app.signature = (app.signature % 8) + 1;
        this.text = app.signature;
        app.setTicks(app.beats * app.signature);
      }
    },
    {
      text: app.beats, down: false,
      action: function() {
        app.beats = (app.beats % 8) + 1;
        this.text = app.beats;
        app.setTicks(app.beats * app.signature);
      }
    },
    {spacer: true},
    {
      text: app.bpm.toString().substr(0, 1), down: false,
      action: function() {
        this.text = ((parseInt(this.text) + 1) % 10).toString();
        app.setBPM(parseInt(app.toolbar[8].text + app.toolbar[9].text + app.toolbar[10].text));
      }
    },
    {
      text: app.bpm.toString().substr(1, 1), down: false,
      action: function() {
        this.text = ((parseInt(this.text) + 1) % 10).toString();
        app.setBPM(parseInt(app.toolbar[8].text + app.toolbar[9].text + app.toolbar[10].text));
      }
    },
    {
      text: app.bpm.toString().substr(2, 1), down: false,
      action: function() {
        this.text = ((parseInt(this.text) + 1) % 10).toString();
        app.setBPM(parseInt(app.toolbar[8].text + app.toolbar[9].text + app.toolbar[10].text));
      }
    }
  ];

  app.load = function() {
    app.actx = new AudioContext();
    for (var y = 0; y < app.samples.length; y++) {
      var audio = new Audio("samples/" + ("00"+y).slice(-2) + ".wav");

      var source = app.actx.createMediaElementSource(audio);
      source.connect(app.actx.destination);

      app.samples[y] = audio;
    }

    app.setRule("B3/S23");
    app.setTicks(app.ticks);

    base.setFPS(60);
    app.setBPM(app.bpm);
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
        if (x % app.signature == 0) {
          l += 5;
        }

        if (app.mode == 1 && app.position == 0)
          s += 50;
        else if (app.mode == 2 && app.position % app.signature == 0
          && x < app.position + app.signature
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
      if (entry.spacer) continue;

      var h = 0, s = 0, l = 20;

      if (entry.down)
        l += 10;

      var cell = app.fromgrid(x, app.height - 1);
      ctx.fillStyle = "hsl(" + h + ", " + s + "%, " + l + "%)";
      ctx.fillRect(cell.x, cell.y, app.scale - 1, app.scale - 1);

      ctx.fillStyle = "#fff";
      if (entry.fa) {
        ctx.font = Math.floor(app.scale * 0.55) + "px FontAwesome";
        ctx.fillText(entry.text, cell.x + app.scale*0.25, cell.y + app.scale*0.7);
      } else {
        ctx.font = Math.floor(app.scale * 0.8) + "px monospace";
        ctx.fillText(entry.text, cell.x + app.scale*0.25, cell.y + app.scale*0.75);
      }
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

  app.mousemoved = function(x, y) {
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

  app.life = function(x1, y1, x2, y2) {
    var ncells = [];
    for (var x = 0; x < app.ticks; x++)
      ncells.push(app.cells[x].slice());

    for (var x = x1 || 0; x < (x2 || app.ticks); x++) {
      for (var y = y1 || 0; y < (y2 || app.samples.length); y++) {
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
          ncells[x][y] = app.stayrules[neighbours];
        else
          ncells[x][y] = app.beginrules[neighbours];
      }
    }

    app.cells = ncells;
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
      app.life(app.position, 0, app.position + app.signature, app.samples.length);
    } else if (app.mode == 3) {
      app.life(app.position, 0, app.position + 1, app.samples.length);
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

  app.getRule = function() {
    var begin = "B";
    for (var i = 0; i < app.beginrules.length; i++) {
      if (app.beginrules[i])
        begin += i;
    }

    var stay = "S";
    for (var i = 0; i < app.stayrules.length; i++) {
      if (app.stayrules[i])
        stay += i;
    }

    return begin + "/" + stay;
  }

  app.setTicks = function(t) {
    app.ticks = t;
    app.width = Math.max(t, app.toolbar.length);

    for (var x = 0; x < app.ticks; x++) {
      app.cells[x] = app.cells[x] || [];
      for (var y = 0; y < app.samples.length; y++) {
        app.cells[x][y] = app.cells[x][y] || false;
      }
    }

    app.resize(base.canvas.width, base.canvas.height);
  }

  app.setBPM = function(bpm) {
    app.bpm = bpm;
    if (app.interval)
      clearInterval(app.interval);
    if (bpm > 0)
      app.interval = setInterval(app.tick, ((1000 * 60) / app.bpm) / app.signature);
    else
      app.interval = null;
  }

  window.app = app;
})();