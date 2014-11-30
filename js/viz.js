// vis.js
//==============
// window.globaldata = globaldata || {};
var Network, RadialPlacement, activate, root;

// var dateAqListGeneratedString;

root = typeof exports !== "undefined" && exports !== null ? exports : this;

//  Help with the placement of nodes
RadialPlacement = function () {
  var center, current, increment, place, placement, radialLocation, radius, setKeys, start, values;
  // stores the key -> location values
  values = d3.map();
  // how much to separate each location by
  increment = 5;
  // how large to make the layout
  radius = 50;
  //  where the center of the layout should be

  center = {
    "x": 0,
    "y": 0
  };
  //  what angle to start at

  start = -120;
  current = start;

  //  Given an center point, angle, and radius length,
  //  return a radial position for that angle

  radialLocation = function (center, angle, radius) {
    var x, y;
    x = center.x + radius * Math.cos(angle * Math.PI / 180);
    y = center.y + radius * Math.sin(angle * Math.PI / 180);
    return {
      "x": x,
      "y": y
    };
  };
  //  Main entry point for RadialPlacement
  //  Returns location for a particular key,
  //  creating a new location if necessary.

  placement = function (key) {
    var value;
    value = values.get(key);
    if (!values.has(key)) {
      value = place(key);
    }
    return value;
  };
  //  Gets a new location for input key

  place = function (key) {

    var value;
    value = radialLocation(center, current, radius);
    values.set(key, value);
    current += increment;
    return value;
  };
  //  Given a set of keys, perform some
  //  magic to create a two ringed radial layout.
  //  Expects radius, increment, and center to be set.
  //  If there are a small number of keys, just make
  //  one circle.

  setKeys = function (keys) {

    var firstCircleCount, firstCircleKeys, secondCircleKeys;
    //  start with an empty values
    values = d3.map();
    //  number of keys to go in first circle
    firstCircleCount = 360 / increment;
    //  if we don't have enough keys, modify increment
    //  so that they all fit in one circle

    if (keys.length < firstCircleCount) {
      increment = 360 / keys.length;
    }
    //  set locations for inner circle

    firstCircleKeys = keys.slice(0, firstCircleCount);
    firstCircleKeys.forEach(function (k) {
      return place(k);
    });
    //  set locations for outer circle

    secondCircleKeys = keys.slice(firstCircleCount);
    //  setup outer circle
    radius = radius + radius / 1.8;
    increment = 360 / secondCircleKeys.length;
    return secondCircleKeys.forEach(function (k) {
      return place(k);
    });
  };
  placement.keys = function (_) {
    if (!arguments.length) {
      return d3.keys(values);
    }
    setKeys(_);
    return placement;
  };
  placement.center = function (_) {
    if (!arguments.length) {
      return center;
    }
    center = _;
    return placement;
  };
  placement.radius = function (_) {
    if (!arguments.length) {
      return radius;
    }
    radius = _;
    return placement;
  };
  placement.start = function (_) {
    if (!arguments.length) {
      return start;
    }
    start = _;
    current = start;
    return placement;
  };
  placement.increment = function (_) {
    if (!arguments.length) {
      return increment;
    }
    increment = _;
    return placement;
  };
  return placement;
};

