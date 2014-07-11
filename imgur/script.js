var image, wrapper, trycount, piccount, favcount, picurl;
zoomed = false;
scalefactor = 1;
urlhistory = ["start.png"];
favourites = [];
historypoint = 0;
loading = false;
tries = 0;
historylength = 1;

function getScaleFactor(w, h) {
    return Math.min(1, Math.min((wrapper.width() - 200) / w,
        (wrapper.height() - 80) / h));
}

function toggleZoom(e) {
    if (e.which == 2 && !zoomed) {
        if (historypoint != 0) {
            var url = "http://images.google.com/searchbyimage?image_url=" + image[0].src;
            open(url);
        }
        return;
    }

    zoomed = !zoomed;

    if (zoomed) {
        image.css({
            "cursor": "-webkit-zoom-out"
        })

        // Ugh!
        image.css({
            "height": "auto",
            "width": "auto"
        });
        var width = image.width();
        var height = image.height();
        image.css({
            "width": image.width() * scalefactor,
            "height": image.height() * scalefactor,
        });
        image.animate({
            "width": width,
            "height": height,
        });

        var scrolltop = (wrapper.height() / 2);
        var scrollleft = (wrapper.width() / 2);
        console.log(scrolltop, scrollleft);
        wrapper.animate({
            "scrollTop": scrolltop,
            "scrollLeft": scrollleft
        });
    }
    else {
        scalefactor = getScaleFactor(image.width(), image.height());

        image.animate({
            "width": image.width() * scalefactor,
            "height": image.height() * scalefactor,
        });

        image.css({
            "cursor": "-webkit-zoom-in"
        });
    }
}

function displayImage() {
    zoomed = false;
    scalefactor = getScaleFactor(image[0].width, image[0].height);

    $("#loading").stop().css({
        "display": "none"
    });

    image.attr("id", "image");
    image.css({
        "width": image[0].width * scalefactor,
        "height": image[0].height * scalefactor,
        "cursor": "-webkit-zoom-in",
        "opacity": 0
    });

    // Colour when the image is a favourite
    if (favourites.indexOf(historypoint) != -1) {
        image.css({
            "box-shadow": "0px 0px 50px -10px #ffd700",
            "border-color": "#ffd700"
        });
    }

    // Color the navigation buttons too
    if (favourites.indexOf(historypoint - 1) != -1) {
        $("#prevbutton").css({
            "border-right-color": "#d78900"
        });
    }
    else {
        $("#prevbutton").css({
            "border-right-color": "#2b2b2b"
        });
    }
    if (favourites.indexOf(historypoint + 1) != -1) {
        $("#nextbutton").css({
            "border-left-color": "#d78900"
        });
    }
    else {
        $("#nextbutton").css({
            "border-left-color": "#2b2b2b"
        });
    }

    image.animate({
        "opacity": 1
    });

    if (historypoint == 0) {
        picurl.textContent = "http://i.imgur.com/?????.png";
        picurl.href = "#";
    }
    else {
        picurl.textContent = image[0].src;
        picurl.href = image[0].src;
    }

    piccount.textContent = "Picture " + (historypoint + 1) + "/" + historylength;

    var i = favourites.indexOf(historypoint);
    if (i == -1)
        favcount.textContent = "Favourite x/" + favourites.length;
    else
        favcount.textContent = "Favourite " + (i + 1) + "/" + favourites.length;

    image.bind("click", toggleZoom);
    image.appendTo("#centered");
}

function previous(e) {
    if (historypoint == 0 || loading)
        return;
    else if (historypoint >= urlhistory.length) {
        urlhistory.push(image[0].src);
    }

    if (e && e.which == 3) {
        historypoint = 0;
    }
    else if (e && e.which == 2) {
        var i = historypoint - 1;
        var found = false;
        while (i >= 0) {
            if (favourites.indexOf(i) != -1) {
                found = true;
                break;
            }
            i--;
        }

        if (found)
            historypoint = i;
    }
    else {
        historypoint--;
    }

    trycount.textContent = "Tries: 1";

    image.remove();
    loading = true;

    $("#loading").css({
        "display": "block",
        "opacity": 0
    }).stop().animate({
        "opacity": 1
    });

    image = $(new Image());

    var loaded = function(e) {
        displayImage();
        loading = false;
    }

    image.bind("load", loaded);
    image[0].src = urlhistory[historypoint];
}

