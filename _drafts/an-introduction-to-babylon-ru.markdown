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
мобильных устройств, геймпадов и устройств VR, анимационный движок, аудио движок, picking, встроенный обработчик коллизий,
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
_Player.js_ содержит класс _Player_, представляющий собой главного персонажа.  
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

Свойства __diffuse__ и __specular__, а также __intensity__ относятся ко всем классам источников света. Каждый свет
можно отключить / включить, вызвав метод __setEnabled(true/false)__.

Для лучшего ориентирования в сцене хорошая идея - отобразить оси мировой системы координат, что и делает метод _createWorldAxis_.

