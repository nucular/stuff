var sub_unconf = false;
var sub_addresses = [];
var sub_blocks = false;

var connection;
var ticker;

// Add size leading zeros to num
function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

// Round to a specific number of decimal points
function roundTo(num, prec) {
    var n = Math.pow(10, prec);
    return Math.round(num * n) / n
}

// HH:MM:SS timestamp for the messages
function timeStamp() {
    var now = new Date();
    return pad(now.getHours(), 2) + ":"
        + pad(now.getMinutes(), 2) + ":"
        + pad(now.getSeconds(), 2);
}

// Generate message for a status event
function statusMessage(e, p) {
    switch (p.msg) {
        case "welcome":
            return; //["Connected successfully", "success"];
        case "subscribed":
            return; //["Subscription added", "info"];
        default:
            return ["Status: " + p.msg, "info"];
    }
}

// Either return the result of addressMessage or unconfMessage depending on the inputs
function dispatchTransaction(e, p) {
    if (sub_addresses.length == 0)
        return unconfMessage(e, p);

    var known = false;
    var adr;
    for (var i = 0; i < p.x.inputs.length && !known; i++) {
        for (var j = 0; j < sub_addresses.length && !known; j++) {
            known = sub_addresses[j] == p.x.inputs[i].prev_out.addr;
            adr = sub_addresses[j];
        }
    }

    if (known)
        return addressMessage(e, p, adr);
    else
        return unconfMessage(e, p);
}

// Generate message to and from an adress inside sub_addresses
function addressMessage(e, p, adr) {
    var sh = p.x.hash.substr(0,5) + "&hellip;" + p.x.hash.substr(-5,5);

    var fee = 0;
    for (var i = 0; i < p.x.inputs.length; i++) {
        fee += p.x.inputs[i].prev_out.value / 100000000;
    }
    fee -= p.x.value_out / 100000000;

    var t = "<a href=\"http://dogechain.info/tx/" + p.x.hash
        + "\">Transaction " + sh + "</a> outgoing from "
        + "subscribed address <a href=\"http://dogechain.info/address/" + adr + "\">"
        + adr + "</a> "
        + "sent &ETH;<b>" + roundTo(p.x.value_out / 100000000 + fee, 8)
        + "</b> minus &ETH;<b>" + roundTo(fee, 8) + "</b> fee from <b>" + p.x.vin_sz
        + "</b> input(s) to <b>" + p.x.vout_sz + "</b> output(s)";

    return [t, "address"];
}

// Generate message for new unconfirmed transactions
function unconfMessage(e, p) {
    if (!sub_unconf)
        return;
    var sh = p.x.hash.substr(0,5) + "&hellip;" + p.x.hash.substr(-5,5);

    var fee = 0;
    for (var i = 0; i < p.x.inputs.length; i++) {
        fee += p.x.inputs[i].prev_out.value / 100000000;
    }
    fee -= p.x.value_out / 100000000;

    var t = "<a href=\"http://dogechain.info/tx/" + p.x.hash
        + "\">Transaction " + sh + "</a> sent &ETH;<b>" + roundTo(p.x.value_out / 100000000 + fee, 8)
        + "</b> minus &ETH;<b>" + roundTo(fee, 8) + "</b> fee from <b>" + p.x.vin_sz
        + "</b> input(s) to <b>" + p.x.vout_sz + "</b> output(s)";

    return [t, "unconf"];
}

// Generate message for new blocks
function blocksMessage(e, p) {
    if (!sub_blocks)
        return;
    var t = "<a href=\"http://dogechain.info/block/" + p.x.hash
        + "\">Block #" + p.x.height + "</a> mined by <b>" + p.x.miner
        + "</b> with <b>" + p.x.n_tx + "</b> transaction(s), difficulty of <b>" + roundTo(p.x.difficulty, 5)
        + "</b> (<b>" + p.x.bits + "</b> bits) with &ETH;<b>" + roundTo(p.x.reward / 100000000, 8) + "</b> reward";
    return [t, "block"];
}

// Add a new message to the ticker
function addMessage(time, cls, text) {
    //if (ticker[0].hasChildNodes())
    //    $("<hr>").appendTo(ticker)

    var m = $("<span class=\"message\"></span>");
    $("<span class=\"time\">[" + time + "]</span>").appendTo(m);
    $("<span class=\"bar " + cls + "\"></span>").appendTo(m);
    $("<span class=\"content\">" + text + "</span>").appendTo(m);
    m.appendTo(ticker);

    // Remove everything off the screen
    for (var i = 0; i < ticker.children().length; i++) {
        var f = $(ticker.children()[i]);
        var v = ticker.position().top + f.height();
        if (v <= 0) {
            f.remove();
        }
        else {
            break;
        }
    }
}

