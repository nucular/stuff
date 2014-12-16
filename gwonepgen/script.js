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
    if (state == "start" && newstate != "start") {
        $("#wrapper").fadeOut();
    }
    if (newstate == "start" && state != "start") {
        $("#wrapper").fadeIn();
    }

    state = newstate;
}

function shortenComment(comment) {
    var sentences = comment.match(/([^!.?]+)([!.?])?/g);
    var result = (sentences.shift() || "") + (sentences.shift() || "");
    while (result.length < 30 && sentences.length > 0)
        result += (sentences.shift() || "") + (sentences.shift() || "");
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
                var permalink = "http://reddit.com"
                    + data[0].data.children[0].data.permalink
                    + comment.id;;
                success(shortenComment(decodeEntities(comment.body_html)),
                    comment.author, permalink);
            }
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
                success(url);
            }
        }
    });
}

function generate(comment_subs, image_subs) {
    var comment_subs = comment_subs || $("input[name=comment-subs]").val().split("+");
    var image_subs = image_subs || $("input[name=image-subs]").val().split("+");

    setState("loading");

    randomComment(comment_subs, function(text, author, permalink) {
        var colid = Math.floor(Math.random() * COLORS.length);
        $("#comment")
            .css("color", COLORS[colid])
            .css("text-shadow", "0px 0px 4px " + SHADOW[colid])
            .css("font-family", choice(FONTS))
            .css("font-size", (7 + Math.random() * 3).toString() + "vmin")
            .css("top", Math.floor(Math.random() * 80).toString() + "%")
            .text(text)
            .fadeIn()
            .click(function() {open(permalink)});

        var colid = Math.floor(Math.random() * COLORS.length);
        $("#author")
            .css("color", COLORS[colid])
            .css("text-shadow", "0px 0px 4px " + SHADOW[colid])
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

$(function(e) {
    // link sharing and stuff
    setInterval(function() {
        if (document.location.hash != oldhash) {
            oldhash = document.location.hash;
            var m = document.location.hash.match(/#\/([\w\-]+)\/([\w\-]+)/);
            if (m) {
                var comment_subs = m[1].split("+");
                var image_subs = m[2].split("+");
                generate(comment_subs, image_subs);
            } else {
                setState("start");
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
        generate(comment_subs.split("+"), image_subs.split("+"));
    });
    $("#result").click(function(e) {
        generate();
    });
});
