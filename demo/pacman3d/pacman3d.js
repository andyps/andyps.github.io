var pacman3d = function(canvasId) {
    this.init(canvasId); 
};

pacman3d.prototype = {
    antialias: true,
    showFps: true,
    showWorldAxis: true,
    
    fpsContainer: null,
    hudContainer: null,
    levelsContainer: null,
    scoreContainer: null,
    engine: null,
    scene: null,
    player: null,
    level: null,
    spriteManager: null,
    
    currentLevel: 0,
    levelsCompleted: 0,
    score: 0,
    mute: false,
};
pacman3d.prototype.init = function(canvasId) {
    var canvas = document.getElementById(canvasId);
    this.engine = new BABYLON.Engine(canvas, this.antialias);
    this.scene = new BABYLON.Scene(this.engine);
    //this.scene.clearColor = new BABYLON.Color3(0, 0, 0);
    //this.scene.ambientColor = new BABYLON.Color3(1, 1, 1);
    
    // var camera = new BABYLON.FreeCamera('camera', new BABYLON.Vector3(5, 10, -8), this.scene);
    // camera.rotation = new BABYLON.Vector3(Math.PI / 3.5, 0, 0);
    // camera.attachControl(this.engine.getRenderingCanvas());
    var camera = new BABYLON.FollowCamera('camera', new BABYLON.Vector3(5, 10, -8), this.scene);
    camera.radius = 10;
    camera.heightOffset = 6;
    camera.rotationOffset = 180;
    //camera.rotationOffset = -90;
    
    this.scene.activeCamera = camera;
    
    var light  = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), this.scene);
    light.intensity = 0.7;
    // var light = new BABYLON.PointLight('light', new BABYLON.Vector3(0, 100, -900), this.scene);
    // light.intensity = 0.5;
        
    // var light = new BABYLON.DirectionalLight('light', new BABYLON.Vector3(1,-1,-0.5), this.scene);
    // light.position = new BABYLON.Vector3(0, 40, 0);
    //this.shadows = new BABYLON.ShadowGenerator(1024, light);
    //this.shadows.useBlurVarianceShadowMap = true;
    
    var skybox = BABYLON.Mesh.CreateBox('skybox', 100.0, this.scene);
    skybox.infiniteDistance = false;
    var skyboxMaterial = new BABYLON.StandardMaterial('skybox', this.scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.disableLighting = true;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture('images/skybox/env', this.scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skybox.material = skyboxMaterial;
    
    //show fps
    if (this.showFps) {
        this.fpsContainer = document.createElement('div');
        this.fpsContainer.title = this.fpsContainer.id = 'stats';
        document.body.appendChild(this.fpsContainer);
    }
    var $this = this;
    window.addEventListener('resize', function(){
        $this.engine.resize();
    });
    
    this.initSounds();
    
    this.initHud();
    
    this.spriteManager = new BABYLON.SpriteManager('spriteManager', 'images/ghost.png', 10, 300, this.scene);
    
    this.run();
    
    return this;
};
pacman3d.prototype.initHud = function() {
    this.hudContainer = document.createElement('div');
    this.hudContainer.id = 'hud';

    this.scoreContainer = document.createElement('span');
    this.scoreContainer.id = 'hud-score';
    this.levelsContainer = document.createElement('span');
    this.levelsContainer.id = 'hud-levels';

    this.hudContainer.appendChild(this.scoreContainer);
    this.hudContainer.appendChild(this.levelsContainer);
    this.scoreContainer.textContent = '0';
    this.levelsContainer.textContent = '0';

    document.body.appendChild(this.hudContainer);
};
pacman3d.prototype.updateHud = function() {
    this.scoreContainer.textContent = this.score;
    this.levelsContainer.textContent = this.levelsCompleted;
};
pacman3d.prototype.initSounds = function() {
    new BABYLON.Sound('coin', 'audio/coin.ogg', this.scene, function() {
        // console.log('coin sound is ready');
    });    
    new BABYLON.Sound('levelup', 'audio/levelup.ogg', this.scene, function() {
        // console.log('levelup sound is ready');
    });
    new BABYLON.Sound('playerisdown', 'audio/playerisdown.ogg', this.scene, function() {
        // console.log('playerisdown sound is ready');
    });
};
pacman3d.prototype.playSound = function(name) {
    if (!this.mute) {
        this.scene.getSoundByName(name).play();
    }
};
pacman3d.prototype.createWorldAxis = function() {
    var halfSize = 50;
    var x = BABYLON.Mesh.CreateLines('x', [
        new BABYLON.Vector3(-halfSize, 0, 0),
        new BABYLON.Vector3(halfSize, 0, 0),
        new BABYLON.Vector3(halfSize, 10, 0)
    ], this.scene);
    x.color = new BABYLON.Color3(1, 0, 0);
    var y = BABYLON.Mesh.CreateLines('y', [
       new BABYLON.Vector3(0, -halfSize, 0),
       new BABYLON.Vector3(0, halfSize, 0),
       new BABYLON.Vector3(10, halfSize, 0)
    ], this.scene);
    y.color = new BABYLON.Color3(0, 1, 0);
    var z = BABYLON.Mesh.CreateLines('z', [
       new BABYLON.Vector3(0, 0, -halfSize),
       new BABYLON.Vector3(0, 0, halfSize),
       new BABYLON.Vector3(0, 10, halfSize)
    ], this.scene);
    z.color = new BABYLON.Color3(0, 0, 1);
};
pacman3d.prototype.run = function() {
    var $this = this;
    // this.scene.enablePhysics(null, new BABYLON.OimoJSPlugin());
    this.scene.enablePhysics();
    if (this.showWorldAxis) this.createWorldAxis();
    
    this.level = Level.Create(levels[this.currentLevel], this);
    
    var playerPosition = this.level.startPosition.clone();
    playerPosition.y = 3;
    this.player = new Player(this, playerPosition);
    this.scene.activeCamera.target = this.player;
    this.player.initControls();

    this.scene.registerBeforeRender(function() {
        $this.player.move();
        $this.level.moveEnemies();
        if ($this.player.position.y < -20) {
            $this.playSound('playerisdown');
            $this.level.reset();
        }
    });
    this.engine.runRenderLoop(function() {
        $this.scene.render();
        
        if ($this.showFps) {
            $this.fpsContainer.innerHTML = $this.engine.getFps().toFixed() + ' fps';
        }
    });
    this.scene.registerAfterRender(function() {
        $this.checkCollisions();
    });
    
};
pacman3d.prototype.checkCollisions = function() {
    var eaten = this.level.checkEnemyCollisions();
    if (eaten) {
        this.playSound('playerisdown');
        this.level.reset();
        return;
    }
    this.level.checkCoinCollisions();
    if (this.level.isCompleted()) {
        this.nextLevel();
    }
};
pacman3d.prototype.nextLevel = function() {
    this.currentLevel++;
    this.levelsCompleted++;
    this.playSound('levelup');
    this.updateHud();
    if (this.currentLevel > (levels.length - 1)) {
        this.currentLevel = 0;
    }
    this.level.eliminate();

    this.level = Level.Create(levels[this.currentLevel], this);
    
    var playerPosition = this.level.startPosition.clone();
    playerPosition.y = 1;
    this.player.reset(playerPosition);
};

window.addEventListener('DOMContentLoaded', function() {
    var debugMode = true;
    var game = new pacman3d('gameCanvas');
    if (debugMode) {
        window.game = game;
        // game.scene.debugLayer.show();
    }
}, false);
