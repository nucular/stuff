var bookmarklet = 'javascript:(function(){var a=document.createElement("script");a.type="text/javascript";a.setAttribute("src","http://nucular.github.io/stuff/dogerizer/dogerizer.min.js");document.getElementsByTagName("head")[0].appendChild(a);})()';

$(function() {
    if (document.location.search == "?on") {
        $("<script type=\"text/javascript\" src=\"dogerizer.min.js\"></script>").appendTo("head");
        $("#toggle").text("Turn Dogerizer off!").attr("href", "?");
    }
    else {
        $("#toggle").text("Turn Dogerizer on!").attr("href", "?on");
    }

    $("#bookmarklet").attr("href", bookmarklet).bind("click", function(e) {
        $("#bookmarklet-help").text("Nah, drag it to the toolbar, derp");
        e.preventDefault();
    });
});
