var playnext = true;

function playThread(res) {
    playnext = true;

    // Store personalities
    var persons = {};

    function nextMessage(i) {
        if (i > res.length || !playnext) {
            $("#status").text("Done.");
            $("#message").text("");
            return;
        }
        var p = res.posts[i];

        if (p.com) {
            console.log(p);

            // strip html and stuff
            var msg = p.com.replace(/<(?:.|\n)*?>/gm, "");
            msg = msg.replace(/(&gt;)+ ?\d+/g, "\n");
            msg = msg.replace(/&gt; ?/g, " ");
            msg = msg.replace("\n", " ");
            msg = msg.replace(/https?:\/\/[^\s]+/, " ");

            // replace html entities
            msg = $("<div />").html(msg).text();

            if (msg != "") {
                var options;
                if (persons.hasOwnProperty(p.id)) {
                    options = persons[p.id];
                }
                else {
                    options = {
                        amplitude: 70 + (Math.random() * 50),
                        pitch: 20 + (Math.random() * 120),
                        speed: 140 + (Math.random() * 90),
                        wordgap: -10 + (Math.random() * 10)
                    }
                    persons[p.id] = options;
                }

                $("#status").text("Generating message " + i + " by " + p.id + " (" + p.name + ")...");
                $("#message")[0].innerHTML = p.com;
                speak.play(msg, options, function() {
                    nextMessage(i + 1);
                });
            }
            else {
                nextMessage(i + 1);
            }
        }
        else {
            nextMessage(i + 1);
        }
    }

    nextMessage(0);
}

function fetchThread(url) {
    var match = /https?:\/\/boards.4chan.org\/(\w+)\/thread\/(\d+)\/?/.exec(url);

    if (!match) {
        $("#status").text("Not a valid URL.");
        return;
    }

    var board = match[1], thread = match[2];
    var api = "http://a.4cdn.org/" + board + "/thread/" + thread + ".json"
    var jsonapi = "http://jsonpwrapper.com/?urls%5B%5D=" + encodeURIComponent(api) + "&callback=threadCallback"
    $("#status").text("Fetching thread...");
    $.ajax({
        type: "GET",
        url: jsonapi,
        async: false,
        jsonpCallback: "threadCallback",
        dataType: "jsonp",
        success: function(res) {
            $("#status").text("Done.");
            // For some reason the response isn't parsed as json
            res = JSON.parse(res[0].body);
            playThread(res);
        }
    });
}

$(function() {
    $("#status").text("Loading speak.js...");
    speak.play(".", {}, function() {
        $("#status").text("Ready.");
        $("#panel").css("visibility", "visible");
    });

    $("#playbutton").bind("click", function() {
        fetchThread($("#threadurl")[0].value)
    });

    $("#stopbutton").bind("click", function() {
        playnext = false;
    });
});
