$(function() {
    // get a directory listing from GitHub
    jQuery.getJSON("https://api.github.com/repos/nucular/stuff/git/trees/HEAD", function(res) {
        $("#fetching").remove();

        if (!res.tree && res.message) {
            $("<small>Sorry but the GitHub API played a trick on me :("
                + "<br/>It just said \"" + res.message + "\".</small>")
                .appendTo("#stuff");
        }

        jQuery.each(res.tree, function(i, v) {
            if (v.type == "tree") {
                var p = v.path;
                
                // fetch some informations too
                jQuery.getJSON(p + "/infos.json", function(inf, span) {
                    var link = $("<a href=\"" + p + "\">" + p + "</a>");
                    var span = $("<span class=\"item\"></span><br/>");

                    if (!inf.hidden) {
                        var tags = "";
                        var desc = $("<span class=\"description\">(" + inf.description + ")</span>");

                        if (inf.boring) {
                            tags = tags + "[boring]";
                            span[0].classList.add("boring");
                        }
                        if (inf.wip) {
                            tags = tags + "[WIP]";
                            span[0].classList.add("wip");
                        }
                        if (inf.emphasis) {
                            span[0].classList.add("emphasis");
                        }

                        if (tags != "")
                            $("<span class=\"tags\">" + tags + "</span>").appendTo(span);
                        link.appendTo(span);
                        desc.appendTo(span);
                        span.appendTo("#stuff");
                    }
                });
            }
        });
    }).error(function(e) {
        $("#fetching").remove();
        $("<small>Sorry but the GitHub API left me hanging :("
            + "<br/>It said \"" + e.responseJSON.message + "\" and left.</small>")
            .appendTo("#stuff");
    });
});
