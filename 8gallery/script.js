function Thumbnail(type, thumburl, url, width, height) {
    this.type = type;
    this.thumburl = thumburl;
    this.url = url;
    this.width = width;
    this.height = height;
}

Thumbnail.prototype.appendTo = function(el, width, height) {
    var $thumb = $("<img class=\"gthumb\"/>")
        .attr("src", this.thumburl)
        .attr("width", width || this.width)
        .attr("height", height || this.height);

    if (this.type == "image") {
        var $link = $("<a class=\"gimagelink\"></a>")
            .attr("href", this.url);
    } else {
        var $link = $("<a class=\"gvideolink\"></a>")
            .attr("href", this.url + "#swipeboxvideo=1");
    }

    $thumb.appendTo($link);
    $link.appendTo(el);
}


function Row() {
    this.thumbnails = [];
    this.limit = Infinity;
}

Row.prototype.add = function(th) {
    this.thumbnails.push(th);
    this.limit = Math.min(th.height, this.limit);
}

Row.prototype.appendTo = function(el) {
    if (this.limit == Infinity)
        return;

    $("<hr/>").appendTo(el);

    var limit = this.limit;
    $.each(this.thumbnails, function(i, v) {
    	var factor = limit / v.height;
        v.appendTo(el, v.width * factor, limit);
    });
}


var sources = {}

sources.chan8 = {
    url: /8ch\.net\/(\w+)\/res\/(\d+)\.html/,
    api: "8ch.net/{1}/res/{2}.json",
    parser: function(match, data) {
        var board = match[1];
        var id = match[2];
        var rows = [];

        var thumb = function(obj) {
            var type = "image";
            if (obj.ext == ".webm" || obj.ext == ".mp4") {
                type = "video";
            }

            var thumburl = "//media.8ch.net/" + board + "/thumb/" + obj.tim + ".jpg";
            var url = "//media.8ch.net/" + board + "/src/" + obj.tim + obj.ext;

            return new Thumbnail(type, thumburl, url, obj.tn_w, obj.tn_h);
        }

        $.each(data.posts, function(i, v) {
            var row = new Row();

            if (v.filename) {
                row.add(thumb(v));
                if (v.extra_files) {
                    $.each(v.extra_files, function(i, v) {
                        row.add(thumb(v));
                    });
                }
            }

            if (row.thumbnails.length > 0)
                rows.push(row);
        });

        return [data.posts[0].sub || "8chan Thread", rows];
    }
}

sources.chan4 = {
    url: /boards\.4chan\.org\/(\w+)\/thread\/(\d+)/,
    api: "boards.4chan.org/{1}/thread/{2}.json",
    parser: function(match, data) {
        var board = match[1];
        var id = match[2];
        var rows = new Row();

        var thumb = function(obj) {
            var type = "image";
            if (obj.ext == ".webm" || obj.ext == ".mp4") {
                type = "video";
            }

            var thumburl = "//1.t.4cdn.org/" + board + "/" + obj.tim + "s.jpg";
            var url = "//i.4cdn.org/" + board + "/" + obj.tim + obj.ext;

            return new Thumbnail(type, thumburl, url, obj.tn_w, obj.tn_h);
        }

        $.each(data.posts, function(i, v) {
            if (v.filename) {
                row.add(thumb(v));
            }
        });

        return [data.posts[0].sub || "4chan Thread", [row]];
    }
},

sources.imgur = {
    url: /imgur\.com\/a|(?:gallery)\/(\w{5})/,
    api: "api.imgur.com/2/album/{1}/images.json",
    parser: function(match, data) {
        var album = data.album;
        var row = new Row();

        $.each(album.images, function(i, v) {
            var thumb = new Thumbnail("image", v.links.small_square,
                v.links.original, 90, 90);
            row.add(thumb);
        });

        return [album.title, [row]];
    }
}

