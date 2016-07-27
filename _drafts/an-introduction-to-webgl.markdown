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

### Шаг первый

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

После линкования нужно "принять к использованию" созданную программу, вызвав метод контекста **useProgram**

    this.prg = prg;
    this.gl.useProgram(this.prg);

На этом этапе программа успешно создана. Остается только передать в шейдеры все нужные данные.
Выглядит несколько громоздко, но зато гибко. Можно менять программы во время выполнения.
В этом же методе я добавил код для получения ссылок на используемые шейдерами переменные.
Получим ссылку на переменную _aPosition_ таким образом

    this.prg.aPosition = this.gl.getAttribLocation(this.prg, 'aPosition');

Т.е. ссылка будет храниться в _this.prg.aPosition_.

Приготовим куб, для чего создадим конструктор _CubeMesh_.

    function CubeMesh(vertices, indices) {
        this.vertices = new Float32Array(vertices);
        this.indices = new Uint8Array(indices);
        this.elementsCnt = indices.length;
        this.vbo = this.ibo = null;
    }

Этому объекту, как видно, нужно передать список _vertices_ (вершины) и _indices_ (индексы или номера вершин).

Удобно задавать геометрию в WebGL с помощью списка индексов.
В WebGL есть несколько режимов рисования, один из них - это рисование треугольниками.
Таким образом, чтобы нарисовать прямоугольник понадобится 2 треугольника.
Чтобы нарисовать куб нужно 12 треугольников.
Используя индексы, нам достаточно определить 8 вершин и передать графической системе координаты 
этих 8 вершин, т.е. массив из 24 чисел типа float для задания _vertices_ и 12 наборов по три
числа для передачи _indices_, т.е. дополнительно массив из 36 чисел типа integer.
Каждый индекс указывает на соответствующую вершину в массиве вершин.
Без индексов при использовании метода рисования _gl.TRIANGLES_ понадобится 
12 (кол-во треугольников) * 3 (три вершины) * 3 (3 координаты для каждой вершины) = 108 чисел типа float.

Начало системы координат находится в центре области рисования. Ось _Y_ направлена вверх, 
ось _X_ направлена вправо. Что касается оси _Z_, то тут можно выбирать на свой вкус.
WebGL не навязывает ни правостороннюю ни левостороннюю систему, хотя так называемая
усеченная система координат (**clip coordinate system**) является левосторонней.
В усеченной системе, все точки выходящие за отрезок [-1.0, 1.0] удаляются.
Все координаты в конце концов приводятся к усеченной системе координат.
В Three.js система координат правосторонняя (ось Z направлена на наблюдателя от экрана), как принято в большинстве программ OpenGL,
а в BabylonJS левосторонняя система (как долгое время было в DirectX).

    createCube: function() {
        var halfSize = 0.5;
        var vertices = [
            halfSize, halfSize, halfSize, // 0
            -halfSize, halfSize, halfSize, // 1
            -halfSize, -halfSize, halfSize, // 2
            halfSize, -halfSize, halfSize, // 3
            halfSize, halfSize, -halfSize, // 4
            -halfSize, halfSize, -halfSize, // 5
            -halfSize, -halfSize, -halfSize, // 6
            halfSize, -halfSize, -halfSize // 7
        ];
        var indices = [
            0, 1, 2, 0, 2, 3, // front
            4, 7, 6, 4, 6, 5, // back
            0, 4, 5, 0, 5, 1, // up
            3, 2, 6, 3, 6, 7, // down
            3, 7, 4, 3, 4, 0, // right
            1, 5, 6, 1, 6, 2, // left
        ];
        this.cubeMesh = new CubeMesh(vertices, indices);
    }

_halfSize_ здесь это половина размера куба. Покаместь мы задали координаты в усеченной системе.

После задания геометрии, нужно создать буферы памяти и поместить в них заготовленные данные (см. метод _initBuffers_).

    initBuffers: function() {
        this.cubeMesh.vbo = this.gl.createBuffer();
        this.cubeMesh.ibo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeMesh.vbo);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.cubeMesh.vertices, this.gl.STATIC_DRAW);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.cubeMesh.ibo);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.cubeMesh.indices, this.gl.STATIC_DRAW);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
    }

В следующем участке кода задаются некоторые параметры, такие как цвет области рисования и проверка теста глубины.

    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clearDepth(1.0);
    this.gl.enable(this.gl.DEPTH_TEST);

Окончательный вид конструктора:

    var Cube = function(canvasId) {
        this.canvas = document.getElementById(canvasId);
        var params = {antialias: true};
        this.gl = this.canvas.getContext('webgl', params) || this.canvas.getContext('experimental-webgl', params);
        if (!this.gl) {
            document.body.innerHTML = 'Unfortunately your browser is not supported';
            return;
        }
        if (!this.initProgram()) {
            return;
        }
        this.createCube();
        this.initBuffers();
        
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clearDepth(1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.renderLoop();
    };

В последней строчке конструктора идет вызов метода _renderLoop_, который вызывает _this.render()_.
В методе _render_ и происходит рисование.
_renderLoop_ вызывается в каждом фрейме с помощью _requestAnimationFrame_, также как и при использовании
2d контекста канваса.

Рассмотрим теперь метод _render_.
В нем сначала очищается область рисования, а точнее буфер цвета и глубины.

    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

Потом нужно активировать данные конкретного геометрического объекта. В нашем случае он один.

    this.gl.enableVertexAttribArray(this.prg.aPosition);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeMesh.vbo);
    this.gl.vertexAttribPointer(this.prg.aPosition, 3, this.gl.FLOAT, false, 0, 0);
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.cubeMesh.ibo);

