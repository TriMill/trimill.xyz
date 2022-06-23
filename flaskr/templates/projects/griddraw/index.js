window.onload = () => {
    window.mouseButton = null;
    window.canvas = createCanvas("#canvas-wrapper", window.innerWidth, window.innerHeight, 30, mouseOver);
    
    window.colorpicker = createColorpicker(
        ".picking-area", ".picker", 
        ".hue-picking-area", ".hue-picker", 
        "#hexcode", "#colordisplay"
    );

    d3.select("#undo").on("click", window.canvas.undo);
    d3.select("#redo").on("click", window.canvas.redo);
    d3.select("#clear").on("click", window.canvas.clear);
    d3.select("#setbg").on("click", ()=>window.canvas.setbg(HSVtoRGB(window.colorpicker.color)));
    d3.select("#setlines").on("click", ()=>window.canvas.setlinecol(HSVtoRGB(window.colorpicker.color)));
    d3.select("#togglelines").on("click", ()=>window.canvas.setlinecol(null));

    window.colorpicker.updateColorOutput();
};

function mouseOver(mouse) {
    const x = Math.floor(mouse[0]/window.canvas.spacing);
    const y = Math.floor(mouse[1]/window.canvas.spacing);
    if(window.mouseButton == 0) {
        window.canvas.setCell(x, y, HSVtoRGB(window.colorpicker.color));
    } else if(window.mouseButton == 1) {
        const cell = d3.select("#cell-"+x+"-"+y);
        if(cell.size() > 0) {
            const color = cell.style("fill");
            const hsvcol = HEXtoHSV(RGBtoHEX(color));
            window.colorpicker.color = hsvcol;
            window.colorpicker.updateColorOutput();
        }
    } else if(window.mouseButton == 2) {
        window.canvas.setCell(x, y, null);
    }
}

window.addEventListener("scroll", ()=>{window.scrollTo(0, 0)});
