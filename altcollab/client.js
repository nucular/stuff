(function() {
  var client = window.client || {};
  window.client = client;
  
  function now() {
    if (window.performance)
      return window.performance.now();
    else
      return (new Date()).getTime();
  }

  client.config = {
    server: "", // socket.io server
    delay: 1000 / 30, // delay before trying to draw frame
    timeout: 100, // timeout before frame is dropped,
    forcefreq: 1000 / 60 // frequency of force pointer events
  }
  client.queue = [];
  client.focused = false;

  client.init = function() {
    $("#disconnected").fadeOut();
    $("#connected").fadeIn();

    client.canvas = $("#screen")[0];
    client.ctx = client.canvas.getContext("2d");

    client.io = io(client.config.server);

    client.io.on("raw", function(frame) {
      var blob = new Blob([frame.image], {type: "image/jpeg"});
      if (!blob) return;

      var img = new Image();
      img.src = URL.createObjectURL(blob);

      client.queue.push({
        type: "raw",
        start: now(),
        img: img,
        x: frame.x, y: frame.y
      });
      setTimeout(client.frame, client.config.delay);
    });

    client.io.on("copy", function(rect) {
      client.queue.push({
        type: "copy",
        start: now(),
        src: {
          x: rect.src.x,
          y: rect.src.y
        },
        width: rect.width,
        height: rect.height,
        x: rect.x,
        y: rect.y
      });
      setTimeout(client.frame, client.config.delay);
    });

    setInterval(client.frame, client.config.delay);
    input.init();
  }

  client.frame = function() {
    var v = client.queue[0];
    if (!v) return;
    
    var done = false;
    if (v.type == "raw") {
      if (v.img.complete) {
        if (v.img.width > client.canvas.width || v.img.height > client.canvas.height) {
          client.canvas.width = Math.max(client.canvas.width, v.img.width);
          client.canvas.height = Math.max(client.canvas.height, v.img.height);
        }
        client.ctx.drawImage(v.img, v.x, v.y);
        URL.revokeObjectURL(v.img.src);
        done = true;
      }
    } else if (v.type == "copy") {
      var data = client.ctx.getImageData(v.src.x, v.src.y, v.width, v.height);
      client.ctx.putImageData(data, v.x, v.y);
      done = true;
    }

    if (done) {
      client.queue.shift();
    } else {
      var taken = now() - v.start;
      if (taken >= client.config.timeout) {
        console.log("Frame dropped after", taken, "timeout");
        client.queue.shift();
      }
    }
  }
})();
