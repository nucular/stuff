function loadNext() {
    $("#playercontainer").fadeOut(function() {
        $(this).remove();
    });
    $.getJSON("http://corser.herokuapp.com/api.clyp.it/featuredlist/random?count=1", function(res) {
        var res = res[0];

        var c = $("<div id='playercontainer'></div>").hide();

        var a = $("<audio controls autoplay id='player'></audio>").appendTo(c);
        $("<source src='" + res.SecureOggUrl + "' type='audio/ogg'>").appendTo(a);
        $("<source src='" + res.SecureMp3Url + "' type='audio/mp3'>").appendTo(a);
        a.bind("ended", function() {
            loadNext();
        });

        $("<a href='" + res.Url + "'><h2>" + res.Title + "</h2></a>").appendTo(c);
        $("<p></p>").text(res.Description).appendTo(c);
        $("<a></a>").attr("href", res.Mp3Url).text("MP3").appendTo(c);
        $("<span> &middot; </span>").appendTo(c);
        $("<a></a>").attr("href", res.OggUrl).text("OGG").appendTo(c);

        c.appendTo("#main").fadeIn();
    });
}

$("#go-button").click(function() {
    loadNext();
});
