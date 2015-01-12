self.addEventListener("message", function(e) {
    var data = e.data;

    var width = data.width;
    var height = data.height;

    var indata1 = data.indata1;
    var indata2 = data.indata2;
    var outdata = new Uint8Array(width * height * 4);

    var fade1 = data.fade1;
    var fade2 = data.fade2;
    var shift = data.shift;
    var gamma = data.gamma;

    var tf1 = function(c) {
            var scaled = c * fade1 + shift;
            return Math.floor(Math.pow(scaled / 255.0, gamma) * 255.0)
        }
    var tf2 = function(c) {return Math.round(c * fade2)}

    var p = Math.floor(width / 100);
    for (var x = 0; x < width; x++) {
        for (var y = 0; y < height; y++) {

            var o = ((y * width) + x) * 4;
            var i = o; //((Math.floor(y / 2) * width) + Math.floor(x / 2)) * 4;

            if ((x%2==0 && y%2==1) || (x%2==1 && y%2==0)) {
                outdata[o] = tf1(indata1[i]);
                outdata[o+1] = tf1(indata1[i+1]);
                outdata[o+2] = tf1(indata1[i+2]);
                outdata[o+3] = tf1(indata1[i+3]);
            } else {
                outdata[o] = tf2(indata2[i]);
                outdata[o+1] = tf2(indata2[i+1]);
                outdata[o+2] = tf2(indata2[i+2]);
                outdata[o+3] = tf2(indata2[i+3]);
            }
        }

        if (x % p == 0) {
            self.postMessage({
                mode: "process",
                process: (x / width) * 100
            });
        }
    }

    self.postMessage({
        mode: "merge",
        outdata: outdata,
        width: width,
        height: height
    });
});
