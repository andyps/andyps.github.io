const EARTH_RADIUS = 6371032;
const PI_180 = Math.PI / 180;

class App {
    constructor(canvasId) {
        this.isDebug = false;
        this.isARReady = false;
        this.isWatchingAR = false;
        this.deviceId = null;
        
        this.clock = new THREE.Clock();
        this.initScene(canvasId);
        
        this.cubesNum = 0;
        this.cubeProto = null;
        //~ this.createObjects();
        
        this.ar = new AR(this.onARInit.bind(this));
        
        this.registerEvents();
        
        this.initialARData = null;
        
        this.userLocation = null;
        this.initialLocation = null;
        this.diffLocation = {x: 0, y: 0, z: 0};
        
    }
    
    run() {
        let render = (time) => {
            this.render(time);
            window.requestAnimationFrame(render);
        };
        render();
    }
    createCube(name) {
        let geometry = new THREE.BoxGeometry(0.25, 0.25, 0.25);
        let material = new THREE.MeshLambertMaterial({color: 0x7d4db2, reflectivity: 0, wireframe: true});
        let cubeMesh = new THREE.Mesh(geometry, material);
        cubeMesh.name = name;
        
        return cubeMesh;
    }
    addObject() {
        if (!this.isARReady || !this.initialARData) {
            return;
        }
        const fromCamera = {x: -1, y: 0, z: -2};
        fromCamera.x += this.cubesNum - 1;
        
        const name = 'obj-' + this.cubesNum;
        //~ const cubeMesh = this.createCube(name);
        
        //~ cubeMesh.position.x = this.camera.position.x + fromCamera.x;
        //~ cubeMesh.position.y = this.camera.position.y + fromCamera.y;
        //~ cubeMesh.position.z = this.camera.position.z + fromCamera.z;
        
        //~ cubeMesh.position.x = 0;
        //~ cubeMesh.position.y = 0;
        //~ cubeMesh.position.z = -2;
        
        //~ this.scene.add(cubeMesh);
        //~ this.cubesNum++;
        
        //~ this.ar.addObject(cubeMesh.name, fromCamera.x, fromCamera.y, fromCamera.z, this.onARAddObject.bind(this));
        this.ar.addObject(name, 0, 0, -2, this.onARAddObject.bind(this));
        
        //~ this.requestAnimationFrame();
    }

    createObjects() {
        const cubeMesh = this.createCube('obj-0');
        
        //~ const axisHelper = new THREE.AxisHelper(45);
        //~ cubeMesh.add(axisHelper);
        
        cubeMesh.position.set(2, 0.5, -4);
        this.scene.add(cubeMesh);
        
        this.cubeProto = cubeMesh;
        this.cubesNum++;
    }
    
    initScene(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!Utils.isWebGLSupported(this.canvas)) {
            this.showError('Unfortunately your browser is not supported');
            return;
        }

        this.scene = new THREE.Scene();
        this.engine = new THREE.WebGLRenderer({
            antialias: true,
            canvas: this.canvas
        });

        let w = window.innerWidth;
        let h = window.innerHeight;
        let aspect = w / h;
        
        this.engine.setSize(w, h, true);
        
        this.engine.setClearColor('#000', 0);
        
        this.camera = new THREE.PerspectiveCamera(45, aspect, 1, 10000);
        //~ this.camera.position.set(-95, 95, 95);
        //~ this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        
        this.camera.position.set(0, 1.6, 0);
        this.camera.lookAt(new THREE.Vector3(0, 1.6, -100));

        this.scene.add(this.camera);
        
        let light = new THREE.PointLight(0xffffff, 2, 0);
        this.camera.add(light);
        
        this.camera.matrixAutoUpdate = false;
        
        //~ this.createOrbitCameraControls();
        