sources.redditBoard = {
    url: /reddit\.com\/r\/([\w_\-+]+)/,
    api: "reddit.com/r/{1}.json",
    parser: function(match, data) {
        var rows = [];

        var posts = data.data.children;
        $.each(posts, function(i, v) {
            if (v.data.thumbnail) {
                // nested sources :O
                var album = v.data.url.match(sources.imgur);
                if (album) {
                    var api = sources.imgur.api;
                    $.each(album, function(i, v) {
                        api = api.replace(new RegExp("\\{" + i + "\\}", "g"), v);
                    });

                    $.ajax({
                        url: "//corser.herokuapp.com/" + api,
                        dataType: "json",
                        error: function(xhr, ts, e) {
                            $("#loader").fadeOut("fast", function() {
                                $("#error").text(e).fadeIn("fast");
                            });
                            console.error(e);
                        },
                        success: function(data, ts, xhr) {
                            console.log("Response", data);

                            var parsed = source.parser(match, data);
                            $("#subject").text(parsed[0]);
                            $.each(parsed[1], function(k, v) {
                                v.appendTo("#gallery");
                            });
                            $("<hr/>").appendTo("#gallery");

                            $(".gimagelink").swipebox();
                            $(".gvideolink").swipebox();

                            $("#loader").fadeOut("fast");
                        }
                    });
                }


                var ext = v.data.url.match(/\.(\w+)(?:[\?|#].*)?$/);
                if (!ext) return;
                if (ext == "jpg" || ext == "png" || ext == "gif")
                    type = "image";
                else if (ext == "webm" || ext == "mp4")
                    type = "video";
                console.log(v.data);
            }
        });
    }
}

sources.placekitten = {
    url: /placekitten\.com/,
    parser: function(match) {
        var row = new Row();
    
        for (var i=0; i < 100; i++) {
            var w = 200 + Math.floor(Math.random() * 20) * 20;
            var h = 300 + Math.floor(Math.random() * 10) * 20;
            var url = "http://placekitten.com/g/" + w + "/" + h;
            var th = new Thumbnail("image", url, url, w / 2, h / 2);
            row.add(th);
        }

        return ["Kittens", [row]];
    }
}

function loadSource(url) {
    $("#gallery").children().remove();

    var match;
    var source;
    $.each(sources, function(k, v) {
        match = url.match(v.url);
        if (match) {
            console.log("Source", k);
            source = v;
            return false; // break
        }
    });
    if (!source || !match) {
        $("#error").text("Source not supported (yet)").fadeIn("fast");
        return;
    }

    $("#error").fadeOut("fast", function() {
        $("#loader").fadeIn("fast");
    });

    var api = source.api;
    if (api) {
        $.each(match, function(i, v) {
            api = api.replace(new RegExp("\\{" + i + "\\}", "g"), v);
        });
        console.log("API", api);

        $.ajax({
            url: "//corser.herokuapp.com/" + api,
            dataType: "json",
            error: function(xhr, ts, e) {
                $("#loader").fadeOut("fast", function() {
                    $("#error").text(e).fadeIn("fast");
                });
                console.error(e);
            },
            success: function(data, ts, xhr) {
                console.log("Response", data);

                var parsed = source.parser(match, data);
                $("#subject").text(parsed[0]);
                $.each(parsed[1], function(k, v) {
                    v.appendTo("#gallery");
                });
                $("<hr/>").appendTo("#gallery");

                $(".gimagelink").swipebox();
                $(".gvideolink").swipebox();

                $("#loader").fadeOut("fast");
            }
        });
    } else {
        console.log("No API given");

        var parsed = source.parser(match);
        $("#subject").text(parsed[0]);
        $.each(parsed[1], function(k, v) {
            v.appendTo("#gallery");
        });
        $("<hr/>").appendTo("#gallery");

        $(".gimagelink").swipebox();
        $(".gvideolink").swipebox();

        $("#loader").fadeOut("fast");
    }
}

$(function(e) {
    $("#load-form").submit(function(e) {
        e.preventDefault();
        $("#subject").text("Gallery");
        loadSource($("#load-input").val());
        
    });
});
