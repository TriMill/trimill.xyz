var shaderBase;
var dpi = 1;

const BASE_CTX = {
    "*$2": "cmul",
    "/$2": "cdiv",
    "^$2": "cpow",
    "root$2": "croot",
    "root$2_o": "croot_o",
    "recip$1": "crecip",
    "re$1": "cre",
    "im$1": "cim",
    "abs$1": "cabs",
    "arg$1": "carg",
    "arg$1_i": "carg_o",
    "norm$1": "cnorm",
    "conj$1": "cconj",
    "sqrt$1": "csqrt",
    "sqrt$1_o": "csqrt_o",
    "√$1": "csqrt",
    "√$1_o": "csqrt_o",
    "sinh$1": "csinh",
    "cosh$1": "ccosh",
    "tanh$1": "ctanh",
    "asinh$1": "casinh",
    "asinh$1_o": "casinh_o",
    "acosh$1_o": "cacosh_o",
    "sin$1": "csin",
    "cos$1": "ccos",
    "tan$1": "ctan",
    "asin$1": "casin",
    "acos$1": "cacos",
    "atan$1": "catan",
    "asin$1_o": "casin_o",
    "acos$1_o": "cacos_o",
    "exp$1": "cexp",
    "log$1": "clog",
    "log$2": "clogbase",
    "log$1_o": "clog_o",
    "log$2_o": "clogbase_o",
    "ln$1": "clog",
    "ln$1_o": "clog_o",
    "gamma$1": "cgamma",
    "Γ$1": "cgamma",
    "unitcircle$1": "cunitcircle",
    "signre$1": "csignre",
    "signim$1": "csignim",
    "lambertw$1": "clambertw",
    // CONSTANTS
    "e": "CONST_E",
    "pi": "CONST_PI",
    "π": "CONST_PI",
    "tau": "CONST_TAU",
    "τ": "CONST_TAU",
    "emg": "CONST_EMGAMMA",
    "γ": "CONST_EMGAMMA",
    // NOT OFFICIALLY SUPPORTED YET
    "digamma$1": "cdigamma",
    "loggamma$1": "cloggamma",
    "erf$1": "cerf",
    "eulerfn$1": "ceulerfn",
    "ti$1": "cti",
    "weierp$3": "cweierp",
};

const FZ_CTX = {
    ...BASE_CTX,
    "z": "z",
    "c": "c",
    "n": "n",
}

const INIT_CTX = {
    ...BASE_CTX,
    "z": "z",
}

function expr2source(expr, ctx) {
    let ast = peg$parse(expr);
    console.log(ast);
    const reduced = ast.reduce();
    if(reduced !== null) {
        ast = reduced;
    }
    return ast.gen(ctx);
}

function graph() {
    const shadingRaw = document.getElementById("shading").value
    try {
        const options = {
            rmin: parseFloat(document.getElementById("rmin").value),
            rmax: parseFloat(document.getElementById("rmax").value),
            imin: parseFloat(document.getElementById("imin").value),
            imax: parseFloat(document.getElementById("imax").value),
            drawcontours: document.getElementById("drawcontours").checked,
            smoothcolor: document.getElementById("smoothcolor").checked,
            shading: 15/(4-4*shadingRaw**4) - 15/4,
            swapbw: document.getElementById("swapbw").checked,
            iterations: parseInt(document.getElementById("iterations").value),
        }

        console.log(options);

        console.log("=== PRINTING GENERATED GLSL ===");
        const fz = document.getElementById("fz").value;
        const fzSource = expr2source(fz, FZ_CTX);
        console.log("fz: " + fzSource);
        const initZ = document.getElementById("init_z").value;
        const initZSource = expr2source(initZ, INIT_CTX);
        console.log("z_init: " + initZSource);
        const initC = document.getElementById("init_c").value;
        const initCSource = expr2source(initC, INIT_CTX);
        console.log("c_init: " + initCSource);

        const fsSource = shaderBase 
                       + "vec2 f(vec2 z, vec2 c, vec2 n) { return "
                       + fzSource
                       + ";}"
                       + "vec2 z_init(vec2 z) { return "
                       + initZSource
                       + ";}"
                       + "vec2 c_init(vec2 z) { return "
                       + initCSource
                       + ";}";
        runShader(fsSource, options);
    } catch(e) {
        document.getElementById("errors").textContent = e.toString();
        console.log(e);
        return;
    }
    document.getElementById("errors").textContent = "";
}

