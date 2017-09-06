import ARKitWrapper from './platform/ARKitWrapper.js'

class App {
    constructor(canvasId) {
        this.isDebug = false;
        this.deviceId = null;
        
        this.clock = new THREE.Clock();
        this.initScene(canvasId);
        
        this.cubesNum = 0;

        
        this.initAR();
        
        this.registerUIEvents();
    }
    initAR() {
        this.ar = ARKitWrapper.GetOrCreate();
        this.ar.waitForInit().then(this.onARInit.bind(this));
        this.ar.addEventListener(ARKitWrapper.WATCH_EVENT_NAME, this.onARWatch.bind(this));
        this.ar.addEventListener(ARKitWrapper.ADD_OBJECT_NAME, this.onARAddObject.bind(this));
        
        this.ar.addEventListener(ARKitWrapper.RECORD_START, () => {
            document.querySelector('#btn-reset').style.display = 'none';
            document.querySelector('#btn-debug').style.display = 'none';
        });
        
        this.ar.addEventListener(ARKitWrapper.RECORD_STOP, () => {
            document.querySelector('#btn-reset').style.display = '';
            document.querySelector('#btn-debug').style.display = '';
        });
        
        this.ar.addEventListener(ARKitWrapper.DID_MOVE_BACKGROUND, () => {
            this.onARDidMoveBackground();
        });
        
        this.ar.addEventListener(ARKitWrapper.WILL_ENTER_FOREGROUND, () => {
            this.onARWillEnterForeground();
        });
        
        this.ar.addEventListener(ARKitWrapper.INTERRUPTED, () => {
            this.showMessage('arkitInterrupted');
        });
        
        this.ar.addEventListener(ARKitWrapper.INTERRUPTION_ENDED, () => {
            this.showMessage('arkitInterruptionEnded');
        });
    }
    run() {
        let render = (time) => {
            this.render(time);
            window.requestAnimationFrame(render);
        };
        render();
    }
    createCube(name) {
        let geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        let material = new THREE.MeshLambertMaterial({color: 0x7d4db2, reflectivity: 0, wireframe: false});
        let cubeMesh = new THREE.Mesh(geometry, material);
        cubeMesh.name = name;
        
        return cubeMesh;
    }
    addObject() {
        const name = 'obj-' + this.cubesNum;
        this.ar.addObject(name, 0, 0, -1);
    }

    initScene(canvasId) {
        this.canvas = document.getElementById(canvasId);
        // use webgl1
        this.canvas.getContext('webgl');
        
        this.scene = new THREE.Scene();
        this.engine = new THREE.WebGLRenderer({
            antialias: true,
            canvas: this.canvas
        });
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        this.engine.setSize(this.width, this.height, false);
        
        this.engine.setClearColor('#000', 0);

        this.camera = new THREE.PerspectiveCamera(37.94, this.width / this.height, 0.001, 1000);
        
        this.camera.position.set(0, 1.6, 0);
        this.camera.lookAt(new THREE.Vector3(0, 1.6, -100));

        this.scene.add(this.camera);
        
        let light = new THREE.PointLight(0xffffff, 2, 0);
        this.camera.add(light);
        
        this.camera.matrixAutoUpdate = false;
        
        this.fpsStats = new Stats();
        this.fpsStats.setMode(0);
        this.fpsStats.domElement.style.display = 'none';
        document.body.appendChild(this.fpsStats.domElement);
    }
    
    toggleDebug() {
        this.isDebug = !this.isDebug;
        
        if (!this.isDebug) {
            this.fpsStats.domElement.style.display = 'none';
            document.querySelector('#info-container').style.display = 'none';
        } else {
            this.fpsStats.domElement.style.display = '';
            document.querySelector('#info-container').style.display = '';
        }
        
        this.ar.setDebugDisplay(this.isDebug);
    }
    
    cleanScene() {
        let children2Remove = [];

        this.scene.children.forEach(child => {
            if (!child.isCamera) {
                children2Remove.push(child);
            }
        });

        children2Remove.forEach(child => {
            child.parent.remove(child);
        });
        
        this.cubesNum = 0;
        document.querySelector('#info-objectsCnt').textContent = 0;
    }

