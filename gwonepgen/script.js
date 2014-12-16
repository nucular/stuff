var FONTS = [
    "'Lobster', cursive",
    "'Oswald', sans-serif",
    "'Pacifico', cursive",
    "'Bangers', cursive",
    "'Raleway', sans-serif"
];
// Flat UI
var COLORS = [
    "#1abc9c", "#2ecc71", "#3498db", "#9b59b6", "#34495e",
    "#16a085", "#27ae60", "#2980b9", "#8e44ad", "#2c3e50",
    "#f1c40f", "#e67e22", "#e74c3c", "#ecf0f1", "#95a5a6",
    "#f39c12", "#d35400", "#c0392b", "#bdc3c7", "#7f8c8d"
]
var SHADOW = [
    "#000", "#000", "#000", "#000", "#fff",
    "#000", "#000", "#fff", "#fff", "#fff",
    "#000", "#000", "#000", "#000", "#000",
    "#000", "#fff", "#fff", "#000", "#000"
]

var state = "start";
var oldhash = "";
var comment_perma = [];
var image_perma = [];

var decodeEntities = (function () {
    //create a new html document (doesn't execute script tags in child elements)
    var doc = document.implementation.createHTMLDocument("");
    var element = doc.createElement("div");

    function getText(str) {
        element.innerHTML = str;
        str = element.textContent;
        element.textContent = "";
        return str;
    }

    function decodeHTMLEntities(str) {
        if (str && typeof str === "string") {
            //called twice because initially text might be encoded like this: &lt;img src=fake onerror=&quot;prompt(1)&quot;&gt;
            return getText(getText(str));
        }
    }
    return decodeHTMLEntities;
})();

function choice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function setState(newstate) {
    if (state == "loading" && newstate != "loading") {
        $(".spinner").slideUp("fast");
    }
    if (newstate == "loading" && state != "loading") {
        $(".inner.spinner").css("background-color", choice(COLORS));
        $(".spinner").slideDown();
    }
    if (state == "done" && newstate != "done") {
        $("#comment").fadeOut("slow");
        $("#result").fadeOut("fast");
    }
    if (newstate == "done" && state != "done") {
        updatePerma();
    }
    if (state == "start" && newstate != "start") {
        $("#wrapper").fadeOut();
    }
    if (newstate == "start" && state != "start") {
        $("#wrapper").fadeIn();
    }

    state = newstate;
}

