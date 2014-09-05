var resizeTimer = 0;

var meanSamples = 0;
var meanSum = 0;

var lastTime, targetTime;

function pad(num, size) {
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}

function secondsToTime(secs)
{
    var d = new Date(1970, 0, -3);
    d.setSeconds(secs);
    return pad(d.getDay(), 2) + "d "
        + pad(d.getHours(), 2) + ":"
        + pad(d.getMinutes(), 2) + ":"
        + pad(d.getSeconds(), 2);
}

function minutesBetween(startDate, endDate) {
    var diff = endDate.getTime() - startDate.getTime();
    return (diff / 60000);
}

$(function() {
    // set target
    minutes = minutesBetween(
        new Date(),
        new Date("2014.09.12-04:56:00")
    );

    // timer resizing
    $("#timer").quickfit({max: Infinity});
    $(window).bind("resize", function(e) {
        resizeTimer = 2;
    });
    setInterval(function() {
        if (resizeTimer > 0) {
            resizeTimer--;
            if (resizeTimer == 0) {
                $("#timer").quickfit({max: Infinity});
            }
        }
    }, 200);

    Pusher.host = "slanger1.chain.so";
    Pusher.ws_port = 443;
    Pusher.wss_port = 443;

    var pusher = new Pusher("e9f5cc20074501ca7395", {
        encrypted: true,
        disabledTransports: ["sockjs"],
        disableStats: true
    });

    pusher.connection.bind("state_change", function(states) {
        var t = {
            "connecting": "Connecting to the chain.so API...",
            "connected": "Waiting for the first block...may take a while",
            "unavailable": "The API is temporarily unavailable... Come back later.",
            "failed": "Connection to the API failed D:",
            "disconnected": "Disconnected."
        }[states.current];
        $("#status").text(t);
    });
    pusher.connection.bind("connecting_in", function(delay) {
        $("#status").text("Retrying in " + delay + " seconds...");
    });

    var blockchain_channel = pusher.subscribe("blockchain_update_doge");
    blockchain_channel.bind("block_update", function(data) {
        if (data.type == "block") {
            console.log("Block no " + data.value.block_no);

            $("#blocknum").text(data.value.block_no);
            $("#blockminer").html(data.value.mined_by.replace("...", "&hellip;"));
            $("#blocktxs").text(data.value.total_txs);
            $("#blockdiff").text(
                Math.round(data.value.mining_difficulty * 1000) / 1000
            );

            var remaining = 371337 - data.value.block_no;
            $("#remaining").text(remaining);

            if (!lastTime) {
                $("#status").text("Waiting for another block...may take a while");
                lastTime = data.value.time;
            } else {
                meanSum += (data.value.time - lastTime) / 60;
                meanSamples++;
                var mean = meanSum / meanSamples;

                lastTime = data.value.time;
                minutes = mean * remaining;

                $("#status").text("Connected");
                $("#blocktime").text(Math.round(mean * 1000) / 1000);
            }
        }
    });

    setInterval(function() {
        if (minutes) {
            if (minutes < 0) {
                $("#timer").text("AuxPoW enabled!");
                $("#timer").quickfit({max: Infinity});
            } else {
                if (minutes < 60) {
                    $("#header").text("Safe mode disabled for miners");
                }
                var t = secondsToTime(minutes * 60);
                window.document.title = t;

                $("#timer").html("");                
                t = t.replace(/\:/g, "<span class=\"zero\">:</span>")
                        .replace(/d/g, "<span class=\"zero\">d</span>");
                $("#timer").html(t);

                minutes -= (1 / 60);
            }
        }
    }, 1000)
});