    reset() {
        const onStop = () => {
            this.ar.removeEventListener(ARKitWrapper.STOP_EVENT_NAME, onStop);
            this.cleanScene();
            this.watchAR();
        };
        this.ar.addEventListener(ARKitWrapper.STOP_EVENT_NAME, onStop);
        this.ar.stop();
    }
    
    registerUIEvents() {
        document.querySelector('#btn-add').addEventListener('click', () => {
            this.addObject();
        });
        
        document.querySelector('#btn-debug').addEventListener('click', () => {
            this.toggleDebug();
        });
        
        document.querySelector('#btn-reset').addEventListener('click', () => {
            this.reset();
        });

        document.querySelector('#message').onclick = function() {
            this.style.display = 'none';
        }
        document.querySelector('#btn-snapdebug').addEventListener('click', () => {
            document.querySelector('#info-snapdebug').value = document.querySelector('#info-debug').value;
        });
    }
    
    showMessage(txt) {
        document.querySelector('#message').textContent = txt;
        document.querySelector('#message').style.display = 'block';
    }

    requestAnimationFrame() {
        window.requestAnimationFrame(this.render.bind(this));
    }
    
    watchAR() {
        this.ar.watch({
            location: true,
            camera: true,
            objects: true,
            debug: this.isDebug,
            h_plane: true,
            hit_test_result: 'hit_test_plane'
        });
    }
    
    render(time) {
        let deltaTime = Math.max(0.001, Math.min(this.clock.getDelta(), 1));
        
        if (this.isDebug) {
            this.fpsStats.begin();
        }
        
        this.engine.render(this.scene, this.camera);
        
        if (this.isDebug) {
            this.fpsStats.end();
        }
    }
    
    onARAddObject(e) {
        const info = e.detail;
        const cubeMesh = this.createCube(info.name);
        
        //~ const axisHelper = new THREE.AxisHelper(45);
        //~ cubeMesh.add(axisHelper);
        
        cubeMesh.matrixAutoUpdate = false;

        info.transform[13] += 0.2 / 2;
        cubeMesh.matrix.fromArray(info.transform);
        
        this.scene.add(cubeMesh);
        this.cubesNum++;

        this.requestAnimationFrame();
        
        document.querySelector('#info-objectsCnt').textContent = this.cubesNum;
    }
    
    onARDidMoveBackground() {
        const onStopByMoving2Back = () => {
            this.ar.removeEventListener(ARKitWrapper.STOP_EVENT_NAME, onStopByMoving2Back);
            this.cleanScene();
        };
        this.ar.addEventListener(ARKitWrapper.STOP_EVENT_NAME, onStopByMoving2Back);
        this.ar.stop();
    }
    
    onARWillEnterForeground() {
        this.watchAR();
    }
    
    onARInit() {
        this.deviceId = this.ar.deviceId;
        this.watchAR();
    }
    
    onARWatch() {
        const cameraProjectionMatrix = this.ar.getData('projection_camera');
        const cameraTransformMatrix = this.ar.getData('camera_transform');
        if (cameraProjectionMatrix && cameraTransformMatrix) {
            this.camera.projectionMatrix.fromArray(cameraProjectionMatrix);

            this.camera.matrix.fromArray(cameraTransformMatrix);
        }
        
        const arObjects = this.ar.getData('objects');
        if (arObjects && arObjects.forEach) {
            arObjects.forEach(info => {
                // is it needed?
                const mesh = this.scene.getObjectByName(info.name);
                // mesh.matrix.fromArray(info.transform);
            });
        }
        
        if (this.isDebug) {
            this.logDebugData();
        }
        
        this.requestAnimationFrame();
    }
    
    logDebugData() {
        let data = this.ar.getData();
        const date = (new Date()).toTimeString();
        
        // show data in debug layer
        const objPositions = [];
        this.scene.children.forEach(child => {
            if (child.name.substr(0, 3) !== 'obj') {
                return;
            }
            objPositions.push(child.getWorldPosition());
        });
        
        document.querySelector('#info-debug').value = JSON.stringify(data) + ':' + date;
    }
    
}

window.addEventListener('DOMContentLoaded', () => {
    window.app = new App('app-canvas');
});