// Create the connnection object and set up the handlers
function createSocket() {
    connection = new WebSocket("ws://ws.dogechain.info/inv");
    connection.onopen = function(e) {
        updateSubs();
    }
    connection.onmessage = function(e) {
        var p = JSON.parse(e.data);
        var tmp;
        switch (p.op) {
            case "status":
                tmp = statusMessage(e, p); break;
            case "utx":
                tmp = dispatchTransaction(e, p); break;
            case "block":
                tmp = blocksMessage(e, p); break;
            default:
                return;
        }

        if (!tmp)
            return;

        var text = tmp[0];
        var cls = tmp[1];
        addMessage(timeStamp(), cls, text);
    };
    connection.onclose = function(e) {
        setTimeout(createSocket, 300);
    }
    connection.onerror = function(e) {
        addMessage(timeStamp(), "failure", e.msg);
    }
}

// Send the subscriptions if nescessary and update the buttons
function updateSubs() {
    if (sub_unconf) {
        connection.send("{\"op\":\"unconfirmed_sub\"}");
        $("#subbut_unconf").css({"text-decoration": "underline"});
    }
    else {
        $("#subbut_unconf").css({"text-decoration": "none"});
    }

    if (sub_blocks) {
        connection.send("{\"op\":\"blocks_sub\"}");
        $("#subbut_blocks").css({"text-decoration": "underline"});
    }
    else {
        $("#subbut_blocks").css({"text-decoration": "none"});
    }

    if (sub_addresses.length > 0) {
        for (var i = 0; i < sub_addresses.length; i++) {
            connection.send("{\"op\":\"addr_sub\", \"addr\":\"" + sub_addresses[i] + "\"}");
        }
        $("#subbut_address").text("Address (" + sub_addresses.length + ")");
        $("#subbut_address").css({"text-decoration": "underline"});
    }
    else {
        $("#subbut_address").text("Address");
        $("#subbut_address").css({"text-decoration": "none"});
    }
}

$(function(e) {
    ticker = $("#ticker");

    if (localStorage && localStorage.livedoge) {
        var livedoge = JSON.parse(localStorage.livedoge);
        sub_unconf = livedoge.sub_unconf;
        sub_addresses = livedoge.sub_addresses;
        sub_blocks = livedoge.sub_blocks;
    }

    createSocket();
    addMessage(timeStamp(), "success", "Connected successfully");

    $("#subbut_unconf").click(function() {
        sub_unconf = !sub_unconf;
        if (sub_unconf)
            addMessage(timeStamp(), "info", "Subscribed to unconfirmed transactions");
        else
            addMessage(timeStamp(), "info", "Removed subscription to unconfirmed transactions");
        updateSubs();
    });

    $("#subbut_address").click(function() {
        var text = prompt("Enter the address to subscribe/unsubscribe. "
            + "To unsubscribe you can just enter the first chars too. Yes, you "
            + "can also enter 'D' to unsubscribe from everything.\n\nCurrent subscriptions:\n"
            + sub_addresses.join("\n"));
        if (!text)
            return;

        var adr = text.replace(" ", "");

        var rm = false;
        for (var i = 0; i < sub_addresses.length; i++) {
            if (sub_addresses[i].substr(0, adr.length) == adr) {
                addMessage(timeStamp(), "info", "Unsubscribed from address " + sub_addresses[i]);
                sub_addresses.splice(i, 1);
                i--;
                rm = true;
            }
        }
        if (!rm) {
            if (adr.length != 34)
                return;
            sub_addresses.push(adr);
            addMessage(timeStamp(), "info", "Subscribed to address " + adr);
        }
        updateSubs();
    });

    $("#subbut_blocks").click(function() {
        sub_blocks = !sub_blocks;
        if (sub_blocks)
            addMessage(timeStamp(), "info", "Subscribed to new blocks");
        else
            addMessage(timeStamp(), "info", "Removed subscription to new blocks");
        updateSubs();
    });
});

$(window).bind("unload", function() {
    connection.close();
    if (localStorage) {
            var livedoge = {
            sub_blocks: sub_blocks,
            sub_addresses: sub_addresses,
            sub_unconf: sub_unconf
        };
        localStorage.livedoge = JSON.stringify(livedoge);
    }
    
});
