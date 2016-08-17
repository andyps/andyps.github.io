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
    
    this.initSounds();
    
    this.createCamera();
    this.createLight();
    
    this.rotationX = 0;
    this.rotationY = 0;
    this.rotationXDir = 1;
    this.rotationYDir = 1;
    
    this.createCube();
    // this.createAxis();
    
    var $this = this;
    window.addEventListener('resize', function(){
        $this.engine.resize();
    });

};
Cube.prototype = {
    initSounds: function() {
        var music = new BABYLON.Sound('music', 'audio/music.ogg', this.scene, function() {
            music.play();
        });
    },
    createCamera: function() {
        var camera = new BABYLON.ArcRotateCamera('camera', -1, 1, -130, new BABYLON.Vector3(0, 0, 0), this.scene);
        camera.setPosition(new BABYLON.Vector3(0, 0, -2));
        // camera.attachControl(this.engine.getRenderingCanvas());
        this.scene.activeCamera = camera;
    },
    createLight: function() {
        var light = new BABYLON.PointLight('light', new BABYLON.Vector3(0, 0, 0), this.scene);
        light.parent = this.scene.activeCamera;
    },
    createAxis: function() {
        var halfSize = 50;
        var x = BABYLON.Mesh.CreateLines('x', [
            new BABYLON.Vector3(-halfSize, 0, 0),
            new BABYLON.Vector3(halfSize, 0, 0),
            new BABYLON.Vector3(halfSize, 10, 0)
        ], this.scene);
        x.color = new BABYLON.Color3(1, 0, 0);
        var y = BABYLON.Mesh.CreateLines('y', [
           new BABYLON.Vector3(0, -halfSize, 0),
           new BABYLON.Vector3(0, halfSize, 0),
           new BABYLON.Vector3(10, halfSize, 0)
        ], this.scene);
        y.color = new BABYLON.Color3(0, 1, 0);
        var z = BABYLON.Mesh.CreateLines('z', [
           new BABYLON.Vector3(0, 0, -halfSize),
           new BABYLON.Vector3(0, 0, halfSize),
           new BABYLON.Vector3(0, 10, halfSize)
        ], this.scene);
        z.color = new BABYLON.Color3(0, 0, 1);
    },
    createCube: function() {
        var $this = this;
        
        this.cubeMesh = BABYLON.Mesh.CreateBox('box', 0.61, this.scene);
        var material = new BABYLON.StandardMaterial('material', this.scene);
        material.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.7);
        material.ambientColor = new BABYLON.Color3(0.3, 0.3, 0.7);
        this.cubeMesh.material = material;
        this.cubeMesh.position.x = -0.61;
        
        BABYLON.SceneLoader.ImportMesh('', 'heartcube/', 'cube.babylon', this.scene, function(meshes) { 
            // console.log('heartcube is loaded', meshes.length);
            meshes.forEach(function(m) {
                m.position.x += 0.305;
                m.position.y -= 0.305;
                m.position.z -= 0.305;
            });
            $this.run();
        });
        
    },
    update: function() {
        this.rotationX += this.rotationXDir * 0.5;
        this.rotationY += this.rotationYDir * 0.5;
        this.checkRotateLimits();
              
        this.scene.activeCamera.beta = this.rotationX * PI_180;
        this.scene.activeCamera.alpha = this.rotationY * PI_180;
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
    window.cube.scene.texturesEnabled = false;
    // window.cube.scene.debugLayer.show();
});