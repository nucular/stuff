var REPOS = 33098377; // GitHub doesn't provide an API for that :(

$(function() {
    var repoID = 0;

    var getCurrentRepo = function() {
        var hours = Math.floor(new Date() / (1000 * 60 * 60));
        var s = Math.cos(hours) * 100000;
        return Math.floor((s - Math.floor(s)) * REPOS);
    }

    setInterval(function() {
        var newrepoID = getCurrentRepo();
        if (repoID != newrepoID) {
            repoID = newrepoID;

            $.getJSON("https://api.github.com/repositories?since=" + repoID, function(data, textStatus, jqXHR) {
                var r = data[0];
                console.log(r);

                $.ajax({
                    type: "GET",
                    url: r.url + "/readme",
                    headers: {
                        Accept: "application/vnd.github.3.html"
                    },
                    dataType: "html",
                    success: function(data, textStatus, jqXHR) {
                        $("#repo-readme").html(data);
                    },
                    error: function(jqXHR, textStatus, errorThrown) {
                        $("#repo-readme").html("");
                    }
                });

                $("#repo-owner").text(r.owner.login).attr("href", r.owner.html_url);
                $("#repo-name").text(r.name).attr("href", r.html_url);

                if (r.fork) {
                    $("#repo-forked").show();
                } else {
                    $("#repo-forked").hide();
                }

                if (r.homepage) {
                    $("#repo-homepage").show().attr("href", r.homepage);
                } else {
                    $("#repo-homepage").hide();
                }

                $("#repo-description").text(r.description);
                $("#repo-url").attr("href", r.html_url);
            });
        }
    }, 1000);
});
