// GameObject extends BABYLON.Mesh
var GameObject = function(name, game) {
    BABYLON.Mesh.call(this, name, game.scene);
    
    this.game = game;
};

GameObject.prototype = Object.create(BABYLON.Mesh.prototype);
GameObject.prototype.constructor = GameObject;