function shortenComment(comment) {
    comment = comment.replace(/(https?:\/\/[^ ]+)/g, "") // remove links
    comment = comment.replace(/[^\w\.?!,\:\;\(\)'\/\\ ]/g, "");
    comment = comment.replace(/ {2,}/g, " ");

    var sentences = comment.match(/([\w,;" ]+)([^\w.;" ])?/g);
    var result = "";
    for (var i = 0; i < sentences.length; i++) {
        var oldresult = result;
        result += sentences[i];
        if (result.length > 100)
            break;
    }
    return result;
}

function randomComment(subs, success, error) {
    var sub = choice(subs);

    $.jsonp({
        url: "http://reddit.com/r/" + sub + "/random/.json"
            + "?_=" + Date.now(),
        dataType: "json",
        error: error,
        success: function(data, xhr, ts) {
            if (state != "loading") return;
            console.log(data);

            var comments = data[1].data.children;
            if (comments.length == 0) {
                randomComment(subs, success, error);
            } else {
                var comment = choice(comments).data;

                var postperma = data[0].data.children[0].data.permalink;
                var m = postperma.match(/\/r\/([\w\-]+)\/comments\/(\w+)\/([\w\-]+)\//);
                comment_perma = m.slice(1, 4).concat([comment.id]);

                success(
                    shortenComment(decodeEntities(comment.body_html)),
                    comment.author,
                    "http://reddit.com" + postperma + comment.id
                );
            }
        }
    });
}

function permaComment(url, success, error) {
    $.jsonp({
        url: url + "/.json?limit=1",
        dataType: "json",
        error: error,
        success: function(data, xhr, ts) {
            if (state != "loading") return;

            var comment = data[1].data.children[0].data;
            var postperma = data[0].data.children[0].data.permalink;
            success(
                shortenComment(decodeEntities(comment.body_html)),
                comment.author,
                "http://reddit.com" + postperma + comment.id
            );
        }
    });
}

function randomImage(subs, success, error) {
    var sub = choice(subs);

    $.jsonp({
        url: "http://reddit.com/r/" + sub + "/random/.json"
            + "?_=" + Date.now(),
        dataType: "json",
        error: error,
        success: function(data, xhr, ts) {
            if (state != "loading") return;

            var post = data[0].data.children[0].data;
            var m = post.url.match(/imgur\.com\/(\w{7}|\w{5})(?:\.\w+)?$/);

            if (!m) {
                randomImage(subs, success, error);
            } else {
                var url = "http://i.imgur.com/" + m[1] + ".jpg";

                var postperma = data[0].data.children[0].data.permalink;
                var m = postperma.match(/\/r\/([\w\-]+)\/comments\/(\w+)\/([\w\-]+)\//);
                image_perma = m.slice(1, 3);

                success(url);
            }
        }
    });
}

function permaImage(url, success, error) {
    $.jsonp({
        url: url + "/.json?limit=0",
        dataType: "json",
        error: error,
        success: function(data, xhr, ts) {
            if (state != "loading") return;

            var post = data[0].data.children[0].data;
            var m = post.url.match(/imgur\.com\/(\w{7}|\w{5})(?:\.\w+)?$/);

            if (m) {
                var url = "http://i.imgur.com/" + m[1] + ".jpg";
                success(url);
            } else {
                error();
            }
        }
    });
}

function updatePerma() {
    var permalink = document.location.protocol + "//" + document.location.hostname
        + (document.location.port ? ":" + document.location.port : "") + document.location.pathname
        + "#/perma/" + comment_perma.join("%2F") + "/" + image_perma.join("%2F");
    $("#perma").text(permalink).attr("href", permalink);
}

function generate(comment_subs, image_subs) {
    setState("loading");

    randomComment(comment_subs, function(text, author, permalink) {
        var colid = Math.floor(Math.random() * COLORS.length);
        $("#comment")
            .css("color", COLORS[colid])
            .css("text-shadow", "0px 0px 4px " + SHADOW[colid])
            .css("font-family", choice(FONTS))
            .css("font-size", (7 + Math.random() * 3).toString() + "vmin")
            .css("top", Math.floor(Math.random() * 80).toString() + "%")
            .attr("href", permalink)
            .text(text)
            .fadeIn();

        var colid = Math.floor(Math.random() * COLORS.length);
        $("#author")
            .css("color", COLORS[colid])
            .css("text-shadow", "0px 0px 4px " + SHADOW[colid])
            .attr("href", "http://reddit.com/u/" + author)
            .text("/u/" + author);

        if ($("#result").is(":visible")) setState("done");
    });
    randomImage(image_subs, function(url) {
        $("#result")
            .css("background-image", "url(" + url + ")")
            .fadeIn();
        if ($("#comment").is(":visible")) setState("done");
    });
}

function perma(comment_link, image_link) {
    setState("loading");

    permaComment(comment_link, function(text, author, permalink) {
        var colid = Math.floor(Math.random() * COLORS.length);
        $("#comment")
            .css("color", COLORS[colid])
            .css("text-shadow", "0px 0px 4px " + SHADOW[colid])
            .css("font-family", choice(FONTS))
            .css("font-size", (7 + Math.random() * 3).toString() + "vmin")
            .css("top", Math.floor(Math.random() * 80).toString() + "%")
            .attr("href", permalink)
            .text(text)
            .fadeIn();

        var colid = Math.floor(Math.random() * COLORS.length);
        $("#author")
            .css("color", COLORS[colid])
            .css("text-shadow", "0px 0px 4px " + SHADOW[colid])
            .attr("href", "http://reddit.com/u/" + author)
            .text("/u/" + author);

        if ($("#result").is(":visible")) setState("done");
    });
    permaImage(image_link, function(url) {
        $("#result")
            .css("background-image", "url(" + url + ")")
            .fadeIn();
        if ($("#comment").is(":visible")) setState("done");
    });
}

$(function(e) {
    // link sharing and stuff
    setInterval(function() {
        if (document.location.hash != oldhash) {
            oldhash = document.location.hash;
            var m = document.location.hash.match(/#\/perma\/([\w\-]+)%2F(\w+)%2F([\w\-]+)%2F(\w+)\/([\w\-]+)%2F(\w+)/);
            if (m) {
                var comment_link = "http://reddit.com/r/" + m[1] + "/comments/" + m[2] + "/" + m[3] + "/" + m[4];
                var image_link = "http://reddit.com/r/" + m[5] + "/comments/" + m[6];
                comment_perma = m.slice(1, 5);
                image_perma = m.slice(5, 7);

                document.location.hash = "#/" + m[1] + "/" + m[5];
                oldhash = document.location.hash;
                $("input[name=comment-subs]").val(m[1]);
                $("input[name=image-subs]").val(m[5]);

                perma(comment_link, image_link);
            } else {
                var m2 = document.location.hash.match(/#\/([\w\-\+]+)\/([\w\-\+]+)/);
                if (m2) {
                    $("input[name=comment-subs]").val(m2[1]);
                    $("input[name=image-subs]").val(m2[2]);
                    var comment_subs = m2[1].split("+");
                    var image_subs = m2[2].split("+");
                    generate(comment_subs, image_subs);
                } else {
                    setState("start");
                }
            }
        }
    }, 500);

    // some more nice random colors
    $("#header").css("color", choice(COLORS));
    $("#header b").css("color", choice(COLORS));

    $("form").submit(function(e) {
        e.preventDefault();

        var comment_subs = $("input[name=comment-subs]").val();
        var image_subs = $("input[name=image-subs]").val();
        document.location.hash = "#/" + comment_subs + "/" + image_subs;
    });
    $("#result").click(function(e) {
        generate(
            $("input[name=comment-subs]").val().split("+"),
            $("input[name=image-subs]").val().split("+")
        );
    });
    $("#perma").click(function(e) {
        e.stopPropagation();
    })
});
