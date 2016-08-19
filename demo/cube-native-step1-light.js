function CubeMesh(vertices, indices, normals) {
    this.vertices = new Float32Array(vertices);
    this.indices = new Uint8Array(indices);
    this.elementsCnt = indices.length;
    this.vbo = this.ibo = null;
    this.normals = new Float32Array(normals);
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
        'varying vec4 vColor;',
        'attribute vec3 aNormal;',
        'void main(void) {',
            'gl_Position = vec4(aPosition, 1.0);',
            'vec4 color = vec4(0.3, 0.3, 0.7, 1.0);',
            'vec3 lightPos = vec3(0.5, 0.1, -1.4);',
            'vec3 lightRay = gl_Position.xyz - lightPos.xyz;',
            'float lambertTerm = max(dot(normalize(aNormal), -normalize(lightRay)), 0.0);',
            'vec3 diffuse = vec3(1.0, 1.0, 1.0) * color.rgb * lambertTerm;',
            'vec3 ambient = vec3(0.5, 0.5, 0.5) * color.rgb;',
            'vColor = vec4(ambient + diffuse, color.a);',
       '}'
    ],
    fgShader: [
        'precision mediump float;',
        'varying vec4 vColor;',
        'void main(void) {',
            'gl_FragColor = vColor;',
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
        this.prg.aNormal = this.gl.getAttribLocation(this.prg, 'aNormal');
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
        this.cubeMesh.nbo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeMesh.nbo);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.cubeMesh.normals, this.gl.STATIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
    },
    createCube: function() {
        var vertices = [
            0, 0.7865660786628723, 0.36237241422448463, -0.7071067690849304, 0.4330126941204071, -0.25, 
            -0.7071067690849304, -0.4330126941204071, 0.25, 0, -0.0794593095779419, 0.8623724142244846, // 0-1-2-3 front 0 1 2 3
            0, -0.0794593095779419, 0.8623724142244846, 0.7071067690849304, -0.4330126941204071, 0.25, 
            0.7071067690849304, 0.4330126941204071, -0.25, 0, 0.7865660786628723, 0.36237241422448463, // 3-7-4-0 right 4 5 6 7
            0, 0.7865660786628723, 0.36237241422448463, 0.7071067690849304, 0.4330126941204071, -0.25, 
            0, 0.0794593095779419, -0.8623724142244846, -0.7071067690849304, 0.4330126941204071, -0.25, // 0-4-5-1 up 8 9 10 11
            -0.7071067690849304, 0.4330126941204071, -0.25, 0, 0.0794593095779419, -0.8623724142244846, 
            0, -0.7865660786628723, -0.36237241422448463, -0.7071067690849304, -0.4330126941204071, 0.25, // 1-5-6-2 left 12 13 14 15
            0, -0.0794593095779419, 0.8623724142244846, -0.7071067690849304, -0.4330126941204071, 0.25,
            0, -0.7865660786628723, -0.36237241422448463, 0.7071067690849304, -0.4330126941204071, 0.25, // 3-2-6-7 down 16 17 18 19
            0.7071067690849304, 0.4330126941204071, -0.25, 0.7071067690849304, -0.4330126941204071, 0.25,
            0, -0.7865660786628723, -0.36237241422448463, 0, 0.0794593095779419, -0.8623724142244846 // 4-7-6-5 back 20 21 22 23
        ];
        var indices = [
            0, 1, 2, 0, 2, 3, // front
            4, 5, 6, 4, 6, 7, // right
            8, 9, 10, 8, 10, 11, // up
            12, 13, 14, 12, 14, 15, // left
            16, 17, 18, 16, 18, 19, // down
            20, 21, 22, 20, 22, 23 // back
        ];
        var f = [-0.7071067690849304, 0.3535533845424652, 0.6123724142244846];
        var r = [0.7071067690849304, 0.3535533845424652, 0.6123724142244846];
        var u = [0, 0.8660253882408142, -0.5];
        var l = [-0.7071067690849304, -0.3535533845424652, -0.6123724142244846];
        var d = [0, -0.8660253882408142, 0.5];
        var b = [0.7071067690849304, -0.3535533845424652, -0.6123724142244846];
        var normals = [].concat(f, f, f, f, r, r, r, r, u, u, u, u, l, l, l, l, d, d, d, d, b, b, b, b);
        this.cubeMesh = new CubeMesh(vertices, indices, normals);
    },
    renderLoop: function() {
        var $this = this;
        this.render();
        window.requestAnimationFrame(function() {
            $this.renderLoop();
        });
    },
    render: function() {
        this.gl.viewport(0, 0, 400, 400);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.enableVertexAttribArray(this.prg.aPosition);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeMesh.vbo);
        this.gl.vertexAttribPointer(this.prg.aPosition, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.cubeMesh.ibo);
        this.gl.enableVertexAttribArray(this.prg.aNormal);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeMesh.nbo);
        this.gl.vertexAttribPointer(this.prg.aNormal, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.drawElements(this.gl.TRIANGLES, this.cubeMesh.elementsCnt, this.gl.UNSIGNED_BYTE, 0);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
    }
};
window.addEventListener('DOMContentLoaded', function() {
    window.cube = new Cube('appCanvas');
});
