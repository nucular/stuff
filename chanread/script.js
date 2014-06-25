var playnext = true;
var voices = ["en", "en-n", "en-rp", "en-sc", "en-us", "en-wm"];

function playThread(res) {
    playnext = true;

    // Store personalities
    var persons = {};
    // wait until done
    var done = true;
    var i = 0;

    function nextMessage(i) {
        if (i > res.length || !playnext) {
            $("#status").text("Done.");
            $("#message").text("");
            return;
        }
        var p = res.posts[i];

        if (p && p.com) {
            // strip html and stuff
            var msg = p.com.replace(/<(?:.|\n)*?>/gm, "");
            msg = msg.replace(/(&gt;)+ ?\d+/g, "\n");
            msg = msg.replace(/&gt; ?/g, " ");
            //msg = msg.replace("\n", " ");
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
                        pitch: 10 + (Math.random() * 60),
                        speed: 130 + (Math.random() * 80),
                        //wordgap: -10 + (Math.random() * 10),
                        voice: voices[Math.floor(Math.random() * voices.length)]
                    }
                    persons[p.id] = options;
                }

                $("#status").text("Generating message " + i + " by " + p.id + " (" + p.name + ")...");
                $("#message")[0].innerHTML = p.com;
                meSpeak.loadVoice("voices/en/" + options.voice);
                meSpeak.speak(msg, options, function() {
                    done = true;
                });
            }
            else {
                done = true;
            }
        }
        else {
            done = true;
        }
    }

    setInterval(function() {
        if (done) {
            i++;
            done = false;
            nextMessage(i);
        }
    }, 500)
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
    $("#status").text("Loading speak.js... may take a while");
    jQuery.getScript("mespeak.js", function() {
        meSpeak.loadConfig("mespeak_config.json");
        // pre-load all voices for faster access later
        for (var i = 0; i < voices.length; i++) {
            meSpeak.loadVoice("voices/en/" + voices[i] + ".json");
        }
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
