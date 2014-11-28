// From http://stackoverflow.hewgill.com/questions/182/112.html
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
    "."
];

var itagToText = {
    0:   "dash",
    299: "1080p/mp4v",
    298: "720p/mp4v",
    272: "hires/webm",
    271: "1440p/webm",
    264: "1440p/mp4v", // hires
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
    // last, just in case 4k video crashes graphics cards driver
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

function getTypeExt(type, def) {
    var container = type.split(";");
    if (container && container[0]) {
        switch (container[0]) {
            case "video/mp4": return ".mp4"; break;
            case "audio/mp4": return ".m4a"; break;

            case "video/webm": return ".webm"; break;
            case "audio/webm": return ".weba"; break;

            case "video/x-flv": return ".flv"; break;
            case "video/3gpp": return ".3gp"; break;

            default: return (def || ""); break;
        }
    } else {
        return (def || "");
    }
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
        var startmarker = afmts[0][0];
        $.each(afmts, function(k, v) {
            if (v[0] == startmarker) {
                if (current.hasOwnProperty("url")) {
                    parsed_afmts.push(current);
                }
                current = {};
                current[startmarker] = v[1];
            }
            else {
                current[v[0]] = v[1];
            }
        });
        if (current.hasOwnProperty("url")) {
            parsed_afmts.push(current);
        }
        parsed.adaptive_fmts = parsed_afmts;
    }

    if (parsed.hasOwnProperty("url_encoded_fmt_stream_map")) {
        var fmtmap = parsed.url_encoded_fmt_stream_map;
        fmtmap = parse_qsl(fmtmap, "&,");
        var parsed_fmts = [];
        var current = {};
        var startmarker = fmtmap[0][0];
        $.each(fmtmap, function(k, v) {
            if (v[0] == startmarker) {
                if (current.hasOwnProperty("url")) {
                    parsed_fmts.push(current);
                }
                current = {};
                current[startmarker] = v[1];
            }
            else {
                current[v[0]] = v[1];
            }
        });
        if (current.hasOwnProperty("url")) {
            parsed_afmts.push(current);
        }
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

    var saneauthor = author.replace(/[^\w\(\)\- ]+/g, "");
    var sanetitle = title.replace(/[^\w\(\)\- ]+/g, "");

    $("#author").html(author);
    $("#title").html(title);

    $("tbody", $results).children().remove();
    if (r.hasOwnProperty("fmts")) {
        $.each(r.fmts, function(i, v) {
            if (v.hasOwnProperty("itag")) {
                var tr = $("<tr></tr>");

                var itext = itagToText[v.itag] || "Unknown (" + v.itag + ")";
                var saneitext = (itagToText[v.itag] || v.itag.toString()).replace(/\//g, "-");
                var type = v.type || "";
                var sanetype = type.replace(";", " ")
                    .replace("+codecs=", "(")
                    .replace(/\"/g, "")
                    .replace(/\,/g, ", ") + ((type.indexOf("+codecs=") != -1) ? ")" : "");

                var filename = sanetitle + " (" + saneitext + ")" + getTypeExt(type || "");
                var td = $("<td></td>").appendTo(tr);
                $("<a class=\"dl-link\"></a>")
                    .text(itext)
                    .attr("href", v.url)
                    .attr("download", filename)
                    .appendTo(td);

                if (v.hasOwnProperty("quality"))
                    $("<td></td>").text(v.quality).appendTo(tr);
                else
                    $("<td>n/a</td>").appendTo(tr);

                if (v.hasOwnProperty("type"))
                    $("<td></td>").text(sanetype).appendTo(tr);
                else
                    $("<td>n/a</td>").appendTo(tr);

                tr.appendTo("#fmts>tbody");
            }
        });
    }

    if (r.hasOwnProperty("adaptive_fmts")) {
        $.each(r.adaptive_fmts, function(i, v) {
            if (v.hasOwnProperty("itag")) {
                var tr = $("<tr></tr>");

                var itext = itagToText[v.itag] || "Unknown (" + v.itag + ")";
                var saneitext = (itagToText[v.itag] || v.itag.toString()).replace(/\//g, "-");
                var type = v.type || "";
                var sanetype = v.type.replace(";", " ")
                    .replace("+codecs=", "(")
                    .replace(/\"/g, "")
                    .replace(/\,/g, ", ") + ((type.indexOf("+codecs=") != -1) ? ")" : "");

                var filename = sanetitle + " (" + saneitext + ")" + getTypeExt(type || "");
                var td = $("<td></td>").appendTo(tr);
                $("<a class=\"dl-link\"></a>")
                    .text(itext)
                    .attr("href", v.url)
                    .attr("download", filename)
                    .appendTo(td);

                if (v.hasOwnProperty("size"))
                    $("<td></td>").text(v.size).appendTo(tr);
                else
                    $("<td>n/a</td>").appendTo(tr);

                if (v.hasOwnProperty("type"))
                    $("<td></td>").text(sanetype).appendTo(tr);
                else
                    $("<td>n/a</td>").appendTo(tr);

                if (v.hasOwnProperty("fps"))
                    $("<td></td>").text(v.fps).appendTo(tr);
                else
                    $("<td>n/a</td>").appendTo(tr);

                tr.appendTo("#afmts>tbody");
            }
        });
    }

    $(".dl-link").click(function(e) {
        e.preventDefault();
        $("#dl-hint").stop(true).fadeOut("fast").fadeIn("fast").fadeOut("fast").fadeIn("fast");
    })

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
        document.location.hash = "";
        $("#shortlink").attr("href", "http://ytdl.ga").text("ytdl.ga#[Video URL]");
        return;
    }
    $().add($fetchbutton).add($videoinput).slideUp("fast");

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
            $("#shortlink").attr("href", "http://ytdl.ga").text("ytdl.ga#[Video URL]");
            $().add($fetchbutton).add($videoinput).add($error).slideDown("slow");
            return;
        }
    }
    document.location.hash = id;
    $("#shortlink").attr("href", "http://ytdl.ga#" + id).text("ytdl.ga#" + id);

    loadingtext = loadingtexts[Math.floor(Math.random() * loadingtexts.length)];
    loadingstate = 0;
    $loading.slideDown("slow");
    $.jsonp({
        url: "https://youtube.com/get_video_info?video_id=" + id,
        dataType: "text",
        error: function(xhr, ts, e) {
            $loading.slideUp("fast");
            $error.text(e);
            $().add($fetchbutton).add($videoinput).add($error).slideDown("slow");
        },
        success: function(data, ts, xhr) {
            var p = processInfos(data);
            showResults(p);
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
