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
        
        this.raycaster = new THREE.Raycaster();
        this.registerUIEvents();
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
            // do something when recording is started
        });
        
        this.ar.addEventListener(ARKitWrapper.RECORD_STOP_EVENT, () => {
            // do something when recording is stopped
        });
        
        this.ar.addEventListener(ARKitWrapper.DID_MOVE_BACKGROUND_EVENT, () => {
            this.onARDidMoveBackground();
        });
        
        this.ar.addEventListener(ARKitWrapper.WILL_ENTER_FOREGROUND_EVENT, () => {
            this.onARWillEnterForeground();
        });
        
        this.ar.addEventListener(ARKitWrapper.INTERRUPTED_EVENT, () => {
            // do something on interruption event
        });
        
        this.ar.addEventListener(ARKitWrapper.INTERRUPTION_ENDED_EVENT, () => {
            // do something on interruption event ended
        });
        
        this.ar.addEventListener(ARKitWrapper.SHOW_DEBUG_EVENT, e => {
            const options = e.detail;
            this.isDebug = options.debug == 1;
            if (!this.isDebug) {
                this.fpsStats.domElement.style.display = 'none';
            } else {
                this.fpsStats.domElement.style.display = '';
            }
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
    }

    registerUIEvents() {
        this.tapPos = {x: 0, y: 0};
        this.canvas.addEventListener('click', e => {
            let normX = e.clientX / window.innerWidth;
            let normY = e.clientY / window.innerHeight;
            
            this.tapPos = {x: 2 * normX - 1, y: -2 * normY + 1};
            
            this.ar.hitTest(normX, normY);
        });
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
        
        if (typeof(e) == 'object' && Array.isArray(e.detail) && e.detail.length) {
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
        if (info) {
            // if hit testing is positive
            transform = info.world_transform;
        } else {
            // if hit testing is negative put object at distance 1m from camera
            this.raycaster.setFromCamera(
                {x: this.tapPos.x, y: this.tapPos.y},
                this.camera
            );
            
            let objPos = this.raycaster.ray.origin.clone();
            objPos.add(this.raycaster.ray.direction);
            transform = new THREE.Matrix4();
            transform.makeTranslation(objPos.x, objPos.y, objPos.z);
            transform = transform.toArray();
        }
        
        this.ar.addAnchor(
            name,
            transform
        );
    }
    onARAddObject(e) {
        const info = e.detail;
        const cubeMesh = this.createCube(info.uuid);
        
        cubeMesh.matrixAutoUpdate = false;

        info.transform[13] += CUBE_SIZE / 2;
        cubeMesh.matrix.fromArray(info.transform);
        
        this.scene.add(cubeMesh);
        this.cubesNum++;

        this.requestAnimationFrame();
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
        
        this.requestAnimationFrame();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.app = new App('app-canvas');
});
