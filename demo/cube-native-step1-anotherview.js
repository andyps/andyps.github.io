function CubeMesh(vertices, indices) {
    this.vertices = new Float32Array(vertices);
    this.indices = new Uint8Array(indices);
    this.elementsCnt = indices.length;
    this.vbo = this.ibo = null;
}
var Cube = function(canvasId) {
    this.canvas = document.getElementById(canvasId);
    var params = {antialias: true};
    this.gl = this.canvas.getContext('webgl', params) || this.canvas.getContext('experimental-webgl', params);
    if (!this.gl) {
        document.body.innerHTML = 'Unfortunately your browser is not supported';
        return;
    }
    if (!this.initProgram()) {
        return;
    }
    this.createCube();
    this.initBuffers();
    
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clearDepth(1.0);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.renderLoop();
};
Cube.prototype = {
    vxShader: [
        'attribute vec3 aPosition;',
        'void main(void) {',
            'gl_Position = vec4(aPosition, 1.0);',
       '}'
    ],
    fgShader: [
        'void main(void) {',
            'gl_FragColor = vec4(0.3, 0.3, 0.7, 1.0);',
        '}'
    ],
    initProgram: function() {
        var shaderSrc = this.vxShader.join('\n');
        var vxShader = this.createShader(shaderSrc, this.gl.VERTEX_SHADER);
        shaderSrc = this.fgShader.join('\n');
        var fgShader = this.createShader(shaderSrc, this.gl.FRAGMENT_SHADER);
        if (!vxShader || !fgShader) {
            return false;
        }
        var prg = this.gl.createProgram();
        this.gl.attachShader(prg, vxShader);
        this.gl.attachShader(prg, fgShader);
        this.gl.linkProgram(prg);
        
        var linked = this.gl.getProgramParameter(prg, this.gl.LINK_STATUS);
        if (!linked) {
            console.log(this.gl.getProgramInfoLog(prg));
            this.gl.deleteProgram(prg);
            this.gl.deleteShader(fgShader);
            this.gl.deleteShader(vxShader);
            return false;
        }
        this.prg = prg;
        this.gl.useProgram(this.prg);
        this.prg.aPosition = this.gl.getAttribLocation(this.prg, 'aPosition');
        return true;
    },
    createShader: function(src, type) {
        var shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, src);
        this.gl.compileShader(shader);
        var compiled = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
        if (!compiled) {
            console.log(this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    },
    initBuffers: function() {
        this.cubeMesh.vbo = this.gl.createBuffer();
        this.cubeMesh.ibo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeMesh.vbo);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.cubeMesh.vertices, this.gl.STATIC_DRAW);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.cubeMesh.ibo);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.cubeMesh.indices, this.gl.STATIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
    },
    createCube: function() {
        var vertices = [
            0, 0.7865660786628723, 0.36237241422448463, // 0
            -0.7071067690849304, 0.4330126941204071, -0.25, // 1
            -0.7071067690849304, -0.4330126941204071, 0.25, // 2
            0, -0.0794593095779419, 0.8623724142244846, // 3
            0.7071067690849304, 0.4330126941204071, -0.25, // 4
            0, 0.0794593095779419, -0.8623724142244846, // 5
            0, -0.7865660786628723, -0.36237241422448463, // 6
            0.7071067690849304, -0.4330126941204071, 0.25 // 7
        ];
        var indices = [
            0, 1, 2, 0, 2, 3, // front
            4, 7, 6, 4, 6, 5, // back
            0, 4, 5, 0, 5, 1, // up
            3, 2, 6, 3, 6, 7, // down
            3, 7, 4, 3, 4, 0, // right
            1, 5, 6, 1, 6, 2, // left
        ];
        this.cubeMesh = new CubeMesh(vertices, indices);
    },
    renderLoop: function() {
        var $this = this;
        this.render();
        window.requestAnimationFrame(function() {
            $this.renderLoop();
        });
    },
    render: function() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.enableVertexAttribArray(this.prg.aPosition);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeMesh.vbo);
        this.gl.vertexAttribPointer(this.prg.aPosition, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.cubeMesh.ibo);
        this.gl.drawElements(this.gl.TRIANGLES, this.cubeMesh.elementsCnt, this.gl.UNSIGNED_BYTE, 0);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
    }
};
window.addEventListener('DOMContentLoaded', function() {
    window.cube = new Cube('appCanvas');
});