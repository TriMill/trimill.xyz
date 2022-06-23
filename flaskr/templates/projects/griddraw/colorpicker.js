function HSVtoRGB(c){var r,g,b,i,f,p,q,t,h=c.h,s=c.s,v=c.v;i=Math.floor(h*6);f=h*6-i;p=v*(1-s);q=v*(1-f*s);t=v*(1-(1-f)*s);switch(i%6){case 0:r=v,g=t,b=p;break;case 1:r=q,g=v,b=p;break;case 2:r=p,g=v,b=t;break;case 3:r=p,g=q,b=v;break;case 4:r=t,g=p,b=v;break;case 5:r=v,g=p,b=q;break}return "rgb("+Math.round(r*255)+", "+Math.round(g*255)+", "+Math.round(b*255)+")"}

function RGBtoHEX(c){return "#"+c.split("(")[1].split(")")[0].split(",").map((x)=>{x=parseInt(x).toString(16);return(x.length==1)?"0"+x:x}).join("")}

function HEXtoHSV(c){var r=parseInt(c[1]+c[2],16)/255,g=parseInt(c[3]+c[4],16)/255,b=parseInt(c[5]+c[6],16)/255,cmax,cmin,diff,h,s;cmax=Math.max(r,g,b);cmin=Math.min(r,g,b);diff=cmax-cmin;if(cmax==cmin){h=0}else if(cmax==r){h=(((g-b)/diff)/6+1)%1}else if(cmax==g){h=(((b-r)/diff)/6+1/3)%1}else if(cmax==b){h=(((r-g)/diff)/6+2/3)%1}if(cmax==0){s=0}else{s=diff/cmax}return{h:h,s:s,v:cmax}}

function createColorpicker(selPickingArea, selPicker, selHuePickingArea, selHuePicker, selHexcode, selDisplay) {
    const result = {
        color: {h:0.6111,s:0.89,v:0.72}
    };

    const pickingArea = d3.select(selPickingArea);
    const picker = d3.select(selPicker);
    const huePickingArea = d3.select(selHuePickingArea);
    const huePicker = d3.select(selHuePicker);
    const hexcode = d3.select(selHexcode);
    const display = d3.select(selDisplay);

    pickingArea.on("contextmenu", (event, d)=>{event.preventDefault();});
    pickingArea.on("mousedown", (event, d)=>{
        event.preventDefault();
        window.mouseButton = event.button;
        colorChange(d3.pointer(event));
    });
    pickingArea.on("mousemove", (event, d)=>{
        event.preventDefault();
        if(window.mouseButton !== null) {
            colorChange(d3.pointer(event));
        }
    });
    pickingArea.on("mouseup", (event, d)=>{window.mouseButton = null;});


    huePickingArea.on("contextmenu", (event, d)=>{event.preventDefault();});
    huePickingArea.on("mousedown", (event, d)=>{
        event.preventDefault();
        window.mouseButton = event.button;
        hueChange(d3.pointer(event));
    });
    huePickingArea.on("mousemove", (event, d)=>{
        event.preventDefault();
        if(window.mouseButton !== null) {
            hueChange(d3.pointer(event));
        }
    });
    huePickingArea.on("mouseup", (event, d)=>{window.mouseButton = null;});


    hexcode.on("input", hexChange);
    hexcode.on("change", hexChange);
    hexcode.on("keypress", hexChange);
    hexcode.on("paste", hexChange);

    function hexChange(event, d) {
        const val = event.target.value;
        if(val.match(/#[0-9a-fA-F]{6}/)) {
            result.color = HEXtoHSV(event.target.value);
            result.updateColorOutput();
        }
    }

    function colorChange(mouse) {
        const xp = Math.min(Math.max(mouse[0],0),200);
        const yp = Math.min(Math.max(mouse[1],0),200);
        result.color.s = xp/200;
        result.color.v = 1-yp/200;
        result.updateColorOutput();
    }

    function hueChange(mouse) {
        result.color.h = mouse[1]/200;
        result.updateColorOutput();
    }

    result.updateColorOutput = function() {
        const hsv = result.color;
        const rgb = HSVtoRGB(hsv);
        display.style("background", rgb);
        hexcode.node().value = RGBtoHEX(rgb);
        huePicker.style("top", hsv.h*200+"px");
        picker.style("top", ((1-hsv.v)*200-4)+"px").style("left", (hsv.s*200-4)+"px");
        pickingArea.style("background", 
            "-webkit-linear-gradient(top, #00000000,  #000 100%),"+
            "-webkit-linear-gradient(left, #fff, #ffffff00 100%),"+
            HSVtoRGB({h:hsv.h,s:1,v:1})
        );
    }

    return result;

}
