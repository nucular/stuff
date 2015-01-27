var $intro, $canvas;
var canvas, ctx;
var mouse = {top: 0, down: 0, left: 0, right: 0, down: false};

function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function render() {
    var pitch =  1 + ((mouse.top + 200) / canvas.height) * 15;

    ctx.fillStyle = "#fff";
    var w = canvas.width, h = canvas.height;
    for (var y = 0; y < h; y += pitch * 2) {
        ctx.fillRect(0, y, w, pitch);
    }
}

$(function() {
    $intro = $("#intro");
    $canvas = $("#canvas");

    canvas = $canvas[0];

    if (!canvas.getContext) return;
    ctx = canvas.getContext("2d");

    // Both canvas and JS (obviously) is supported
    $canvas.hide().css("cursor", "crosshair");
    $intro.css("display", "table");
    
    // Events!
    $(document).bind("mousemove", function(e) {
        mouse.top = e.clientY || e.pageY;
        mouse.bottom = canvas.height - mouse.top;
        mouse.left = e.clientX || e.pageX;
        mouse.right = canvas.width - mouse.left
        if (mouse.down) {
            clear();
            render();
        }
    }).bind("mousedown", function(e) {
        mouse.down = true;
        render();
    }).bind("mouseup", function(e) {
        mouse.down = false;
        clear();
    });

    $(window).bind("resize", function(e) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    $("#intro").bind("mousedown", function() {
        $("#intro").fadeOut("fast", function() {
            $("#canvas").show();
        });
    });
});
