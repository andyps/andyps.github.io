// Extends GameObject
var Player = function(game, position) {
    GameObject.call(this, 'player', game);
    
    var mouth = BABYLON.Mesh.CreateCylinder('playerMouth', 0.8, 0.8, 0.8, 3, 1, game.scene, false);
    var head = BABYLON.Mesh.CreateSphere('playerHead', 16, 0.8, game.scene);
    mouth.position.x += 0.4;
    mouth.rotation.y = Math.PI;
    mouth.rotation.x = Math.PI / 2;
    var mouthCSG = BABYLON.CSG.FromMesh(mouth);
    var headCSG = BABYLON.CSG.FromMesh(head);
    var playerCSG = headCSG.subtract(mouthCSG);
    mouth.dispose();
    head.dispose();
    
    var tmpPlayerMesh = playerCSG.toMesh('tmp', new BABYLON.StandardMaterial('tmp', game.scene), game.scene);
    var vertexData = BABYLON.VertexData.ExtractFromMesh(tmpPlayerMesh);
    vertexData.applyToMesh(this);
    tmpPlayerMesh.dispose();
    
    this.rotationQuaternion = new BABYLON.Quaternion();
    this.physicsImpostor = new BABYLON.PhysicsImpostor(
        this, 
        BABYLON.PhysicsImpostor.SphereImpostor, 
        { mass: 0, restitution: 0.5, friction: 0.1 },
        game.scene
    );
    
    this.reset(position);
    this.physicsImpostor.setMass(1);
};

Player.prototype = Object.create(GameObject.prototype);
Player.prototype.constructor = Player;

Player.prototype.initControls = function() {
    var $this = this;
    window.addEventListener('keydown', function(e) {
        switch(e.which) {
            case 39: // right
                $this.rotations[0] = 1;
                break;
            case 37: // left
                $this.rotations[1] = 1;
                break;
            case 38: // forward
                $this.directions[0] = 1;
                break;
            case 40: // back
                $this.directions[1] = 1;
                break;
        }
    }, false);
    window.addEventListener('keyup', function(e) {
        switch (e.which) {
            case 39: // right
            case 37: // left
                $this.rotations = [0, 0];
                break;
            case 38:// back:
            case 40:// forward:
                $this.directions = [0, 0];
                break;
        }
    });
};

Player.prototype.move = function() {
    if (this.directions[0] != 0) {
        this.moveTo(1);
    }
    if (this.directions[1] != 0) {
        this.moveTo(-1);
    }
    if (this.rotations[0] != 0) {
        this.rotateTo(0.05);
    }
    if (this.rotations[1] != 0) {
        this.rotateTo(-0.05);
    }
};

Player.prototype.moveTo = function(dir) {
    this.computeWorldMatrix();
    var v = new BABYLON.Vector3(dir, 0, 0);
    var m = this.getWorldMatrix();
    // global vector into local vector
    var v2 = BABYLON.Vector3.TransformCoordinates(v, m);
    v2.subtractInPlace(this.position);
    v2.normalize().scaleInPlace(0.05 * this.game.scene.getAnimationRatio());
    
    // this.physicsImpostor.applyImpulse(v2, this.position);
    this.position.addInPlace(v2);
};
Player.prototype.rotateTo = function(angle) {
    var mQuaternion = this.rotationQuaternion;
    var q = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, angle * this.game.scene.getAnimationRatio());
    // update mesh rotationQuaternion
    this.rotationQuaternion = q.multiply(mQuaternion);
};
Player.prototype.reset = function(position) {
    this.rotations = [0, 0];
    this.directions = [0, 0];

    this.position.x = position.x;
    this.position.y = position.y;
    this.position.z = position.z;
    this.rotation.x = this.rotation.y = this.rotation.z = 0; 
    this.rotationQuaternion.x = this.rotationQuaternion.y = this.rotationQuaternion.z = 0;
    this.rotationQuaternion.w = 1;
    
    this.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, 0, 0));
    this.physicsImpostor.setAngularVelocity(new BABYLON.Quaternion(0, 0, 0, 0));
};
