// Extends GameObject
var Coin = function(game, position, faceTo) {
    GameObject.call(this, 'coin', game);
    var vertexData = BABYLON.VertexData.CreateCylinder({
        height: 0.05,
        diameterBottom: 0.6,
        diameterTop: 0.6,
        tessellation: 16
    });
    vertexData.applyToMesh(this);
    this.init(game, position, faceTo);
};

Coin.prototype = Object.create(GameObject.prototype);
Coin.prototype.constructor = Coin;

Coin.prototype.init = function(game, position, faceTo) {
    this.game = game;
    this.position.x = position.x;
    this.position.y = position.y;
    this.position.z = position.z;
    if (faceTo === Block.TYPES.COINZ) {
        this.rotation.x = Math.PI / 2;
    } else {
        this.rotation.z = Math.PI / 2;
    }
    this.animate();
};

Coin.animation = new BABYLON.Animation(
    'coin', 'rotation.y', 30,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
);
Coin.animation.setKeys([
    {
        frame: 0,
        value: 0
    },
    {
        frame: 15,
        value: Math.PI / 2
    },     
    {
        frame: 30,
        value: 0
    },     
    {
        frame: 45,
        value: -Math.PI / 2
    }, 
    {
        frame: 60,
        value: 0
    }
]);

Coin.prototype.animate = function() {
    this.animations.push(Coin.animation.clone());
    this.getScene().beginAnimation(this, 0, 60, true, 1.0);
};

Coin.objectPrototypes = {
};
Coin.objectPrototypes[Block.TYPES.COINX] = null;
Coin.objectPrototypes[Block.TYPES.COINZ] = null;

Coin.create = function(game, position, type) {
    if (!Coin.objectPrototypes[type]) {
        Coin.objectPrototypes[type] = new Coin(game, new BABYLON.Vector3(0, 0, 0), type);
        Coin.objectPrototypes[type].isVisible = false;
        Coin.objectPrototypes[type].setEnabled(false);
    }
    var coin = Coin.objectPrototypes[type].createInstance('coin_' + type);
    coin.init = Coin.prototype.init;
    coin.animate = Coin.prototype.animate;
    coin.isVisible = true;
    coin.setEnabled(true);
    coin.init(game, position, type);
    return coin;
};
