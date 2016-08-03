---
layout: post
comments: false
title:  "Введение в BabylonJS"
date:   2016-07-30 00:00:10 +0000
categories: webgl
---
В этой статье мы познакомимся с популярным WebGL-фреймворком **BabylonJS** на
примере создания прототипа игры. Полные листинги программы доступны 
на github по [адресу](https://github.com/andyps/andyps.github.io/tree/master/demo/pacman3d){:target="_blank"}.  

## О BabylonJS

_BabylonJS_ является Open Source проектом, распространяемым под лицензией Apache License 2.0.  
[Исходные коды на github](https://github.com/BabylonJS/Babylon.js){:target="_blank"}.  
Фреймворк обладает богатыми возможностями, которые перечислены прямо [на официальном сайте](http://www.babylonjs.com/){:target="_blank"}
и является отличным средством для разработки трехмерных и двумерных игр.

> "A complete JavaScript framework for building 3D games with HTML5, WebGL and Web Audio"

Некоторые возможности:  
набор готовых мешей, различных источников света, материалов, различные виды камер в том числе для
мобильных устройств, геймпадов и устройств VR, возможность загрузки
мешей с файлов, анимационный движок, аудио движок, picking, встроенный обработчик коллизий,
интеграция с физическими движками, спрайты и 2d api, система частиц, пользовательские материалы и шейдеры,
карты высот, постобработка, туман, карты теней и, что очень важно, многое сделано для оптимизации приложений, 
есть специальная панель отладки.  
У фреймворка отличная [документация](http://doc.babylonjs.com/){:target="_blank"} и набор обучающих материалов на официальном сайте,
отзывчивый форум, есть [roadmap](https://doc.babylonjs.com/generals/Roadmap){:target="_blank"}.

## Что будет сделано

Итак, что же за игру мы сделаем.  
Главным персонажем в игре будет такой себе трехмерный вариант известного pacman-а, который
будет собирать монетки. Когда все монетки на уровне собраны,
игра переходит на следующий уровень. В игре очень просто добавить свой уровень.  
Конечно же будут враги, столкновений с которыми нужно избегать.  
Будет использован физический движок.

## Базовые понятия и структура приложения

Самое первое, что нужно сделать - подготовить html с элементом canvas и подключить библиотеку Babylon.js.

    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PACMAN3D</title>
    <link href="main.css" rel="stylesheet" type="text/css" charset="utf-8" >
    <script src="vendor/babylonjs/babylon.2.4.js"></script>
    <script src="vendor/babylonjs/cannon.js"></script>

    <script src="levels.js"></script>
    <script src="Level.js"></script>
    <script src="GameObject.js"></script>
    <script src="Player.js"></script>
    <script src="Block.js"></script>
    <script src="Coin.js"></script>
    <script src="EnemyBrain.js"></script>
    <script src="Ghost.js"></script>
    <script src="pacman3d.js"></script>
    </head>
    <body>
        <canvas id="gameCanvas" oncontextmenu="return false;">Browser not supported</canvas>
    </body>
    </html>

Кроме самого фреймворка, я подключил сразу библиотеку физического движка **cannon.js**, а также файлы игры.  
Для каждой сущности будут созданы отдельные классы и файлы.  
_Player.js_ содержит класс _Player_, представляющий собой игрового персонажа (или **PC**).  
_Coin.js_ содержит класс _Coin_ для создания монет.  
_Block.js_ отвечает за прорисовку блоков платформы, по которой перемещаются персонажи.  
_Ghost.js_ соответствует классу _Ghost_ - это враги-привидения (т.е. **NPC**, _NPC_ в игровой терминологии - неуправляемый игроком персонаж).  
_EnemyBrain.js_ позволяет наделить всех NPC зачатками **AI** (искусственный интеллект). Благодаря _EnemyBrain_, 
все NPC умеют передвигаться по платформе, не падая вниз, выбирая правильное направление движения.  
Все вышеназванные классы, кроме _EnemyBrain_, наследуют класс _GameObject_, находящийся в файле _GameObject.js_.  
Файл _Level.js_ соответствует классу _Level_. Данные, согласно которым конструируются уровни, находятся в файле _levels.js_.
Именно этот файл нужно отредактировать, чтобы добавить новые уровни или изменить/удалить существующие.  
_pacman3d.js_ - это главный файл, с которого и начнем рассмотрение JavaScript-кода.

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
        this.scene.debugLayer.show();
        
        var camera = new BABYLON.FreeCamera('camera', new BABYLON.Vector3(5, 10, -8), this.scene);
        camera.attachControl(this.engine.getRenderingCanvas());
        this.scene.activeCamera = camera;
        
        var light  = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), this.scene);
        light.intensity = 0.7;
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
        this.run();
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
        // ...
    };
    pacman3d.prototype.playSound = function(name) {
        // ...
    };
    pacman3d.prototype.createWorldAxis = function() {
        // ...
    };
    pacman3d.prototype.run = function() {
        var $this = this;
        if (this.showWorldAxis) this.createWorldAxis();
        this.engine.runRenderLoop(function() {
            $this.scene.render();
            if ($this.showFps) {
                $this.fpsContainer.innerHTML = $this.engine.getFps().toFixed() + ' fps';
            }
        });
    };
    pacman3d.prototype.checkCollisions = function() {
        // ...
    };
    pacman3d.prototype.nextLevel = function() {
        // ...
    };

    window.addEventListener('DOMContentLoaded', function() {
        window.game = new pacman3d('gameCanvas');
    }, false);

Все пустые методы мы заполним позже. 
Итак, после загрузки страницы, создается главный объект игры и конструктору передается id элемента canvas.  
Использование BabylonJS начинается с создания экземпляра класса **BABYLON.Engine**.

    var canvas = document.getElementById(canvasId);
    this.engine = new BABYLON.Engine(canvas, this.antialias);

Engine можно назвать сердцем или двигателем фреймворка. Первым аргументом при создании экземпляра _BABYLON.Engine_ передается элемент canvas. 
Второй аргумент включает / отключает поддержку сглаживания (antialias).  
Обязательным элементом является сцена. Приложение может иметь несколько сцен. Для создания сцены используется
класс **BABYLON.Scene**, которому нужно передать объект _BABYLON.Engine_.

    this.scene = new BABYLON.Scene(this.engine);

Сцена имеет такие часто используемые свойства, как 
_clearColor_ - цвет фона,
_meshes_ - список мешей,
_lights_ - список источников света,
_materials_ - список материалов,
_textures_ - список текстур,
_cameras_ - список камер,
_activeCamera_ - активная камера.

На этапе разработки, особенно для улучшения производительности приложения, очень полезной может оказаться панель отладки.
Ее можно включить следующим образом:

    this.scene.debugLayer.show()

Панель отладки включает много информации, напр. fps, количество вызовов рендеринга сцены (draw calls), дерево мешей.  
Несмотря на то, что debugLayer показывает fps, в коде я включил вызов метода _getFps_ у _BABYLON.Engine_, т.к. это бывает
часто нужно в самом приложении.

Следующий обязательный элемент - это камера. С помощью камеры мы "видим" сцену и все ее объекты. 
В коде выше используется камера **BABYLON.FreeCamera**. Это стандартная камера для шутеров от первого лица.
Ею удобно пользоваться при разработке, т.к. она позволяет свободно оглянуть всю сцену с любой позиции.  
Все камеры BabylonJS наследуют класс BABYLON.Camera. Этот класс можно наследовать для создания своих кастомных камер,
если вас не устроят уже готовые.  
Все камеры и многие другие конструкторы принимают первым параметром имя, а также принимают экземпляр сцены.  
Класс _BABYLON.Scene_ в свою очередь имеет метод _getCameraByName_.  
Аналогичные методы имеются и для других объектов сцены:
_getMeshByName_, _getLightByName_, _getMaterialByName_.  
Камеры можно переключать, изменяя свойство сцены _activeCamera_.
Второй аргумент _BABYLON.FreeCamera_, как можно догадаться - позиция камеры.

Для указания позиций используется класс **BABYLON.Vector3**.

Для управления камерой, нужно вызвать метод _attachControl_:

    camera.attachControl(this.engine.getRenderingCanvas());

Следующий код важен для сохранения пропорций и разрешения картинки при изменении размеров браузера

    var $this = this;
    window.addEventListener('resize', function(){
        $this.engine.resize();
    });

В методе _initSounds_ будут загружаться используемые звуковые файлы.  
В методе _initHud_ создаются html-элементы для отображения номера текущего уровня игры и количества очков. 
Как вариант, HUD можно было реализовать как часть WebGL-приложения.

В методе _run_ происходит необходимый вызов метода _runRenderLoop_. Этому методу передается функция, которая будет вызываться
каждые 60 фреймов в секунду (в идеальном случае). Кстати, замечу, что на данный момент рендеринг в WebGL ограничен числом 60 fps.
Движок прорисовывает сцену при вызове _render_:

    $this.scene.render();

Пустая сцена готова и показывается стандартный цвет фона, если он не был переопределен с помощью свойства _clearColor_, например
таким образом

    this.scene.clearColor = new BABYLON.Color3(0, 0, 0);

То есть, класс **BABYLON.Color3** используются для задания цвета и это еще один класс, без которого вы навряд ли обойдетесь.

Навряд ли вы обойдетесь и без такой важной составляющей, как свет, хотя это необязательный элемент и приложение будет работать и без него.  
BabylonJS имеет 4 типа источников света: 
**PointLight** - точечный источник света, испускаемого во всех направлениях,  
**DirectionalLight** определяется направлением,  
**SpotLight** - источник направленного света конической формы (например, фонарик),  
**HemisphericLight** - симулирует свет солнца.

HemisphericLight определяется направлением к солнцу, 
диффузным цветом (diffuse, цвет пикселей, направленных вверх), 
цветом земли (groundColor, цвет пикселей, направленных к земле)
и отраженным цветом (specular).

Свойства _diffuse_ и _specular_, а также _intensity_ относятся ко всем классам источников света. Каждый свет
можно отключить / включить, вызвав метод _setEnabled(true/false)_.

Прежде, чем что-то добавить в сцену для удобства разработки добавим оси мировой системы координат, что реализовано в методе _createWorldAxis_.
**Mesh** - еще одно базовое понятие 3d-программ. В BabylonJS они создаются статическими методами класса _BABYLON.Mesh_.
Вот некоторые из них:  
_BABYLON.Mesh.CreateBox_ - создание куба,  
_BABYLON.Mesh.CreateSphere_ - создание сферы,  
_BABYLON.Mesh.CreatePlane_ - создает плоскую прямоугольную поверхность,  
_BABYLON.Mesh.CreateCylinder_ - цилиндр,  
_BABYLON.Mesh.CreateTorus - создание тора,  
_BABYLON.Mesh.CreateTube_ - создание поверхности трубчатой формы,  
_BABYLON.Mesh.CreateRibbon_ - поверхность ленточно формы,  
_BABYLON.Mesh.CreateLines - создание линий.

Отмечу возможность загрузки моделей из файлов.

Заполним кодом метод _createWorldAxis_

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

после чего можно будет увидеть
[следующий результат](http://cube-sim.com/pacman3d/step1.html){:target="_blank"}.

Самыми важными свойствами мешей являются _position_ и _rotation_.  
_position_ - свойство-объект, которое содержит координаты меша на сцене.  
_rotation_ - свойство-объект, которое содержит информацию о ориентации меша относительно осей x, y и z.
C помощью _rotation_ меш можно вращать.  
Оба свойства являются экземплярами объекта **BABYLON.Vector3**.

## Создание уровня

Вся информация по уровням игры содержится в файле _levels.js_. Каждый уровень представлен
в виде массива, который представляет из себя карту располагаемых объектов. Каждый элемент карты уровня - это обозначение
типа блока данного участка карты.

Уровни создаются классом _Level_ в методе _Level.Create_ на основе карты уровня.

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

Конструктор класса _Level_:

    var Level = function(game) {
        this.game = game;
        
        this.startPosition = new BABYLON.Vector3(0, 0, 0);
        this.score = 0;
        this.coins = [];
        this.blocks = [];
        this.enemies = [];
    };

## Классы GameObject и Block

Все объекты уровня основываются на классе _GameObject_, который в свою очередь наследуется от класса _BABYLON.Mesh_.

    var GameObject = function(name, game) {
        BABYLON.Mesh.call(this, name, game.scene);
        this.game = game;
    };
    GameObject.prototype = Object.create(BABYLON.Mesh.prototype);
    GameObject.prototype.constructor = GameObject;

Другой подход - не расширять класс _BABYLON.Mesh_, а инкапсулировать соответствующий экземпляр _BABYLON.Mesh_ внутри игрового объекта.  

Рассмотрим класс _Block_.

    var Block = function(game, position) {
        GameObject.call(this, 'block', game);
        var vertexData = BABYLON.VertexData.CreateBox({size: 1});
        vertexData.applyToMesh(this);
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

В _Block.TYPES_ находятся все типы блоков.  
Хочу обратить внимание на два момента.  
В конструкторе _Block_ приходится создавать набор вершин, представляющий собой куб,
с помощью _BABYLON.VertexData.CreateBox_, так как _Block_ расширяет класс GameObject и, следовательно, BABYLON.Mesh.
Потом этот набор применяется следующим образом:

    vertexData.applyToMesh(this);

Второе - поскольку блоков много, мы сначала создаем прототип блока, на основание которого создаются все остальные блоки.

    Block.objectPrototype = new Block(game, new BABYLON.Vector3(0, 0, 0));
    Block.objectPrototype.isVisible = false;
    Block.objectPrototype.setEnabled(false);

## Улучшение производительности с помощью инстанцирования

В BabylonJS есть удобные средства для оптимизации. В данном приложении мы повсюду используем инстанцирование. Это позволяет отрендерить
множество однотипных объектов с помощью одного "draw call". Уменьшение количества необходимых вызовов прорисовки -
эффективное средство для улучшения производительности. Если количество fps вас не устраивает,
в первую очередь обратите внимание на значение "draw calls" в панели отладки. Пример инстанцирования блоков:

    var block = Block.objectPrototype.createInstance('block');

С этой целью также можно использовать способ склеивания мешей. В BabylonJS это делается очень просто:
в метод **BABYLON.Mesh.MergeMeshes** первым параметром нужно передать массив мешей. На выходе получится
один единственный меш, поэтому применять этот способ имеет смысл только тогда, когда вам не нужны больше исходные меши как
отдельные объекты, например, если не нужно изменять их позиции. Второй параметр метода _BABYLON.Mesh.MergeMeshes_ позволяет
оставить исходные объекты, если указать его равным _false_ (по умолчанию равен _true_).

Упомяну еще, что BabylonJS поддерживает **LOD** (Level Of Detail). _LOD_ - это способ улучшения производительности
за счет уменьшения уровня детализации объекта при удалении от него.

## Класс Coin

Для создания монеток используется **BABYLON.VertexData.CreateCylinder**.

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

Отличие монеток CX и CZ состоит в их ориентации. CX "смотрит" на плоскость yz, а CZ - на xy.

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

_rotation.x_ и _rotation.z_ используются для разворота монеты. Углы задаются в радианах.

## Класс Player

В классе _Player_ используется метод **CSG** для задания геометрии. _CSG_ расшифровывается как 
_Constructive Solid Geometry_ и это способ моделирования геометрических тел с помощью комбинирования нескольких
примитивов.  
Мы используем сферу как основу, из которой вырезается треугольная призма, созданная с помощью _BABYLON.Mesh.CreateCylinder_.

    var Player = function(game, position) {
        GameObject.call(this, 'player', game);
        
        var mouth = BABYLON.Mesh.CreateCylinder('playerMouth', 0.8, 0.8, 0.8, 3, 1, game.scene, false);
        var head = BABYLON.Mesh.CreateSphere('playerHead', 16, 0.8, game.scene);
        mouth.position.x += 0.4;
        mouth.rotation.y = Math.PI;
        mouth.rotation.x = Math.PI / 2;
        var mouthCSG = BABYLON.CSG.FromMesh(mouth);
        var headCSG = BABYLON.CSG.FromMesh(head);
        var playerCSG = headCSG.subtract(mouthCSG);
        mouth.dispose();
        head.dispose();
        
        var tmpPlayerMesh = playerCSG.toMesh('tmp', new BABYLON.StandardMaterial('tmp', game.scene), game.scene);
        var vertexData = BABYLON.VertexData.ExtractFromMesh(tmpPlayerMesh);
        vertexData.applyToMesh(this);
        tmpPlayerMesh.dispose();
        
        this.reset(position);
    };

## Анимация

Применим анимацию к монеткам.  
Можно управлять анимацией самому, например используя свойства мешей _position_ и _rotation_, а можно 
использовать заготовленный для этих целей класс **BABYLON.Animation**.

Для начала создадим объект BABYLON.Animation, указав свойство, которое будет изменяться

    Coin.animation = new BABYLON.Animation(
        'coin', 'rotation.y', 30,
        BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

Третий параметр - количество фреймов в секунду для анимации,  
четвертый - тип данных,
пятый параметр позволяет зациклить анимацию, поэтому здесь указано _BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE_.

Следующим шагом нужно создать набор значений для каждого фрейма (animation keys) и добавить его в свойство _animations_ меша:

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

И, наконец, с помощью метода _beginAnimation_ сцены, анимация начинает работать:

    Coin.prototype.animate = function() {
        this.animations.push(Coin.animation.clone());
        this.getScene().beginAnimation(this, 0, 60, true, 1.0);
    };

Четвертый параметр метода _beginAnimation_ установлен в true для зацикливания анимации.

Если вы управляете анимацией вручную, обратите внимание на метод сцены _getAnimationRatio_.
Использование этого метода позволяет сделать скорость анимации независимой от fps игры.

Что получается на данный момент:
[демо](http://cube-sim.com/pacman3d/step2.html){:target="_blank"},  
[html](https://github.com/andyps/andyps.github.io/tree/master/demo/pacman3d/step2.html){:target="_blank"},  
[код класса игры](https://github.com/andyps/andyps.github.io/tree/master/demo/pacman3d/pacman3d-step2.js){:target="_blank"},  
[остальной код](https://github.com/andyps/andyps.github.io/tree/master/demo/pacman3d/step2){:target="_blank"}.

## Физический движок

BabylonJS имеет хорошую интеграцию с двумя физическими движками: **Oimo.js** и **Cannon.js**. Мы будем использовать последний.

Чтобы использовать физический движок в BabylonJS всего лишь нужно подключить файл с кодом движка и вызвать метод _enablePhysics_.
Добавим этот вызов в начало метода _run_:

    this.scene.enablePhysics();

_enablePhysics_ принимает два аргумента. Первый - это gravity с характиристиками притяжения в виде вектора BABYLON.Vector3.
По умолчанию gravity равно BABYLON.Vector3(0, -9.807, 0).  
Второй параметр позволяет нам указать конкретный физический движок. В версии BabylonJS 2.4 используется по умолчанию 
_Cannon.js_ и этот параметр равен _new BABYLON.CannonJSPlugin()_.
Чтобы использовать _Oimo.js_ нужно передать _new BABYLON.OimoJSPlugin()_.

После включения физического движка пока ничего видимого не произойдет. pacman остается висеть и не падает на платформу.
Чтобы применить физику к мешу, ему нужно добавить так называемое **"rigid body"** (в переводе - твердое тело). Каждое
"rigid body" имеет какую-то форму. Чем проще форма (по другому - impostor), тем легче движку выполнять свою работу.
Коллизии рассчитываются с учетом выбранной формы, то есть они не применяются непосредственно к мешу.  
Некоторые виды "импостеров":
_BABYLON.PhysicsImpostor.SphereImpostor_, _BABYLON.PhysicsImpostor.BoxImpostor_,
_BABYLON.PhysicsImpostor.PlaneImpostor_, _BABYLON.PhysicsImpostor.CylinderImpostor_, 
_BABYLON.PhysicsImpostor.HeightmapImpostor_.

Добавим к мешу игрока "rigid body":

    this.physicsImpostor = new BABYLON.PhysicsImpostor(
        this, 
        BABYLON.PhysicsImpostor.SphereImpostor, 
        { mass: 0, restitution: 0.5, friction: 0.1 },
        game.scene
    );

Как видите, нужно создать экземпляр _BABYLON.PhysicsImpostor_ и присвоить его свойству меша _physicsImpostor_.
Конструктор _PhysicsImpostor_ должен получить первым параметром сам меш,
вторым - вид тела для расчета физики, третим - миксин с физическими характеристиками,
четвертым, что привычно при работе с BabylonJS - объект сцены.

Смысл физических характеристик, которые мы указываем, ясен из названий:
_mass_ - масса тела (в кг),
_friction_ - коэффициент трения при соприкосновении с другими "rigid body",
_restitution_ - коэффициент сопротивления (попробуйте увеличить это число и вы увидите,
что увеличилась "прыгучесть").

Сейчас pacman все еще висит в воздухе. Это потому что мы указали нулевую массу.
После 

    this.physicsImpostor.setMass(1);

он начнет падать.

Есть несколько способов как перемещать или вращать меш с применением физического движка.  
Чтобы переместить меш, можно использовать метод "импостера" _setLinearVelocity_, например

    this.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, 1, 0));

Конечно, это не заставит тело двигаться с постоянной скоростью вверх, т.к. на него действует сила притяжения.

Для вращения существует аналогичный метод _setAngularVelocity_. Пример:

    this.physicsImpostor.setAngularVelocity(new BABYLON.Quaternion(0, 1, 0, 0));
    
Единственным аргументом метода является объект _BABYLON.Quaternion_.  
Теперь, кстати, для вращения PC мы будем использовать **кватернионы**.

Другим способом изменить положение тела является применение силы или импульса.
Чтобы применить импульс, нужно использовать метод _applyImpulse_, например:

    this.physicsImpostor.applyImpulse(new BABYLON.Vector3(0, 10, 0), this.getAbsolutePosition());

Первый параметр - вектор импульса, второй - место приложения вектора импульса.

Еще одним объектом, к которому нужно применить физику, является платформа. Иначе, pacman падает вниз сквозь нее.

    this.physicsImpostor = new BABYLON.PhysicsImpostor(
        this,
        BABYLON.PhysicsImpostor.BoxImpostor,
        { mass: 0, restitution: 0.2, friction: 0.5 },
        game.scene
    );

Конечно же, для блоков платформы нужно указать массу равной нулю.

Настала пора добавить управление pacman-ом. Обозначу основные моменты.  
Инициализацией управления занимается метод _Player.prototype.initControls_. 
Как было замечено выше, для вращения используется кватернион.  
При нажатии на клавиши, информация о нажатых клавишах сохраняется в массивах _directions_ и _rotations_ объекта _Player_.
Потом в каждом фрейме вызывается метод _Player.prototype.move_, который и изменяет позицию и вращение. Вызов метода _move_
помещен в callback метода сцены _registerBeforeRender_:

    this.scene.registerBeforeRender(function() {
        $this.player.move();
        if ($this.player.position.y < -20) {
            $this.level.reset();
        }
    });

Если pacman сваливается с платформы уровень сбрасывается и возвращается на начальную позицию.

Заменим камеру _FreeCamera_ на _FollowCamera_.

    var camera = new BABYLON.FollowCamera('camera', new BABYLON.Vector3(5, 10, -8), this.scene);
    camera.radius = 10;
    camera.heightOffset = 6;
    camera.rotationOffset = 180;

Эта камера будет следовать за pacman при его перемещениях. Но для этого нужно присвоить свойство _target_:

    this.scene.activeCamera.target = this.player;

Промежуточные результаты:
[демо](http://cube-sim.com/pacman3d/step3.html){:target="_blank"},  
[html](https://github.com/andyps/andyps.github.io/tree/master/demo/pacman3d/step3.html){:target="_blank"},  
[код класса игры](https://github.com/andyps/andyps.github.io/tree/master/demo/pacman3d/pacman3d-step3.js){:target="_blank"},  
[остальной код](https://github.com/andyps/andyps.github.io/tree/master/demo/pacman3d/step3){:target="_blank"}.

## Спрайтовое привидение

Создадим класс _Ghost_, который как и остальные объекты наследует класс _GameObject_. Но этот объект будет 
реализован на основе спрайтов.  
Спрайты можно использовать не только в двумерной графике, но и в трехмерной для реализации
различных эффектов, симуляции деревьев и т.п. Конечно же, BabylonJS можно использовать и для двумерных приложений и одним
из вспомогательных средств в BabylonJS являются спрайты. В последних версиях появился небольшой 2d-движок.

Чтобы использовать спрайты в BabylonJS, нужно создать вспомогательный менеджер спрайтов. В разбираемом коде это делается
в методе _pacman3d.prototype.init_ перед вызовом _run_:

    this.spriteManager = new BABYLON.SpriteManager('spriteManager', 'images/ghost.png', 10, 300, this.scene);

Самый главный параметр - это конечно же путь к спрайтовому изображению.  
Третий параметр - это максимальное количество экземпляров спрайта.  
Четвертый соответствует размеру одного изображения.

Привидение является мешом, а точнее кубом, но сам меш является невидимым, вместо этого к кубу мы привязываем спрайт 
таким образом (см. метод _Ghost.prototype.init_):

    this.sprite = new BABYLON.Sprite('enemy', game.spriteManager);
    this.sprite.position = this.position;
    this.sprite.playAnimation(0, 6, true, 150);

Как видно, конструктору _BABYLON.Sprite_ нужно передать, кроме имени, спрайтовый менеджер. Потом позиция спрайта привязывается
к позиции меша с помощью присваивания свойства _position_. После вызова _sprite.playAnimation_ начинает работать
анимация спрайта, картинки входящие в спрайт начинают сменять друг друга, начиная с самой первой под номером 0.  
Третий параметр со значением _true_ зацикливает анимацию. Четвертый - характеризует скорость анимации (чем меньше, тем быстрее).

Чтобы привидение двигалось и правильно выбирало дорогу, не падая вниз, я наделил его зачатками **AI** (см. файл _EnemyBrain.js_):

    this.ai = new EnemyBrain(this.game.currentLevel, mapCellZ, mapCellX);

Промежуточные результаты:
[демо](http://cube-sim.com/pacman3d/step4.html){:target="_blank"},  
[html](https://github.com/andyps/andyps.github.io/tree/master/demo/pacman3d/step4.html){:target="_blank"},  
[код класса игры](https://github.com/andyps/andyps.github.io/tree/master/demo/pacman3d/pacman3d-step4.js){:target="_blank"},  
[остальной код](https://github.com/andyps/andyps.github.io/tree/master/demo/pacman3d/step4){:target="_blank"}.

## Обработка коллизий, подсчет монеток и логика смены уровней

BabylonJS предоставляет встроенные средства для проверки коллизий. Каждый меш имеет свойство _showBoundingBox_.
Если его установить в _true_, вы увидите ограничивающий куб вокруг меша. Именно он и используется для расчета коллизий.

Проверка коллизий в нашем приложении запускается в каждом фрейме следующим кодом в _pacman3d.prototype.run_:

    this.scene.registerAfterRender(function() {
        $this.checkCollisions();
    });

Для проверки коллизий между мешами у каждого меша есть метод _intersectsMesh_. В этот метод нужно передать другой
меш, коллизиции с которым проверяются. Например, в следующем коде проверяются коллизии с мешами-привидениями:

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

Если происходит коллизия "pacman и привидение", уровень сбрасывается и игрок возвращается на первоначальную позицию.  
Если происходит коллизия "pacman и монетка", увеличивается счетчик собранных монеток и, если монеток не осталось, 
идет переходит на следующий уровень. Текущий уровень удаляется вызовом _this.level.eliminate();_, а новый создается.  
Обработка коллизий в главном классе игры:

    pacman3d.prototype.checkCollisions = function() {
        var eaten = this.level.checkEnemyCollisions();
        if (eaten) {
            this.level.reset();
            return;
        }
        this.level.checkCoinCollisions();
        if (this.level.isCompleted()) {
            this.nextLevel();
        }
    };

Кроме пересечения с другим мешом, можно проверить коллизию с точкой в пространстве (_BABYLON.Vector3_). Для этого у меша
есть метод _intersectsPoint_. Еще один схожий метод, а именно _intersects_ проверяет коллизию с лучом (см. класс _BABYLON.Ray_).  
_intersects_ возвращает немного интересной информации о пересечении, например точку пересечения (_pickedPoint_) и расстояние
между ней и началом луча (_distance_).

Еще один вид коллизий, который наверняка пригодится - это выбор объектов мышкой. Объект сцены имеет метод _pick_, 
которому нужно передать координаты указателя, например:

    var pickInfo = this.scene.pick(this.scene.pointerX, this.scene.pointerY);

В этом примере, _pickInfo_ содержит схожую с результатом _intersects_ информацию, включая _pickedMesh_ (меш, который выбран мышкой).

Функционал уже реализован, осталось приукрасить графику и добавить звуки:
[демо](http://cube-sim.com/pacman3d/step5.html){:target="_blank"},  
[html](https://github.com/andyps/andyps.github.io/tree/master/demo/pacman3d/step5.html){:target="_blank"},  
[код класса игры](https://github.com/andyps/andyps.github.io/tree/master/demo/pacman3d/pacman3d-step5.js){:target="_blank"},  
[остальной код](https://github.com/andyps/andyps.github.io/tree/master/demo/pacman3d/step5){:target="_blank"}.

## Материал и текстуры

Материал и текстуры - еще одни важнейшие элементы 3d-приложений, особенно игровых.  
Материал характеризует оптические свойства объектов. С помощью текстур мы можем имитировать поверхность
реальных предметов.

На данный момент все объекты, кроме привидений и осей координат раскрашены дефолтным серым цветом. Сейчас мы все раскрасим!

Начнем с главного игрового персонажа.

    var material = new BABYLON.StandardMaterial('player', game.scene);

_BABYLON.StandardMaterial_ является стандартным материалом BabylonJS. Конструктору этого класса нужно 
передать название материала и конкретную сцену. В дальнейшем этот материал можно достать с помощью метода 
_getMaterialByName_ сцены. Все остальное достигается путем использования соответствующих свойств материала.

    material.diffuseColor = material.ambientColor = new BABYLON.Color3(1, 1, 0);

Материал присваивается объекту очень просто

    this.material = material;

После этих действий pacman становится желтым. 

Раскрашиваем монетки

    var material = new BABYLON.StandardMaterial('coin', game.scene);
    material.diffuseColor = new BABYLON.Color3(1,1,1);
    material.emissiveColor = new BABYLON.Color3(1,1,1);

Итак, о некоторых свойства материалов.  
_diffuseColor_ - цвет объекта под светом или диффузный цвет (то есть на финальный цвет влияет цвет света),  
_emissiveColor_ - цвет объекта без источника света (то есть его продуцирует сам объект) или исходящий свет,  
_ambientColor_ - фоновый цвет объекта, т.е. цвет, на который влияет фоновый цвет сцены (свойство _scene.ambientColor_).
Фоновый свет - свет, который распределен или рассеян средой.  
_specularColor_ - зеркальный цвет, цвет отражения на поверхности объекта.  
Свойство _specularPower_ характеризует отражающие свойства материала.  
_alpha_ - прозрачность материала.  
Свойство _wireframe_, установленное в _true_ показывает каркас меша.  
С точки зрения производительности полезно выключить отображение текстур с обратной стороны поверхностей путем
присвоения _false_ свойству _backFaceCulling_.

Следующий код, демонстрирует некоторые дополнительные эффекты, которые можно реализовать в BabylonJS достаточно просто.

    material.emissiveFresnelParameters = new BABYLON.FresnelParameters();
    material.emissiveFresnelParameters.bias = 0.01;
    material.emissiveFresnelParameters.power = 2;
    material.emissiveFresnelParameters.leftColor = BABYLON.Color3.Black();
    material.emissiveFresnelParameters.rightColor = new BABYLON.Color3(1, 1, 1);

После этого монетки стали блестеть.

Что касается платформы, то для нее мы добавим текстуры

    this.material = new BABYLON.StandardMaterial('ground', game.scene);
    this.material.diffuseTexture = new BABYLON.Texture('images/ground1.jpg', game.scene);

Конструктору _BABYLON.Texture_ нужно передать путь к изображению текстуры и объект сцены, после чего 
присвоить полученную текстуру свойству _diffuseTexture_ материала.  
Кстати, для свойств материала _diffuseColor_, _emissiveColor_, _ambientColor_ и _specularColor_ существуют
аналогичные текстурные свойства с аналогичными различиями между ними:
_diffuseTexture_, _emissiveTexture_, _ambientTexture_ и _specularTexture_.

Из свойств текстур хочу обратить внимание на следующие:
_hasAlpha_ - установите в _true_ если текстура содержит alpha-канал,  
_uOffset_ и _vOffset_ - смещение в системе координат _(u, v)_ текстуры,
_uScale_ и _vScale_ - скейлинг текстуры вдоль осей _u_ и _v_.

Это конечно же не все возможности, которые предоставляет BabylonJS с помощью текстур.
Например, поддерживаются видеотекстуры (_BABYLON.VideoTexture_), имитация зеркал с помощью
_BABYLON.MirrorTexture_, **бамп маппинг** (см. свойство материала _bumpTexture_).

В нашей программе используется _skybox_ с помощью кубической текстуры для создания окружения:

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

## Звук

В заключение обзора добавим звуки к игре. Ниже пример как инициализируется звуковой объект (см. метод _pacman3d.prototype.initSounds_):

    new BABYLON.Sound('coin', 'audio/coin.ogg', this.scene, function() {
        // console.log('coin sound is ready');
    });

Инициализация звука не выделяется из подхода, прослеживаемого по всему фреймворку. В конструктор передаются:
имя, путь к файлу, объект сцены. Следующий параметр позволяет выполнить код после успешной загрузки файла.
Последним параметром можно указать дополнительные опции, например зациклить воспроизведение.

В нужных участках кода, когда нужно воспроизвести звуковой файл вызывается следующий метод:

    pacman3d.prototype.playSound = function(name) {
        if (!this.mute) {
            this.scene.getSoundByName(name).play();
        }
    };

Конечный результат:  
[демо](http://cube-sim.com/pacman3d/){:target="_blank"},  
[исходный код](https://github.com/andyps/andyps.github.io/tree/master/demo/pacman3d){:target="_blank"}.
