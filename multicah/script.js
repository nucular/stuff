function parseSearch() {
    var search = document.location.search;
    if (search == "")
        return {}

    search = search.substring(1);
    var parts = search.split("&");
    var result = {};

    for (var i = 0; i < parts.length; ++i) {
        var name = parts[i].split("=")[0];
        var value = parts[i].split("=")[1];

        if (value == "false")
            value = false;
        else if (value == "true")
            value = true
        else {
            nvalue = parseFloat(value);
            if (isNaN(nvalue))
                value = decodeURIComponent(value);
            else
                value = nvalue;
        }
        result[name] = value;
    }

    return result;
}

$(function() {
    var search = parseSearch();

    if (search.comic) {
        var ids = search.comic.match(/([A-Z][a-z]+)/g);

        if (ids) {
            var output = $("#output");
            $.each(ids, function(i, v) {
                var url = "http://files.explosm.net/rcg/" + v + v + v + ".png";

                $("<img src=\"" + url + "\">").load(function() {
                    var panel = $("<div class=\"panel\"></div>");

                    $("<div class=\"image i1\">")
                        .css("background-image", "url(" + url + ")")
                        .attr("title", v)
                        .appendTo(panel);
                    $("<div class=\"image i2\">")
                        .css("background-image", "url(" + url + ")")
                        .attr("title", v)
                        .appendTo(panel);
                    panel.appendTo(output);
                });
            });
        }

        $("#back").attr("href",
            document.location.href.replace(
                document.location.search, "")
            ).show();

    } else if (search.gen) {
        var gen = parseInt(search.gen);
        if (!isNaN(gen)) {
            var generated = "";
            for (var i = 0; i < gen; i++) {
                var id = IDS[Math.floor(Math.random() * IDS.length)];
                generated += id;
            }
            document.location.search = "?comic=" + generated;
        }
    } else {
        $("#form").show();
    }
});
