---
layout: post
title:  "Введение в WebGL"
date:   2016-07-25 12:00:00 +0300
categories: webgl
---
В данном обзоре мы создадим простую 3d-программу, используя **WebGL**. Сначала мы будем использовать
WebGL Api напрямую. Потом сделаем варианты на популярных WebGL-фреймворках **Three.js** и **BabylonJS**.

## Небольшое вступление

WebGL позволяет использовать в браузере преимущества аппаратного ускорения трехмерной графики
без установки плагинов. WebGL основана на **OpenGL ES 2.0**, которая в свою очередь базируется на спецификации OpenGL 2.0 и
используется на мобильных устройствах. Название "WebGL" можно интерпретировать как 
"_OpenGL для браузеров_".

В состав рабочей группы WebGL, разрабатывающей стандарт, входит 
некоммерческая организация [**Khronos Group**](https://www.khronos.org/webgl/){:target="_blank"}, а также
разработчики ведущих браузеров.

Первая версия WebGL была выпущена в 2011 году. На данный момент последней является версия 1.0.3, выпущенная в 2014, 
и ожидается выход версии 2.0. Версия 2.0 основана уже на **OpenGL ES 3.0** API.

Все популярные браузеры (Safari, Chrome, Firefox, IE, Edge) поддерживают WebGL, в том числе и на мобильных
устройствах. Позже всех включили поддержку WebGL в своих браузерах Apple и Microsoft:
Apple - начиная с Safari 8 в 2014 году, Microsoft - начиная с IE 11 в 2013 году.

## Используем WebGL Api напрямую

Даже если вы используете WebGL-фреймворк и не собираетесь участвовать в разработке оного, 
знания по WebGL необходимы для понимания того, что происходит в вашей
программе, для решения возникающих задач, в том числе проблем производительности.
И Three.js и BabylonJS предоставляют api низкого уровня, которое близко к использованию нативного api.
Иногда возникает потребность переписать / дописать часть кода фреймворка специально для
своего приложения.

Долгое время на официальном сайте Three.js можно было прочитать, что для рисования куба, используя
только нативные средства браузера, понадобилось бы написать сотни строк кода.
![three.js documentation screenshot](/images/threejsdoc-jan2016.png)

На самом деле нам действительно понадобится больше чем сотня строк, но все не так сложно как то там звучит.

Сначала создадим html. Нам нужен элемент canvas и его контекст "webgl".
Для поддержки устаревших версий браузеров, в частности Internet Explorer 11, нужно проверить контекст "experimental-webgl".  
HTML:

    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="UTF-8">
    <title>Cube - native WebGL</title>
    <style>
    html, body {
        overflow: hidden;
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
    }
    #appCanvas {
        width: 400px;
        height: 400px;
        touch-action: none;
    }
    </style>

    <script src="./cube-native-step1.js"></script>

    </head>
    <body>
        <canvas id="appCanvas" oncontextmenu="return false;">Browser not supported</canvas>
    </body>
    </html>

JavaScript:

    var Cube = function(canvasId) {
        this.canvas = document.getElementById(canvasId);
        var params = {antialias: true};
        this.gl = this.canvas.getContext('webgl', params) || this.canvas.getContext('experimental-webgl', params);
        if (!this.gl) {
            document.body.innerHTML = 'Unfortunately your browser is not supported';
            return;
        }
    };
    window.addEventListener('DOMContentLoaded', function() {
        window.cube = new Cube('appCanvas');
    });

Чтобы что-то нарисовать в WebGL, как и в любой программе OpenGL, необходимы шейдеры. По сути, шейдеры - это программы
на C-подобном языке, которые выполняются графической картой. Язык, используемый в шейдерах (shading language), ограничен и 
специально разработан для решения типичных графических задач, например матричных/векторных операций.
В WebGL используется язык шейдеров **OpenGL ES SL**.
Есть два типа шейдеров: вершинный (**vertex shader**) и фрагментный (**fragment shader**). Вершинный
используется в основном для описания геометрии. Он выполняется для каждой вершины, которую передали шейдеру.