function decodeURLParams() {
    const canvas = document.getElementById("canvas");
    var params = new URLSearchParams(window.location.search);
    if(!params.has("dpi") || params.get("dpi") == "1") {
        dpi = 1;
        canvas.width  = 640;
        canvas.height = 640;
    } else if(params.get("dpi") == "2") {
        dpi = 2;
        canvas.width  = 640*2;
        canvas.height = 640*2;
    } else if(params.get("dpi") == "4") {
        dpi = 4;
        canvas.width  = 640*4;
        canvas.height = 640*4;
    }
    if(params.has("src")) {
        const src = JSON.parse(atob(params.get("src")));
        document.getElementById("fz").value = src.expr;
        document.getElementById("rmin").value = src.axes[0];
        document.getElementById("rmax").value = src.axes[1];
        document.getElementById("imin").value = src.axes[2];
        document.getElementById("imax").value = src.axes[3];
        document.getElementById("shading").value = src.shading;
        document.getElementById("swapbw").checked = src.swapbw;
        document.getElementById("drawcontours").checked = src.contours;
        if(src.itermode !== false) {
            document.getElementById("enable_iters").checked = true;
            document.getElementById("iterations").value = src.itermode.iters;
            document.getElementById("init_z").value = src.itermode.zinit;
            document.getElementById("init_c").value = src.itermode.cinit;
        } else {
            document.getElementById("enable_iters").checked = false;
        }
    }
}

function encodeURLParams() {
    const itermode = document.getElementById("enable_iters").checked;
    let params = {
        expr: document.getElementById("fz").value,
        axes: [
            document.getElementById("rmin").value,
            document.getElementById("rmax").value,
            document.getElementById("imin").value,
            document.getElementById("imax").value,
        ],
        shading: document.getElementById("shading").value,
        swapbw: document.getElementById("swapbw").checked,
        contours: document.getElementById("drawcontours").checked,
    };
    if(itermode) {
        params.itermode = {
            iters: document.getElementById("iterations").value,
            zinit: document.getElementById("init_z").value,
            cinit: document.getElementById("init_c").value,
        }
    } else {
        params.itermode = false;
    }
    
    const src = btoa(JSON.stringify(params));
    const url = window.location.origin + window.location.pathname + "?src=" + src + "&dpi=" + dpi;
    document.location.href = url;
}

function changeIterationMode() {
    const checked = document.getElementById('enable_iters').checked;
    document.getElementById('iteration_mode').hidden = !checked;
    if(!checked) {
        document.getElementById('iterations').value = 1;
        document.getElementById('init_z').value = "z";
        document.getElementById('init_c').value = "0";
    }
}

//const constantHtml = `<span class="constant">
//<input type="button" class="const-del" value="[-]" style="color: #ff4444" onclick="this.parentElement.remove()"/>
//<input type="text" class="const-label" style="width: 30px" /> = 
//<input type="text" class="const-re" style="width: 80px" /> + 
//<input type="text" class="const-im" style="width: 80px" /> i
//</span>`
//
//function addConstant() {
//    const parse = Range.prototype.createContextualFragment.bind(document.createRange());
//    const constWrapper = document.getElementById("constants-wrapper");
//    constWrapper.appendChild(parse(constantHtml));
//}

window.onload = () => {
    decodeURLParams();
    fetch('shaderbase.glsl')
        .then(response => response.text())
        .then((data) => {
            shaderBase = data;
            graph();
        });
    changeIterationMode();
};