function next(e) {
    if (loading)
        return;
    if (historypoint >= urlhistory.length) {
        urlhistory.push(image[0].src);
    }

    if (e && e.which == 3) {
        historypoint = urlhistory.length - 1;
    }
    else if (e && e.which == 2) {
        var i = historypoint + 1;
        var found = false;
        while (i < urlhistory.length) {
            if (favourites.indexOf(i) != -1) {
                found = true;
                break;
            }
            i++;
        }

        if (found)
            historypoint = i;
    }
    else {
        historypoint++;
    }

    image.remove();
    loading = true;
    tries = 0;

    $("#loading").css({
        "display": "block",
        "opacity": 0
    }).stop().animate({
        "opacity": 1
    });

    // Reset the navbutton colors
    $("#nextbutton").css({
        "border-left-color": "#2b2b2b"
    });
    if (favourites.indexOf(historypoint - 1) == -1) {
        $("#prevbutton").css({
            "border-right-color": "#2b2b2b"
        });
    }

    loadNext();
}

function loadNext() {
    image = $(new Image());
    tries++;

    trycount.textContent = "Tries: " + tries;

    var loaded = function(e) {
        // We'll just go with that for now
        if (image[0].width == 161 && image[0].height == 81) {
            loadNext();
            return;
        }

        // Really stupid workaround
        if (historypoint >= urlhistory.length)
            historylength++;

        displayImage();
        loading = false;
    }

    var errored = function(e) {
        loadNext();
    }

    if (historypoint >= urlhistory.length) {
        var charlength = $('input[name=charlength]:checked').val();
        var id;

        if (charlength == "5" || (charlength == "Random" && Math.random() > 0.5)) {
            id = Math.random().toString(36).substr(2,5);
        }
        else if (charlength == "7" || charlength == "Random") {
            id = Math.random().toString(36).substr(2,7);
        }

        var url = "http://i.imgur.com/" + id + ".png";
    }
    else {
        var url = urlhistory[historypoint];
    }

    if (historypoint == 0) {
        picurl.textContent = "http://i.imgur.com/?????.png";
        picurl.href = "#";
    }
    else {
        picurl.textContent = url;
        picurl.href = url;
    }
    
    image.bind("load", loaded);
    image.bind("error", errored);
    image[0].src = url
}

function keyDown(e) {
    if (!loading) {
        if (e.keyCode == 37)
            previous();
        else if (e.keyCode == 39)
            next();
        else if (e.keyCode == 38)
            addFavourite();
        else if (e.keyCode == 40)
            removeFavourite();
    }
}

function addFavourite() {
    if (favourites.indexOf(historypoint) != -1)
        return;

    favourites.push(historypoint);
    image.css({
        "box-shadow": "0px 0px 50px -10px #ffd700",
        "border-color": "#ffd700"
    });
    favcount.textContent = "Favourite " + favourites.length + "/" + favourites.length;
}

function removeFavourite() {
    var i = favourites.indexOf(historypoint);
    if (i == -1)
        return;

    favourites.splice(i, 1);
    image.css({
        "box-shadow": "0px 0px 50px -15px #999",
        "border-color": "#444"
    });
    favcount.textContent = "Favourite x/" + favourites.length;
}

function saveFavourites() {
    var l = [];
    for (var i = 0; i < favourites.length; i++) {
        var url;

        if (favourites[i] >= urlhistory.length)
            url = image[0].src;
        else if (favourites[i] == 0)
            continue;
        else
            url = urlhistory[favourites[i]];

        l.push(url);
    }
    console.log(l);

    localStorage.setItem("favourites",
        JSON.stringify(l));
}

function loadFavourites() {
    var v = JSON.parse(localStorage.getItem("favourites"));

    if (v != null && v.length != 0) {
        for (var i = 0; i < v.length; i++) {
            favourites.push(i + 1);
            urlhistory.push(v[i]);
        }

        historylength = urlhistory.length;
        $("#nextbutton").css({
            "border-left-color": "#d78900"
        });
    }
}

$(function() {
    wrapper = $("#wrapper");
    trycount = $("#trycount")[0];
    piccount = $("#piccount")[0];
    favcount = $("#favcount")[0];
    picurl = $("#picurl")[0];

    $("#prevbutton").bind("mousedown", previous);
    $("#nextbutton").bind("mousedown", next);

    $("#prevbutton").bind("contextmenu", function() {return false;});
    $("#nextbutton").bind("contextmenu", function() {return false;});

    $(document).bind("keydown", keyDown)
    $(window).bind("unload", saveFavourites);
    loadFavourites();

    image = $(new Image());
    image.bind("load", function() {
        displayImage();
    })
    image[0].src = "start.png";
});