function Thumbnail(type, thumburl, url, width, height) {
    this.type = type;
    this.thumburl = thumburl;
    this.url = url;
    this.width = width;
    this.height = height;
}

Thumbnail.prototype.appendTo = function(el) {
    var $thumb = $("<img class=\"gthumb\"/>")
        .attr("src", this.thumburl)
        .attr("width", this.width)
        .attr("height", this.height);

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
    this.height = Infinity;
}

Row.prototype.add = function(th) {
    this.thumbnails.push(th);
    this.height = Math.min(th.height, this.height);
}

Row.prototype.appendTo = function(el) {
    if (this.height == Infinity)
        return;

    $("<hr/>").appendTo(el);

    $.each(this.thumbnails, function(i, v) {
        v.width = v.width * (this.height / v.height);
        v.height = this.height;
        v.appendTo(el);
    });
}


var sources = {
    chan8: {
        url: /8chan\.co\/(\w+)\/res\/(\d+)\.html/,
        api: "//8chan.co/{1}/res/{2}.json",
        parser: function(match, data) {
            var board = match[1];
            var id = match[2];
            var rows = [];

            var thumb = function(obj) {
                var type = "image";
                if (obj.ext == ".webm" || obj.ext == ".mp4") {
                    type = "video";
                }

                var thumbext = (type == "video") ? ".jpg" : obj.ext;
                var thumburl = "//media.8chan.co/" + board + "/thumb/" + obj.tim + thumbext;
                var url = "//media.8chan.co/" + board + "/src/" + obj.tim + obj.ext;

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
    },

    chan4: {
        url: /boards\.4chan\.org\/(\w+)\/thread\/(\d+)/,
        api: "//boards.4chan.org/{1}/thread/{2}.json",
        parser: function(match, data) {
            var board = match[1];
            var id = match[2];
            var rows = [];

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
                var row = new Row();

                if (v.filename) {
                    row.add(thumb(v));
                }

                if (row.thumbnails.length > 0)
                    rows.push(row);
            });

            return [data.posts[0].sub || "4chan Thread", rows];
        }
    },

    imgur: {
        url: /imgur\.com\/a|(?:gallery)\/(\w{5})/,
        api: "//api.imgur.com/2/album/{1}/images.json",
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
    $.each(match, function(i, v) {
        api = api.replace(new RegExp("\\{" + i + "\\}", "g"), v);
    });
    console.log("API", api);

    $.jsonp({
        url: api,
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

$(function(e) {
    $("#load-form").submit(function(e) {
        e.preventDefault();
        $("#subject").text("Gallery");
        loadSource($("#load-input").val());
        
    });
});
