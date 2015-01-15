var itagToText = {
    0:   "dash",

    // MP4

    38 : "highres/mp4", //1440p variable?
    37 : "1080p/mp4",
    22 : "720p/mp4",
    20 : "480p/mp4",
    18 : "360p/mp4",
    // 3D
    102: "720p/webm/3D",
    101: "360p/webmH/3D",
    100: "360p/webmL/3D",
    // Adaptive video
    138: "hires/mp4v",
    264: "1440p/mp4v",
    137: "1080p/mp4v", 299: "1080p/mp4v",
    136: "720p/mp4v", 298: "720p/mp4v",
    135: "480p/mp4v",
    134: "360p/mp4v",
    133: "240p/mp4v",
    160: "144p/mp4v",
    // Adaptive audio
    141: "256kbps/mp4a",
    140: "128kbps/mp4a",
    139: "48kbps/mp4a",

    // WebM

    46 : "1080p/webm",
    45 : "720p/webm",
    44 : "480p/webm",
    43 : "360p/webm",
    // 3D
    85 : "520p/mp4/3D",
    84 : "720p/mp4/3D",
    83 : "240p/mp4/3D",
    82 : "360p/mp4/3D",
    // Adaptive video
    272: "hires/webm",
    271: "1440p/webm",
    248: "1080p/webm",
    247: "720p/webm",
    246: "480p/webm", 245: "480p/webm",
    244: "480p/webm",
    243: "360p/webm",
    242: "240p/webm",
    278: "144p/webm",
    // Adaptive audio
    172: "160kbps/weba",
    171: "96kbps/weba",
    249: "unknown/weba", // downloads 403'd 
    250: "unknown/weba",
    251: "unknown/weba",
    
    // FLV

    120: "720p/flv",
    35 : "480p/flv",
    34 : "360p/flv",
    5  : "240p/flv",

    // 3GPP

    17 : "144p/3gpp",
    36 : "180p/3gpp",

    // Live

    96 : "1080p/live",
    95 : "720p/live",
    94 : "480p/live",
    93 : "360p/live",
    92 : "240p/live",
    91 : "180p/live", // guesswork
    90 : "144p/live", // guesswork
    132 : "240p/live",
    151 : "72p/live",

    /*
    // Fake live
    11080 : "1080p/live",
    10720 : "720p/live",
    10480 : "480p/live",
    10360 : "360p/live",
    10240 : "240p/live",
    10180 : "180p/live",
    10144 : "144p/live",
    10072 : "72p/live",
    */
};
var oldhash = "";

String.prototype.repeat = function( num )
{
    return new Array( num + 1 ).join( this );
}

function getTypeExt(type, deflt) {
    var container = type.split(";");
    if (container && container[0]) {
        switch (container[0]) {
            case "video/mp4": return ".mp4"; break;
            case "audio/mp4": return ".m4a"; break;

            case "video/webm": return ".webm"; break;
            case "audio/webm": return ".weba"; break;

            case "video/x-flv": return ".flv"; break;
            case "video/3gpp": return ".3gp"; break;

            default: return (deflt || ""); break;
        }
    } else {
        return (deflt || "");
    }
}

function updateLoading() {
    if ($loading.is(":visible") ) {
        $("#loading>span").first().text(loadmsg.generate());
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
        console.log("=== afmts ===");

        var afmts = parsed.adaptive_fmts;
        afmts = parse_qsl(afmts, "&,");
        var parsed_afmts = [];
        var current = {};
        var startmarker = afmts[0][0];
        $.each(afmts, function(k, v) {
            if (k != 0 && v[0] == startmarker) {
                if (current.hasOwnProperty("url")) {
                    parsed_afmts.push(current);
                }
                current = {};
                current[startmarker] = v[1];
                console.log("---");
            }
            else { 
                current[v[0]] = v[1];
            }
            console.log(v[0], v[1]);
        });
        if (current.hasOwnProperty("url")) {
            parsed_afmts.push(current);
        }
        parsed.adaptive_fmts = parsed_afmts;
    }

    if (parsed.hasOwnProperty("url_encoded_fmt_stream_map")) {
        console.log("");
        console.log("=== fmts ===");

        var fmtmap = parsed.url_encoded_fmt_stream_map;
        fmtmap = parse_qsl(fmtmap, "&,");
        var parsed_fmts = [];
        var current = {};
        var startmarker = fmtmap[0][0];
        $.each(fmtmap, function(k, v) {
            if (k != 0 && v[0] == startmarker) {
                if (current.hasOwnProperty("url")) {
                    parsed_fmts.push(current);
                }
                current = {};
                current[startmarker] = v[1];
                console.log("---");
            }
            else {
                current[v[0]] = v[1];
            }
            console.log(v[0], v[1]);
        });
        if (current.hasOwnProperty("url")) {
            parsed_fmts.push(current);
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
        document.location.hash = ""; oldhash = "";
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
            document.location.hash = ""; oldhash = "";
            $("#shortlink").attr("href", "http://ytdl.ga").text("ytdl.ga#[Video URL]");
            $().add($fetchbutton).add($videoinput).add($error).slideDown("slow");
            return;
        }
    }
    document.location.hash = id; oldhash = id;
    $("#shortlink").attr("href", "http://ytdl.ga#" + id).text("ytdl.ga#" + id);

    $loading.slideDown("slow");
    updateLoading();
    $.ajax({
        url: "http://corser.herokuapp.com/http://youtube.com/get_video_info?video_id=" + id,
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

function checkHash() {
    var hash = document.location.hash.trim();
    hash = hash.substring(1);
    if (hash != oldhash && hash != "" && hash != "#") {
        $videoinput.val(hash);
        fetchInfos(hash);
        oldhash = hash;
    }
}

$(function() {
    $fetchbutton = $("#fetch-button");
    $videoinput = $("#video-input");
    $loading = $("#loading");
    $error = $("#error");
    $results = $("#results");

    $("form").submit(function(e) {
        e.preventDefault();
        var url = $videoinput.val().trim();
        fetchInfos(url);
    });

    setInterval(checkHash, 500);
    setInterval(updateLoading, 4000);
});
