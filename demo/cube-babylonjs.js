var PI_180 = Math.PI / 180;
var Cube = function(canvasId) {
    this.canvas = document.getElementById(canvasId);
    
    if (!BABYLON.Engine.isSupported()) {
        document.body.innerHTML = 'Unfortunately your browser is not supported';
        return;
    }
    this.engine = new BABYLON.Engine(this.canvas, true);
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.clearColor = new BABYLON.Color3(0, 0, 0);
    this.scene.ambientColor = new BABYLON.Color3(1, 1, 1);
    
    var camera = new BABYLON.ArcRotateCamera('camera', -1, 1, -130, new BABYLON.Vector3(0, 0, 0), this.scene);
    camera.setPosition(new BABYLON.Vector3(-95, 95, 95));
    this.scene.activeCamera = camera;
    
    var light = new BABYLON.PointLight('light', new BABYLON.Vector3(0, 0, 0), this.scene);
    light.specular = new BABYLON.Color3(0, 0, 0);
    light.intensity = 0.2;
    light.parent = camera;
    
    this.createCube();
    
    var $this = this;
    window.addEventListener('resize', function(){
        $this.engine.resize();
    });
    this.rotationX = 0;
    this.rotationY = 0;
    this.rotationXDir = 1;
    this.rotationYDir = 1;
    this.run();
};
Cube.prototype = {
    createCube: function() {
        this.cubeMesh = BABYLON.Mesh.CreateBox('box', 40, this.scene);
        var material = new BABYLON.StandardMaterial('material', this.scene);
        material.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.7);
        material.ambientColor = new BABYLON.Color3(0.3, 0.3, 0.7);
        this.cubeMesh.material = material;
    },
    run: function() {
        var $this = this;
        this.scene.registerBeforeRender(function() {
            $this.update();
        });
        this.engine.runRenderLoop(function(){
            $this.scene.render();
        });
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