(function() {
  var input = window.input || {};
  window.input = input;

  input.keymap = {
    8: "backspace",
    9: "tab",
    13: "ret",
    16: "shift",
    17: "ctrl",
    18: "alt",
    19: "?", // pause
    20: "caps_lock",
    27: "esc",
    32: "spc",
    33: "pgup",
    34: "pgdn",
    35: "end",
    36: "home",
    37: "left",
    38: "up",
    39: "right",
    40: "down",
    44: "print",
    45: "insert",
    46: "delete",
    48: "0",
    49: "1",
    50: "2",
    51: "3",
    52: "4",
    53: "5",
    54: "6",
    55: "7",
    56: "8",
    57: "9",
    59: "semicolon",
    61: "equal",
    65: "a",
    66: "b",
    67: "c",
    68: "d",
    69: "e",
    70: "f",
    71: "g",
    72: "h",
    73: "i",
    74: "j",
    75: "k",
    76: "l",
    77: "m",
    78: "n",
    79: "o",
    80: "p",
    81: "q",
    82: "r",
    83: "s",
    84: "t",
    85: "u",
    86: "v",
    87: "w",
    88: "x",
    89: "y",
    90: "z",
    91: "ctrl", // left command
    93: "ctrl", // right command
    107: "equal",
    109: "minus",
    112: "f1",
    113: "f2",
    114: "f3",
    115: "f4",
    116: "f5",
    117: "f6",
    118: "f7",
    119: "f8",
    120: "f9",
    121: "f10",
    122: "f11",
    123: "f12",
    144: "num_lock",
    145: "scroll_lock",
    186: "semicolon",
    187: "equal",
    188: "comma",
    189: "minus",
    190: "dot",
    191: "slash",
    192: "apostrophe",
    219: "bracket_left",
    220: "backslash",
    221: "bracket_right",
    222: "'",
    224: "ctrl" // command in firefox
  }

  input.shift = false;
  input.ctrl = false;
  input.alt = false;

  input.mouse = {
    x: 0, y: 0,
    buttons: 0
  }

  input.forceid = null;

  input.init = function() {
    $(document).on("keydown", function(e) {
      if (client.focused) {
        e.preventDefault();
        input.keydown(e.keyCode);
      }
    }).on("keyup", function(e) {
      if (client.focused) {
        e.preventDefault();
        input.keyup(e.keyCode);
      }
    });

    $("#screen").on("mousemove", function(e) {
      e.preventDefault();
      if (client.focused) {
        input.mousemove(e.offsetX, e.offsetY);
      }
    }).on("mousedown", function(e) {
      e.preventDefault();
      if (client.focused) {
        input.mousedown(e.button);
      } else {
        $(this).focus();
      }
    }).on("mouseup", function(e) {
      e.preventDefault();
      if (client.focused && input.mouse.buttons != 0) {
        input.mouseup(e.button);
      }
    }).on("contextmenu", function(e) {
      e.preventDefault();
      return false;
    }).on("focus", function(e) {
      input.mouse.buttons = 0;
      client.focused = true;
    }).on("blur", function(e) {
      client.focused = false;
    });

    $("#force").on("change", function(e) {
      if (this.checked) {
        input.forceid = setInterval(function() {
          if (client.focused)
            client.io.emit("pointer", input.mouse.x, input.mouse.y, input.mouse.buttons);
        }, client.config.forcefreq);
      } else {
        clearInterval(input.forceid);
      }
    });
  }

  input.mousemove = function(x, y) {
    input.mouse.x = x;
    input.mouse.y = y;
    client.io.emit("pointer", input.mouse.x, input.mouse.y, input.mouse.buttons);
  }

  input.mousedown = function(buttoncode) {
    input.mouse.buttons |= input.mouseToQemu(buttoncode);
    client.io.emit("pointer", input.mouse.x, input.mouse.y, input.mouse.buttons);
  }

  input.mouseup = function(buttoncode) {
    input.mouse.buttons ^= input.mouseToQemu(buttoncode);
    client.io.emit("pointer", input.mouse.x, input.mouse.y, input.mouse.buttons);
  }

  input.keydown = function(keycode) {
    var m = input.keymap[keycode];

    if (m == "shift") input.shift = true;
    else if (m == "ctrl") input.ctrl = true;
    else if (m == "alt") input.alt = true;

    if (m)
      client.io.emit("keydown", input.keyToQemu(keycode));
  }

  input.keyup = function(keycode) {
    var m = input.keymap[keycode];

    if (m == "shift") input.shift = false;
    else if (m == "ctrl") input.ctrl = false;
    else if (m == "alt") input.alt = false;

    if (m)
      client.io.emit("keyup", input.keyToQemu(keycode));
  }

  input.command = function(cmd) {
    if (!cmd) return;
    var lines = cmd.split(/&&|;|\\n/g);
    for (var i = 0; i < lines.length; i++)
      lines[i] = lines[i].trim();
    lines = lines.filter(Boolean);
    client.io.emit("keydown", "?\n" + lines.join("\n"));
  }

  input.keyToQemu = function(keycode) {
    var m = input.keymap[keycode];
    if (!m) return;

    var p = "";
    if (input.shift) p += "shift-";
    if (input.ctrl) p += "ctrl-";
    if (input.alt) p += "alt";
    return p + m;
  }

  input.mouseToQemu = function(buttoncode) {
    return 1 << buttoncode;
  }
})();
