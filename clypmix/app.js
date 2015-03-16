var queue = [];

function preload(cb) {
    $.getJSON("http://corser.herokuapp.com/api.clyp.it/featuredlist/random?count=1", function(res) {
        var res = res[0];

        var a = $("<audio controls preload id='" + res.AudioFileId + "'></audio>").appendTo("#preloading");
        $("<source src='" + res.SecureOggUrl + "' type='audio/ogg'>").appendTo(a);
        $("<source src='" + res.SecureMp3Url + "' type='audio/mp3'>").appendTo(a);
        a[0].volume = Number($("#volume").val());

        queue.push(res);
        if (cb) cb();
    });
}

function demand(cb) {
    if (queue.length > 0) {
        cb(queue.pop());
    } else {
        preload(function() {
            cb(queue.pop());
        });
    }
}

function next() {
    var play = function() {
        demand(function(res) {
            var c = $("<div id='playercontainer'></div>").hide();
            var a = $("#" + res.AudioFileId).appendTo(c);

            a.bind("ended", function() {
                next();
            });

            $("<a href='" + res.Url + "'><h2>" + res.Title + "</h2></a>").appendTo(c);
            $("<p></p>").text(res.Description).appendTo(c);
            $("<a></a>").attr("href", res.Mp3Url).text("MP3").appendTo(c);
            $("<span> &middot; </span>").appendTo(c);
            $("<a></a>").attr("href", res.OggUrl).text("OGG").appendTo(c);

            c.appendTo("#main").fadeIn("fast");
            a[0].play();

            preload();
        });
    }

    if ($("#playercontainer").length) {
        $("#playercontainer").fadeOut("fast", function() {
            $(this).remove();
            play();
        });
    } else {
        play();
    }
}

$("#go-button").click(function() {
    next();
});

$("#android-fix").click(function() {
    $("#android-fix-dialog").fadeToggle();
    $("#android-fix-input").focus().select();
});

$(function() {
    $("#volume").slider({
        formatter: function(val) {
            return "Default volume: " + val;
        }
    }).bind("slide", function(e) {
        $("audio").each(function(i, v) {
            v.volume = e.value;
        });
    });
    preload();
});