Network = function () {
  //  variables we want to access
  //  in multiple places of Network
  //  width = 960
  //  height = 800
  //  multiplied by 1.2

  var allData, charge, curLinksData, curNodesData, filter, filterLinks, filterNodes, force, forceTick, groupCenters, height, hideDetails, layout, link, linkedByIndex, linksG, mapNodes, moveToRadialLayout, neighboring, network, node, nodeColors, nodeCounts, nodesG, radialTick, setFilter, setLayout, setSort, setupData, showDetails, sort, sortedArtists, strokeFor, tooltip, update, updateCenters, updateLinks, updateNodes, width;
//  var setupData2;
  var forceChargeParam;
  var artfile = "AQList-clean.json";
  var aqdata = window.data;
  var w = window.innerWidth;
  var h = window.innerHeight;
  width = w - 20; // 1152;
  height = 960;

  //  allData will store the unfiltered data
  allData = [];
  curLinksData = [];
  curNodesData = [];
  linkedByIndex = {};
  nodesG = null;
  linksG = null;
  //  these will point to the circles and lines
  //  of the nodes and links

  node = null;
  link = null;
  //  variables to refect the current settings
  //  of the visualization

  layout = "force";
  filter = "all";
  sort = "arts";
  //  groupCenters will store our radial layout for
  //  the group by artist layout.

  groupCenters = null;
  //  our force directed layout
  force = d3.layout.force();
  //  color function used to color nodes
  nodeColors = d3.scale.category20();
  //  tooltip used to display details
  tooltip = Tooltip("vis-tooltip", 230);
  //  charge used in artist layout
  charge = function (node) {
    return -Math.pow(node.radius, 2.0) / 2;
  };
  // forceChargeParam = $("#force_charge_select").val();
  // console.log("vis 138 forceChargeParam = ", forceChargeParam);  

  charge2 = function (node) {
    return -Math.pow(node.radius, 4.0) / 15;
  };
  //  Starting point for network visualization
  //  Initializes visualization and starts force layout

  network = function (selection, data) {
    var vis;

    var genDate = function (data) {
      document.getElementById("dateGeneratedByUN").innerHTML = data.dateGenerated;
    };

    genDate(data);

    //  format our data
    allData = setupData(data);
    //  create our svg and groups

    vis = d3.select(selection)
      .append("svg")
      .attr("width", width)
      .attr("height", height);
    linksG = vis.append("g")
      .attr("id", "links");
    nodesG = vis.append("g")
      .attr("id", "nodes");
    //  setup the size of the force environment

    force.size([width, height]);
    setLayout("force");
    setFilter("all");
    //  perform rendering and start force layout
    // console.log(genDate(data));

    return update();
  };

  //  The update() function performs the bulk of the
  //  work to setup our visualization based on the
  //  current layout/sort/filter.
  // 
  //  update() is called everytime a parameter changes
  //  and the network needs to be reset.

  update = function () {

    // forceChargeParam = $("#force_charge_select").val();
    var targets;
    //  filter data to show based on current filter settings.
    curNodesData = filterNodes(allData.nodes);
    curLinksData = filterLinks(allData.links, curNodesData);
    //  sort nodes based on current sort and update centers for
    //  radial layout

    if (layout === "radial") {
      targets = sortedTargets(curNodesData, curLinksData);
      updateCenters(targets);
    }
    //  reset nodes in force layout
    force.nodes(curNodesData);
    //  enter / exit for nodes

    updateNodes();
    //  always show links in force layout
    if (layout === "force") {
      force.links(curLinksData);
      updateLinks();
    } else {
      //  reset links so they do not interfere with
      //  other layouts. updateLinks() will be called when
      //  force is done animating.
      force.links([]);
      //  if present, remove them from svg
      if (link) {
        link.data([])
          .exit()
          .remove();
        link = null;
      }
    }
    //  start me up!
    return force.start();
  };
  //  Public function to switch between layouts

  network.toggleLayout = function (newLayout, changeInt) {
    force.stop();
    setLayout(newLayout, changeInt);
    return update();
  };
  // where did this method come from????
  network.toggleForce = function (newLayout) {
    force.stop();
    network.forceChargeParam = $('#force_charge_select')
      .val();
    // console.log("network.forceChargeParam = ", $('#force_charge_select'));
    setLayout(newLayout);
    return update();
  };
  //  Public function to switch between filter options
  network.toggleFilter = function (newFilter) {
    force.stop();
    setFilter(newFilter);
    return update();
  };
  //  Public function to switch between sort options
  network.toggleSort = function (newSort) {
    force.stop();
    setSort(newSort);
    return update();
  };
  //  Public function to update highlighted nodes
  //  from search

  network.updateSearch = function (searchTerm) {
    var searchRegEx;
    searchRegEx = new RegExp(searchTerm, "i"); // .toLowerCase());
    return node.each(function (d) {
      var element, match;
      element = d3.select(this);
      match = d.id
        .search(searchRegEx);
      if (searchTerm.length > 0 && match >= 0) {
        element.style("fill", "#F38630")
          .style("stroke-width", 2.0)
          .style("stroke", "#555");
        return d.searched = true;
      } else {
        d.searched = false;
        return element.style("fill", function (d) {
          return nodeColors(d[$('#node_color_select').val()]);
        })
          .style("stroke-width", 1.0);
      }
    });
  };
  //  Public function to update highlighted nodes
  //  from search

  network.updateSearch2 = function (searchTerm) {
    var searchRegEx;
    searchRegEx = new RegExp(searchTerm, "i"); // .toLowerCase());
    return node.each(function (d) {
      var element, match;
      element = d3.select(this);
      match = d.name
        .search(searchRegEx);
      if (searchTerm.length > 0 && match >= 0) {
        element.style("fill", "#F38630")
          .style("stroke-width", 2.0)
          .style("stroke", "#555");
        return d.searched = true;
      } else {
        d.searched = false;
        return element.style("fill", function (d) {
          // return nodeColors(d.target);
          return nodeColors(d[$('#node_color_select').val()]);
        })
          .style("stroke-width", 1.0);
      }
    });
  };

  network.updateData = function (data) {
    allData = setupData(data);
    link.remove();
    node.remove();
    return update();
  };

  //  called once to clean up raw data and switch links to
  //  point to node instances
  //  Returns modified data
  setupData = function (data) {
    var circleRadius, count, countExtent, nodesMap;
    // console.log("data = ");
    // console.log(data);
    var result;
    countExtent = d3.extent(data.nodes, function (d) {
      // console.log('showProps(d, "nodes") = ');
      // console.log(showProps(d, "nodes"));
      //result = parseInt(d.playcount, 10);
      result = parseInt(d.linkCount, 10);
      d.radius = d.linkCount;
      // console.log("viz.js 197 parseInt(d.playcount, 10) = ");
      // console.log(result);
      return parseInt(d.linkCount, 10);
    });
    // console.log("countExtent = ");
    // console.log(countExtent);
    circleRadius = d3.scale.sqrt()
      .range([3, 12])
      .domain(countExtent);
//      .domain(countExtent);
    data.nodes.forEach(function (n) {
      // console.log("n = ");
      // console.log(n);
      var randomnumber;
      n.x = randomnumber = Math.floor(Math.random() * width);
      n.y = randomnumber = Math.floor(Math.random() * height);
      // console.log("243 circleRadius(n.playcount) = ");
      // console.log(circleRadius(n.playcount));
      // console.log("245 n.weight = ");
      // console.log(n.weight);
      // console.log("245 data.nodes = ");
      // console.log(data.nodes);
      // console.log("247 data.nodes.weight = ");
      // console.log(data.nodes.weight);

      // console.log('250 data.nodes.forEach(function (n  = ');
      data.nodes.forEach(function (n) {
        // console.log('54 showProps(n, "n")');
        // console.log(showProps(n, "n"));
      });

      //return n.radius = circleRadius(n.playcount);
      // return n.radius = (n.linkCount);
      // determine radius of each node circle
      return n.radius = circleRadius(Math.pow(n.linkCount * 3, 0.9));
    });
    nodesMap = mapNodes(data.nodes);
    count = 0;
    data.nodes.forEach(function (n) {
      // console.log("n = ")
      // console.log(n.attr("weight"));
      // console.log("267 n.weight = ")
      // console.log(n.weight);
    });
    var linkedByIndexData;
    data.links.forEach(function (l) {
      count++;
      if (!(nodesMap.get(l.target))) {
        // console.log("274 count = ", count, "l.target is undefined; l.source = ", nodesMap.get(l.source));
      }
      l.source = nodesMap.get(l.source);
      l.target = nodesMap.get(l.target);
      // linkedByIndexData = linkedByIndex["" + l.source.id + "," + l.target.id] = 1;
      // console.log("viz.js 216 linkedByIndexData = ");
      // console.log(linkedByIndexData);
      if ((typeof(l.target) !== 'undefined') && (l.target !== null)) {
        return linkedByIndex["" + l.source.id + "," + l.target.id] = 1;
      }
    });
    // console.log("viz.js 283 data = ");
    // console.log(data);
    return data;
  };

  network.updateData2 = function (data) {
    allData = setupData2(data);
    link.remove();
    node.remove();
    return update();
  };

  //  called once to clean up raw data and switch links to
  //  point to node instances
  //  Returns modified data
  setupData2 = function (data) {
    var circleRadius, count, countExtent, nodesMap;
    // console.log("data = ");
    // console.log(data);
    var result;
    countExtent = d3.extent(data.nodes, function (d) {
      // console.log('showProps(d, "nodes") = ');
      // console.log(showProps(d, "nodes"));
      //result = parseInt(d.playcount, 10);
      result = parseInt(d.linkCount, 10);
      d.radius = d.linkCount;
      // console.log("viz.js 197 parseInt(d.playcount, 10) = ");
      // console.log(result);
      return parseInt(d.linkCount, 10);
    });
    // console.log("countExtent = ");
    // console.log(countExtent);
    circleRadius = d3.scale.sqrt()
      .range([3, 12])
      .domain(countExtent);
//      .domain(countExtent);
    data.nodes.forEach(function (n) {
      // console.log("n = ");
      // console.log(n);
//      var randomnumber;
      //     n.x = randomnumber = Math.floor(Math.random() * width);
      //     n.y = randomnumber = Math.floor(Math.random() * height);
      // console.log("243 circleRadius(n.playcount) = ");
      // console.log(circleRadius(n.playcount));
      // console.log("245 n.weight = ");
      // console.log(n.weight);
      // console.log("245 data.nodes = ");
      // console.log(data.nodes);
      // console.log("247 data.nodes.weight = ");
      // console.log(data.nodes.weight);

      // console.log('250 data.nodes.forEach(function (n  = ');
      data.nodes.forEach(function (n) {
        // console.log('54 showProps(n, "n")');
        // console.log(showProps(n, "n"));
      });

      //return n.radius = circleRadius(n.playcount);
      // return n.radius = (n.linkCount);
      // determine radius of each node circle
      return n.radius = circleRadius(Math.pow(n.linkCount * 3, 0.9));
    });
    nodesMap = mapNodes(data.nodes);
    count = 0;
    data.nodes.forEach(function (n) {
      // console.log("n = ")
      // console.log(n.attr("weight"));
      // console.log("267 n.weight = ")
      // console.log(n.weight);
    });
    var linkedByIndexData;
    data.links.forEach(function (l) {
      count++;
      if (!(nodesMap.get(l.target))) {
        // console.log("274 count = ", count, "l.target is undefined; l.source = ", nodesMap.get(l.source));
      }
      l.source = nodesMap.get(l.source);
      l.target = nodesMap.get(l.target);
      // linkedByIndexData = linkedByIndex["" + l.source.id + "," + l.target.id] = 1;
      // console.log("viz.js 216 linkedByIndexData = ");
      // console.log(linkedByIndexData);
      if ((typeof(l.target) !== 'undefined') && (l.target !== null)) {
        return linkedByIndex["" + l.source.id + "," + l.target.id] = 1;
      }
    });
    // console.log("viz.js 283 data = ");
    // console.log(data);
    return data;
  };

  //  Helper function to map node id's to node objects.
  //  Returns d3.map of ids -> nodes
  mapNodes = function (nodes) {
    var nodesMap;
    nodesMap = d3.map();
    nodes.forEach(function (n) {
      return nodesMap.set(n.id, n);
    });
    return nodesMap;
  };
  //  Helper function that returns an associative array
  //  with counts of unique attr in nodes
  //  attr is value stored in node, like 'target'

  nodeCounts = function (nodes, attr) {
    // console.log("296 attr = ");
    // console.log(attr);
    var counts;
    counts = {};
    nodes.forEach(function (d) {
      var _name;
      if (counts[_name = d[attr]] == null) {
        counts[_name] = 0;
      }
      return counts[d[attr]] += 1;
    });
    // console.log("viz.js 239 counts = ");
    // console.log(counts);
    return counts;
  };
  //  Given two nodes a and b, returns true if
  //  there is a link between them.
  //  Uses linkedByIndex initialized in setupData

  neighboring = function (a, b) {
    // console.log("viz.js 243 neighboring = ", linkedByIndex[a.id + "," + b.id] || linkedByIndex[b.id + "," + a.id]);
    return linkedByIndex[a.id + "," + b.id] || linkedByIndex[b.id + "," + a.id];
  };
  //  Removes nodes from input array
  //  based on current filter setting.
  //  Returns array of nodes
  filterNodes = function (allNodes) {
    var cutoff, filteredNodes, playcounts;
    filteredNodes = allNodes;
    if (filter === "popular" || filter === "obscure") {
      playcounts = allNodes.map(function (d) {
        return d.playcount;
      })
        .sort(d3.ascending);
      cutoff = d3.quantile(playcounts, 0.5);
      filteredNodes = allNodes.filter(function (n) {
        if (filter === "popular") {
          return n.playcount > cutoff;
        } else if (filter === "obscure") {
          return n.playcount <= cutoff;
        }
      });
    }
    return filteredNodes;
  };
  //  Returns array of targets sorted based on
  //  current sorting method.

  sortedTargets = function (nodes, links) {
    var targets, counts;
    targets = [];
    if (sort === "links") {
      counts = {};
      links.forEach(function (l) {
        var _name, _name1;
        if (counts[_name = l.source.target] == null) {
          counts[_name] = 0;
        }
        counts[l.source.target] += 1;
        if (counts[_name1 = l.target.target] == null) {
          counts[_name1] = 0;
        }
        return counts[l.target.target] += 1;
      });
      //  add any missing targets that dont have any links

      nodes.forEach(function (n) {
        var _name;
        return counts[_name = n.target] != null ? counts[_name] : counts[_name] = 0;
      });
      //  sort based on counts
      targets = d3.entries(counts)
        .sort(function (a, b) {
          return b.value - a.value;
        });
      //  get just names

      targets = targets.map(function (v) {
        return v.key;
      });
    } else {
      //  sort targets by art count
      counts = nodeCounts(nodes, "target");
      targets = d3.entries(counts)
        .sort(function (a, b) {
          return b.value - a.value;
        });
      targets = targets.map(function (v) {
        return v.key;
      });
    }
    return targets;
  };
  updateCenters = function (targets) {
    if (layout === "radial") {
      return groupCenters = RadialPlacement()
        .center({
          "x": width / 2,
          "y": height / 2 - 100
        })
        .radius(300)
        .increment(18)
        .keys(targets);
    }
  };
  //  Removes links from allLinks whose
  //  source or target is not present in curNodes
  //  Returns array of links

  filterLinks = function (allLinks, curNodes) {
    curNodes = mapNodes(curNodes);
    return allLinks.filter(function (l) {
      if ((typeof l.target === 'undefined') && (l.target) === null) {
        console.log("\n ", __filename, "line", __line, "; Error null target where l.source.id = ", l.source.id, "; l.source = ", JSON.stringify(l.source));
      }
      try {
        if ((typeof l.target.id === 'undefined') && (l.target.id) === null) {
          console.log("\n ", __filename, "line", __line, "; Error null target id where l.source.id = ", l.source.id, "; l.source = ", JSON.stringify(l.source));
        }
      } catch (error) {
        console.log("\n ", __filename, "line", __line, "; Error: ", error, "; null target id where l.source.id = ", l.source.id, "; l.source = ", JSON.stringify(l.source));
      }
      if ((typeof curNodes.get(l.target.id) !== 'undefined') && (curNodes.get(l.target.id) !== null)) {
        return curNodes.get(l.source.id) && curNodes.get(l.target.id);
      }
    });
  };
  //  enter/exit display for nodes
  updateNodes = function () {
    node = nodesG.selectAll("circle.node")
      .data(curNodesData, function (d) {
        return d.id;
      });
    node.enter()
      .append("circle")
      .attr("class", "node")
      .attr("cx", function (d) {
        return d.x;
      })
      .attr("cy", function (d) {
        return d.y;
      })
      .attr("r", function (d) {

        return (d.radius);
      })
      .style("fill", function (d) {
        return nodeColors(d[$('#node_color_select').val()]);
      })
      .style("stroke", function (d) {
        return strokeFor(d);
      })
      .style("stroke-width", 1.0);

    node.on("mouseover", showDetails)
      .on("mouseout", hideDetails);

    // console.log('409 viz.js showProps(node, "node") = ');
    // console.log(showProps(node, "node"));
    //console.log(stringify(node, null, '\t'));
    // var serialized = CircularJSON.stringify(node);
    // console.log("serialized = ", serialized);
    var countN = 0;
    node.forEach(function (n) {
      // console.log('646 viz.js node.forEach(function (n) { showProps(n, "n")');
      // console.log(showProps(n, "n"));

      n.forEach(function (circle) {
        // console.log(" JSON.pruned(circle, 4, 10)\n");
        //   console.log(JSON.pruned(circle, 4, 4));
        countN++;
        if (countN < 5) {
          //  console.log("825 showProps(circle.r, 'circle.r'), # = ", countN);
          //  console.log(showProps(circle.r, "circle.r"));
        }
      });
    });

    return node.exit()
      .remove();
  };
  //  enter/exit display for links
  updateLinks = function () {
    link = linksG.selectAll("line.link")
      .data(curLinksData, function (d) {
        return "" + d.source.id + "_" + d.target.id;
      });
    link.enter()
      .append("line")
      .attr("class", "link")
      .attr("stroke", "#ddd")
      .attr("stroke-opacity", 0.8)
      .attr("x1", function (d) {
        return d.source.x;
      })
      .attr("y1", function (d) {
        return d.source.y;
      })
      .attr("x2", function (d) {
        return d.target.x;
      })
      .attr("y2", function (d) {
        return d.target.y;
      });
    return link.exit()
      .remove();
  };
  //  switches force to new layout parameters
  setLayout = function (newLayout, changeInt) {
    layout = newLayout;
    changeInt = changeInt || 0;
    var forceCharge = $('#force_charge_select').val();
    var newForceCharge = parseInt(forceCharge, 10) + changeInt;
    if (layout === "force") {
      return force.on("tick", forceTick)
        .charge(newForceCharge)
        .linkDistance($('#link_distance_select')
          .val());
    } else if (layout === "radial") {
      return force.on("tick", radialTick)
        .charge(charge);
    }
  };
  //  switches filter option to new filter
  setFilter = function (newFilter) {
    return filter = newFilter;
  };
  //  switches sort option to new sort
  setSort = function (newSort) {
    return sort = newSort;
  };
  //  tick function for force directed layout

  forceTick = function (e) {
    node.attr("cx", function (d) {
      return d.x;
    })
      .attr("cy", function (d) {
        return d.y;
      });
    return link.attr("x1", function (d) {
      return d.source.x;
    })
      .attr("y1", function (d) {
        return d.source.y;
      })
      .attr("x2", function (d) {
        return d.target.x;
      })
      .attr("y2", function (d) {
        return d.target.y;
      });
  };
  radialTick0 = function (e) {
    node.each(moveToRadialLayout(e.alpha));
    node.attr("cx", function (d) {
      return d.x;
    })
      .attr("cy", function (d) {
        return d.y;
      });
    if (e.alpha < 0.03) {
      force.stop();
      return updateLinks();
    }
  };

  // tick function for radial layout
  radialTick = function (e) {
    node.each(moveToRadialLayout(e.alpha));
    node.attr("cx", function (d) {
      return d.x;
    })
      .attr("cy", function (d) {
        return d.y;
      });
    // once alpha is sufficiently low (i.e. 
    // node positions are stabilized and not moving rapidly)
    // stop the animation and update the links
    if (e.alpha < 0.03) {
      force.stop();
      return updateLinks();
    }
    // need to manually update the weight of each node. 
    // This is usually done on force.start.
    // However in this layout no links are present at this 
    // point so all weight values are zero.
    //  link.each(function(l) {
    //    l.source.weight += 1;
    //   l.target.weight += 1;
    //  });
    // node.attr("r", function(d) {
    //  console.log(d.weight);                
    //  return Math.max(radius, radius + 2 * Math.log(d.weight));
    // });
    // console.log("729 node.r = ", node.r);
    // return 1;
    //}
  };
  //  Adjusts x/y for each node to
  //  push them towards appropriate location.
  //  Uses alpha to dampen effect over time.

  moveToRadialLayout = function (alpha) {
    var k;
    k = alpha * 0.1;
    return function (d) {
      var centerNode;
      centerNode = groupCenters(d.target);
      d.x += (centerNode.x - d.x) * k;
      return d.y += (centerNode.y - d.y) * k;
    };
  };
  //  Helper function that returns stroke color for
  //  particular node.

  strokeFor = function (d) {
    return d3.rgb(nodeColors(d.linkCount))
      .darker()
      .toString();
  };
  //  Mouseover tooltip function
  showDetails = function (d, i) {
    var content;
    content = '<p class="main"><span>' + d.name + '</span></p>';
    content += '<hr class="tooltip-hr">';
    content += '<p class="main"><span>ID: ' + d.id + '&nbsp;&nbsp; Links: ' + d.linkCount + '</span></p>';
    if (d.natnlty) {
      content += '<hr class="tooltip-hr">';
      content += '<p class="main"><span>Nationality: ' + d.natnlty;
      content += '</span></p>';
    }
    tooltip.showTooltip(content, d3.event);
    //  higlight connected links
    if (link) {
      link.attr("stroke", function (l) {
        if (l.source === d || l.target === d) {
          return "#555";
        } else {
          return "#ddd";
        }
      })
        .attr("stroke-opacity", function (l) {
          if (l.source === d || l.target === d) {
            return 1.0;
          } else {
            return 0.5;
          }
        });
    }
    //  highlight neighboring nodes
    //  watch out - don't mess with node if search is currently matching

    node.style("stroke", function (n) {
      if (n.searched || neighboring(d, n)) {
        return "#555";
      } else {
        return strokeFor(n);
      }
    })
      .style("stroke-width", function (n) {
        if (n.searched || neighboring(d, n)) {
          return 2.0;
        } else {
          return 1.0;
        }
      });
    //  highlight the node being moused over
    return d3.select(this)
      .style("stroke", "black")
      .style("stroke-width", 2.0);
  };
  hideDetails = function (d, i) {
    tooltip.hideTooltip();
    //  watch out - don't mess with node if search is currently matching
    node.style("stroke", function (n) {
      if (!n.searched) {
        return strokeFor(n);
      } else {
        return "#555";
      }
    })
      .style("stroke-width", function (n) {
        if (!n.searched) {
          return 1.0;
        } else {
          return 2.0;
        }
      });
    if (link) {
      return link.attr("stroke", "#ddd")
        .attr("stroke-opacity", 0.8);
    }
  };
  //  Final act of Network() function is to return the inner 'network()' function.
  return network;
};
//  Activate selector button

