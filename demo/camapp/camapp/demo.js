import ARKitWrapper from './platform/ARKitWrapper.js'


const CUBE_SIZE = 0.1;

class App {
    constructor(canvasId) {
        this.isDebug = true;
        this.deviceId = null;
        
        this.clock = new THREE.Clock();
        this.initScene(canvasId);
        
        this.cubesNum = 0;

        this.initAR();

        this.raycaster = new THREE.Raycaster();
        this.registerUIEvents();
    }

    initAR() {
        this.ar = ARKitWrapper.GetOrCreate();
        this.ar.init({
            ui: {
                arkit: {
                    statistics: this.isDebug,
                    plane: true,
                    focus: true,
                    anchors: true
                },
                custom: {
                    points: true,
                    rec: true,
                    rec_time: true,
                    mic: true,
                    build: true,
                    warnings: true,
                    debug: true
                }
            }
        }).then(this.onARInit.bind(this));

        this.ar.addEventListener(ARKitWrapper.WATCH_EVENT, this.onARWatch.bind(this));

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

        this.ar.addEventListener(ARKitWrapper.INTERRUPTION_EVENT, () => {
            // do something on interruption event
        });

        this.ar.addEventListener(ARKitWrapper.INTERRUPTION_ENDED_EVENT, () => {
            // do something on interruption event ended
        });

        this.ar.addEventListener(ARKitWrapper.MEMORY_WARNING_EVENT, () => {
            // do something on memory warning
        });

        this.ar.addEventListener(ARKitWrapper.ENTER_REGION_EVENT, (e) => {
            // do something when enter a region
            console.log('ENTER_REGION_EVENT', e.detail);
        });

        this.ar.addEventListener(ARKitWrapper.EXIT_REGION_EVENT, (e) => {
            // do something when leave a region
            console.log('EXIT_REGION_EVENT', e.detail);
        });

        this.ar.addEventListener(ARKitWrapper.SESSION_FAILS_EVENT, (e) => {
            // do something when the session fails
            console.log('SESSION_FAILS_EVENT', e.detail);
        });

        this.ar.addEventListener(ARKitWrapper.TRACKING_CHANGED_EVENT, (e) => {
            // do something when tracking status is changed
            console.log('TRACKING_CHANGED_EVENT', e.detail);
        });

        this.ar.addEventListener(ARKitWrapper.HEADING_UPDATED_EVENT, (e) => {
            // do something when heading is updated
            console.log('HEADING_UPDATED_EVENT', e.detail);
        });

        this.ar.addEventListener(ARKitWrapper.SIZE_CHANGED_EVENT, (e) => {
            // do something on viewport 'size changed' event
            this.showMessage('size updated' + JSON.stringify(e.detail));
        });

        this.ar.addEventListener(ARKitWrapper.PLAINS_ADDED_EVENT, (e) => {
            // do something when new plains appear
            console.log('PLAINS_ADDED_EVENT', e.detail);
        });

        this.ar.addEventListener(ARKitWrapper.PLAINS_REMOVED_EVENT, (e) => {
            // do something when plains are removed
            console.log('PLAINS_REMOVED_EVENT', e.detail);
        });

        this.ar.addEventListener(ARKitWrapper.ANCHORS_UPDATED_EVENT, (e) => {
            // do something when anchors are updated
            console.log('ANCHORS_UPDATED_EVENT', e.detail);
        });
        
        this.ar.addEventListener(ARKitWrapper.SHOW_DEBUG_EVENT, e => {
            return;
            const options = e.detail;
            this.isDebug = Boolean(options.debug);
            
            this.fpsStats.domElement.style.display = this.isDebug ? '' : 'none';
        });
    }

