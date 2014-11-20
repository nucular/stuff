// From http://stackoverflow.hewgill.com/questions/182/112.html for the lulz
loadingtexts = [
    "Spinning up the hamster",
    "Shovelling coal into the server",
    "Programming the flux capacitor",
    "The architects are still drafting",
    "The bits are breeding",
    "We're building the buildings as fast as we can",
    "Pay no attention to the man behind the curtain",
    "Enjoy the elevator music",
    "A few bits tried to escape, but we caught them",
    "Go ahead -- hold your breath",
    "Hum something loud while others stare",
    "The server is powered by a lemon and two electrodes",
    "It's still faster than YOU could draw it",
    "Press Alt+F4 for a quick IQ test",
    "Time is an illusion. Loading time doubly so",
    "Reticulating Splines",
    "Press play on tape",
    "Are we there yet?",
    "Insert quarter",
    "99 bottles of beer on the wall",
    "Measuring the cable length to fetch your data",
    "Downloading useless random data",
    "Busylooping",
    "The gods contemplate your fate",
    "Waiting for the system admin to hit enter",
    "Paging for the system admin",
    "Doing something useful",
    ""
];

var itagToText = {
    0:   "dash",
    272: "hires/webm",
    271: "1440p/webm",
    264: "1440p/mp4v", //hires
    248: "1080p/webm",
    247: "720p/webm",
    246: "480p/webm",
    245: "480p/webm",
    244: "480p/webm",
    243: "360p/webm",
    242: "240p/webm",
    172: "160kbps/webm",
    171: "96kbps/webm",
    160: "144p/mp4v",
    141: "256kbps/mp4a",
    140: "128kbps/mp4a",
    139: "48kbps/mp4a",
    138: "hires/mp4v",
    137: "1080p/mp4v",
    136: "720p/mp4v",
    135: "480p/mp4v",
    134: "360p/mp4v",
    133: "240p/mp4v",
    120: "720p/flv",
    102: "720p/webm/3D",
    101: "360p/webmH/3D",
    100: "360p/webmL/3D",
    85 : "520p/mp4/3D",
    84 : "720p/mp4/3D",
    83 : "240p/mp4/3D",
    82 : "360p/mp4/3D",
    //78: "",
    //59: "",
    46 : "1080p/webm",
    37 : "1080p/mp4",
    45 : "720p/webm",
    22 : "720p/mp4",
    44 : "480p/webm",
    20 : "480p/mp4",
    35 : "480p/flv",
    43 : "360p/webm",
    18 : "360p/mp4",
    34 : "360p/flv",
    5  : "240p/flv",
    36 : "180p/3gpp",
    17 : "144p/3gpp",
    // last, just in case "4k" video crashes graphics card"s driver
    38 : "highres/mp4", //1440p variable?
    //4? : "highres/webm"

    96 : "1080p Live",
    95 : "720p Live",
    94 : "480p Live",
    93 : "360p Live",
    92 : "240p Live",
    91 : "180p Live", //Guess work
    90 : "144p Live", //Guess work
    132 : "240p Live",
    151 : "72p Live",
    /*
    //Fake live formats
    11080 : "1080p Live",
    10720 : "720p Live",
    10480 : "480p Live",
    10360 : "360p Live",
    10240 : "240p Live",
    10180 : "180p Live",
    10144 : "144p Live",
    10072 : "72p Live",
    */
};

String.prototype.repeat = function( num )
{
    return new Array( num + 1 ).join( this );
}

function updateLoading() {
    if ($loading.is(":visible") ) {
        loadingstate++;
        if (loadingstate >= 12 + 4 * Math.floor(Math.random() * 10)) {
            loadingtext = loadingtexts[Math.floor(Math.random() * loadingtexts.length)];
            loadingstate = 0;
        }

        $loading.text(loadingtext + ".".repeat(loadingstate % 4));
    }
}

