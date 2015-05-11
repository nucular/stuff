var canvas, ctx;
var jcanvas, jctx;
var width, height;

var dragging = false;
var changed = true;

function removeFromArray(arr, v) {
    var i = arr.indexOf(v);
    arr.splice(i, 1);
}

function v2(x, y) {
    this.x = x;
    this.y = y;
}
var mouse = new v2(0, 0);

function Jack(p) {
    this.p = p;

    this.draw = function() {
        jctx.beginPath()
        jctx.arc(this.p.x, this.p.y, 10, 0, 2 * Math.PI, false);
        jctx.fill();
        jctx.stroke();
    }
}

function Cable(a, b) {
    this.a = a;
    this.b = b;

    this.draw = function() {
        var a = this.a;
        var b = this.b;
        var cx = (this.a.x + this.b.x) / 2;
        var cy = (this.a.y + this.b.y) / 2 + Math.max(50, 300 - Math.sqrt(Math.pow(this.b.x - this.a.x, 2) + Math.pow(this.b.y - this.a.y, 2)));

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(cx, cy, b.x, b.y);
        ctx.stroke();
    }
}

jacks = [];
cables = [];

function drawJacks() {
    jctx.fillStyle = "#222";
    jctx.strokeStyle = "#ccc";
    jctx.lineWidth = 2;
    for (var i = 0; i < jacks.length; i++) {
        jacks[i].draw();
    }
}

function drawCables() {
    ctx.strokeStyle = "#555";
    ctx.lineCap = "round";
    ctx.lineWidth = 10;
    for (var i = 0; i < cables.length; i++) {
        cables[i].draw();
    }
}

function draw() {
    requestAnimationFrame(draw);
    if (changed || dragging) {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(jcanvas, 0, 0); //drawJacks();
        drawCables(ctx);
        changed = false;
    }
}

function mousedown(e) {
    if (!dragging) {
        for (var i = 0; i < jacks.length; i++) {
            if (Math.abs(jacks[i].p.x - e.offsetX) + Math.abs(jacks[i].p.y - e.offsetY) <= 20) {
                for (var j = 0; j < cables.length; j++) {
                    if (cables[j].a === jacks[i].p) {
                        cables[j].a = mouse;
                        dragging = cables[j];
                    } else if (cables[j].b === jacks[i].p) {
                        cables[j].b = mouse;
                        dragging = cables[j];
                    } else {
                        continue;
                    }
                    break;
                }

                if (!dragging) {
                    dragging = new Cable(jacks[i].p, mouse);
                    cables.push(dragging);
                }

                break;
            }
        }
    }
}

function mouseup(e) {
    if (dragging) {
        for (var i = 0; i < jacks.length; i++) {
            if (Math.abs(jacks[i].p.x - e.offsetX) + Math.abs(jacks[i].p.y - e.offsetY) <= 20) {
                if (dragging.a == mouse) {
                    dragging.a = jacks[i].p;
                } else if (dragging.b == mouse) {
                    dragging.b = jacks[i].p;
                }
                dragging = false;
                changed = true;
                break;
            }
        }

        if (dragging) {
            removeFromArray(cables, dragging);
            dragging = false;
            changed = true;
        }
    }
}

$(function(e) {
    canvas = $("canvas")[0];
    ctx = canvas.getContext("2d");
    width = canvas.width;
    height = canvas.height;

    jcanvas = document.createElement("canvas");
    jcanvas.width = width;
    jcanvas.height = height;
    jctx = jcanvas.getContext("2d");

    $(canvas).bind("mousedown", mousedown).bind("mouseup", mouseup);
    $(canvas).bind("mousemove", function(e) { 
        mouse.x = e.offsetX || e.pageX; 
        mouse.y = e.offsetY || e.pageY 
    });

    for (var x = 50; x < width; x += 70) {
        for (var y = 50; y < height; y += 70) {
            jacks.push(new Jack(new v2(x, y)));
        }
    }

    for (var i = 0; i < 10; i++) {
        var start = Math.floor(Math.random() * jacks.length);
        var end = start;
        while (end == start) {
            end = Math.floor(Math.random() * jacks.length);
        }
        cables.push(new Cable(jacks[start].p, jacks[end].p));
    }

    drawJacks(jctx);
    requestAnimationFrame(draw);
});