d3.select("#form").on("submit", function(event) {
  d3.event.preventDefault();
  var root = d3.select("#name")
    .property("value")
    .match(/([^@]+)@?([^@]+)?/);

  d3.select("#form").style("display", "none");

  var force = d3.layout.force()
    .charge(-170)
    .linkDistance(70)
    .size([window.innerWidth, window.innerHeight]);
  var color = d3.scale.category20();

  var svg = d3.select("body").append("svg");

  var nodes = force.nodes();
  var links = force.links();

  var cache = {}, colormap = {_length: 0};

  var update = function () {
    var link = svg.selectAll("line.link")
      .data(links, function(d) { return d.source.id + "-" + d.target.id; });

    link.enter()
      .insert("line", ".node")
      .attr("class", "link");

    link.exit().remove();

    var node = svg.selectAll("g.node")
      .data(nodes, function(d) { return d.id;});

    var nodeG = node.enter()
      .append("g")
      .attr("class", "node")
      .call(force.drag);

    nodeG.append("a")
      .attr("href", function(d) { return "https://npmjs.org/package/" + encodeURIComponent(d.name); })
      .append("circle")
      .style("fill", function(d) { return color(colormap[d.name]); })
      .attr("r", function(d) {
        if (d.name == root[1]) return 10;
        return 5;
      });

    nodeG.append("text")
      .attr("class", "name")
      .text(function(d) { return d.name; });
    nodeG.append("text")
      .attr("class", "version")
      .text(function(d) { return d.version; });

    node.exit().remove();

    force.on("tick", function() {
      link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });
      node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
    });

    force.start();
  }

  var walk = function(name, version) {
    var identifier = name + "@" + version;
    if (cache[identifier]) {
      return cache[identifier].id;
    }

    if (!colormap[name]) {
      colormap[name] = colormap._length;
      colormap._length++;
    }

    var id = nodes.length;
    var node = {
      name: name,
      version: version,
      id: id,
      dependencycount: 0,
      dependentcount: 0
    };
    nodes.push(node);
    cache[identifier] = node;

    d3.json("https://cors-anywhere.herokuapp.com/registry.npmjs.org/" + name + "/" + (version || "latest"), function(error, data) {
      if (error) throw error;
      node.version = data.version;
      node.dependencies = data.dependencies;

      if (!data.dependencies) return id;

      for (var depname in node.dependencies) {
        var depversion = node.dependencies[depname];
        var depid = walk(depname, depversion);
        var depnode = nodes[depid];
        node.dependencycount++;
        depnode.dependentcount++;
        links.push({"source": id, "target": depid});
        update();
      }
    });
    return id;
  }

  walk(root[1], root[2]);
  //force.start();

  window.addEventListener("resize", function(event) {
    force.size([window.innerWidth, window.innerHeight]).resume();
  });
});