Фрагментный шейдер выполняется для каждого фрагмента изображения (своего рода "пикселя"). Часть данных
фрагментный шейдер получает от вершинного шейдера и эти данные интерполируются. В основном он используется
для применения освещения, текстур. Его задача - определить цвет каждого фрагмента.

Как видно из кода ниже, цвет фрагмента определяется путем присвоения значения специальной переменной **gl_FragColor**.
В вершинном шейдере нужно присвоить значение специальной переменной **gl_Position** для задания координаты вершины.
При этом используются данные, которые передаются из javascript-части, т.е. в нашем случае - это переменная-атрибут aPosition.
Переменные _gl_FragColor_ и _gl_Position_ имеют специальное предназначение и их не нужно объявлять самому.

Вершинный шейдер, записанный в виде массива:

    vxShader: [
        'attribute vec3 aPosition;',
        'void main(void) {',
            'gl_Position = vec4(aPosition, 1.0);',
       '}'
    ],

Фрагментный шейдер в виде массива:

    fgShader: [
        'void main(void) {',
            'gl_FragColor = vec4(0.3, 0.3, 0.7, 1.0);',
        '}'
    ],

Т.к. шейдеры мы задали массивом, получим код вершинного шейдера таким образом 

    var shaderSrc = this.vxShader.join('\n');
    
Рассмотрим код функции _createShader_, которая создает и компилирует шейдер. Да, _компилирует_, а потом нас ждет и линкование.

    createShader: function(src, type) {
        var shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, src);
        this.gl.compileShader(shader);
        var compiled = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
        if (!compiled) {
            console.log(this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    },

Создание шейдера с указанием типа

    var shader = this.gl.createShader(type);

Указание кода шейдера

    this.gl.shaderSource(shader, src);

Компиляция шейдера

    this.gl.compileShader(shader);

После компиляции шейдера хорошо бы проверить статус компиляции и вывести информацию об ошибках, если таковые были.

    var compiled = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
    if (!compiled) {
        this.debugError(this.gl.getShaderInfoLog(shader));
        this.gl.deleteShader(shader);
        return null;
    }

Cозданный шейдер понадобится далее для создания объекта _WebGLProgram_ в методе _initProgram_.
Сначала метод _initProgram_ вызывает _createShader_, чтобы создать оба шейдера.

    initProgram: function() {
        var shaderSrc = this.vxShader.join('\n');
        var vxShader = this.createShader(shaderSrc, this.gl.VERTEX_SHADER);
        shaderSrc = this.fgShader.join('\n');
        var fgShader = this.createShader(shaderSrc, this.gl.FRAGMENT_SHADER);
        if (!vxShader || !fgShader) {
            return false;
        }
        ...

Потом создается программа WebGLProgram

    var prg = this.gl.createProgram();

Указываем оба скомпилированных шейдера:

    this.gl.attachShader(prg, vxShader);
    this.gl.attachShader(prg, fgShader);

И, наконец, обещанное линкование:

    this.gl.linkProgram(prg);

Хорошей практикой является проверка статуса линкования и логирование возможных ошибок.

    var linked = this.gl.getProgramParameter(prg, this.gl.LINK_STATUS);
    if (!linked) {
        console.log(this.gl.getProgramInfoLog(prg));
        this.gl.deleteProgram(prg);
        this.gl.deleteShader(fgShader);
        this.gl.deleteShader(vxShader);
        return false;
    }

И, наконец, после линкования нужно принять к использованию созданную программу, вызвав метод контекста **useProgram**

    this.prg = prg;
    this.gl.useProgram(this.prg);

На этом этапе программа успешно создана. Остается только передать в шейдеры все нужные данные.
Выглядит несколько громоздко, но зато гибко. Можно менять программы во время выполнения.
В этом же методе я добавил код для получения ссылок на используемые шейдерами переменные.
Получим ссылку на переменную _aPosition_ таким образом

    this.prg.aPosition = this.gl.getAttribLocation(this.prg, 'aPosition');

Т.е. ссылка будет храниться в _this.prg.aPosition_.

