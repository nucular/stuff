var LINEHEIGHT = 30;
var PADDING = 10;

var $canvas, canvas, ctx;
var $text, $quality;
var encoder = new JPEGEncoder(5);
var image, text = "", quality = 10;
var imagewidth = 750, imageheight = 750;
var compresstimer;

function wrap() {
  var wrapped = [];
  var words = text.split(" ");
  var line = "";

  for (var n = 0; n < words.length; n++) {
    var testLine = line + words[n] + " ";
    var metrics = ctx.measureText(testLine);
    var testWidth = metrics.width;
    if (testWidth > (canvas.width - PADDING*2) && n > 0) {
      wrapped.push(line);
      line = words[n] + " ";
    }
    else {
      line = testLine;
    }
  }
  wrapped.push(line);
  return wrapped;
}

function resize() {
  var width, height;
  var wrapped = wrap();
  var textheight = (wrapped.length * LINEHEIGHT) + PADDING*2 + LINEHEIGHT;
  if (image) {
    imagewidth = Math.min(image.width, 750 - PADDING*2);
    imageheight = (imagewidth / image.width) * image.height;
  } else {
    imagewidth = 750;
    imageheight = 750 + textheight;
  }
  canvas.width = imagewidth + PADDING*2;
  canvas.height = textheight + PADDING + imageheight;
}

function draw() {
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = LINEHEIGHT + 'px "HelveticaNeue","Helvetica Neue",Helvetica,Arial,sans-serif';
  ctx.fillStyle = "#000";

  ctx.textAlign = "left";
  var wrapped = wrap();
  for (var i = 0; i < wrapped.length; i++) {
    ctx.fillText(wrapped[i], PADDING, LINEHEIGHT + PADDING + i * LINEHEIGHT);
  }
  var imagey = (wrapped.length * LINEHEIGHT) + PADDING + LINEHEIGHT;

  if (!image) {
    ctx.textAlign = "center";
    ctx.fillText("drop your image here \ud83d\ude03", 750/2, 750/2 + imagey);
  } else {
    ctx.drawImage(image, PADDING, imagey, imagewidth, imageheight);
  }
}

function compress() {
  var imagedata = ctx.getImageData(0, 0, canvas.width, canvas.height);
  var rawdata = encoder.encode(imagedata, quality, true);
  var blob = new Blob([rawdata.buffer], {type: "image/jpeg"});
  var uri = URL.createObjectURL(blob);
  var img = document.createElement("img");
  img.onload = function(e) {
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(uri);
  }
  img.src = uri;
}

function upload() {
  var imagedata = ctx.getImageData(0, 0, canvas.width, canvas.height);
  var data = encoder.encode(imagedata, quality, false).split(",")[1];

  $.ajax({
    url: "https://api.imgur.com/3/image",
    type: "post",
    headers: {
      Authorization: 'Client-ID 9ac5785cc8ab580'
    },
    data: {
      image: data
    },
    dataType: "json",
    success: function(res) {
      if (res.success) {
        window.location = "https://www.reddit.com/submit"
          + "?url=" + encodeURIComponent(res.data.link)
          + "&title=" + encodeURIComponent(text);
      }
    }
  });
}

$(function() {
  $canvas = $("canvas");
  canvas = $canvas[0];
  ctx = $canvas[0].getContext("2d");

  $text = $("#text");
  $text.on("keyup", function(e) {
    text = $text.val();
    resize();
    draw();
    if (compresstimer) clearTimeout(compresstimer);
    compresstimer = setTimeout(compress, 1000);
  });

  $quality = $("#quality");
  $quality.on("change", function(e) {
    quality = 100 - Number($quality.val());
    $("#quality-label").text(100 - quality);
    draw();
    if (compresstimer) clearTimeout(compresstimer);
    compresstimer = setTimeout(compress, 1000);
  });

  $("#upload").on("click", upload);

  $canvas.on("dragover", function(e) {
    e.preventDefault();
    e.stopPropagation();
  }).on("dragenter", function(e) {
    e.preventDefault();
    e.stopPropagation();
  }).on("drop", function(e) {
    var oe = e.originalEvent;
    if (oe.dataTransfer && oe.dataTransfer.files.length) {
      e.preventDefault();
      e.stopPropagation();
      image = new Image();
      var uri = URL.createObjectURL(oe.dataTransfer.files[0]);
      image.onload = function() {
        resize();
        draw();
        URL.revokeObjectURL(uri);
      }
      image.src = uri;
    }
  });

  draw();
});
