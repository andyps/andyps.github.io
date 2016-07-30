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
    <script src="vendor/babylonjs/babylon.2.4.max.js"></script>
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


