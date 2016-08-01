// Extends GameObject
var Ghost = function(game, mapCellZ, mapCellX, y) {
    GameObject.call(this, 'ghost', game);
    var vertexData = BABYLON.VertexData.CreateBox({size: 1});
    vertexData.applyToMesh(this);
    
    this.init(game, mapCellZ, mapCellX, y);
};

Ghost.prototype = Object.create(GameObject.prototype);
Ghost.prototype.constructor = Coin;

Ghost.prototype.init = function(game, mapCellZ, mapCellX, y) {
    this.game = game;
    this.position.x = mapCellX;
    this.position.y = y;
    this.position.z = -mapCellZ;
};
Ghost.prototype.eliminate = function() {
    this.dispose();
};

Ghost.objectPrototype = null;
Ghost.create = function(game, mapCellZ, mapCellX, y) {
    if (!Ghost.objectPrototype) {
        Ghost.objectPrototype = new Ghost(game, 0, 0, 0);
        Ghost.objectPrototype.isVisible = false;
        Ghost.objectPrototype.setEnabled(false);
    }
    var ghost = Ghost.objectPrototype.createInstance('ghost');
    ghost.init = Ghost.prototype.init;
    ghost.eliminate = Ghost.prototype.eliminate;
    ghost.isVisible = false;
    ghost.setEnabled(true);
    ghost.init(game, mapCellZ, mapCellX, y);
    
    return ghost;
};