activate = function (group, link) {
  d3.selectAll("#" + group + " a")
    .classed("active", false);
  return d3.select("#" + group + " #" + link)
    .classed("active", true);
};

$(function () {
  var myNetwork;
  myNetwork = Network();
  d3.selectAll("#layouts a")
    .on("click", function (d) {
      var newLayout;
      newLayout = d3.select(this)
        .attr("id");
      activate("layouts", newLayout);
      // console.log("newLayout = ", newLayout);
      return myNetwork.toggleLayout(newLayout);
    });
  d3.selectAll("#filters a")
    .on("click", function (d) {
      var newFilter;
      newFilter = d3.select(this)
        .attr("id");
      activate("filters", newFilter);
      return myNetwork.toggleFilter(newFilter);
    });
  d3.selectAll("#sorts a")
    .on("click", function (d) {
      var newSort;
      newSort = d3.select(this)
        .attr("id");
      activate("sorts", newSort);
      return myNetwork.toggleSort(newSort);
    });
  /*
   $("#art_select")
   .on("change", function (e) {
   var artFile;
   artFile = $(this)
   .val();
   // console.log("vis 564 artfile = ", artfile);
   return d3.json("data/" + artFile, function (json) {
   return myNetwork.updateData(json);
   });
   });
   */
  $("#force_charge_select")
    .on("change", function (e) {
      activate("layouts", "force");
      return myNetwork.toggleLayout("force");
    });

  if (false) {
    var intervalID = setInterval(function () {
      wiggle();
    }, 20000);
  }

  var wiggle = function () {
    activate("layouts", "force");
    return myNetwork.toggleLayout("force", 0);
  };

  $("#link_distance_select")
    .on("change", function (e) {
      activate("layouts", "force");
      return myNetwork.toggleLayout("force");
    });

  $("#node_color_select")
    .on("change", function (e) {
      activate("layouts", "force");
      return document.updateNodes(); //   .toggleLayout("force");
    });
  $("#search")
    .keyup(function () {
      var searchTerm;
      searchTerm = $(this)
        .val();
      return myNetwork.updateSearch(searchTerm);
    });

  // get list of radio buttons with name 'size'
  var sz = document.forms['highlight'].elements['type'];

// loop through list
  for (var i = 0, len = sz.length; i < len; i++) {
    sz[i].onclick = function () { // assign onclick handler function to each
      // put clicked radio button's value in total field
      // this.form.elements.value = this.value;
      console.log(this.value);
      searchTerm = $(this)
        .val();
      return myNetwork.updateSearch(searchTerm);
    };
  }

  $("#search2")
    .keyup(function () {
      var searchTerm;
      searchTerm = $(this)
        .val();
      return myNetwork.updateSearch2(searchTerm);
    });

  $('#docs-close')
    .on('click', function () {
      deselectObject();
      return false;
    });
  $(document)
    .on('click', '.select-object', function () {
      var obj = data[$(this)
        .data('name')];
      if (obj) {
        selectObject(obj);
      }
      return false;
    });

  $(window)
    .on('resize', resize);

  /*
   var check = function () {
   document.getElementById("includeEnts").checked = true;
   document.getElementById("includeIndivs").checked = true;
   };
   check();
   */
  // LOAD THE JSON DATA FILE HERE
  // return d3.json("data/al-qaida.json", function(json) {
  return d3.json("data/output/AQList-clean.json", function (json) {
    //return d3.json("data/output/AQList-clean.json", function(json) {
    return myNetwork("#vis", json);
  });

});


