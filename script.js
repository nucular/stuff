$(function() {
  // get a directory listing from GitHub
  jQuery.getJSON("https://api.github.com/repos/nucular/stuff/git/trees/HEAD", function(res) {
    $("#fetching").remove();

    if (!res.tree && res.message) {
      $("<span>Could not get directory listing:"
        + "<br/>" + res.message + "</span>")
        .appendTo("#stuff");
    }

    jQuery.each(res.tree, function(i, v) {
      if (v.type == "tree") {
        var p = v.path;
        
        // fetch some informations too
        jQuery.getJSON(p + "/infos.json", function(inf, span) {
          var link = $("<a href=\"" + p + "\">" + p + "</a>");
          var li = $("<li class=\"item\"></li><br/>");

          if (!inf.hidden) {
            var tags = "";
            var desc = $("<span class=\"description\">(" + inf.description + ")</span>");

            if (inf.boring) {
              tags = tags + "[boring]";
              li.addClass("boring");
            }
            if (inf.wip) {
              tags = tags + "[WIP]";
              li.addClass("wip");
            }
            if (inf.emphasis) {
              li.addClass("emphasis");
            }

            if (tags != "")
              $("<span class=\"tags\">" + tags + "</span>").appendTo(li);
            link.appendTo(li);
            desc.appendTo(li);
            li.appendTo("#stuff");
          }
        });
      }
    });
  }).error(function(e) {
    $("#fetching").remove();
    $("<span>Could not get directory listing:"
      + "<br/>" + e.responseJSON.message + "</span>")
      .appendTo("#stuff");
  });
});
