var txmap = {};

txmap.resizeTimer = 0;
txmap.addresses = {};
txmap.mouse = {x: 0, y: 0};

txmap.init = function() {
    txmap.status = $("#status");
    txmap.tooltip = $("#tooltip");

    txmap.initGraph();

    // bind resizing
    $(window).bind("resize", function(e) {
        txmap.resizeTimer = 2;
    });
    setInterval(function() {
        if (txmap.resizeTimer > 0) {
            txmap.resizeTimer--;
            if (txmap.resizeTimer == 0) {
                txmap.handleResize();
            }
        }
    }, 200);

    // bind mouse
    $(document).bind("mousemove", function(e) { 
        txmap.mouse.x = e.clientX || e.pageX;
        txmap.mouse.y = e.clientY || e.pageY;
    });
    setInterval(function() {
        txmap.tooltip.css({
            left: txmap.mouse.x + 15,
            top: txmap.mouse.y
        });
    }, 1000 / 20);

    txmap.renderer.run();
    txmap.connect();
}

txmap.initGraph = function() {
    txmap.graph = Viva.Graph.graph();

    // force-directed network layout
    txmap.layout = Viva.Graph.Layout.forceDirected(
        txmap.graph, {
            springLength : 50,
            springCoeff : 0.0002,
            dragCoeff : 0.02,
            gravity : -0.1
        }
    );

    // bind the graphic factories
    txmap.graphics = Viva.Graph.View.webglGraphics();
    txmap.graphics.node(txmap.createNode);
    txmap.graphics.link(txmap.createLink);

    // bind the event handlers
    var events = Viva.Graph.webglInputEvents(txmap.graphics, txmap.graph);
    events.mouseEnter(txmap.handleMouseEnter);
    events.mouseLeave(txmap.handleMouseLeave);
    events.dblClick(txmap.handleDoubleClick);
    events.click(txmap.handleClick);

    // create the renderer
    txmap.renderer = Viva.Graph.View.renderer(
        txmap.graph,
        {
            layout: txmap.layout,
            graphics: txmap.graphics,
            container: $("#container")[0]
        }
    );
}

txmap.connect = function() {
    // connect to the chain.so API
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
            "connected": "Connected.",
            "unavailable": "The API is temporarily unavailable... Come back later.",
            "failed": "Connection to the API failed D:",
            "disconnected": "Disconnected."
        }[states.current];
        txmap.status.text(t);
    });
    pusher.connection.bind("connecting_in", function(delay) {
        txmap.status.text("Retrying in " + delay + " seconds...");
    });

    var blockchain_channel = pusher.subscribe("blockchain_update_doge");
    blockchain_channel.bind("tx_update", function(data) {
        if (data.type == "tx") {
            txmap.fetchTransaction(data.value.txid);
        }
    });
}


txmap.fetchTransaction = function(txid) {
    txmap.status.text("Fetching transaction: " + txid);
    jQuery.getJSON("https://chain.so/api/v2/get_tx/DOGE/" + txid,
        function(data, textStatus, jqXHR) {
            txmap.status.text("Connected.");
            if (data.status == "success") {
                txmap.graph.beginUpdate();
                for (var i = 0; i < data.data.inputs.length; i++) {
                    var inaddr = data.data.inputs[i].address;
                    txmap.graph.addNode(inaddr);

                    for (var j = 0; j < data.data.outputs.length; j++) {
                        var outaddr = data.data.outputs[j].address;
                        txmap.graph.addNode(outaddr);
                        if (inaddr != outaddr
                            && !txmap.graph.hasLink(inaddr, outaddr)
                            && !txmap.graph.hasLink(outaddr, inaddr)) {
                            txmap.graph.addLink(inaddr, outaddr);
                        }
                    }
                }
                txmap.graph.endUpdate();
            }
        }
    );
}


txmap.createNode = function(node) {
    return Viva.Graph.View.webglSquare();
}

txmap.createLink = function(link) {
    return Viva.Graph.View.webglLine(0xb3b3b3ff);
}


txmap.handleResize = function() {
    console.log("Event:", "resize")
    txmap.renderer.reset();
    txmap.renderer.rerender();
}

txmap.handleMouseEnter = function(node) {
    if (node.id.length > 7) {
        txmap.tooltip.html(node.id.substring(0, 7) + "&hellip;");
    } else {
        txmap.tooltip.html(node.id);
    }
    txmap.tooltip.css("display", "inline");
}

txmap.handleMouseLeave = function(node) {
    txmap.tooltip.css("display", "none");
}

txmap.handleDoubleClick = function(node) {
    open("https://chain.so/address/" + node.id);
}


$(txmap.init);
