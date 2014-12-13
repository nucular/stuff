$(function() {
    var ids = document.location.search.match(/([A-Z][a-z]+)/g);
    var output = $("#output");
    $.each(ids, function(i, v) {
    	var url = "url(http://files.explosm.net/rcg/" + v + v + v + ".png)";
        var panel = $("<div class=\"panel\"></div>");
        $("<div class=\"image i1\">").css("background-image", url).appendTo(panel);
        $("<div class=\"image i2\">").css("background-image", url).appendTo(panel);
        panel.appendTo(output);
    })
});
