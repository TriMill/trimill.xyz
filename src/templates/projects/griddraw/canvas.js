function createCanvas(selector, width, height, spacing, mouseOver) {
    const result = {
        xsize: Math.ceil(width/spacing),
        ysize: Math.ceil(height/spacing),
        spacing: spacing,
        undoStack: [],
        redoStack: [],
        undoFrame: null,
    };

    result.width = result.xsize*spacing;
    result.height = result.ysize*spacing;

    const svg = d3.select(selector).append("svg")
        .attr("id", "canvas")
        .attr("width", result.width)
        .attr("height", result.height)
        .style("background", "white");
    const cells = svg.append("g").attr("id", "canvas-cells");
    const lines = svg.append("g").attr("id", "canvas-lines");
    for(let i = 0; i < result.ysize; i++) {
        lines.append("line")
            .style("stroke", "#888")
            .attr("class", "line")
            .attr("x1", 0)
            .attr("x2", result.width)
            .attr("y1", i*result.spacing)
            .attr("y2", i*result.spacing);
    }
    for(let i = 0; i < result.xsize; i++) {
        lines.append("line")
            .style("stroke", "#888")
            .attr("class", "line")
            .attr("y1", 0)
            .attr("y2", result.height)
            .attr("x1", i*result.spacing)
            .attr("x2", i*result.spacing);
    }
    svg.on("scroll", ()=>{});
    svg.on("contextmenu", (event, d)=>{event.preventDefault();});
    svg.on("mousedown", (event, d)=>{
        window.mouseButton = event.button;
        result.beginUndoFrame("draw");
        mouseOver(d3.pointer(event));
    });
    svg.on("mousemove", (event, d)=>{
        if(window.mouseButton !== null) {
            mouseOver(d3.pointer(event));
        }
    });
    svg.on("mouseup", (event, d)=>{
        window.mouseButton = null;
        result.endUndoFrame();
    });

    result.svg = svg;

    result.beginUndoFrame = function(type) {
        result.undoFrame = [];
    }

    result.endUndoFrame = function() {
        if(result.undoFrame.length > 0) {
            result.undoStack.push(result.undoFrame);
        }
        result.undoFrame = null;
    }

    result.undo = function() {
        if(result.undoStack.length > 0) {
            const frame = result.undoStack.pop();
            for(const change of frame.reverse()) {
                result.setCell(change.x, change.y, change.before);
            }
            result.redoStack.push(frame);
        }
    }

    result.redo = function() {
        if(result.redoStack.length > 0) {
            const frame = result.redoStack.pop();
            for(const change of frame) {
                result.setCell(change.x, change.y, change.after);
            }
            result.undoStack.push(frame);
        }
    }

    result.clear = function() {
        result.beginUndoFrame();
        for(let x = 0; x < result.xsize; x++) {
            for(let y = 0; y < result.xsize; y++) {
                result.setCell(x, y, null);
            }
        }
        result.endUndoFrame();
    }

    result.setCell = function(x, y, color) {
        const cell = d3.select("#cell-"+x+"-"+y);
        if(color === null) {
            if(cell.size() != 0) {
                if(result.undoFrame){
                    result.undoFrame.push({
                        x: x,
                        y: y,
                        before: cell.style("fill"),
                        after: null
                    });
                }
                cell.remove();
            }
        } else {
            if(cell.size() == 0) {
                if(result.undoFrame){
                    result.undoFrame.push({
                        x: x,
                        y: y,
                        before: null,
                        after: color
                    });
                }
                d3.select("#canvas-cells").append("rect")
                    .style("stroke-width", 0)
                    .style("fill", color)
                    .attr("id", "cell-"+x+"-"+y)
                    .attr("x", x*result.spacing)
                    .attr("y", y*result.spacing)
                    .attr("width", result.spacing)
                    .attr("height", result.spacing);
            } else {
                if(cell.style("fill") == color) {
                    return;
                }
                if(result.undoFrame){
                    result.undoFrame.push({
                        x: x,
                        y: y,
                        before: cell.style("fill"),
                        after: color
                    });
                }
                cell.style("fill", color);
            }
        }
    }

    result.setbg = function(color) {
        svg.style("background", color);
    }

    result.setlinecol = function(color) {
        const lines = d3.selectAll(".line");
        if(color !== null) {
            lines.style("stroke", color);
        } else {
            const cur = lines.attr("visibility");
            if(cur == "hidden") {
                lines.attr("visibility", null);
            } else {
                lines.attr("visibility", "hidden");
            }
        }
    }

    return result;
}
