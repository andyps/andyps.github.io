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

    var material = new BABYLON.StandardMaterial('coin', game.scene);
    material.diffuseColor = new BABYLON.Color3(1,1,1);
    material.emissiveColor = new BABYLON.Color3(1,1,1);
    // material.alpha = 0.7;
    material.emissiveFresnelParameters = new BABYLON.FresnelParameters();
    material.emissiveFresnelParameters.bias = 0.01;
    material.emissiveFresnelParameters.power = 2;
    material.emissiveFresnelParameters.leftColor = BABYLON.Color3.Black();
    material.emissiveFresnelParameters.rightColor = new BABYLON.Color3(1, 1, 1);
    
    this.material = material;
    
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
