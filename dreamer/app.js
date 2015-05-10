(function() {
  var app = window.app || {};
  window.app = app;

  app.running = false;

  app.carrier = 100;
  app.beat = 10;

  app.starttime = 0;

  app.init = function() {
    app.setFreq();

    app.$ui = $("#ui");
    app.$canvas = $("#canvas");
    app.$carrier = $("#carrier-in");
    app.$beat = $("#beat-in");

    app.$carrier.on("change", function(e) {
      var v = parseFloat($(this).val());
      if (v != app.carrier)
        app.setFreq(v, app.beat);
    });
    app.$beat.on("change", function(e) {
      var v = parseFloat($(this).val());
      if (v != app.beat)
        app.setFreq(app.carrier, v);
    });
    $("#toggle").on("mousedown", function(e) {
      if (app.running)
        app.stop();
      else
        app.start();
    });

    // Video
    app.canvas = app.$canvas[0];
    app.ctx = app.canvas.getContext("2d");
    app.canvas.width = 100; app.canvas.height = 100;

    // Audio
    app.actx = new (window.AudioContext ||
      window.webkitAudioContext ||
      window.mozAudioContext ||
      window.oAudioContext ||
      window.msAudioContext)();

    app.gain = app.actx.createGain ? app.actx.createGain() : app.ctx.createGainNode();
    app.merger = app.actx.createChannelMerger(2);

    app.merger.connect(app.gain);
    app.gain.connect(app.actx.destination);


    app.frame();
  }

  app.start = function() {
    app.running = true;

    $({gain: 0.0}).animate({gain: 0.5}, {
      step: function(now) {
        app.gain.gain.value = now;
      }
    });

    app.osc1 = app.actx.createOscillator();
    app.osc1.type = "sine";
    app.osc1.frequency.value = app.carrier - (app.beat / 2.0);
    app.osc1.connect(app.merger, 0, 0);
    app.osc1.start ? app.osc1.start(0) : app.osc1.noteOn(0);

    app.osc2 = app.actx.createOscillator();
    app.osc2.type = "sine";
    app.osc2.frequency.value = app.carrier + (app.beat / 2.0);
    app.osc2.connect(app.merger, 0, 1);
    app.osc2.start ? app.osc2.start(0) : app.osc2.noteOn(0);

    app.starttime = (performance ? performance.now() : (new Date()).getTime());
    $("#toggle").val("stop");
  }

  app.stop = function() {
    app.running = false;

    $({gain: app.gain.gain.value}).animate({gain: 0.0}, {
      step: function(now) {
        app.gain.gain.value = now;
      },
      done: function() {
        app.osc1.stop ? app.osc1.stop() : void(0);
        app.osc2.stop ? app.osc2.stop() : void(0);

        app.osc1.disconnect();
        app.osc2.disconnect();
      }
    });

    $("#toggle").val("start");
  }

  app.setFreq = function(carrier, beat) {
    app.carrier = carrier || app.carrier;
    app.beat = beat || app.beat;

    if (app.running) {
      app.osc1.frequency.value = app.carrier - (app.beat / 2.0);
      app.osc2.frequency.value = app.carrier + (app.beat / 2.0);
    }

    $("#carrier-in").val(app.carrier);
    $("#beat-in").val(app.beat);
    $("#carrier-out").text(app.carrier);
    $("#beat-out").text(app.beat);

    var title = "";
    var description = "";
    if (app.beat >= 40) {
      title = "gamma";
      description = "Higher mental activity, including perception, problem solving, fear, and consciousness";
    } else if (app.beat >= 13) {
      title = "beta";
      description = "Active, busy or anxious thinking and active concentration, arousal, cognition, and or paranoia";
    } else if (app.beat >= 7) {
      title = "alpha";
      description = "Relaxation (while awake), pre-sleep and pre-wake drowsiness, REM sleep, Dreams";
    } else if (app.beat >= 4) {
      title = "theta";
      description = "Deep meditation/relaxation, NREM sleep";
    } else {
      title = "delta";
      description = "Deep dreamless sleep, loss of body awareness";
    }
    $("#beat-title").text(title);
    $("#beat-description").text(description);
  }

  app.frame = function() {
    requestAnimationFrame(app.frame);

    app.ctx.clearRect(0, 0, app.canvas.width, app.canvas.height);
    if (app.running) {
      var time = (performance ? performance.now() : (new Date()).getTime()) - app.starttime;
      var period = ((Math.sin((time / 1000) * app.beat * Math.PI) +1)/2);

      app.ctx.fillStyle = "rgba(255,255,255, " + period + ")";
      app.ctx.fillRect(0, 0, app.canvas.width, app.canvas.height);
    }
  }

  $(app.init);
})();
