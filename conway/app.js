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

  app.ToolbarEntry = function(text, func) {
    this.text = text;
    this.func = func;
    if (typeof text == "function") {
      Object.defineProperty(this, "text", {
        get: text
      });
    } else {
      this.fontawesome = text.charCodeAt(0) >= 0xf000;
    }
    this.down = false;
  }

  app.ToolbarSpacer = function() {
    this.text = "";
    this.func = function() {}
    this.down = false;
  }

  app.cells = [];
  app.toolbar = [
    new app.ToolbarEntry(function() {
      this.fontawesome = true;
      return app.paused ? "\uf04b" : "\uf04c";
    }, function(b) {
      if (b == "l") {
        app.paused = !app.paused;
      } else if (b == "r") {
        app.paused = false;
        app.tick();
        app.paused = true;
      } else if (b == "wu" && app.position < app.ticks-1) {
        app.position++;
      } else if (b == "wd" && app.position > 0) {
        app.position--;
      }
    }),
    new app.ToolbarEntry(function() {
      return app.mode
    }, function(b) {
      if (b == "l") {
        app.mode = (app.mode + 1) % 5;
      } else if (b == "wu" && app.mode < 4) {
        app.mode++;
      } else if (b == "wd" && app.mode > 0) {
        app.mode--;
      } else if (b == "r") {
        var mode = parseInt(prompt("Enter a Game Of Life mode between 0 and 4:\n"
          + "0 = GOL disabled\n"
          + "1 = entire board, every cycle\n"
          + "2 = every beat separate\n"
          + "3 = every tick separate\n"
          + "4 = entire board, every tick",
          app.mode));
        if (mode >= 0 && mode <= 4)
          app.mode = mode;
      }
    }),
    new app.ToolbarEntry("R", function(b) {
      if (b == "l" || b == "r") {
        var rule = prompt(
          "Enter a Game Of Life ruleset in the form 'begin-neighbours/stay-neighbours':",
          app.getRule()
        );
        if (rule)
          app.setRule(rule);
        }
    }),
    new app.ToolbarEntry("C", function(b) {
      if (b == "l" || b == "r") {
        for (var x = 0; x < app.ticks; x++) {
          app.cells[x] = app.cells[x] || [];
          for (var y = 0; y < app.samples.length; y++) {
            app.cells[x][y] = false;
          }
        }
      }
    }),

    new app.ToolbarSpacer(),

    new app.ToolbarEntry(function() {
      return app.signature;
    }, function(b) {
      if (b == "r") {
        var signature = parseInt(prompt(
          "Enter the number of ticks per beat:",
          app.signature)
        );
        if (signature) {
          app.signature = signature;
        }
      } else if (b == "l") {
        app.signature = (app.signature % 8) + 1;
      } else if (b == "wu" && app.beats < 8) {
        app.signature++;
      } else if (b == "wd" && app.signature > 1) {
        app.signature--;
      }
      app.setTicks(app.beats * app.signature);
    }),
    new app.ToolbarEntry(function() {
      return app.beats;
    }, function(b) {
      if (b == "r") {
        var beats = parseInt(prompt(
          "Enter the number of beats:",
          app.beats)
        );
        if (beats) {
          app.beats = beats;
        }
      } else if (b == "l") {
        app.beats = (app.beats % 8) + 1;
      } else if (b == "wu" && app.beats < 8) {
        app.beats++;
      } else if (b == "wd" && app.beats > 1) {
        app.beats--;
      }
      app.setTicks(app.beats * app.signature);
    }),

    new app.ToolbarSpacer(),

    new app.ToolbarEntry(function() {
      return Math.floor(app.bpm / 100) % 10;
    }, function(b) {
      var digit = Math.floor(app.bpm / 100) % 10;
      if (b == "l") {
        digit = (digit + 1) % 10;
      } else if (b == "r") {
        var bpm = parseInt(prompt("Enter the Beats per Minute:", app.bpm));
        if (!isNaN(bpm) && bpm >= 0 && bpm <= 999)
          app.setBPM(bpm);
        return;
      } else if (b == "wu" && digit < 9) {
        digit++;
      } else if (b == "wd" && digit > 0) {
        digit--;
      }
      app.setBPM(digit * 100
        + (Math.floor(app.bpm / 10) % 10) * 10
        + (Math.floor(app.bpm / 1) % 10) * 1);
    }),
    new app.ToolbarEntry(function() {
      return Math.floor(app.bpm / 10) % 10;
    }, function(b) {
      var digit = Math.floor(app.bpm / 10) % 10;
      if (b == "l") {
        digit = (digit + 1) % 10;
      } else if (b == "r") {
        var bpm = parseInt(prompt("Enter the Beats per Minute:", app.bpm));
        if (!isNaN(bpm) && bpm >= 0 && bpm <= 999)
          app.setBPM(bpm);
        return;
      } else if (b == "wu" && digit < 9) {
        digit++;
      } else if (b == "wd" && digit > 0) {
        digit--;
      }
      app.setBPM((Math.floor(app.bpm / 100) % 10) * 100
        + digit * 10
        + (Math.floor(app.bpm / 1) % 10) * 1);
    }),
    new app.ToolbarEntry(function() {
      return Math.floor(app.bpm / 1) % 10;
    }, function(b) {
      var digit = Math.floor(app.bpm / 1) % 10;
      if (b == "l") {
        digit = (digit + 1) % 10;
      } else if (b == "r") {
        var bpm = parseInt(prompt("Enter the Beats per Minute:", app.bpm));
        if (!isNaN(bpm) && bpm >= 0 && bpm <= 999)
          app.setBPM(bpm);
        return;
      } else if (b == "wu" && digit < 9) {
        digit++;
      } else if (b == "wd" && digit > 0) {
        digit--;
      }
      app.setBPM((Math.floor(app.bpm / 100) % 10) * 100
        + (Math.floor(app.bpm / 10) % 10) * 10
        + digit);
    }),
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

    var mouse = app.togrid(base.mouse.x, base.mouse.y);

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

        if (x == mouse.x && y == mouse.y) {
          l += 10;
          s += 15;
        }

        var cell = app.fromgrid(x, y);

        ctx.fillStyle = "hsl(" + h + ", " + s + "%, " + l + "%)";
        ctx.fillRect(cell.x, cell.y, app.scale - 1, app.scale - 1);
      }
    }

    for (var x = 0; x < app.width; x++) {
      var entry = app.toolbar[x];
      if (app.ToolbarSpacer.prototype.isPrototypeOf(entry))
        entry = null;

      var h = 0, s = 0, l = 15;

      if (entry) {
        if (entry.down)
          l += 10;
        if (mouse.y == app.height - 1 && x == mouse.x)
          l += 10;
      } else {
        l = 10;
      }

      var cell = app.fromgrid(Math.floor(x), app.height - 1);
      ctx.fillStyle = "hsl(" + h + ", " + s + "%, " + l + "%)";
      ctx.fillRect(cell.x, cell.y, app.scale - 1, app.scale - 1);

      if (entry) {
        ctx.fillStyle = "#fff";
        if (entry.fontawesome) {
          ctx.font = Math.floor(app.scale * 0.55) + "px FontAwesome";
          ctx.fillText(entry.text, cell.x + app.scale*0.25, cell.y + app.scale*0.7);
        } else {
          ctx.font = Math.floor(app.scale * 0.8) + "px monospace";
          ctx.fillText(entry.text, cell.x + app.scale*0.25, cell.y + app.scale*0.75);
        }
      }
    }

    ctx.restore();
  }

  app.mousepressed = function(b, x, y) {
    var cell = app.togrid(x, y);
    if (cell.x < 0 || cell.y < 0 || cell.x >= app.width) return false;

    if (cell.y < app.samples.length && b == "l") {
      app.cells[cell.x][cell.y] = !app.cells[cell.x][cell.y];
    } else if (cell.x < app.toolbar.length && cell.y == app.height - 1) {
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
        entry.func.apply(entry, [b]);
      }
    }
  }

  app.mousemoved = function(x, y) {
    var cell = app.togrid(x, y);

    for (var x = 0; x < app.toolbar.length; x++) {
      var entry = app.toolbar[x];
      if (entry.down && (cell.x != x || cell.y != app.samples.length))
        entry.down = false;
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