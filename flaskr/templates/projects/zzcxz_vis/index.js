const TAU = 6.283185307179586;

const radius = 25;
const radiusRedirect = 15;
const colorBackground = "var(--bg-intense)";
const colorNormal = "var(--fg)";
const colorRedirect = "#8af";
const colorDone = "var(--fg-faded)";
const colorRedirectDone = "#679";
const colorRoot = "#4a5";
const colorRootDone = "#484";

const alphaInit = 0.5;
const alphaTarget = 0.1;
const linkDistance = 150;
const linkStrength = 0.1;

let nodes = [];
let links = [];
let refresh;
let transform = {x: 0, y: 0, k: 1};
let selectedNode = null;
let showLabels = true;

function getColorFor(elem) {
    if(elem.root) {
        if(elem.done) { return colorRootDone; }
        return colorRoot;
    } else if(elem.type === "normal") {
        if(elem.done) { return colorDone; }
        return colorNormal;
    } else if(elem.type === "redirect") {
        if(elem.done) { return colorRedirectDone; }
        return colorRedirect;
    }
}

function getRadiusFor(elem) {
    if(elem.type === "normal") {
        return radius;
    } else if(elem.type === "redirect") {
        return radiusRedirect;
    }
}

// Fetch and parse a zzcxz page
async function loadPage(id) {
    const url = "https://zzcxz.citrons.xyz/g/" + id + "/raw";
    console.log("fetching id " + id);
    return fetch(url).then(x => x.text()).then(text => {
        let pageType = "normal";
        const directive = text.match(/^\t#([A-Za-z]+)\s*(.*)\n?$/m);
        const title = text.match(/^.+\n/m)[0];
        const links = (text.match(/^[a-z]{5}:.*\n/gm) || [])
            .map(line => {
                return {"to": line.trim().split(":")[0], "type": "normal"};
            });
        if(directive) {
            const kind = directive[1];
            const arg = directive[2];
            if(kind.toLowerCase() === "redirect") {
                pageType= "redirect";
                links.push({"to":arg,"type":"redirect"});
            } else {
                throw "Unsupported directive: #" + kind
            }
        }
        return {
            "id": id,
            "type": pageType,
            "title": title,
            "links": links,
        };
    });
}

// Add a page to the network (nodes and links lists (not linked lists (at least i think not (i do not know how js lists are implemented))))
function addPage(id, x, y, root) {
    loadPage(id).then(page => {
        if(nodes.map(node => node.id).includes(page.id)) {
            return;
        }
        let newLinks = [];
        for(node of nodes) {
            for(link of node.links) {
                if(link.to === page.id) {
                    newLinks.push({
                        "source": node.id,
                        "target": page.id,
                        "type": link.type,
                    });
                }
            }
            for(link of page.links) {
                if(link.to === node.id) {
                    newLinks.push({
                        "source": page.id,
                        "target": node.id,
                        "type": link.type,
                    });
                }
            }
        }
        nodes.push({
            "id": page.id,
            "x": x,
            "y": y,
            "title": page.title,
            "links": page.links,
            "type": page.type,
            "done": false,
            "root": root,
        });
        for(link of newLinks) {
            links.push(link);
        }
        refresh();
    });
}

function addAll(node, x, y) {
    const doneIds = nodes.map(n => n.id);
    for(link of node.links) {
        if(!doneIds.includes(link.to)) {
            const theta = Math.random() * TAU;
            const dx = 2 * radius * Math.cos(theta);
            const dy = 2 * radius * Math.sin(theta);
            addPage(link.to, x + dx, y + dy, false);
        }
    }
    node.done = true;
    d3.select(".node-" + node.id)
        .style("fill", getColorFor);
}

function selectNode(node) {
    if(selectedNode !== null) {
        d3.select(".node-" + selectedNode.id)
            .style("stroke", "#0000");
    }
    selectedNode = node;
    if(selectedNode !== null) {
        d3.select(".node-" + selectedNode.id)
            .style("stroke", "#fff");
        d3.select("#selected-node").attr("hidden", null);
        d3.select("#selected-node-title").html(selectedNode.title);
        d3.select("#selected-node-id").html(selectedNode.id);
        d3.select("#selected-node-link").attr("href", "https://zzcxz.citrons.xyz/g/" + selectedNode.id);
    } else {
        d3.select("#selected-node").attr("hidden", true);
    }
}

function visualize() {
    document.getElementsByTagName("body")[0].style.width = "min(2000px, 90vw)";
    document.getElementById("title").hidden = true;
    const zoom = d3.zoom();
    zoom.on("zoom", event => {
        const elems = d3.select("#elems")
            .attr("transform", event.transform);
        transform = event.transform;
    });

    const svg = d3.select("#graph")
        .append("svg")
        .attr("id", "graph-svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .style("background-color", colorBackground)
        .call(zoom);

    const clientWidth = document.querySelector("#graph").clientWidth;
    const clientHeight = document.querySelector("#graph").clientHeight;

    d3.select("#spoiler").remove();
    d3.select("#ui").attr("hidden", null);

    d3.select("#expand-link").on("click", () => {
        d3.select("#uiexpand").attr("hidden", true);
        d3.select("#ui").attr("hidden", null);
    });

    d3.select("#contract-link").on("click", () => {
        d3.select("#uiexpand").attr("hidden", null);
        d3.select("#ui").attr("hidden", true);
    });

    d3.select("#load-page").on("keypress", (event) => {
        if(event.keyCode == 13) {
            addPage(event.target.value, (clientWidth/2-transform.x)/transform.k, (clientHeight/2-transform.y)/transform.k, true);
            event.target.value = "";
        }
    });

    d3.select("#clear-nodes").on("click", (event) => {
        selectNode(null);
        links.length = 0;
        nodes.length = 0;
        refresh();
    });

    d3.select("#toggle-labels").on("click", (event) => {
        showLabels = !showLabels;
        if(showLabels) {
            d3.selectAll(".label").attr("visibility", "visible");
        } else {
            d3.selectAll(".label").attr("visibility", "hidden");
        }
    });

    d3.select("body")
        .on("keydown", event => {
            if(event.keyCode == 27) {
                selectNode(null);
            }
        })
        .on("click", event => selectNode(null));

    const marker = svg.append("svg:defs")
        .selectAll(".triangle-marker")
        .data([["normal", colorNormal], ["redirect", colorRedirect]])
        .enter()
        .append("svg:marker")
        .attr("id", d => `triangle-${d[0]}`)
        .attr("refX", radius+10)
        .attr("refY", 5)
        .attr("orient", "auto")
        .attr("markerUnits", "strokeWidth")
        .attr("markerWidth", 15)
        .attr("markerHeight", 10)
        .append("svg:polygon")
        .attr("points", "0 0, 15 5, 0 10")
        .attr("fill", d => d[1]);

    const simulation = d3.forceSimulation().nodes(nodes);
    const forceLinks = d3.forceLink(links)
        .distance(linkDistance)
        .strength(linkStrength)
        .id((d, i) => d.id);

    simulation.force("link", forceLinks)
        .force("charge", d3.forceManyBody().distanceMax(256).distanceMin(1).strength(-50))
        .force("collide", d3.forceCollide().radius(radius*1.4));

    const elems = svg.append("g").attr("id", "elems");
    const gLinks = elems.append("g").attr("id", "links");
    const gNodes = elems.append("g").attr("id", "nodes");
    const gLabels = elems.append("g").attr("id", "labels");

    let node, link, label;

    const dragDrop = d3.drag().on("start", (event, node) => {
        node.fx = node.x;
        node.fy = node.y;
    }).on("drag", (event, node) => {
        simulation.alpha(alphaInit).alphaTarget(alphaTarget).restart();
        node.fx = event.x;
        node.fy = event.y;
    }).on("end", (event, node) => {
        if (!event.active) {
          simulation.alphaTarget(alphaTarget);
        }
        node.fx = null;
        node.fy = null;
    })

    function tick() {
        gNodes.selectAll(".node")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
        gLabels.selectAll(".label")
            .attr("x", d => d.x)
            .attr("y", d => d.y);
        gLinks.selectAll(".link")
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
    }

    refresh = () => {
        node = gNodes.selectAll(".node").data(nodes, d => d.id);

        node.exit().remove();

        node.enter()
            .append("circle")
            .attr("class", d => `node node-${d.id}`)
            .attr("r", getRadiusFor)
            .style("fill", getColorFor)
            .style("stroke", "#0000")
            .style("stroke-width", 2.5)
            .call(dragDrop)
            .on("click", (event, target) => addAll(target, target.x, target.y))
            .on("contextmenu", (event, target) => { event.preventDefault(); selectNode(target); });

        label = gLabels.selectAll(".label");

        label = gLabels.selectAll(".label").data(nodes, d => d.id);

        label.exit().remove();

        label.enter()
            .append("text")
            .attr("class", "label")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .style("fill", colorBackground)
            .style("stroke", colorNormal)
            .style("stroke-width", 2.5)
            .style("paint-order", "stroke")
            .style("font-size", "15px")
            .text(d => d.title)
            .attr("pointer-events", "none")
            .attr("visibility", showLabels ? "visible" : "hidden");

        link = gLinks.selectAll(".link").data(links);

        link.exit().remove();

        link.enter()
            .append("line")
            .attr("class", "link")
            .style("stroke", getColorFor)
            .attr("marker-end", d => `url(#triangle-${d.type})`);

        simulation.nodes(nodes).on("tick", tick);
        simulation.force("link").initialize(links);
        simulation.alpha(alphaInit).alphaTarget(alphaTarget).restart();
    };
    addPage("zzcxz", clientWidth/2, clientHeight/2, true);
}

window.onload = () => {
    if(new URLSearchParams(window.location.search).has("skip")) {
        visualize();
    }
}
