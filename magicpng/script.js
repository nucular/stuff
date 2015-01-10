GAMMA = 0.023;
FADE1 = 220.0 / 255.0;
FADE2 = 210.0 / 255.0;
SHIFT = 10;

function makeCRCTable(){
    var c;
    var crcTable = [];
    for(var n =0; n < 256; n++){
        c = n;
        for(var k =0; k < 8; k++){
            c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        }
        crcTable[n] = c;
    }
    return crcTable;
}

function crc32(str) {
    var crcTable = window.crcTable || (window.crcTable = makeCRCTable());
    var crc = 0 ^ (-1);

    for (var i = 0; i < str.length; i++ ) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF];
    }

    return (crc ^ (-1)) >>> 0;
};

function setgAMA(data, gamma) {
    pack32u = function(n) {
        var bytes = [0, 0, 0, 0];
        var i = 3;
        while (n > 0 && i >= 0) {
            bytes[i--] = n % 256;
            n = n >>> 8;
        }
        return String.fromCharCode.apply(this, bytes);
    }

    var end = data.indexOf("PLTE");
    if (end == -1)
        end = data.indexOf("IDAT");
    end -= 4;

    var chunk = "gAMA"; // type
    chunk += pack32u(Math.floor(gamma * 100000)); // value
    chunk += pack32u(crc32(chunk)); // crc
    chunk = String.fromCharCode(0, 0, 0, 4) + chunk; // prepend size

    return data.substring(0, end) + chunk + data.substring(end);
}

$(function() {
    var ctx1 = $("#input-canvas-1")[0].getContext("2d");
    var ctx2 = $("#input-canvas-2")[0].getContext("2d");
    ctx1.fillText("Image 1", 105, 120); ctx2.fillText("Image 2", 105, 120);

    $("#back").bind("click", function() {
        $("#output").fadeOut("fast", function() {
            $("#input").fadeIn("fast");
        });
    })

    $(".drop-area").bind("dragover", function(e) {
        e.stopPropagation();
        e.preventDefault();
        e.originalEvent.dataTransfer.dropEffect = "copy";
    });
    $("#input-drop-1").bind("drop", function(e) {
        e.stopPropagation();
        e.preventDefault();

        var img = new Image;
        img.src = URL.createObjectURL(e.originalEvent.dataTransfer.files[0]);
        img.onload = function() {
            ctx1.canvas.width = img.width; ctx1.canvas.height = img.height;
            ctx1.drawImage(img, 0,0);
        }
    });
    $("#input-drop-2").bind("drop", function(e) {
        e.stopPropagation();
        e.preventDefault();

        var img = new Image;
        img.src = URL.createObjectURL(e.originalEvent.dataTransfer.files[0]);
        img.onload = function() {
            ctx2.canvas.width = img.width; ctx2.canvas.height = img.height;
            ctx2.drawImage(img, 0,0);
        }
    });
    $("#generate").bind("click", function(e) {
        $("#input").fadeOut("fast");

        var ctx = $("#output-canvas")[0].getContext("2d");
        var width = Math.min(ctx1.canvas.width, ctx2.canvas.width);
        var height = Math.min(ctx1.canvas.height, ctx2.canvas.height);

        ctx.canvas.width = width; ctx.canvas.height = height;

        outdata = ctx.getImageData(0, 0, width, height);
        indata1 = ctx1.getImageData(0, 0, width, height);
        indata2 = ctx2.getImageData(0, 0, width, height);

        var tf1 = function(c) {
            var scaled = c * FADE1 + SHIFT;
            return Math.floor(Math.pow(scaled / 255.0, GAMMA) * 255.0)
        }
        var tf2 = function(c) {return Math.round(c * FADE2)}

        for (var x = 0; x < width * 2; x++) {
            for (var y = 0; y < height * 2; y++) {

                var o = ((y * width) + x) * 4;
                var i = o; //((Math.floor(y / 2) * width) + Math.floor(x / 2)) * 4;

                if ((x%2==0 && y%2==1) || (x%2==1 && y%2==0)) {
                    outdata.data[o] = tf1(indata1.data[i]);
                    outdata.data[o+1] = tf1(indata1.data[i+1]);
                    outdata.data[o+2] = tf1(indata1.data[i+2]);
                    outdata.data[o+3] = tf1(indata1.data[i+3]);
                } else {
                    outdata.data[o] = tf2(indata2.data[i]);
                    outdata.data[o+1] = tf2(indata2.data[i+1]);
                    outdata.data[o+2] = tf2(indata2.data[i+2]);
                    outdata.data[o+3] = tf2(indata2.data[i+3]);
                }
            }
        }

        ctx.putImageData(outdata, 0, 0);
        var url = $("#output-canvas")[0].toDataURL();
        var data = atob(url.substring(22));
        data = setgAMA(data, GAMMA);

        var buf = new ArrayBuffer(data.length);
        var view = new Uint8Array(buf);
        for (var i = 0; i < view.length; i++)
            view[i] = data.charCodeAt(i);

        var blob = new Blob([view], {"type": "image/png"});
        var url = (URL || webkitURL || mozURL).createObjectURL(blob);

        $("#save-a").attr("href", url);
        $("#output").fadeIn("fast");
    });
});
