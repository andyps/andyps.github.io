var Level = function(game) {
    this.game = game;
    
    this.startPosition = new BABYLON.Vector3(0, 0, 0);
    this.score = 0;
    this.coins = [];
    this.blocks = [];
    this.enemies = [];
};

Level.prototype.reset = function() {
    var playerPosition = this.startPosition.clone();
    playerPosition.y = 3;
    this.game.player.reset(playerPosition);
};

/**
* Creates a new map
*/
Level.Create = function(matrix, game) {
    var level = new Level(game);
    for (var z = 0; z < matrix.length; z++) {
        for (var x = 0; x < matrix[z].length; x++) {
            var type = matrix[z][x];
            if (type == Block.TYPES.NOTHING) {
                continue;
            }
            
            var position = new BABYLON.Vector3(x, 0, -z);
            var block = Block.create(game, position);
            level.blocks.push(block);
            
            if (type == Block.TYPES.NORMAL) {
                continue;
            }
            
            if (type == Block.TYPES.START) {
                level.startPosition = position;
                continue;
            }
            
            position.y = 0.9;
            
            if (type == Block.TYPES.COINX || type == Block.TYPES.COINZ) {
                var coin = Coin.create(game, position, type);
                level.coins.push(coin);
            } else if (type == Block.TYPES.ENEMY1) {

            } else if (type == Block.TYPES.ENEMY2) {
                
            }
        }
    }

    return level;
};
