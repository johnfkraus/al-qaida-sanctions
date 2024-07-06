var Network, RadialPlacement, activate, root;
var selected = {},
  root = typeof exports !== "undefined" && exports !== null ? exports : this;

Network = function () {
  //  variables we want to access in multiple places of Network
  var allData, charge, charge2, consoleLog, curLinksData, curNodesData, desiredDocsHeight, doc, filter, filterLinks, filterNodes, n,
    forceChargeParam, forceTick, groupCenters, svgHeight, hideDetails, layout, link, linkedByIndex, linksG, mapNodes,
    maxRadius, maxRadiusSelect, moveToRadialLayout, neighboring, network, node, nodeColors, nodeColors2, nodeColorsForNoLongerListed, nodeCounts, nodesG, radialTick, radius2,
    searchTerm, setFilter, setLayout, setMaxRadius, setSort, setupData, setupData2, showDetails, showingDoc, showTheDoc, sort, sortedTargets,
    strokeFor, tooltip, update, updateCenters, updateLinks, updateNodes, width;
  var consoleLog = true;
  var docClosePadding = 8;
  var topStuffNegativeMargin = 10;

  var w = window.innerWidth;
  var h = window.innerHeight;
  width = w - 20; // 1152;
  svgHeight = 0;
  desiredDocsHeight = 200;

  setSize(false);
  //  allData will store the unfiltered data
  allData = [];
  curLinksData = [];
  curNodesData = [];
  linkedByIndex = {};
  nodesG = null;
  linksG = null;
  showingDoc = false;

  //  these will point to the circles and lines of the nodes and links
  node = null;
  link = null;

  //  variables to reflect the current settings of the visualization
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
  nodeColorsForNoLongerListed = d3.scale.ordinal().domain([0, 1]).range(['#dddddd', '#111111']);
  //  tooltip used to display details
  tooltip = Tooltip("viz-tooltip", 230);
  doc = Document("viz-doc"); // , 630);

  //  charge used in artist layout
  charge = function (node) {
    return -Math.pow(node.radius, 2.0) / 2;
  };

  // forceChargeParam = $("#force_charge_select").val();
  charge2 = function (node) {
    return -Math.pow(node.radius, 4.0) / 15;
  };

  //  Starting point for network visualization
  //  Initializes visualization and starts force layout
  network = function (selection, data) {
    var viz;
    // var genDateString = vizFormatDate(data.dateGenerated);
    // var dateStringHardSpaces = genDateString.replace(/\s/g, "&nbsp;");
    // var result = "List published by the United Nations on " + dateStringHardSpaces;
    // var genDate = function (data) {
    //   document.getElementById("dateGeneratedByUN").innerHTML = result;
    // }(data);
    if (consoleLog) {
      console.log("docClosePadding = ", docClosePadding);
    }
    //  format our data
    allData = setupData(data);
    //  create our svg and groups
    viz = d3.select(selection)
      .append("svg")
      .attr("width", width)
      .attr("height", svgHeight);
    linksG = viz.append("g")
      .attr("id", "links");
    nodesG = viz.append("g")
      .attr("id", "nodes");

``    //  setup the size of the force environment
    force.size([width, svgHeight]);
    setLayout("force");
    setFilter("all");
    //  perform rendering and start force layout
    return update();
  };

  function setSize(showDoc) {
    var docHeight = 0,
      docContainer = $('#doc-container'),
      docClose = $('#doc-close'),
      showingDoc = false;


    var topStuffDisplay = $("#top-stuff").css("display"); // .style(); // .getAttribute("display");
      // console.log($("#top-stuff").css("display")); // none or ?
    let topStuffHeight;
    if (topStuffDisplay == "none") {
      console.log("topstuff display = none, ", topStuffDisplay);
      topStuffHeight = 0;
    } else {
      console.log("topstuff display = ", topStuffDisplay);
      //topStuffHeight = $("#top-stuff").height();
      topStuffHeight = 85;
    }

    if (typeof showDoc == 'boolean') {
      showingDoc = showDoc;
      docContainer[showDoc ? 'show' : 'hide']();
      docClose[showDoc ? 'show' : 'hide']();
    }
    if (showingDoc) {
      docHeight = desiredDocsHeight;
      $('#doc-container').css('height', docHeight + 'px');
    }
    svgHeight = 960; //= window.innerHeight - docHeight - topStuffHeight;
    if (consoleLog) {
      console.log("116 vis.js window.innerHeight = ", window.innerHeight);
      console.log("117 docHeight = ", docHeight);
      console.log("118 topStuffHeight = ", topStuffHeight );
      console.log("svgHeight = ", window.innerHeight - docHeight - topStuffHeight);
      console.log("; window.innerHeight = ", window.innerHeight, "; desiredDocsHeight = ", desiredDocsHeight, "; topStuffHeight = ", topStuffHeight, "; svgHeight = ", svgHeight);
      console.log("; window.innerWidth = ", window.innerWidth);
    }
    $('svg').css('height', (svgHeight + topStuffNegativeMargin) + 'px');
    if (window.innerWidth < 900) {
      $('.mainTitleDiv').css('font-size', '14px');
    }
  }

  var repositionSvg = function (obj) {
    var svg = $('svg');
    var nodeRect = {
      left: obj.x + obj.extent.left + svg.margin.left,
      top: obj.y + obj.extent.top + svg.margin.top,
      width: obj.extent.right - obj.extent.left,
      height: obj.extent.bottom - obj.extent.top
    };
    var svgRect = {
      left: svg.scrollLeft(),
      top: svg.scrollTop(),
      width: svg.width(),
      height: svg.height()
    };
    if (nodeRect.left < svgRect.left ||
      nodeRect.top < svgRect.top ||
      nodeRect.left + nodeRect.width > svgRect.left + svgRect.width ||
      nodeRect.top + nodeRect.height > svgRect.top + svgRect.height) {
      svg.animate({
        scrollLeft: nodeRect.left + nodeRect.width / 2 - svgRect.width / 2,
        scrollTop: nodeRect.top + nodeRect.height / 2 - svgRect.height / 2
      }, 500);
    }
  };

//  The update() function performs the bulk of the
//  work to setup our visualization based on the
//  current layout/sort/filter.
//  update() is called every time a parameter changes
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
    network.consoleLog = false;
    network.updateNodes();
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
  // end of update()
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
//  Public function to update highlighted nodes from search
  network.updateSearchIdLinkClick = function (id) {
    var searchRegEx;
    searchRegEx = new RegExp(id, "i"); // .toLowerCase());
    var searchResult = [];
    node.each(function (d) {
      var element, match;
      //element = d3.select(this);
      match = d.id
        .search(searchRegEx);
      if (id.length > 0 && match >= 0) {
        return d;
      }
    });
  };

  network.resize = function (showDoc) {
    console.log("viz.js 1120 resize(showDoc = ", showDoc, ")");
    var topStuffDisplay = $("#top-stuff").css("display");
    let topStuffHeight;
    if (topStuffDisplay == "none") {
      console.log("topstuff display = none, ", topStuffDisplay);
      topStuffHeight = 0;
    } else {
      console.log("topstuff display = ", topStuffDisplay);
      topStuffHeight = $("#top-stuff").height();
    }



    var docHeight = 0,
      svgHeight = 0,
      docContainer = $('#doc-container'),
      docClose = $('#doc-close');
    if (typeof showDoc == 'boolean') {
      showingDoc = showDoc;
      docContainer[showDoc ? 'show' : 'hide']();
      if (showDoc) {
        docClose.css('display', 'inline'); //[showDoc ? 'show' : 'hide']();
      } else {
        docClose.css('display', 'none'); //[showDoc ? 'show' : 'hide']();
      }
    }

    if (showingDoc) {
      docHeight = desiredDocsHeight;
      $('#doc-container').css('height', docHeight + 'px');
    } else {
      docHeight = 0;
      $('#doc-container').css('height', 0 + 'px');
    }
    // svgHeight = window.innerHeight - docHeight - $("#top-stuff").height() + topStuffNegativeMargin;
    svgHeight = window.innerHeight - docHeight - topStuffHeight + topStuffNegativeMargin;
    if (consoleLog) {
      console.log("viz.js 1143 window.innerHeight = ", window.innerHeight, "; svgHeight = ", svgHeight, "; window.innerWidth = ", window.innerWidth);
    }
    $('#svg').css('height', svgHeight + 'px');
    if (window.innerWidth < 900) {
      $('.mainTitleDiv').css('font-size', '14px');
    }
  };

  // Public function to update highlighted nodes from search
  network.updateColor3 = function (searchTermName) {
    // reset the none/entities/individuals radio buttons to "none"
    $('input[name="noneEntIndiv"][value=""]').prop('checked', true);
    if (consoleLog) {
      console.log("viz.js updateColor() searchTermName = ", searchTermName, "; node_color_select = ", $('#node_color_select').val());
    }
    var searchRegEx;
    searchRegEx = new RegExp(searchTermName, "i"); // .toLowerCase());
    return node.each(function (d) {
      var element, match;



      d.radius = 400; // 44;
      element = d3.select(this);



      element.r = '500'; //  '44'; // = d3.select(this);


      match = d.name
        .search(searchRegEx);
      if (searchTermName.length > 0 && match >= 0) {
        element.style("fill", "#F38630")
          .style("stroke-width", 6.0)   // MATCH LINE 351
          .style("stroke", "#555")
          .r === "44";

        return d.searched = true;
      } else {
        d.searched = false;
        return element.style("fill", function (d) {
          // return nodeColors(d.target);
          if (d[searchTermName] === undefined) {
            d[searchTermName] = "0";
          }
          if (consoleLog) {
            console.log("viz.js updateColor() 408 d.id = ", d.id, "; d[searchTermName] = ", d[searchTermName], "; nodeColors(d[searchTermName]) = ", nodeColors(d[searchTermName]));
          }
          if (searchTermName === "noLongerListed") {
            return nodeColorsForNoLongerListed(d[searchTermName]);
          } else {
            if (consoleLog) {
              console.log("nodeColors(d[searchTermName]) = ", nodeColors(d[searchTermName]));
            }
            return nodeColors(d[searchTermName]);
          }
        })
          .style("stroke-width", 1.0);
      }
    });
  };

  // Public function to update highlighted nodes
  network.updateMaxRadius = function (maxRadius) {
    console.log("maxRadius = ", maxRadius);
    return node.each(function (d) {
      var element = d3.select(this);
      console.log('linkCount = ', element[0][0].__data__.linkCount);
      let linkCount = element[0][0].__data__.linkCount;
      let linkCountInt = parseInt(linkCount, 10);
      // let circleRadiusResult = setupData2.circleRadius(Math.pow(linkCountInt * 3, 0.9));
      element.style("radius", circleRadiusResult); // node.linkCount);
      // element.style("radius", linkCountInt); // node.linkCount);
      return d.searched = true;
    })
  };

  // Public function to update highlighted nodes from search
  network.updateSearchId = function (searchTermId) {
    var searchRegEx;
    searchRegEx = new RegExp(searchTermId, "i"); // .toLowerCase());
    return node.each(function (d) {
      var element, match;
      element = d3.select(this);
      match = d.id
        .search(searchRegEx);
      if (searchTermId.length > 0 && match >= 0) {
        element.style("fill", "#F38630")
          .style("stroke-width", 6.0)   // modified from 2.0
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
  // Public function to update highlighted nodes from search
  network.updateSearchListedOrNot = function (searchTermListedOrNot) {
    var searchRegEx;
    searchRegEx = new RegExp(searchTermListedOrNot, "i"); // .toLowerCase());
    return node.each(function (d) {
      var element, match;
      element = d3.select(this);
      match = d.id
        .search(searchRegEx);
      if (searchTermListedOrNot.length > 0 && match >= 0) {
        element.style("fill", "#F38630")
          .style("stroke-width", 6.0)  // MATCH LINE 351
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

//  Public function to update highlighted nodes from search
  network.updateSearchName = function (searchTermName) {
    var searchRegEx;
    searchRegEx = new RegExp(searchTermName, "i"); // .toLowerCase());
    return node.each(function (d) {
      var element, match;
      element = d3.select(this);
      match = d.name
        .search(searchRegEx);
      if (searchTermName.length > 0 && match >= 0) {
        element.style("fill", "#F38630")
          .style("stroke-width", 6.0) // MATCH LINE 351
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

  // called once to clean up raw data and switch links to point to node instances.  Returns modified data
  setupData = function (data) {
    // initialize circle radius scale
    // parseInt( stringToParse, 10 );
    // countExtent = d3.extent(data.nodes, (d) -> d.playcount)
    var circleRadius, count, countExtent, nodesMap;
    var result;

    // countExtent is an Array with value 1 = minimum link count (0) and value 2 = maximum link count;
    console.log('viz.js 417 $(\'#max_radius_select\').val() = ', $('#max_radius_select').val());
//    console.log('circleRadius = ', circleRadius);


    // d is a sanctioned node from the array 'nodes' in the Object 'data'.  d has a 'radius' among its properties

    countExtent = d3.extent(data.nodes, function (d) {
      //result = parseInt(d.linkCount, 10);
      result = parseInt(d.linkCount, 10); // 10 is merely the radix; we are using decimal, base 10
      // if the node has 4 links, the radius is set to 4, a number, not a string representation of  anumber
      d.radius = d.linkCount;
      return parseInt(d.linkCount, 10);
    });

    maxRadiusSelect = parseInt($('#max_radius_select').val());
    console.log("viz.js 432 maxRadiusSelect = ", maxRadiusSelect);

    circleRadius = d3.scale.sqrt()
      .range([3, parseInt($('#max_radius_select').val())])
      .domain(countExtent);

    // console.log("438 circleRadius = ", circleRadius);
// countExtent is an Array with value 1 = minimum link count (0) and value 2 = maximum link count;
//    console.log('$(\'#max_radius_select\').val() = ', $('#max_radius_select').val());
//    console.log('circleRadius = ', circleRadius);

//      .domain(countExtent);
    data.nodes.forEach(function (n) {
      // set initial x/y to values within the width/height
      // of the visualization
      var randomnumber;
      n.x = randomnumber = Math.floor(Math.random() * width);
      n.y = randomnumber = Math.floor(Math.random() * svgHeight);

      //return n.radius = circleRadius(n.linkCount);
      // return n.radius = (n.linkCount);
      // determine radius of each node circle

      var circleRadiusResult = circleRadius(Math.pow(n.linkCount * 3, 0.9));
      // console.log("456 circleRadiusResult = ", circleRadiusResult);
      // uncomment for debugging d3

      // console.log('n.id = ', n.id, '; n.linkCount = ', n.linkCount, '; circleRadius(Math.pow(n.linkCount * 3, 0.9)) = ', circleRadius(Math.pow(n.linkCount * 3, 0.9)));

      return n.radius = circleRadius(Math.pow(n.linkCount * 3, 0.9));
    });
    // id's -> node objects
    nodesMap = mapNodes(data.nodes);
    // switch links to point to node objects instead of id's
    count = 0;
    var linkedByIndexData;
    data.links.forEach(function (l) {
      count++;
//      if (!(nodesMap.get(l.target))) {
      // console.log("274 count = ", count, "l.target is undefined; l.source = ", nodesMap.get(l.source));
      //     }
      l.source = nodesMap.get(l.source);
      l.target = nodesMap.get(l.target);
      // linkedByIndexData = linkedByIndex["" + l.source.id + "," + l.target.id] = 1;
      if ((typeof(l.target) !== 'undefined') && (l.target !== null)) {
        return linkedByIndex["" + l.source.id + "," + l.target.id] = 1;
      }
    });
    return data;
  };
//  called once to clean up raw data and switch links to point to node instances.  Returns modified data
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
    var result;

    // countExtent is an Array with value 1 = minimum link count (0) and value 2 = maximum link count;
//    console.log('$(\'#max_radius_select\').val() = ', $('#max_radius_select').val());
//    console.log('circleRadius = ', circleRadius);

    countExtent = d3.extent(data.nodes, function (d) {
      //result = parseInt(d.linkCount, 10);
      result = parseInt(d.linkCount, 10);
      d.radius = d.linkCount;
      return parseInt(d.linkCount, 10);
    });
    circleRadius = d3.scale.sqrt()
      .range([3, $('#max_radius_select').val()])
      .domain(countExtent);

    data.nodes.forEach(function (n) {
      // var randomnumber;
      // n.x = randomnumber = Math.floor(Math.random() * width);
      // n.y = randomnumber = Math.floor(Math.random() * height);
      // return n.radius = circleRadius(n.linkCount);
      // return n.radius = (n.linkCount);
      // determine radius of each node circle
      return n.radius = circleRadius(Math.pow(n.linkCount * 3, 0.9));
    });
    nodesMap = mapNodes(data.nodes);
    count = 0;
    var linkedByIndexData;
    data.links.forEach(function (l) {
      count++;
      l.source = nodesMap.get(l.source);
      l.target = nodesMap.get(l.target);
      // linkedByIndexData = linkedByIndex["" + l.source.id + "," + l.target.id] = 1;
      if ((typeof(l.target) !== 'undefined') && (l.target !== null)) {
        return linkedByIndex["" + l.source.id + "," + l.target.id] = 1;
      }
    });
    return data;
  };

//  Helper function to map node ids to node objects.
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
    var counts;
    counts = {};
    nodes.forEach(function (d) {
      var _name;
      if (counts[_name = d[attr]] == null) {
        counts[_name] = 0;
      }
      return counts[d[attr]] += 1;
    });
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
    var cutoff, filteredNodes, linkCounts;
    filteredNodes = allNodes;
    // if (filter === "popular" || filter === "obscure") {
    //   alert("hey, popular or obscure!");
    //   linkCounts = allNodes.map(function (d) {
    //     return d.linkCount;
    //   })
    //     .sort(d3.ascending);
    //   cutoff = d3.quantile(linkCounts, 0.5);
    //   filteredNodes = allNodes.filter(function (n) {
    //     if (filter === "popular") {
    //       return n.linkCount > cutoff;
    //     } else if (filter === "obscure") {
    //       return n.linkCount <= cutoff;
    //     }
    //   });
    // }
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
      //  add any missing targets that don't have any links

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
          "y": svgHeight / 2 - 100
        })
        .radius(300)
        .increment(18)
        .keys(targets);
    }
  };
//  Removes links from allLinks whose source or target is not present in curNodes
//  Returns array of links

  filterLinks = function (allLinks, curNodes) {
    curNodes = mapNodes(curNodes);
    return allLinks.filter(function (l) {
      if ((typeof l.target === 'undefined') && (l.target) === null) {
        console.log('filename: viz.js, line approx. 672;  Error null target where l.source.id = ', l.source.id, '; l.source = ', JSON.stringify(l.source));
      }
      try {
        if ((typeof l == 'undefined') && (typeof l.target == 'undefined') && (typeof l.target.id === 'undefined') && (l.target.id === null)) {

          console.log('filename: viz.js, line approx. 676; Error null target id where l.source.id = ', l.source.id, '; l.source = ', JSON.stringify(l.source));

          if ((typeof curNodes.get(l.target.id) !== 'undefined') && (curNodes.get(l.target.id) !== null)) {
            return curNodes.get(l.source.id) && curNodes.get(l.target.id);
          }
        }
      } catch (err) {
        // console.log('filename: viz.js, line approx. 679;  Error: ', err, '; null target id where l.source.id = ', l.source.id, '; l.source = ', JSON.stringify(l.source).substring(0, 1000), "l.target = ", l.target );
      }
      try {
        if ( (l.target !== 'undefined')  && (typeof curNodes.get(l.target.id) !== 'undefined') && (curNodes.get(l.target.id) !== null)) {
          return curNodes.get(l.source.id) && curNodes.get(l.target.id);
          // return curNodes.get(l.source.id).substring(0, 1000) && curNodes.get(l.target.id).substring(0, 1000);
        }
      } catch (err) {
        console.log('691 viz.js, line approx. 687;  Error: ', err.toString().substring(0, 10000));

      }
    });
  };

//  enter/exit display for nodes
  network.updateNodes = function () {
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
      .on("mouseout", hideDetails); //.on("click", selectObject(this,el));

    node.on("click", showTheDoc);

    function selectObject(obj, el) {
      var node;
      if (el) {
        node = d3.select(el);
      } else {
        svg.node.each(function (d) {
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
      $('#doc')
        .html(obj.doc);
      $('#doc-container')
        .scrollTop(0);
      resize(true);
    }

    var countN = 0;
    node.forEach(function (n) {
      // console.log('646 viz.js node.forEach(function (n) { showProps(n, "n")');
      // console.log(showProps(n, "n"));
      n.forEach(function (circle) {
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

  setMaxRadius = function (newLayout, changeInt) {
    layout = newLayout;
    changeInt = changeInt || 0;
    var radius = $('#circle_radius_max').val();
    // var newRadius = parseInt(forceCharge, 10) + changeInt;
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

//  Helper function that returns stroke color for particular node.
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
    if (d.indiv0OrEnt1 === 0 && d.natnlty && d.natnlty !== 0) {
      // console.log("indiv0OrEnt1 === 0: ", (d.indiv0OrEnt1 === 0), "d.natnlty !=== 0 = ", (d.natnlty !== 0), (d.natnlty != 0))
      content += '<hr class="tooltip-hr">';
      content += '<p class="main"><span>Nationality: ' + d.natnlty;
      content += '</span></p>';
    }
    tooltip.showTooltip(content, d3.event);

    //  highlight connected links
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
            return 0.4;
          }
        })
        .attr("z-index", function (l) { // not sure this code actually does anything
          if (l.source === d || l.target === d) {
            return "100";
          } else {
            return "0";
          }
        });
    }
  };


//  click node for doc function
  showTheDoc = function (d, i) {
    console.log("viz.js 1006, showTheDoc(d, i), this = ", this, "; d.id = ", d.id, "; i = ", i);
    var aNode = this;
    // console.log("typeof aNode = ", typeof aNode);
    // let longNarrative;
    //  $("button#getNarrative").click(function () {
    var fileName = d.narrativeFileName;
    // var fileName = "NSQE01101E.shtml";
    var path = "data/narrative_summaries/";
    var url = path + fileName;
    $.ajaxSetup({
      async: false,
      scriptCharset: "utf-8",
      cache: false,
      contentType: "utf-8"
    });
    $.ajax({
      url: url,
      success: function (result) {
        longNarrative = result;
        var content;
        if (typeof (longNarrative) !== 'null' && typeof (longNarrative) !== 'undefined') {
          content = longNarrative;
        } else {
          content = d.docs;
        }
        content = addMouseovers(content);
        showDocument(d, content, d3.event);
      }
      }).fail(function (jqXHR, textStatus, errorThrown) {
        console.log("failed, textStatus = ", textStatus, "; errorThrown = ", errorThrown);
        content = '<div class="bioData">No narrative available.</div>';
        showDocument(d, content, d3.event);
      });

    return d3.select(this);
  };

  var showDocument = function (d, content, event) {
    this.d = d;
    var that = this;
    //$("span#name").html(d.name);
    $("span#name").html(d.name);
    $("span#id").html(d.id);
    // $("span#nameOriginalScript").html(d.NAME_ORIGINAL_SCRIPT);
    $("span#nameOriginalScript").html(d.nameOriginalScript);
    $("span#longNarrative").html(content);

    $("span#narrative").html(d.COMMENTS1);

    if (d.indiv0OrEnt1 == 0 && (typeof d.indivDateOfBirth !== 'undefined') && d.indivDateOfBirth !== "") {
      $("span#indivDob").html(d.indivDateOfBirth);
      $("div#dateOfBirthDiv").css("display", "block");
    } else {
      $("div#dateOfBirthDiv").css("display", "none");
    }
    if (d.indiv0OrEnt1 == 0 && (typeof d.indivPlaceOfBirth !== 'undefined') && d.indivPlaceOfBirth !== "") {
      $("div#placeOfBirthDiv").css("display", "block");
      $("span#indivPlaceOfBirth").html(d.indivPlaceOfBirth);
    } else {
      $("div#placeOfBirthDiv").css("display", "none");
    }

    if (d.aliasesString !== "") {
      $("span#aliasesString").html(d.aliasesString);
      $("div#aliasDiv").css("display", "block");
    } else {
      $("div#aliasDiv").css("display", "none");
    }
    if (d.addressesString !== "") {
      $("span#addressesString").html(d.addressesString);
      $("div#addressesDiv").css("display", "block");
    } else {
      $("div#addressesDiv").css("display", "none");
    }
    if ((typeof d.gender !== 'undefined') && (d.gender !== "")) {
      $("span#genderString").html(d.gender);
      $("div#genderDiv").css("display", "block");
    } else {
      $("div#genderDiv").css("display", "none");
    }
    if (typeof d.listedOn !== 'undefined' && d.listedOn !== "") {
      $("div#dateListedDiv").css("display", "block");
      $("span#dateListed").html(vizFormatDate(d.listedOn));
    } else {
      $("div#dateListedDiv").css("display", "none");
    }

    if (typeof d.dateUpdatedString !== 'undefined' && d.dateUpdatedString !== "") {
      $("div#dateUpdatedDiv").css("display", "block");
      $("span#dateUpdated").html(d.dateUpdatedString);
    } else {
      $("div#dateUpdatedDiv").css("display", "none");
    }

    srnl = $("span.refNumLink");
    console.log("1028 ", srnl, srnl.length); //. .innerHTML);
    // for item in snrl
    //   console.log("1030 ", item.innerHTML);
    for (var i = 0, l = srnl.length; i < l; i++) {
      searchTermId = srnl[i].innerHTML;
      console.log(searchTermId);
      srnl.mouseover(function () {
        //xyz.showLinkedNode(searchTermId);
          // searchTermId = innerh;
          return Network.updateSearchId(searchTermId);
        });
    }

    $("#doc-container").show();
    $("#doc-close").css('display', 'inline');
    this.d = d;
    resize(true);

  };

  var vizFormatDate = function (dateString) {
    var m_names = ["January", "February", "March",
      "April", "May", "June", "July", "August", "September",
      "October", "November", "December"];
    var d = new Date(dateString);
    var curr_date = d.getDate();
    var curr_month = d.getMonth();
    var curr_year = d.getFullYear();
    var dateString = curr_date + " " + m_names[curr_month]
      + " " + curr_year;
    // console.log("viz.js 947 vizFormatDate() dateString = ", dateString);
    return dateString;
  };

  function resize(showDoc) {
    console.log("viz.js 1120 resize(showDoc = ", showDoc, ")");
    var topStuffDisplay = $("#top-stuff").css("display");
    let topStuffHeight;
    if (topStuffDisplay == "none") {
      console.log("topstuff display = none, ", topStuffDisplay);
      topStuffHeight = 0;
    } else {
      console.log("topstuff display = ", topStuffDisplay);
      topStuffHeight = $("#top-stuff").height();
    }

    var docHeight = 0,
      svgHeight = 0,
      docContainer = $('#doc-container'),
      docClose = $('#doc-close');
    if (typeof showDoc == 'boolean') {
      showingDoc = showDoc;
      docContainer[showDoc ? 'show' : 'hide']();
      // docClose[showDoc ? 'show' : 'hide']();
      if (showDoc) {
        docClose.css('display', 'inline'); //[showDoc ? 'show' : 'hide']();
      } else {
        docClose.css('display', 'none'); //[showDoc ? 'show' : 'hide']();
      }
    }

    if (showingDoc) {
      docHeight = desiredDocsHeight;
      $('#doc-container').css('height', docHeight + 'px');
    } else {
      docHeight = 0;
      $('#doc-container').css('height', 0 + 'px');
    }

    if (window.innerHeight > 1) {
      window.resizeTo(400, 1200);
    }
    svgHeight = window.innerHeight - docHeight - topStuffHeight + topStuffNegativeMargin;

    if (consoleLog) {
      console.log("viz.js 1143 window.innerHeight = ", window.innerHeight, "; svgHeight = ", svgHeight, "; window.innerWidth = ", window.innerWidth);
    }
    $('#svg').css('height', svgHeight + 'px');

    if (window.innerWidth < 900) {
      $('.mainTitleDiv').css('font-size', '14px');
    }
  }

  // mouseout function
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
          return 6.0;  // match value from line 351
        }
      });
    if (link) {
      return link.attr("stroke", "#ddd")
        .attr("stroke-opacity", 0.8);
    }
  };

  let addMouseovers= function (content) {
    return content;
  }


//  Final act of Network() function is to return the inner 'network()' function.
  return network;
};
// END OF Network()

//  Activate selector button
activate = function (group, link) {
  d3.selectAll("#" + group + " a")
    .classed("active", false);
  return d3.select("#" + group + " #" + link)
    .classed("active", true);
};
// end of activate()

$(function () {
    var searchTerm;
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
    $("#force_charge_select")
      .on("change", function (e) {
        activate("layouts", "force");
        return myNetwork.toggleLayout("force");
      });
    // $("#max_radius_select")
    //   .on("change", function (e) {
    //     activate("layouts", "force");
    //     return myNetwork.toggleLayout("force");
    //   });



    // var intervalID = setInterval(function () {
    //     wiggle();
    //   }, 20000);

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
        $('input[name="noLongerListed"][value="1"]').prop('checked', false);
        // $('input[name="noLongerListed"]).prop('checked', false);
        activate("layouts", "force");
        var nodeColorSelect = $("#node_color_select").val();
        return myNetwork.updateColor3(nodeColorSelect);
      });

  $("#max_radius_select")
    .on("change", function (e) {
      // $('input[name="noLongerListed"][value="1"]').prop('checked', false);
      // $('input[name="noLongerListed"]).prop('checked', false);
      activate("layouts", "force");
      var maxRadius = $("#max_radius_select").val();
      return myNetwork.updateMaxRadius(maxRadius); //  .updateColor3(nodeColorSelect);
    });


  $('#unhideNavbar')
    .on('click', function() {
      $("#top-stuff").css("display", "table");
      $('#unhideNavbar').css("display", "none");
      return myNetwork.resize(false);
    });


  $('#hideNavbar')
    .on('click', function () {
      // deselectObject();
      let topStuff = $("#top-stuff");
      topStuff.css("display", "none");
      console.log("#hideNavbar clicked");
      $('#unhideNavbar').css("display", "table");
      return myNetwork.resize(false);
      // return false;
    });


  $('#doc-close')
      .on('click', function () {
        // deselectObject();
        console.log("viz.js 1114 #doc-close clicked");
        return myNetwork.resize(false);
        // return false;
      });

    // $('#doc-container').html(
    //   $('#doc-container')
    //     .html()
    //     .replace(
    //       /\b(QD[i|e]\.\d{3})\b/ig,
    //       '<a href="#" class="normalTip" title="QD___">$1</a>'
    //     )
    // );

    // $('a.normalTip').aToolTip();



    function hideDocument() {
      $("#doc-close").css('display', 'none');
      $("#doc-container").css('display', 'none');
      myNetwork.resize(false);
    }

    $("#searchInputId")
      .keyup(function () {
        var searchTermId;
        searchTermId = $(this)
          .val();
        return myNetwork.updateSearchId(searchTermId);
      });
    $("#searchInputName")
      .keyup(function () {
        var searchTermName;
        searchTermName = $(this)
          .val();
        return myNetwork.updateSearchName(searchTermName);
      });

    // $("#highlightOnMover").mouseover(
    // function() {
    //   var searchTermId;
    //   searchTermId = $(this).val()  //  x.innerHTML;
    //   console.log("searchTermId: " + searchTermId);
    //   return myNetwork.updateSearchId(searchTermId);
    // });

  // "No Longer Listed" checkbox, (OBE as of 2024)
    $("input[name='noLongerListed']").change(function (e) {
      // e = jQuery.Event
      if (myNetwork.consoleLog) {
        console.log("checkbox clicked = ", this.checked);
      }
      if (this.checked) {
        activate("layouts", "force");
        return myNetwork.updateColor3("noLongerListed");
      } else {
        activate("layouts", "force");
        return myNetwork.updateColor3("name");
      }
    });

    $(window).resize(function () {
      if (myNetwork.consoleLog) {
        console.log('viz.js 1175 window was resized');
      }
      myNetwork.resize();
    });

    // get list of radio buttons with name 'noneEntIndiv'
    var radioNEI = document.forms['highlight'].elements['noneEntIndiv'];
    // loop through list
    for (var i = 0, len = radioNEI.length; i < len; i++) {
      radioNEI[i].onclick = function () { // assign onclick handler function to each
        // put clicked radio button's value in total field
        $('input[name="noLongerListed"][value="1"]').prop('checked', false);
        searchTerm = $(this)
          .val();
        return myNetwork.updateSearchId(searchTerm);
      };
    }

    $(document).on('click', '.select-object', function () {
        var obj = data[$(this)
          .data('name')];
        if (obj) {
          selectObject(obj);
        }
        return false;
      });

    $(window)
      .on('resize', function () {
        if (myNetwork.consoleLog) {
          console.log("vis.js 1208 window resized");
        }
        myNetwork.resize;
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
    }

    function deselectObject(doResize) {
      if (doResize || typeof doResize == 'undefined') {
        myNetwork.resize(false);
      }
      graph.node.classed('selected', false);
      selected = {};
      highlightObject(null);
    }

    // LOAD THE JSON DATA FILE HERE
    let myJsonData =  jsonData.replace(/\\/g, '\\');
    return myNetwork("#svg", JSON.parse(myJsonData));
  }
);
// end of function()