    createCube(name) {
        let geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
        let material = new THREE.MeshLambertMaterial({color: 0x7d4db2, reflectivity: 0, wireframe: false, opacity: 0.8});
        let cubeMesh = new THREE.Mesh(geometry, material);
        cubeMesh.name = name;
        
        return cubeMesh;
    }
    initScene(canvasId) {
        this.canvas = document.getElementById(canvasId);
        
        this.scene = new THREE.Scene();
        this.engine = new THREE.WebGLRenderer({
            antialias: true,
            canvas: this.canvas,
            alpha: true
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
    }

    registerUIEvents() {
        this.tapPos = {x: 0, y: 0};
        this.canvas.addEventListener('click', e => {
            let normX = e.clientX / window.innerWidth;
            let normY = e.clientY / window.innerHeight;
            
            this.tapPos = {x: 2 * normX - 1, y: -2 * normY + 1};
            
            this.ar.hitTest(normX, normY).then(data => this.onARHitTest(data)).catch(e => e);
        });
        
        document.querySelector('#message').onclick = function() {
            this.style.display = 'none';
        }
        document.querySelector('#btn-snapdebug').addEventListener('click', () => {
            document.querySelector('#info-snapdebug').value = document.querySelector('#info-debug').value;
        });
        document.querySelector('#btn-stop').addEventListener('click', () => {
            this.ar.stop().then(() => {
                //~ this.showMessage('Stopped!');
            });
        });
    }

    requestAnimationFrame() {
        window.requestAnimationFrame(this.render.bind(this));
    }
    
    watchAR() {
        this.ar.watch({
            location: {
                accuracy: ARKitWrapper.LOCATION_ACCURACY_HUNDRED_METERS
            },
            camera: true,
            anchors: true,
            planes: true,
            lightEstimate: true,
            heading: {
                accuracy: 360
            }
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
    onARHitTest(data) {
        let info;
        let planeResults = [];
        let planeExistingUsingExtentResults = [];
        let planeExistingResults = [];
document.querySelector('#info-snapdebug').value = 'RHitTest\n' + JSON.stringify(data);
        if (data.planes.length) {
            // search for planes
            planeResults = data.planes;
            
            planeExistingUsingExtentResults = planeResults.filter(
                hitTestResult => hitTestResult.point.type == ARKitWrapper.HIT_TEST_TYPE_EXISTING_PLANE_USING_EXTENT
            );
            planeExistingResults = planeResults.filter(
                hitTestResult => hitTestResult.point.type == ARKitWrapper.HIT_TEST_TYPE_EXISTING_PLANE
            );
            
            if (planeExistingUsingExtentResults.length) {
                // existing planes using extent first
                planeExistingUsingExtentResults = planeExistingUsingExtentResults.sort((a, b) => a.point.distance - b.point.distance);
                info = planeExistingUsingExtentResults[0].point;
            } else if (planeExistingResults.length) {
                // then other existing planes
                planeExistingResults = planeExistingResults.sort((a, b) => a.point.distance - b.point.distance);
                info = planeExistingResults[0].point;
            } else {
                // other plane types
                planeResults = planeResults.sort((a, b) => a.point.distance - b.point.distance);
                info = planeResults[0].point;
            }
        } else if (data.points.length) {
            // feature points if any
            info = data.points[0];
        }
//~ this.showMessage('hittest!:' + info.type + 'd:' + info.distance + 't:' + JSON.stringify(info.worldTransform));

        let transform;
        if (info) {
            // if hit testing is positive
            transform = info.worldTransform;
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
            transform = this.ar.createARMatrix(transform);
        }
        
        //~ transform = new THREE.Matrix4();
        //~ transform.makeTranslation(0, 1, 0);
        //~ transform = transform.toArray();
        //~ transform = this.ar.createARMatrix(transform);
        
        //~ transform = {
            //~ v0: {x: v0[0], y: v0[1], z: v0[2], w: v0[3]},
            //~ v1: {x: v1[0], y: v1[1], z: v1[2], w: v1[3]},
            //~ v2: {x: v2[0], y: v2[1], z: v2[2], w: v2[3]},
            //~ v3: {x: v3[0], y: v3[1], z: v3[2], w: v3[3]}
        //~ }
        this.ar.addAnchor(
            transform
        ).then(info => this.onARAddObject(info));
    }
    onARAddObject(info) {
//~ this.showMessage('onARAddObject:' + JSON.stringify(info));
        const cubeMesh = this.createCube(info.uuid);
        cubeMesh.matrixAutoUpdate = false;

        //~ info.world_transform[13] += CUBE_SIZE / 2;
        //~ info.worldTransform.v3.y += CUBE_SIZE / 2;
        cubeMesh.matrix.fromArray(this.ar.flattenARMatrix(info.worldTransform));
document.querySelector('#info-snapdebug').value = 'ADDobj\n\n' + JSON.stringify(info.worldTransform) + '\n\n' + JSON.stringify(this.ar.flattenARMatrix(info.worldTransform));
        this.scene.add(cubeMesh);
        this.cubesNum++;

        this.requestAnimationFrame();
    }
    
    onARDidMoveBackground() {
        //~ this.showMessage('onARDidMoveBackground!' + this.deviceId);
        this.ar.stop().then(() => {
            this.cleanScene();
        });
    }
    
    onARWillEnterForeground() {
        //~ this.showMessage('onARWillEnterForeground!');
        this.watchAR();
    }
    
    onARInit(e) {
        if (!this.ar.deviceInfo || !this.ar.deviceInfo.uuid) {
            return;
        }

        this.deviceId = this.ar.deviceInfo.uuid;

        this.showMessage('init' + JSON.stringify({
            'device': this.ar.deviceInfo,
            'window': {w: window.innerWidth, h: window.innerHeight}
        }));
        
        this.watchAR();
    }
    
    onARWatch() {
        const camera = this.ar.getData('camera');
        if (camera) {
            this.camera.projectionMatrix.fromArray(
                this.ar.flattenARMatrix(camera.projectionCamera)
            );
            this.camera.matrix.fromArray(
                this.ar.flattenARMatrix(camera.cameraTransform)
            );
        }

        if (this.isDebug) {
            this.logDebugData();
        }

        this.requestAnimationFrame();
    }
    
    showMessage(txt) {
        document.querySelector('#message').textContent = txt;
        document.querySelector('#message').style.display = 'block';
    }
    
    logDebugData(data) {
        data = data ? data : this.ar.getData();
        const date = (new Date()).toTimeString();
        
        let scale = new THREE.Vector3();
        let pos = new THREE.Vector3();
        let rotq = new THREE.Quaternion();
        this.camera.matrix.decompose(pos, rotq, scale);
        
        let rot = new THREE.Euler().setFromQuaternion(rotq);
        
        document.querySelector('#info-debug').value = JSON.stringify(data) + ':\n\n camerapos: \n'
            + JSON.stringify(this.camera.matrix.getPosition()) + '\n\nscale:\n'
            + JSON.stringify(scale) + '\n\n quaternion:\n'
            + JSON.stringify(rotq) + '\n\n RATation:\n'
            + JSON.stringify({x: rot.x * 180 / Math.PI, y: rot.y * 180 / Math.PI, z: rot.z * 180 / Math.PI}) + '\n\npos:\n'
            + JSON.stringify(pos) + '\n\n'
            + JSON.stringify({window: {w: window.innerWidth, h: window.innerHeight}}) + '\n'
            + date;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.app = new App('app-canvas');
});
