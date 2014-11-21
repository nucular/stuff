function loadThread(board, id) {
    $("#gallery").children().remove();

    $.jsonp({
        url: "https://8chan.co/" + board + "/res/" + id + ".json",
        dataType: "json",
        error: function(xhr, ts, e) {
            console.error(e);
        },
        success: function(data, ts, xhr) {
            console.log("Downloaded thread");
            console.log("Post count", data.posts.length);

            $("#subject").text(data.posts[0].sub);

            for (var i = 0; i < data.posts.length; i++) {
                console.log("Post", i);
                var p = data.posts[i];
                var thumbnails = [];
                var minheight = 1000;

                if (p.filename) {
                    thumbnails.push(p);
                    minheight = Math.min(minheight, p.tn_h);

                    if (p.extra_files) {
                        for (var j = 0; j < p.extra_files.length; j++) {
                            thumbnails.push(p.extra_files[j]);
                            minheight = Math.min(minheight, p.extra_files[j].tn_h);
                        }
                    }

                    $("<hr/>").appendTo("#gallery");
                }

                for (var j = 0; j < thumbnails.length; j++) {
                    var img = thumbnails[j];

                    var te = (img.ext == ".webm" || img.ext == ".mp4") ? ".jpg" : img.ext;
                    var $thumb = $("<img class=\"gthumb\"/>")
                        .attr("src", "https://media.8chan.co/" + board + "/thumb/" + img.tim + te)
                        .attr("height", minheight);

                    var cl = (img.ext == ".webm" || img.ext == ".mp4") ? "gvideolink" : "gimagelink";
                    var $link = $("<a class=\"" + cl + "\"></a>")
                        .attr("href", "https://media.8chan.co/" + board + "/src/" + img.tim + img.ext);

                    $thumb.appendTo($link);
                    $link.appendTo("#gallery");
                }
            }

            $(".gimagelink").magnificPopup({
                type: "image",
                gallery: {
                    enabled: true,
                    preload: [0,1]
                }
            });

            $(".gvideolink").magnificPopup({
                type: "iframe",
                gallery: {
                    enabled: true,
                    preload: [0,0]
                }
            });

            $("#load-popup>button").click();
        }
    });
}

$(function(e) {
    $("#load-form").submit(function(e) {
        e.preventDefault();
        var url = $("#load-input").val().trim();
        var m = url.match(/8chan\.co\/(\w+)\/res\/(\d+)\.html/);
        if (m) {
            loadThread(m[1], m[2]);
        }
    });

    $("#load-button").magnificPopup({
        type: "inline",
        midClick: true
    });
});
