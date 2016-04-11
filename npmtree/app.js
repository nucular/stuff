var run = function(rootname, rootversion) {
  var force = d3.layout.force()
    .charge(-170)
    .linkDistance(70)
    .size([window.innerWidth, window.innerHeight]);
  var color = d3.scale.category20();

  var svg = d3.select("body").insert("svg", "#form");
  var container = svg.append("g");

  var nodes = force.nodes();
  var links = force.links();

  var zoom = d3.behavior.zoom()
    .scaleExtent([0.5, 5])
    .on("zoom", function(d) {
      container.attr("transform", "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")");
    });
  svg.call(zoom);

  var cache = {}, colormap = {_length: 0};

  var update = function () {
    var link = container.selectAll("line.link")
      .data(links, function(d) { return d.source.id + "-" + d.target.id; });

    link.enter()
      .insert("line", ".node")
      .attr("class", "link");

    link.exit().remove();

    var node = container.selectAll("g.node")
      .data(nodes, function(d) { return d.id;});

    var nodeG = node.enter()
      .append("g")
      .attr("class", "node")
      .call(force.drag);

    nodeG.append("a")
      .attr("href", function(d) { return "https://npmjs.org/package/" + encodeURIComponent(d.name); })
      .attr("target", "__blank")
      .append("circle")
      .style("fill", function(d) { return color(colormap[d.name]); })
      .attr("r", function(d) {
        if (d.name == rootname) return 10;
        else return 5;
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

  var walk = function(name, version, cb) {
    if (!colormap[name]) {
      colormap[name] = colormap._length;
      colormap._length++;
    }

    d3.json("https://cors-anywhere.herokuapp.com/registry.npmjs.org/" + name + "/" + (version || "latest"), function(error, data) {
      if (error) throw error;

      var identifier = data.name + "@" + data.version;
      if (cache[identifier]) {
        if (cb) cb(cache[identifier]);
      } else {
        var id = nodes.length;
        var node = {
          name: data.name,
          version: data.version,
          id: id
        };
        nodes.push(node);
        cache[identifier] = node;

        if (data.dependencies) {
          for (var depname in data.dependencies) {
            var depversion = data.dependencies[depname];
            walk(depname, depversion, function(depnode) {
              links.push({"source": id, "target": depnode.id});
              update();
            });
          }
        } else {
          update();
        }
        if (cb) cb(node);
      }
    });
  }

  walk(rootname, rootversion);

  window.addEventListener("resize", function(event) {
    force.size([window.innerWidth, window.innerHeight]).resume();
  });
}

var root = window.location.search.match(/\?package=([^@]+)@?([^@]+)?/);
if (root)
  run(root[1], root[2]);
