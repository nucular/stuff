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

var NonRepeatingRandom = function(length) {
    this.length = length || Infinity;
    this.history = [];

    this.transform = function(n) {
        return n;
    }

    this.get = function() {
        var rnd = this.transform(Math.random());
        while (this.history.indexOf(rnd) != -1)
            rnd = this.transform(Math.random());

        this.history.push(rnd);
        while (this.history.length > this.length)
            this.history.shift();

        return rnd;
    }
}

$(function() {
    var search = parseSearch();

    if (search.comic) {
        var ids = search.comic.match(/([A-Z][a-z]+)/g);

        if (ids) {
            var output = $("#output");
            $.each(ids, function(i, v) {
                var url = "http://files.explosm.net/rcg/" + v + v + v + ".png";

                var panel = $("<div class=\"panel\"></div>");
                $("<img src=\"" + url + "\">").load(function() {
                    $("<div class=\"image i1\">")
                        .css("background-image", "url(" + url + ")")
                        .attr("title", v)
                        .appendTo(panel);
                    $("<div class=\"image i2\">")
                        .css("background-image", "url(" + url + ")")
                        .attr("title", v)
                        .appendTo(panel);
                }).error(function() {
                    panel.remove();
                });
                panel.appendTo(output);
            });
        }

        $("#back").attr("href",
            document.location.href.replace(
                document.location.search, "")
            ).show();

    } else if (search.gen) {
        var gen = parseInt(search.gen);
        var rand = new NonRepeatingRandom();
        rand.transform = function(n) {return Math.floor(n * IDS.length)};

        if (!isNaN(gen)) {
            var generated = "";

            for (var i = 0; i < gen; i++) {
                var id = IDS[rand.get()];
                generated += id;
            }

            document.location.search = "?comic=" + generated;
        }
    } else {
        $("#form").show();
    }
});
