var PI_180 = Math.PI / 180;
function CubeMesh(vertices, indices, normals) {
    this.vertices = new Float32Array(vertices);
    this.indices = new Uint8Array(indices);
    this.elementsCnt = indices.length;
    this.vbo = this.ibo = this.nbo = null;
    this.normals = new Float32Array(normals);
}
function Matrix() {
    this.elements = new Float32Array(16);
}
Matrix.prototype = {
    setFrustum: function(left, right, bottom, top, near, far) {
        var els = this.elements;
        var rw = 1 / (right - left);
        var rh = 1 / (top - bottom);
        var rd = 1 / (far - near);

        els[0] = 2 * near * rw;
        els[1] = 0;
        els[2] = 0;
        els[3] = 0;
        
        els[4] = 0;
        els[5] = 2 * near * rh;
        els[6] = 0;
        els[7] = 0;

        els[8] = (right + left) * rw;
        els[9] = (top + bottom) * rh;
        els[10] = -(far + near) * rd;
        els[11] = -1;
        
        els[12] = 0;
        els[13] = 0;
        els[14] = -2 * near * far * rd;
        els[15] = 0;
        return this;
    },
    setPerspective: function(fovy, aspect, near, far) {
        // fovy is in radians
        var top = near * Math.tan(0.5 * fovy);
        var bottom = -top;
        var right = top * aspect;
        var left = -right;
        
        return this.setFrustum(left, right, bottom, top, near, far);
    },
    setLookAt: function(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ) {
        var els = this.elements;
        var fx = centerX - eyeX;
        var fy = centerY - eyeY;
        var fz = centerZ - eyeZ;
        
        // normalize f
        var rlf = 1 / Math.sqrt(fx * fx + fy * fy + fz * fz);
        fx *= rlf;
        fy *= rlf;
        fz *= rlf;
        
        // cross product of f and up
        var sx = fy * upZ - fz * upY;
        var sy = fz * upX - fx * upZ;
        var sz = fx * upY - fy * upX;
        
        // normalize s
        var rls = 1 / Math.sqrt(sx * sx + sy * sy + sz * sz);
        sx *= rls;
        sy *= rls;
        sz *= rls;
        
        // cross product of s and f
        var ux = sy * fz - sz * fy;
        var uy = sz * fx - sx * fz;
        var uz = sx * fy - sy * fx;
        
        els[0] = sx;
        els[1] = ux;
        els[2] = -fx;
        els[3] = 0;

        els[4] = sy;
        els[5] = uy;
        els[6] = -fy;
        els[7] = 0;

        els[8] = sz;
        els[9] = uz;
        els[10] = -fz;
        els[11] = 0;

        els[12] = 0;
        els[13] = 0;
        els[14] = 0;
        els[15] = 1;
        return this.translate(-eyeX, -eyeY, -eyeZ);
    },
    translate: function(x, y, z) {
        var els = this.elements;
        els[12] += els[0] * x + els[4] * y + els[8] * z;
        els[13] += els[1] * x + els[5] * y + els[9] * z;
        els[14] += els[2] * x + els[6] * y + els[10] * z;
        els[15] += els[3] * x + els[7] * y + els[11] * z;
        return this;
    },
    setIdentity: function() {
        var els = this.elements;
        els[0] = 1; els[4] = 0; els[8] = 0; els[12] = 0;
        els[1] = 0; els[5] = 1; els[9] = 0; els[13] = 0;
        els[2] = 0; els[6] = 0; els[10] = 1; els[14] = 0;
        els[3] = 0; els[7] = 0; els[11] = 0; els[15] = 1;
        return this;
    }
};
Matrix.Identity = function() {
    var identityMatrix = new Matrix();
    return identityMatrix.setIdentity();
};
function Vector(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
}
Vector.prototype = {
    lengthSq: function() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    },
    length: function () {
        return Math.sqrt(this.lengthSq());
    },
    toArray: function() {
        return [this.x, this.y, this.z];
    }
};
function Camera(canvas, fovY, near, far, position) {
    this.canvas = canvas;
    this.fovY = fovY;
    this.near = near;
    this.far = far;
    this.rotationX = 0; // like latitude but from 0 to 180
    this.rotationY = 0; // like longitude but from 0 to 360
    this.position = new Vector(position.x, position.y, position.z);
    this.applyPosition();
    this.vMatrix = Matrix.Identity();
    this.pMatrix = Matrix.Identity();
    this.updateProjectMatrix();
    this.updateViewMatrix();
    this.rotationXDir = 1;
    this.rotationYDir = 1;
}
Camera.prototype = {
    update: function() {
        this.rotationX += this.rotationXDir * 0.5;
        this.rotationY += this.rotationYDir * 0.5;
        this.checkRotateLimits();
        this.applyRotation();
        this.updateViewMatrix();
    },
    checkRotateLimits: function() {
        if (this.rotationY >= 360 || this.rotationY <= -360) {
            this.rotationY = this.rotationY % 360;
        }
        if (this.rotationY < 0) {
            this.rotationY += 360;
        }
        if (this.rotationX >= 170) {
            this.rotationX = 170;
            this.rotationXDir *= -1;
        } else if (this.rotationX <= 10) {
            this.rotationX = 10;
            this.rotationXDir *= -1;
        }
    },
    applyPosition: function() {
        this.distance = this.position.length();
        this.rotationX = Math.acos(this.position.y / this.distance) / PI_180;
        this.rotationY = -Math.atan2(this.position.z, this.position.x) / PI_180;
        if (this.rotationY < 0) {
            this.rotationY += 360;
        }
    },
    applyRotation: function() {
        var rotYRad = this.rotationY * PI_180;
        var rotXRad = this.rotationX * PI_180;
        this.position.x = Math.sin(rotXRad) * Math.cos(rotYRad) * this.distance;
        this.position.y = Math.cos(rotXRad) * this.distance;
        this.position.z = -Math.sin(rotXRad) * Math.sin(rotYRad) * this.distance;
    },
    updateProjectMatrix: function() {
        this.aspect = this.canvas.width / this.canvas.height;
        this.pMatrix.setPerspective(this.fovY, this.aspect, this.near, this.far);
    },
    updateViewMatrix: function() {
        this.vMatrix.setLookAt(
            this.position.x, 
            this.position.y, 
            this.position.z,
            0, 0, 0,
            0, 1, 0
        );
    }
};
function Light(position) {
    this.position = new Vector(position.x, position.y, position.z);
}
var Cube = function(canvasId) {
    this.canvas = document.getElementById(canvasId);
    var params = {antialias: true};
    this.gl = this.canvas.getContext('webgl', params) || this.canvas.getContext('experimental-webgl', params);
    if (!this.gl) {
        document.body.innerHTML = 'Unfortunately your browser is not supported';
        return;
    }
    this.handleSize();
    if (!this.initProgram()) {
        return;
    }
    this.camera = new Camera(this.canvas, 0.8 /* ~45.84deg */, 1, 260, new Vector(-95, 95, 95));
    this.nMatrix = Matrix.Identity();
    this.light = new Light(new Vector(0, 0, 0));
    this.light.position = this.camera.position;
    this.createCube();
    this.initBuffers();
    var $this = this;
    window.addEventListener('resize', function() {
        $this.handleSize();
    });
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clearDepth(1.0);
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.CULL_FACE);
    this.renderLoop();
};
Cube.prototype = {
    vxShader: [
        'attribute vec3 aPosition;',
        'uniform mat4 uPMatrix;',
        'uniform mat4 uVMatrix;',
        'uniform vec3 uLightPosition;',
        'varying vec4 vColor;',
        'attribute vec3 aNormal;',
        'uniform mat4 uNMatrix;',
        'void main(void) {',
            'vec4 vertex = vec4(aPosition, 1.0);',
            
            'vec4 color = vec4(0.3, 0.3, 0.7, 1.0);',
            'vec3 normal = vec3(uNMatrix * vec4(aNormal, 1.0));',
            'vec4 lightPos = vec4(uLightPosition, 1.0);',
            'vec3 lightRay = vertex.xyz - lightPos.xyz;',
            'float lambertTerm = max(dot(normalize(normal), -normalize(lightRay)), 0.0);',
            'vec3 diffuse = vec3(1.0, 1.0, 1.0) * color.rgb * lambertTerm;',
            'vec3 ambient = vec3(0.5, 0.5, 0.5) * color.rgb;',
            'vColor = vec4(ambient + diffuse, color.a);',
            
            'gl_Position = uPMatrix * uVMatrix * vertex;',
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
        this.prg.uPMatrix = this.gl.getUniformLocation(this.prg, 'uPMatrix');
        this.prg.uVMatrix = this.gl.getUniformLocation(this.prg, 'uVMatrix');
        
        this.prg.aNormal = this.gl.getAttribLocation(this.prg, 'aNormal');
        this.prg.uNMatrix = this.gl.getUniformLocation(this.prg, 'uNMatrix');
        this.prg.uLightPosition = this.gl.getUniformLocation(this.prg, 'uLightPosition');
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
        var halfSize = 20;
        var vertices = [
            halfSize, halfSize, halfSize, -halfSize, halfSize, halfSize, -halfSize, -halfSize, halfSize, halfSize, -halfSize, halfSize, // 0-1-2-3 front 0 1 2 3
            halfSize, -halfSize, halfSize, halfSize, -halfSize, -halfSize, halfSize, halfSize, -halfSize, halfSize, halfSize, halfSize, // 3-7-4-0 right 4 5 6 7
            halfSize, halfSize, halfSize, halfSize, halfSize, -halfSize, -halfSize, halfSize, -halfSize, -halfSize, halfSize, halfSize, // 0-4-5-1 up 8 9 10 11
            -halfSize, halfSize, halfSize, -halfSize, halfSize, -halfSize, -halfSize, -halfSize, -halfSize, -halfSize, -halfSize, halfSize, // 1-5-6-2 left 12 13 14 15
            halfSize, -halfSize, halfSize, -halfSize, -halfSize, halfSize, -halfSize, -halfSize, -halfSize, halfSize, -halfSize, -halfSize, // 3-2-6-7 down 16 17 18 19
            halfSize, halfSize, -halfSize, halfSize, -halfSize, -halfSize, -halfSize, -halfSize, -halfSize, -halfSize, halfSize, -halfSize // 4-7-6-5 back 20 21 22 23
        ];
        var indices = [
            0, 1, 2, 0, 2, 3, // front
            4, 5, 6, 4, 6, 7, // right
            8, 9, 10, 8, 10, 11, // up
            12, 13, 14, 12, 14, 15, // left
            16, 17, 18, 16, 18, 19, // down
            20, 21, 22, 20, 22, 23 // back
        ];
        var normals = [
            0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, // front
            1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, // right
            0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // up
            -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // left
            0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, // down
            0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0 // back
        ];
        this.cubeMesh = new CubeMesh(vertices, indices, normals);
    },
    renderLoop: function() {
        var $this = this;
        this.camera.update();
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
        
        this.gl.enableVertexAttribArray(this.prg.aNormal);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeMesh.nbo);
        this.gl.vertexAttribPointer(this.prg.aNormal, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.uniformMatrix4fv(this.prg.uPMatrix, false, this.camera.pMatrix.elements);
        this.gl.uniformMatrix4fv(this.prg.uVMatrix, false, this.camera.vMatrix.elements);
        this.gl.uniform3fv(this.prg.uLightPosition, this.light.position.toArray());
        this.gl.uniformMatrix4fv(this.prg.uNMatrix, false, this.nMatrix.elements);
        
        this.gl.drawElements(this.gl.TRIANGLES, this.cubeMesh.elementsCnt, this.gl.UNSIGNED_BYTE, 0);
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
    },
    handleSize: function() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.width = this.canvas.width + 'px';
        this.canvas.style.height = this.canvas.height + 'px';
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        if (this.camera) {
            this.camera.updateProjectMatrix();
        }
    }
};
window.addEventListener('DOMContentLoaded', function() {
    window.cube = new Cube('appCanvas');
});