Если используются индексы, то рисование производится методом drawElements контекста

    this.gl.drawElements(this.gl.TRIANGLES, this.cubeMesh.elementsCnt, this.gl.UNSIGNED_BYTE, 0);

На данном этапе нарисован красный куб, хотя мы видим квадрат из-за его расположения.
Можно было подобрать другие значения координат вершин, чтобы куб был повернут по другому.
Итак, имеем всего около 128 строк.
Что получилось на данный момент - [демо шаг 1](http://cube-sim.com/cube-native-step1.html){:target="_blank"}.

### Шаг второй - мировая система координат, вращающаяся камера

Перейдем к более удобной системе координат, она будет, кстати, правосторонняя.
Для этого создадим объект _Camera_. Камера будет ответственна за направление взгляда на сцену и 
за определение области видимости (**frustrum**), т.е. той области пространства за пределами, которой точки будут отброшены.
Это достигается путем матричных преобразований, поэтому нам понадобится вспомогательный объект _Matrix_.
Для удобства введем также объект _Vector_.

Камера будет использовать перспективную проекцию, т.е. frustrum выглядит как усеченная пирамида.
Конструктору будем передавать элемент canvas (используется для подсчета aspect ratio - отношения ширины кадра к высоте), 
угол обзора по оси y, расстояние до ближней и дальней плоскостей области видимости, а также позицию камеры в пространстве.
Камера смотрит на начало координат. 
Реализованную камеру программно можно вращать по поверхности сферы с центром 
в начале координат, а также перемещать. 

    this.camera = new Camera(this.canvas, 0.8 /* ~45.84deg */, 1, 260, new Vector(-95, 95, 95));

Матрицу преобразования камеры нужно передать в вершинный шейдер.
Эта матрица состоит из двух матриц: матрицы вида и матрицы проекции.
В данной программе в шейдер передаются обе матрицы отдельно и уже там они умножаются.
Теперь вершинный шейдер выглядит так:

    vxShader: [
        'attribute vec3 aPosition;',
        'uniform mat4 uPMatrix;',
        'uniform mat4 uVMatrix;',
        'void main(void) {',
            'vec4 vertex = vec4(aPosition, 1.0);',
            'gl_Position = uPMatrix * uVMatrix * vertex;',
       '}'
    ]

В _initProgram_ добавлены две строчки для получения ссылок на переменные:

    this.prg.uPMatrix = this.gl.getUniformLocation(this.prg, 'uPMatrix');
    this.prg.uVMatrix = this.gl.getUniformLocation(this.prg, 'uVMatrix');

Чтобы передать данные в шейдер, в методе _render_ добавлены такие две строчки перед прорисовкой сцены:

    this.gl.uniformMatrix4fv(this.prg.uPMatrix, false, this.camera.pMatrix.elements);
    this.gl.uniformMatrix4fv(this.prg.uVMatrix, false, this.camera.vMatrix.elements);

Поскольку сейчас используется камера, размеры куба можно увеличить, иначе он будет слишком маленький.
В css я внес некоторые изменения, теперь область рисования занимает всю клиентскую часть браузера.
Чтобы изображение оставалось пропорциональным добавлен метод _handleSize_, который вызывается 
при ресайзе окна и вначале работы программы.
Наконец, в _renderLoop_ перед вызовом метода _render_, добавим вызов _this.camera.update()_ с несколькими строчками, которые
обеспечивают вращение камеры вокруг начала координат и куба.

Итак, вращающийся куб готов (на самом деле вращается камера) - [демо шаг 2](http://cube-sim.com/cube-native-step2.html){:target="_blank"}.
Да, нам понадобилось почти три с половиной сотни строк, но выглядит это не как "страшные многие сотни".
Поэтому, считаю выражение в документации Three.js несколько преувеличенным.
Заметно, что часть кода легко выносится отдельно для повторного использования: объект
_Matrix_ для операций с матрицами, _Vector_ для операций с векторами, создание и компиляция шейдеров,
функционал камеры.

### Шаг третий - важность света

Добавим теперь простенькое освещение, которое придаст объем трехмерной сцене.
Будем использовать точечный источник цвета. Освещение в нашем случае будет вычисляться в 
вершинном шейдере. Вычисления во фрагментном шейдере дают более реалистичное затенение.
Таким образом, в вершинном шейдере вычислим цвет каждой вершины.
Чтобы передавать данные между шейдерами нужно использовать **varying**-переменные.
Цвет будет передаваться во фрагментный шейдер с помощью varying-переменной _vColor_.
Значения цвета при этом интерполируются.
В вершинный шейдер добавлен следующий участок кода:

    'vec4 color = vec4(0.3, 0.3, 0.7, 1.0);',
    'vec3 normal = vec3(uNMatrix * vec4(aNormal, 1.0));',
    'vec4 lightPos = vec4(uLightPosition, 1.0);',
    'vec3 lightRay = vertex.xyz - lightPos.xyz;',
    'float lambertTerm = max(dot(normalize(normal), -normalize(lightRay)), 0.0);',
    'vec3 diffuse = vec3(1.0, 1.0, 1.0) * color.rgb * lambertTerm;',
    'vec3 ambient = vec3(0.5, 0.5, 0.5) * color.rgb;',
    'vColor = vec4(ambient + diffuse, color.a);',
    
Как в вершинном, так и во фрагментном шейдере нужно объявить varying-переменную _vColor_.
В вершинном шейдере понадобится еще **uniform**-переменная _uLightPosition_ (позиция источника цвета), 
переменная-атрибут _aNormal_ (нормаль к вычисляемой вершине) и матрица нормалей _uNMatrix_.

    'uniform vec3 uLightPosition;',
    'varying vec4 vColor;',
    'attribute vec3 aNormal;',
    'uniform mat4 uNMatrix;',

Во фрагментном шейдере все остается просто:

    'precision mediump float;',
    'varying vec4 vColor;',
    'void main(void) {',
        'gl_FragColor = vColor;',
    '}'

Получаем ссылки на переменные в _initProgram_:

    this.prg.aNormal = this.gl.getAttribLocation(this.prg, 'aNormal');
    this.prg.uNMatrix = this.gl.getUniformLocation(this.prg, 'uNMatrix');
    this.prg.uLightPosition = this.gl.getUniformLocation(this.prg, 'uLightPosition');

В методе _render_ передаем информацию о позиции источника света и матрицу нормалей:

    this.gl.uniform3fv(this.prg.uLightPosition, this.light.position.toArray());
    this.gl.uniformMatrix4fv(this.prg.uNMatrix, false, this.nMatrix.elements);

Поскольку куб не двигается, в нашем случае его матрица нормалей будет всегда единичной матрицей и 
ее можно не использовать. Иначе, матрицу нормалей нужно пересчитывать для каждого 
освещаемого объекта на сцене при каждом перемещении.

Для передачи данных о нормалях нужно создать буфер нормалей. 
Конструктор _CubeMesh_ теперь принимает массив нормалей. В функции _initBuffers_
добавлено создание буфера нормалей,

    this.cubeMesh.nbo = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeMesh.nbo);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.cubeMesh.normals, this.gl.STATIC_DRAW);

