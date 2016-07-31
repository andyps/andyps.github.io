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
    
    this.reset(position);
};

Player.prototype = Object.create(GameObject.prototype);
Player.prototype.constructor = Player;

Player.prototype.reset = function(position) {
    this.position.x = position.x;
    this.position.y = position.y;
    this.position.z = position.z;
    this.rotation.x = this.rotation.y = this.rotation.z = 0; 
};
