var EnemyBrain = function(currentLevel, mapCellZ, mapCellX) {
    this.onPath = false;
    this.currentLevel = currentLevel; 
    // [z, x]
    this.target = [-1, -1];
    this.mapCell = [mapCellZ, mapCellX];
    // when 1 - positive direction, when -1 - negative direction
    this.directions = [0, 0];
};
EnemyBrain.prototype.canStepInto = function(mapCellZ, mapCellX) {
    var levelMap = levels[this.currentLevel];
    var cellType;
    if (levelMap[mapCellZ]) {
        cellType = levelMap[mapCellZ][mapCellX];
    }
    
    return (typeof(cellType) !== 'undefined') && (cellType != Block.TYPES.NOTHING);
};
EnemyBrain.prototype.chooseDirection = function() {
    this.directions = [0, 0];
    var mapCellZ = this.mapCell[0];
    var mapCellX = this.mapCell[1];
    var possibleDirs = [];
    // can move along z+
    if (this.canStepInto(mapCellZ - 1, mapCellX)) {
        possibleDirs.push([0, 1]);
    }
    // can move along z-
    if (this.canStepInto(mapCellZ + 1, mapCellX)) {
        possibleDirs.push([0, -1]);
    }
    // can move along x+
    if (this.canStepInto(mapCellZ, mapCellX + 1)) {
        possibleDirs.push([1, 1]);
    }
    // can move along x-
    if (this.canStepInto(mapCellZ, mapCellX - 1)) {
        possibleDirs.push([1, -1]);
    }
    if (possibleDirs.length == 0) {
        // stuck, no way
        return false;
    }
    var dirInfoInd = Math.floor(Math.random() * possibleDirs.length);
    var dirInfo = possibleDirs[dirInfoInd];
    this.directions[dirInfo[0]] = dirInfo[1];
    return true;
};
EnemyBrain.prototype.chooseSteps = function() {
    var levelMap = levels[this.currentLevel];
    var mapCellZ = this.mapCell[0];
    var mapCellX = this.mapCell[1];
    var maxSteps = 0;
    var steps = 0;
    var len, sign;
    // choose step numbers
    if (this.directions[0] != 0) {
        // z
        sign = this.directions[0];
        len = levelMap.length;
        var z = mapCellZ - sign;
        for (; (z < len) && (z >= 0); z -= sign) {
            if (!this.canStepInto(z, mapCellX)) {
                break;
            }
            maxSteps++;
        }
    } else {
        // x
        sign = this.directions[1];
        len = levelMap[mapCellZ].length;
        var x = mapCellX + sign;
        for (; (x < len) && (x >= 0); x += sign) {
            if (!this.canStepInto(mapCellZ, x)) {
                break;
            }
            maxSteps++;
        }
    }
    if (maxSteps) {
        steps = Math.floor(Math.random() * maxSteps) + 1;
    }
    return steps;
};
EnemyBrain.prototype.choosePath = function() {
    var mapCellZ = this.mapCell[0];
    var mapCellX = this.mapCell[1];
    this.onPath = false;
    this.target = [-1, -1];
    // choose direction
    var dirExists = this.chooseDirection();
    var steps = 0;
    if (dirExists) {
        steps = this.chooseSteps();
    }
    if (steps) {
        this.target = [-1, -1];
        if (this.directions[0] != 0) {
            // along z
            this.target[0] = mapCellZ - steps * this.directions[0];
            this.target[1] = mapCellX;
        } else {
            // along x
            this.target[0] = mapCellZ;
            this.target[1] = mapCellX + steps * this.directions[1];
        }
        this.onPath = true;
    }
};
EnemyBrain.prototype.proceed = function(stepDiff) {
    var mapCellZ = this.mapCell[0];
    var mapCellX = this.mapCell[1];
    if (this.directions[0] > 0) {
        mapCellZ -= stepDiff;
        if (mapCellZ <= this.target[0]) {
            mapCellZ = this.target[0];
            this.onPath = false;
        }
    } else if (this.directions[0] < 0) {
        mapCellZ += stepDiff;
        if (mapCellZ >= this.target[0]) {
            mapCellZ = this.target[0];
            this.onPath = false;
        }
    } else if (this.directions[1] > 0) {
        mapCellX += stepDiff;
        if (mapCellX >= this.target[1]) {
            mapCellX = this.target[1];
            this.onPath = false;
        }
    } else if (this.directions[1] < 0) {
        mapCellX -= stepDiff;
        if (mapCellX <= this.target[1]) {
            mapCellX = this.target[1];
            this.onPath = false;
        }
    }
    
    this.mapCell[0] = mapCellZ;
    this.mapCell[1] = mapCellX;
    return this.mapCell;
};
EnemyBrain.prototype.getPath = function(stepDiff) {
    if (this.onPath) {
        return this.proceed(stepDiff);
    }
    this.choosePath();
    return this.mapCell;
};
