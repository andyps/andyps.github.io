import ARKitWrapper from './platform/ARKitWrapper.js'

const CUBE_SIZE = 0.1;
class App {
    constructor(canvasId) {
        this.isDebug = true;
        this.deviceId = null;
        
        this.clock = new THREE.Clock();
        this.initScene(canvasId);
        
        this.cubesNum = 0;
        this.cubesNames = 0;

        this.initAR();
        
        this.registerUIEvents();
        this.raycaster = new THREE.Raycaster();
    }
    initAR() {
        this.ar = ARKitWrapper.GetOrCreate({
            ui: {
                browser: true,
                points: true,
                focus: true,
                rec: true,
                rec_time: true,
                mic: true,
                build: true,
                plane: true,
                warnings: true,
                anchors: false,
                debug: true,
                statistics: this.isDebug
            }
        });
        this.ar.waitForInit().then(this.onARInit.bind(this));
        this.ar.addEventListener(ARKitWrapper.WATCH_EVENT, this.onARWatch.bind(this));
        
        this.ar.addEventListener(ARKitWrapper.ADD_ANCHOR_EVENT, this.onARAddObject.bind(this));
        this.ar.addEventListener(ARKitWrapper.HIT_TEST_EVENT, this.onARHitTest.bind(this));
        
        this.ar.addEventListener(ARKitWrapper.RECORD_START_EVENT, () => {
            document.querySelector('#btn-reset').style.display = 'none';
            document.querySelector('#btn-debug').style.display = 'none';
        });
        
        this.ar.addEventListener(ARKitWrapper.RECORD_STOP_EVENT, () => {
            // document.querySelector('#btn-reset').style.display = '';
            // document.querySelector('#btn-debug').style.display = '';
        });
        
        this.ar.addEventListener(ARKitWrapper.DID_MOVE_BACKGROUND_EVENT, () => {
            this.onARDidMoveBackground();
        });
        
        this.ar.addEventListener(ARKitWrapper.WILL_ENTER_FOREGROUND_EVENT, () => {
            this.onARWillEnterForeground();
        });
        
        this.ar.addEventListener(ARKitWrapper.INTERRUPTED_EVENT, () => {
            // this.showMessage('arkitInterrupted');
        });
        
        this.ar.addEventListener(ARKitWrapper.INTERRUPTION_ENDED_EVENT, () => {
            // this.showMessage('arkitInterruptionEnded');
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
        let geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
        let material = new THREE.MeshLambertMaterial({color: 0x7d4db2, reflectivity: 0, wireframe: false, opacity: 0.8});
        let cubeMesh = new THREE.Mesh(geometry, material);
        cubeMesh.name = name;
        
        return cubeMesh;
    }
    addObject() {

    }
    generateCubeName() {
        const name = 'obj-' + this.cubesNames;
        this.cubesNames++;
        return name;
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
        this.fpsStats.domElement.style.left = 'auto';
        this.fpsStats.domElement.style.right = '0px';
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
        this.cubesNames = 0;
        document.querySelector('#info-objectsCnt').textContent = 0;
    }

    reset() {
        const onStop = () => {
            this.ar.removeEventListener(ARKitWrapper.STOP_EVENT, onStop);
            this.cleanScene();
            this.watchAR();
        };
        this.ar.addEventListener(ARKitWrapper.STOP_EVENT, onStop);
        this.ar.stop();
    }
    
    registerUIEvents() {
        document.querySelector('#btn-add').addEventListener('click', () => {
            this.addObject();
        });          
        
        document.querySelector('#btn-set-options').addEventListener('click', () => {
            const frm = document.querySelector('#form-options');
            let options = {
                browser: frm.elements['opt-browser'].checked,
                points: frm.elements['opt-points'].checked,
                focus: frm.elements['opt-focus'].checked,
                rec: frm.elements['opt-rec'].checked,
                rec_time: frm.elements['opt-rec_time'].checked,
                mic: frm.elements['opt-mic'].checked,
                build: frm.elements['opt-build'].checked,
                plane: frm.elements['opt-plane'].checked,
                warnings: frm.elements['opt-warnings'].checked,
                anchors: frm.elements['opt-anchors'].checked,
                debug: frm.elements['opt-debug'].checked,
                statistics: frm.elements['opt-statistics'].checked
            };
            this.isDebug = options.debug;
            
            this.showMessage(JSON.stringify(options));
            
            this.ar.setUIOptions(options);
        });          
        
        document.querySelector('#btn-options').addEventListener('click', () => {
            document.querySelector('#area-options').style.display = '';
            document.querySelector('#info-debug').style.display = 'none';
            document.querySelector('#info-snapdebug').style.display = 'none';
        });        
        
        document.querySelector('#btn-stop').addEventListener('click', () => {
            this.ar.stop();
        });        
        
        document.querySelector('#btn-testMemoryWarningOnShot').addEventListener('click', () => {
            window.webkit.messageHandlers.testMemoryWarningOnShot.postMessage({
                test: true
            });
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
        
        this.mousePos = null;
        this.canvas.addEventListener('click', e => {
            let normX = e.clientX / window.innerWidth;
            let normY = e.clientY / window.innerHeight;
            
            this.mousePos = {x: 2 * normX - 1, y: -2 * normY + 1};
            
            this.ar.hitTest(normX, normY);
        });
        
        window.showDebug = (options) => {
            this.showMessage(JSON.stringify(options));
            
            let isOn = false;
            if (options && options.debug == "1") isOn = true;
            this.isDebug = isOn;
            
            if (!this.isDebug) {
                this.fpsStats.domElement.style.display = 'none';
            } else {
                this.fpsStats.domElement.style.display = '';
            }
        }
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
            objects: true
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
    onARHitTest(e) {
        let info;
        let planeResults = [];
        let planeExistingUsingExtentResults = [];
        let planeExistingResults = [];

        document.querySelector('#info-snapdebug').value = JSON.stringify(e.detail);
        
        if (Array.isArray(e.detail) && e.detail.length) {
            // search for planes
            planeResults = e.detail.filter(hitTestResult => hitTestResult.type != ARKitWrapper.HIT_TEST_TYPE_FEATURE_POINT);
            
            planeExistingUsingExtentResults = planeResults.filter(
                hitTestResult => hitTestResult.type == ARKitWrapper.HIT_TEST_TYPE_EXISTING_PLANE_USING_EXTENT
            );
            planeExistingResults = planeResults.filter(
                hitTestResult => hitTestResult.type == ARKitWrapper.HIT_TEST_TYPE_EXISTING_PLANE
            );
            
            if (planeExistingUsingExtentResults.length) {
                // existing planes using extent first
                planeExistingUsingExtentResults = planeExistingUsingExtentResults.sort((a, b) => a.distance - b.distance);
                info = planeExistingUsingExtentResults[0];
            } else if (planeExistingResults.length) {
                // then other existing planes
                planeExistingResults = planeExistingResults.sort((a, b) => a.distance - b.distance);
                info = planeExistingResults[0];
            } else if (planeResults.length) {
                // other types except feature points
                planeResults = planeResults.sort((a, b) => a.distance - b.distance);
                info = planeResults[0];
            } else {
                // feature points if any
                info = e.detail[0];
            }
        }
        
        let name = this.generateCubeName();
        let transform;
        
        let cameraPos;
        
        this.raycaster.setFromCamera(
            {x: this.mousePos.x, y: this.mousePos.y},
            this.camera
        );
        console.log('ray origin', this.raycaster.ray.origin);
        console.log('dir', this.raycaster.ray.direction);
        console.log('mousePos', this.mousePos);
        
        let newPos;
        if (info && false) {
            // if hit testing is positive
            transform = info.world_transform;
        } else {
            transform = new THREE.Matrix4();

            cameraPos = new THREE.Vector3();
            cameraPos.setFromMatrixPosition(this.camera.matrix);
            
            newPos = this.raycaster.ray.origin.clone();
            newPos.add(this.raycaster.ray.direction);
            
            // if hit testing is negative put object in arbitrary position
            //~ transform.makeTranslation(cameraPos.x, cameraPos.y, cameraPos.z - 1);
            transform.makeTranslation(newPos.x, newPos.y, newPos.z);
            transform = transform.toArray();
        }
        this.ar.addAnchor(
            name,
            transform
        );
        
        this.showMessage(JSON.stringify({
            newPos: newPos,
            cameraPos: typeof(cameraPos) != 'undefined' ? {x: cameraPos.x, y: cameraPos.y, z: cameraPos.z} : null,
            numberPlaneResult: planeResults.length,
            numberAll: info ? e.detail.length : 0,
            info: info ? {
                type: info.type,
                distance: info.distance,
                world_transform: info.world_transform
            } : null
        }));
    }
    onARAddObject(e) {
        const info = e.detail;
        const cubeMesh = this.createCube(info.uuid);
        
        //~ const axisHelper = new THREE.AxisHelper(45);
        //~ cubeMesh.add(axisHelper);

        cubeMesh.matrixAutoUpdate = false;

        info.transform[13] += CUBE_SIZE / 2;
        cubeMesh.matrix.fromArray(info.transform);
        
        this.scene.add(cubeMesh);
        this.cubesNum++;

        this.requestAnimationFrame();
        
        document.querySelector('#info-objectsCnt').textContent = this.cubesNum;
    }
    
    onARDidMoveBackground() {
        const onStopByMoving2Back = () => {
            this.ar.removeEventListener(ARKitWrapper.STOP_EVENT, onStopByMoving2Back);
            this.cleanScene();
        };
        this.ar.addEventListener(ARKitWrapper.STOP_EVENT, onStopByMoving2Back);
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
        /*
        const arObjects = this.ar.getData('objects');
        if (arObjects && arObjects.forEach) {
            arObjects.forEach(info => {
                // is it needed?
                const mesh = this.scene.getObjectByName(info.uuid);
                // mesh.matrix.fromArray(info.transform);
            });
        }
        */
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