function selectObject(obj, el) {
  var node;
  if (el) {
    node = d3.select(el);
  } else {
    graph.node.each(function (d) {
      if (d === obj) {
        node = d3.select(el = this);
      }
    });
  }
  if (!node) return;

  if (node.classed('selected')) {
    deselectObject();
    return;
  }
  deselectObject(false);

  selected = {
    obj: obj,
    el: el
  };

  highlightObject(obj);

  node.classed('selected', true);
  $('#docs')
    .html(obj.docs);
  $('#docs-container')
    .scrollTop(0);
  resize(true);

  var $graph = $('#graph-container'),
    nodeRect = {
      left: obj.x + obj.extent.left + graph.margin.left,
      top: obj.y + obj.extent.top + graph.margin.top,
      width: obj.extent.right - obj.extent.left,
      height: obj.extent.bottom - obj.extent.top
    },
    graphRect = {
      left: $graph.scrollLeft(),
      top: $graph.scrollTop(),
      width: $graph.width(),
      height: $graph.height()
    };
  if (nodeRect.left < graphRect.left ||
    nodeRect.top < graphRect.top ||
    nodeRect.left + nodeRect.width > graphRect.left + graphRect.width ||
    nodeRect.top + nodeRect.height > graphRect.top + graphRect.height) {

    $graph.animate({
      scrollLeft: nodeRect.left + nodeRect.width / 2 - graphRect.width / 2,
      scrollTop: nodeRect.top + nodeRect.height / 2 - graphRect.height / 2
    }, 500);
  }
}

function deselectObject(doResize) {
  if (doResize || typeof doResize == 'undefined') {
    resize(false);
  }
  graph.node.classed('selected', false);
  selected = {};
  highlightObject(null);
}


var showingDocs = false,
  docsClosePadding = 8,
  desiredDocsHeight = 300;

function resize(showDocs) {
  var docsHeight = 0,
    graphHeight = 0,
    $docs = $('#docs-container'),
    $graph = $('#graph-container'),
    $close = $('#docs-close');

  if (typeof showDocs == 'boolean') {
    showingDocs = showDocs;
    $docs[showDocs ? 'show' : 'hide']();
  }

  if (showingDocs) {
    docsHeight = desiredDocsHeight;
    $docs.css('height', docsHeight + 'px');
  }

  graphHeight = window.innerHeight - docsHeight;
  $graph.css('height', graphHeight + 'px');

  $close.css({
    top: graphHeight + docsClosePadding + 'px',
    right: window.innerWidth - $docs[0].clientWidth + docsClosePadding + 'px'
  });
}