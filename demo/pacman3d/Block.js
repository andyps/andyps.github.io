var Block = function(game, position) {
    GameObject.call(this, 'block', game);
    var vertexData = BABYLON.VertexData.CreateBox({size: 1});
    vertexData.applyToMesh(this);
    
    this.material = new BABYLON.StandardMaterial('ground', game.scene);
    this.material.diffuseTexture = new BABYLON.Texture('images/ground1.jpg', game.scene);
    
    this.init(game, position);
};

Block.prototype = Object.create(GameObject.prototype);
Block.prototype.constructor = Block;

Block.TYPES = {
    NOTHING: '-',
    NORMAL: 0,
    START: 'S',
    COINX: 'CX',
    COINZ: 'CZ',
    ENEMY1: 'E1',
    ENEMY2: 'E2',
};

Block.prototype.init = function(game, position) {
    this.game = game;
    this.position.x = position.x;
    this.position.y = position.y;
    this.position.z = position.z;
    
    this.physicsImpostor = new BABYLON.PhysicsImpostor(
        this,
        BABYLON.PhysicsImpostor.BoxImpostor,
        { mass: 0, restitution: 0.2, friction: 0.5 },
        game.scene
    );
};

Block.objectPrototype = null;

Block.create = function(game, position) {
    if (!Block.objectPrototype) {
        Block.objectPrototype = new Block(game, new BABYLON.Vector3(0, 0, 0));
        Block.objectPrototype.isVisible = false;
        Block.objectPrototype.setEnabled(false);
    }
    var block = Block.objectPrototype.createInstance('block');
    block.init = Block.prototype.init;
    
    block.isVisible = true;
    block.setEnabled(true);
    
    block.init(game, position);
    
    return block;
};