        this.fpsStats = new Stats();
        this.fpsStats.setMode(0);
        this.fpsStats.domElement.style.display = 'none';
        document.body.appendChild(this.fpsStats.domElement);
    }
    
    createOrbitCameraControls() {
        let controls = new THREE.OrbitControls(this.camera, this.canvas);
        controls.enablePan = false;
        controls.minPolarAngle = 0;
        controls.target.set(0, 0, 0);
        controls.zoomSpeed = 1.0;
        controls.rotateSpeed = 0.3;
        controls.keyPanSpeed = 7.0;

        controls.minDistance = 10;
        controls.maxDistance = 300;
        controls.minZoom = 1;
        controls.maxZoom = 100;

        controls.maxPolarAngle = 85 * PI_180;
        controls.enableRotate = true;
        
        this.cameraControls = controls;
    }
    
    resize() {
        // this.engine.setSize(window.innerWidth, window.innerHeight, true);
        // this.camera.aspect = window.innerWidth / window.innerHeight;
        // this.camera.updateProjectionMatrix();
    }
    
    toggleDebug() {
        this.isDebug = !this.isDebug;
        
        if (!this.isDebug) {
            document.querySelector('#info-container').style.display = 'none';
            this.fpsStats.domElement.style.display = 'none';
        } else {
            document.querySelector('#info-container').style.display = '';
            this.fpsStats.domElement.style.display = '';
        }
        
        this.ar.toggleDebug(this.isDebug);
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
        this.ar.stop(() => {
            this.cleanScene();
            this.isWatchingAR = false;
            this.watchAR();
        });
    }
    
    registerEvents() {
        window.addEventListener('resize', () => {
            this.resize();
        });
        
        document.querySelector('#btn-add').addEventListener('click', () => {
            this.addObject();
        });
        
        document.querySelector('#btn-debug').addEventListener('click', () => {
            this.toggleDebug();
        });
        
        document.querySelector('#btn-stop').addEventListener('click', () => {
            this.ar.stop();
        });
        
        document.querySelector('#btn-watch').addEventListener('click', () => {
            this.watchAR();
        });
        
        document.querySelector('#btn-reset').addEventListener('click', () => {
            this.reset();
        });

        document.querySelector('#btn-snapdebug').addEventListener('click', () => {
            document.querySelector('#info-snapdebug').value = document.querySelector('#info-location').value;
        });
    }
    
    requestAnimationFrame() {
        window.requestAnimationFrame(this.render.bind(this));
    }
    
    watchAR() {
        if (!this.isARReady || this.isWatchingAR) {
            return;
        }

        this.isWatchingAR = true;
        
        this.ar.watch(
            {
                location: true,
                camera: true,
                objects: true,
                debug: false,
                h_plane: true,
                hit_test_result: 'hit_test_plane'
                
            },
            this.onARWatch.bind(this)
        );
    }
    
    render(time) {
        if (!this.initialARData) {
            return;
        }
        let deltaTime = Math.max(0.001, Math.min(this.clock.getDelta(), 1));
        
        if (this.isDebug) {
            this.fpsStats.begin();
        }
        //~ this.cameraControls.update(deltaTime);
        
        this.camera.position.set(
            this.diffLocation.x,
            this.camera.position.y,
            this.diffLocation.z
        );
        
        this.engine.render(this.scene, this.camera);
        
        if (this.isDebug) {
            this.fpsStats.end();
        }
    }
    
    getARData(key, data) {
        if (!data) {
            data = this.ar.rawARData;
        }
        if (data && typeof(data[key]) != 'undefined') {
            return data[key];
        }
        return null;
    }
    
    onARAddObject(info) {
        const cubeMesh = this.createCube(info.name);
        
        //~ const axisHelper = new THREE.AxisHelper(45);
        //~ cubeMesh.add(axisHelper);
        //~ cubeMesh.position.x = 0;
        //~ cubeMesh.position.y = 3;
        //~ cubeMesh.position.z = -3;
        
        cubeMesh.matrixAutoUpdate = false;
        
        cubeMesh.matrix.fromArray(info.transform);
        
        this.scene.add(cubeMesh);
        this.cubesNum++;

        this.requestAnimationFrame();
        
        document.querySelector('#info-objectsCnt').textContent = this.cubesNum;
    }
    
    onARInit(deviceId) {
        this.deviceId = deviceId;
        this.isARReady = true;
        
        this.watchAR();
    }
    
    onARWatch(data) {
        if (!this.initialARData) {
            this.initialARData = this.ar.rawARData;
            this.userLocation = this.geo2Cartesian(this.initialARData.location);
            this.initialLocation = {
                x: this.userLocation.x,
                y: this.userLocation.y,
                z: this.userLocation.z
            }

            //~ this.run();
            
        } else {
            this.userLocation = this.geo2Cartesian(this.getARData('location'));
            this.diffLocation.x = this.userLocation.x - this.initialLocation.x;
            this.diffLocation.y = this.userLocation.y - this.initialLocation.y;
            this.diffLocation.z = this.userLocation.z - this.initialLocation.z;
        }
        
        const cameraProjectionMatrix = this.getARData('projection_camera');
        const cameraTransformMatrix = this.getARData('camera_transform');
        if (cameraProjectionMatrix && cameraTransformMatrix) {

            cameraProjectionMatrix[0] = 0.9942156119758434;
            cameraProjectionMatrix[5] = 1.7674940162428914;

            this.camera.projectionMatrix.fromArray(cameraProjectionMatrix);
            this.camera.matrix.fromArray(cameraTransformMatrix);
            //~ this.camera.updateMatrixWorld(true);
        }
        
        const arObjects = this.getARData('objects');
        if (arObjects && arObjects.forEach) {
            arObjects.forEach(info => {
                if (info.name !== 'obj-0') {
                    return;
                }
                
                const mesh = this.scene.getObjectByName(info.name);
                //~ mesh.matrixAutoUpdate = false;
                mesh.matrix.fromArray(info.transform);
            });
        }
        
        if (this.isDebug) {
            this.logDebugData(data);
        }
        
        this.requestAnimationFrame();
    }
    
    logDebugData(data) {
        const date = (new Date()).toTimeString();
        document.querySelector('#info-deviceId').textContent = this.deviceId;
        
        const arObjects = data.objects;
        let obj1Info = null;
        
        if (arObjects && arObjects.length) {
            
            for (let i = 0; i < arObjects.length; i++) {
                if (arObjects[i].name == 'obj-0') {
                    obj1Info = arObjects[i];
                    break;
                }
            }
        }
        
        const objPositions = [];
        this.scene.children.forEach(child => {
            if (child.name.substr(0, 3) !== 'obj') {
                return;
            }
            objPositions.push(child.getWorldPosition());
        });
        document.querySelector('#info-location').value = 
            'Camera:' + JSON.stringify(this.camera.getWorldPosition()) + "\n---\n" +
            'Size:' + JSON.stringify({
                w: window.innerWidth, h: window.innerHeight, a: window.innerWidth / window.innerHeight,
                sw: screen.width, sh: screen.height, sa: screen.width / screen.height
            })
            + "\n---\n" +
            'Positions:' + JSON.stringify(objPositions) + "\n---\n" +
            'FirstObjectData:' + JSON.stringify(obj1Info) + "\n---\n" +
            JSON.stringify(data) + ':' + date;
    }
    
    geo2Cartesian(location) {
        let x = EARTH_RADIUS * Math.cos(location.latitude) * Math.sin(location.longitude);
        let y = EARTH_RADIUS * Math.cos(location.latitude) * Math.cos(location.longitude);
        let z = EARTH_RADIUS * Math.sin(location.latitude);
        return {x: x, y: y, z: z};
    }
}

window.addEventListener('DOMContentLoaded', () => {
    console.log('loaded');
    window.app = new App('app-canvas');
});
