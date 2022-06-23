const vsSource = `#version 300 es
    in vec4 aVertexPosition;
    void main() {
      gl_Position = aVertexPosition;
    }
`;

function runShader(fsSource, options) {
    const canvas = document.querySelector('#canvas');
    const gl = canvas.getContext('webgl2', {preserveDrawingBuffer:true});
    if (!gl) {
        alert('could not initialize webgl.');
        return;
    }
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    gl.useProgram(shaderProgram);

    const vertexPosition = gl.getAttribLocation(shaderProgram, 'aVertexPosition');

    uResolution = gl.getUniformLocation(shaderProgram, "uResolution");
    uRangeAxes = gl.getUniformLocation(shaderProgram, "uRangeAxes");
    uDrawContours = gl.getUniformLocation(shaderProgram, "uDrawContours");
    uShadingIntensity = gl.getUniformLocation(shaderProgram, "uShadingIntensity");
    uSwapBlackWhite = gl.getUniformLocation(shaderProgram, "uSwapBlackWhite");
    uIterations = gl.getUniformLocation(shaderProgram, "uIterations");
    uSmoothColor = gl.getUniformLocation(shaderProgram, "uSmoothColor");
    
    gl.uniform2f(uResolution, gl.canvas.width, gl.canvas.height);
    gl.uniform4f(uRangeAxes, options.rmin, options.rmax, options.imin, options.imax);
    gl.uniform1i(uDrawContours, options.drawcontours ? 1 : 0);
    gl.uniform1f(uShadingIntensity, options.shading);
    gl.uniform1i(uSwapBlackWhite, options.swapbw) ? 1 : 0;
    gl.uniform1i(uIterations, options.iterations);
    gl.uniform1i(uSmoothColor, options.smoothcolor);

    const buffers = initBuffers(gl);
    drawScene(gl, vertexPosition, buffers);
}

function initBuffers(gl) {
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
        1.0, 1.0,
        -1.0, 1.0,
        1.0, -1.0,
        -1.0, -1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array(positions),
        gl.STATIC_DRAW);
    return {
        position: positionBuffer,
    };
}

function drawScene(gl, vertexPosition, buffers) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const projectionMatrix = mat4.create();
    const modelViewMatrix = mat4.create(); 

    const numComponents = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(vertexPosition);

    const vertexOffset = 0;
    const vertexCount = 4;
    gl.drawArrays(gl.TRIANGLE_STRIP, vertexOffset, vertexCount);
}

function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        throw Error('could not initialize shader program: ' + gl.getProgramInfoLog(shaderProgram));
    }
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return shaderProgram;
}

function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const text = 'could not compile shaders: ' + gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw Error(text);
    }
    return shader;
}
