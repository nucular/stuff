var $body;
var $content;
var $warning;

var $starburst;
var $starburst_rays;
var $starburst_color;

var then, time = 0;

var resized = true;
var colors = [
    "white", "red", "black", "green", "white", "blue",
    "black", "magenta", "white", "yellow", "black", "cyan"
];
var frame = 0;

var img_rot = 0;
var img_scale = 0;
var img_scale_mult = 1;
var img_width = 500, img_height = 300;

var win_width = 0, win_height = 0;

function animate() {
    requestAnimationFrame(animate);
    
    var now = Date.now();
    dt = (now - then) / 1000;
    then = now;
    time += dt;

    $body.css("background-color", colors[frame % colors.length]);
    $starburst_rays.attr("transform", "rotate(" + (time * 50) + ")");
    $starburst_color.attr("stop-color", colors[(frame + 1) % colors.length]);

    img_scale = (1 + (Math.cos(time * 20) / 4)) * img_scale_mult;
    var width = img_width * img_scale;
    var height = img_height * img_scale;
    var x = (win_width / 2) - (width / 2), y = (win_height / 2) - (height / 2);

    $content.css({
        "width": Math.floor(width),
        "height": Math.floor(height),
        "transform": "rotate(" + img_rot + "deg)",
        "left": Math.floor(x),
        "top": Math.floor(y)
    });

    img_rot = Math.sin(time * 10) * 10;

    frame++;
}

setInterval(function() {
    if (resized) {
        resized = false;

        win_width = $(window).width();
        win_height = $(window).height();

        var wf = win_width / win_height, hf = win_height / win_width;
        if (wf > hf)
            $starburst.attr("transform", "scale(" + wf + "," + 1 + ")");
        else
            $starburst.attr("transform", "scale(" + 1 + "," + hf + ")");

        img_scale_mult = Math.min(Math.min(
            win_width / img_width / 1.5, win_height / img_height / 1.8
        ), 1);

        $warning.css("padding-top", win_height / 2 - 200)
    }
}, 300)

$(function() {
    $body = $(document.body);
    $warning = $("#warning");

    $image = $("#image");
    $youtube = $("#youtube");
    $z0r = $("#z0r");

    $starburst = $("#starburst-g");
    $starburst_rays = $("#starburst-rays");
    $starburst_color = $("#starburst-color");

    $(window).on("resize", function(e) {
        resized = true;
    });

    $warning.on("click", function() {
        $warning.css("display", "none");

        if (window.location.search.length > 1) {
            var url = window.location.search.substr(1);
            var m = url.match(/(?:https?:\/\/)?(?:www\.)?youtube.com\/watch\?v=([a-zA-Z0-9-_]{11})/);
            if (m) {
                var embd = "http://www.youtube.com/embed/" + m[1] + "?autoplay=1&controls=0&fs=0&iv_load_policy=3&loop=1&rel=0&disablekb=1";
                $youtube.attr("src", embd);
                $content = $youtube;
            } else {
                var m = url.match(/(?:https?:\/\/)?(?:www\.)?z0r\.de\/(\d+)/);
                if (m) {
                    var embd = "http://z0r.de/L/z0r-de_" + m[1] + ".swf";
                    $z0r.attr("data", embd);
                    $content = $z0r;

                    // onload does not fire for objects D:
                    if ($z0r[0].TGetProperty) {
                        img_width = $z0r[0].TGetProperty("/", 8);
                        img_height = $z0r[0].TGetProperty("/", 9);
                        $z0r.attr("width", img_width).attr("height", img_height);
                    } else {
                        img_width = 853;
                        img_height = 480;
                        $z0r.attr("width", 853).attr("height", 480);
                    }
                    $content.css("display", "block");
                    animate();
                } else {
                    $content = $image;
                    $image.attr("src", url);
                }
            }
        } else {
            $content = $image;
            $image.attr("src", "hint.gif");
        }

        $content.on("load", function() {
            img_width = $content.width();
            img_height = $content.height();
            $content.css("display", "block");
            animate();
        });
    });

    then = Date.now();
});