а в функции _render_:

    this.gl.enableVertexAttribArray(this.prg.aNormal);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cubeMesh.nbo);
    this.gl.vertexAttribPointer(this.prg.aNormal, 3, this.gl.FLOAT, false, 0, 0);

И функция создания куба _createCube_ конечно же претерпела изменения, т.к. нужно задать массив нормалей:

    createCube: function() {
        var halfSize = 20;
        var vertices = [
            halfSize, halfSize, halfSize, -halfSize, halfSize, halfSize, -halfSize, -halfSize, halfSize, halfSize, -halfSize, halfSize, // 0-1-2-3 front 0 1 2 3
            halfSize, -halfSize, halfSize, halfSize, -halfSize, -halfSize, halfSize, halfSize, -halfSize, halfSize, halfSize, halfSize, // 3-7-4-0 right 4 5 6 7
            halfSize, halfSize, halfSize, halfSize, halfSize, -halfSize, -halfSize, halfSize, -halfSize, -halfSize, halfSize, halfSize, // 0-4-5-1 up 8 9 10 11
            -halfSize, halfSize, halfSize, -halfSize, halfSize, -halfSize, -halfSize, -halfSize, -halfSize, -halfSize, -halfSize, halfSize, // 1-5-6-2 left 12 13 14 15
            halfSize, -halfSize, halfSize, -halfSize, -halfSize, halfSize, -halfSize, -halfSize, -halfSize, halfSize, -halfSize, -halfSize, // 3-2-6-7 down 16 17 18 19
            halfSize, halfSize, -halfSize, halfSize, -halfSize, -halfSize, -halfSize, -halfSize, -halfSize, -halfSize, halfSize, -halfSize // 4-7-6-5 back 20 21 22 23
        ];
        var indices = [
            0, 1, 2, 0, 2, 3, // front
            4, 5, 6, 4, 6, 7, // right
            8, 9, 10, 8, 10, 11, // up
            12, 13, 14, 12, 14, 15, // left
            16, 17, 18, 16, 18, 19, // down
            20, 21, 22, 20, 22, 23 // back
        ];
        var normals = [
            0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, // front
            1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, // right
            0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // up
            -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // left
            0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, // down
            0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0 // back
        ];
        this.cubeMesh = new CubeMesh(vertices, indices, normals);
    }

Итого, добавилось еще около 50 строчек кода и освещение готово. Можно заметить, что благодаря
строчке

    this.light.position = this.camera.position;

источник света перемещается вместе с камерой - [демо](http://cube-sim.com/cube-native.html){:target="_blank"}.
