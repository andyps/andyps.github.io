var Level = function(game) {
    this.game = game;
    
    this.startPosition = new BABYLON.Vector3(0, 0, 0);
    this.score = 0;
    this.coins = [];
    this.blocks = [];
    this.enemies = [];
};

Level.prototype.eliminate = function() {
    this.blocks.forEach(function(block) {
        block.dispose();
    });
    this.blocks.length = 0;
    this.enemies.forEach(function(enemy) {
        enemy.eliminate();
    });
    this.enemies.length = 0;
};

Level.prototype.moveEnemies = function() {
    this.enemies.forEach(function(enemy) {
        enemy.move();
    });
};

Level.prototype.checkEnemyCollisions = function() {
    var enemy;
    for (var i = 0; i < this.enemies.length; i++) {
        enemy = this.enemies[i];
        if (enemy.intersectsMesh(this.game.player)) {
            return true;
        }
    }
    return false;
};
Level.prototype.checkCoinCollisions = function() {
    var coinInd = null;
    var coin;
    for (var i = 0; i < this.coins.length; i++) {
        coin = this.coins[i];
        if (coin.intersectsMesh(this.game.player)) {
            coin.dispose();
            this.coins[i] = coin = null;
            this.score++;
            coinInd = i;
            this.game.score++;
            this.game.updateHud();
            break;
        }
    }
    if (coinInd !== null) {
        this.coins.splice(coinInd, 1);
        return true;
    }
    return false;
};

Level.prototype.isCompleted = function() {
    return this.coins.length <= 0;
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
                var enemy = Ghost.create(game, z, x, position.y);
                level.enemies.push(enemy);
                
            } else if (type == Block.TYPES.ENEMY2) {
                
            }
        }
    }

    return level;
};
