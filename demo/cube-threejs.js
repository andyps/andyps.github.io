var PI_180 = Math.PI / 180;
var Cube = function(canvasId) {
    this.canvas = document.getElementById(canvasId);

    try {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            canvas: this.canvas
        });
    } catch(e) {
        document.body.innerHTML = 'Unfortunately your browser is not supported';
        return;
    }
    this.renderer.setSize(window.innerWidth, window.innerHeight, true);
    this.renderer.setClearColor(0x000000);
    this.scene = new THREE.Scene();
    
    var fov = Math.round(100 * 0.8 / PI_180) / 100; // ~45.84deg
    this.camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 1, 260);
    this.camera.position.set(-95, 95, 95);
    this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    
    var light = new THREE.PointLight(0xffffff, 2, 0);
    this.camera.add(light);
    this.scene.add(this.camera);

    this.createCube();
    
    var $this = this;
    window.addEventListener('resize', function() {
        $this.renderer.setSize(window.innerWidth, window.innerHeight, true);
        $this.camera.aspect = window.innerWidth / window.innerHeight;
        $this.camera.updateProjectionMatrix();
    });
    this.rotationX = 0;
    this.rotationY = 0;
    this.rotationXDir = 1;
    this.rotationYDir = 1;
    this.run();
};
Cube.prototype = {
    createCube: function() {
        var geometry = new THREE.BoxGeometry(40, 40, 40);
        var material = new THREE.MeshLambertMaterial({color: 0x4d4db2, reflectivity: 0});
        this.cubeMesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.cubeMesh);
    },
    run: function() {
        var render;
        var $this = this;
        render = function() {
            $this.update();
            $this.renderer.render($this.scene, $this.camera);
            window.requestAnimationFrame(render);
        };
        render();
    },
    update: function() {
        this.rotationX += this.rotationXDir * 0.5;
        this.rotationY += this.rotationYDir * 0.5;
        this.checkRotateLimits();
        
        this.cubeMesh.rotation.x = this.rotationX * PI_180;
        this.cubeMesh.rotation.y = this.rotationY * PI_180;
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
    }
};
window.addEventListener('DOMContentLoaded', function() {
    window.cube = new Cube('appCanvas');
});