function processInfos(t) {
    parse_qs = function(t, sep) {
        var parsed = {};
        var split = t.split(new RegExp("[" + sep + "]+"));
        var pair;
        $.each(split, function(k, v) {
            pair = v.split("=");
            parsed[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
        });
        return parsed
    }

    parse_qsl = function(t, sep) {
        var parsed = [];
        var split = t.split(new RegExp("[" + sep + "]+"));
        var pair;
        $.each(split, function(k, v) {
            pair = v.split("=");
            parsed.push([decodeURIComponent(pair[0]), decodeURIComponent(pair[1])]);
        });
        return parsed
    }

    var parsed = parse_qs(t, "&");

    if (parsed.hasOwnProperty("adaptive_fmts")) {
        var afmts = parsed.adaptive_fmts;
        afmts = parse_qsl(afmts, "&,");
        var parsed_afmts = [];
        var current = {};
        $.each(afmts, function(k, v) {
            if (v[0] == "url") {
                if (current.hasOwnProperty("url")) {
                    parsed_afmts.push(current);
                }
                current = {url: v[1]}
            }
            else {
                current[v[0]] = v[1];
            }
        });
        parsed.adaptive_fmts = parsed_afmts;
    }

    if (parsed.hasOwnProperty("url_encoded_fmt_stream_map")) {
        var fmtmap = parsed.url_encoded_fmt_stream_map;
        fmtmap = parse_qsl(fmtmap, "&,");
        var parsed_fmts = [];
        var current = {};
        $.each(fmtmap, function(k, v) {
            if (v[0] == "itag") {
                if (current.hasOwnProperty("url")) {
                    parsed_fmts.push(current);
                }
                current = {itag: v[1]}
            }
            else {
                current[v[0]] = v[1];
            }
        });
        parsed.url_encoded_fmt_stream_map = undefined;
        parsed.fmts = parsed_fmts;
    }
    console.log(parsed);
    return parsed
}

function showResults(r) {
    $loading.slideUp("fast");
    if (r.hasOwnProperty("status") && r.status == "fail") {
        if (r.hasOwnProperty("reason")) {
            $error.html(r.reason.replace(/\+/g, " "));
        }
        else {
            $error.text("Unknown error on YouTube side.");
        }
        $().add($fetchbutton).add($videoinput).add($error).slideDown("slow");
        return;
    }

    var author = r.author.replace(/\+{3}/g, " &plus; ").replace(/\+/g, " ");
    var title = r.title.replace(/\+{3}/g, " &plus; ").replace(/\+/g, " ");
    $("#author").html(author);
    $("#title").html(title);

    $("tbody", $results).children().remove();
    if (r.hasOwnProperty("fmts")) {
        $.each(r.fmts, function(i, v) {
            var tr = $("<tr></tr>");
            if (v.hasOwnProperty("itag")) {
                var itext = itagToText[v.itag];
                $("<td><a download='" + title.replace(/[^\w\(\)\- ]+/g, "_")
                    + " " + itext.replace(/\//g, "-")
                    + "' href='" + v.url + "'>" + itext + "</a></td>").appendTo(tr);

                if (v.hasOwnProperty("quality"))
                    $("<td>" + v.quality + "</td>").appendTo(tr);
                else
                    $("<td></td>").appendTo(tr);

                if (v.hasOwnProperty("type"))
                    $("<td>" + v.type.replace(";", " ").replace("+codecs=", " ") + "</td>").appendTo(tr);
                else
                    $("<td></td>").appendTo(tr);
            }
            tr.appendTo("#fmts>tbody");
        });
    }

    if (r.hasOwnProperty("adaptive_fmts")) {
        $.each(r.adaptive_fmts, function(i, v) {
            var tr = $("<tr></tr>");
            if (v.hasOwnProperty("itag")) {
                var itext = itagToText[v.itag] || "Unknown (" + v.itag + ")";
                $("<td><a download='" + title + "-" + itext.replace(/\//g, "-")
                    + "' href='" + v.url + "'>" + itext + "</a></td>").appendTo(tr);

                if (v.hasOwnProperty("size"))
                    $("<td>" + v.size + "</td>").appendTo(tr);
                else
                    $("<td></td>").appendTo(tr);

                if (v.hasOwnProperty("type"))
                    $("<td>" + v.type.replace(";", " ").replace("+codecs=", " ") + "</td>").appendTo(tr);
                else
                    $("<td></td>").appendTo(tr);

                if (v.hasOwnProperty("fps"))
                    $("<td>" + v.fps + "</td>").appendTo(tr);
                else
                    $("<td></td>").appendTo(tr);
            }
            tr.appendTo("#afmts>tbody");
        });
    }

    if (r.hasOwnProperty("thumbnail_url")) {
        $("#thumbnail").attr("src", r.thumbnail_url);
    } else {
        $("#thumbnail").attr("src", "http://www.userlogos.org/files/logos/48083_szop_gracz/yt_logo2.png");
    }
    $("#vidlink").attr("href", "https://www.youtube.com/watch?v=" + r.video_id)

    $().add($fetchbutton).add($videoinput).add($results).slideDown("slow");
}

function fetchInfos(url) {
    $().add($error).add($results).slideUp("fast");

    if (url == "") {
        return;
    }
    else {
        $().add($fetchbutton).add($videoinput).slideUp("fast");
    }

    var id;
    if (url.match(/^[A-Za-z0-9_-]{11}$/)) {
        id = url;
    }
    else {
        var m = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i);
        if (m) {
            id = m[1];
        }
        else {
            $error.text("Invalid URL or ID!");
            document.location.hash = "";
            $().add($fetchbutton).add($videoinput).add($error).slideDown("slow");
            return;
        }
    }
    document.location.hash = id;

    loadingtext = loadingtexts[Math.floor(Math.random() * loadingtexts.length)];
    loadingstate = 0;
    $loading.slideDown("slow");
    $.jsonp({
        url: "https://youtube.com/get_video_info?video_id=" + id,
        dataType: "json",
        error: function(xhr, ts, e) {
            if (xhr.status != 502) {
                $loading.slideUp("fast");
                $error.text(e);
                $().add($fetchbutton).add($videoinput).add($error).slideDown("slow");
            } else {
                var p = processInfos(xhr.responseJSON.error);
                showResults(p);
            }
        },
        success: function(data, ts, xhr) {
            // this won't ever happen because we're tricking jsonproxy
        }
    });

    return false;
}

$(function() {
    $fetchbutton = $("#fetch-button");
    $videoinput = $("#video-input");
    $loading = $("#loading");
    $error = $("#error");
    $results = $("#results");

    if (window.top.location != document.location) {
        // break out of the freenom frame
        $("#content").children().css("display", "none");
        $("#content h1").text("Loading...").css("display", "block");

        loadingtext = loadingtexts[Math.floor(Math.random() * loadingtexts.length)];
        loadingstate = 0;
        $loading.slideDown("slow");

        window.top.location.href = document.location.href;
        return;
    }

    var hash = document.location.hash.trim();
    if (hash != "") {
        hash = hash.substring(1);
        $videoinput.val(hash);
        fetchInfos(hash);
    }

    $("form").submit(function(e) {
        e.preventDefault();
        var url = $videoinput.val().trim();
        fetchInfos(url);
    });

    setInterval(updateLoading, 300);
});
