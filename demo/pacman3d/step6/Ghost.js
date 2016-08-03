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
    this.sprite = new BABYLON.Sprite('enemy', game.spriteManager);
    this.game = game;
    this.position.x = mapCellX;
    this.position.y = y;
    this.position.z = -mapCellZ;
    
    this.sprite.position = this.position;
    
    this.ai = new EnemyBrain(this.game.currentLevel, mapCellZ, mapCellX);
    this.sprite.playAnimation(0, 6, true, 150);
};
Ghost.prototype.eliminate = function() {
    this.sprite.dispose();
    this.dispose();
};
Ghost.prototype.move = function() {
    var newPos = this.ai.getPath(0.01 * this.game.scene.getAnimationRatio());
    this.position.z = -newPos[0];
    this.position.x = newPos[1];
};

Ghost.objectPrototype = null;
Ghost.create = function(game, mapCellZ, mapCellX, y) {
    if (!Ghost.objectPrototype) {
        Ghost.objectPrototype = new Ghost(game, 0, 0, 0);
        Ghost.objectPrototype.sprite.dispose();
        Ghost.objectPrototype.isVisible = false;
        Ghost.objectPrototype.setEnabled(false);
    }
    var ghost = Ghost.objectPrototype.createInstance('ghost');
    ghost.init = Ghost.prototype.init;
    ghost.move = Ghost.prototype.move;
    ghost.eliminate = Ghost.prototype.eliminate;
    ghost.isVisible = false;
    ghost.setEnabled(true);
    ghost.init(game, mapCellZ, mapCellX, y);
    
    return ghost;
};
