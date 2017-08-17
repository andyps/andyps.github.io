const EARTH_RADIUS = 6371032;
const PI_180 = Math.PI / 180;

class App {
    constructor(canvasId) {
        this.isDebug = false;
        this.isARReady = false;
        
        this.clock = new THREE.Clock();
        this.initScene(canvasId);
        
        this.cubesNum = 0;
        this.cubeProto = null;
        this.createObjects();
        
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
        let material = new THREE.MeshLambertMaterial({color: 0x7d4db2, reflectivity: 0});
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
        
        const axisHelper = new THREE.AxisHelper(45);
        cubeMesh.add(axisHelper);
        
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
        this.engine.setSize(window.innerWidth, window.innerHeight, true);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }
    registerEvents() {
        window.addEventListener('resize', () => {
            this.resize();
        });
        
        document.querySelector('#btn-add').addEventListener('click', () => {
            try {
                this.addObject();
            } catch(e) {
                alert('Error: ' + e.message);
            }
        });
        
        document.querySelector('#btn-debug').addEventListener('click', () => {
            this.isDebug = !this.isDebug;
            
            if (!this.isDebug) {
                document.querySelector('#info-container').style.display = 'none';
                this.fpsStats.domElement.style.display = 'none';
            } else {
                document.querySelector('#info-container').style.display = '';
                this.fpsStats.domElement.style.display = '';
            }
        });
        
        document.querySelector('#btn-stop').addEventListener('click', () => {
            this.ar.stop();
        });
        
        document.querySelector('#btn-watch').addEventListener('click', () => {
            try {
                this.ar.watch(
                    {
                        'location': true,
                        'camera': true,
                        'objects': true
                    },
                    this.onARWatch.bind(this)
                );
            } catch (e) {
                alert('Error: ' + e.message);
            }
        });
    }
    
    requestAnimationFrame() {
        window.requestAnimationFrame(this.render.bind(this));
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
        
        document.querySelector('#info-deviceId').textContent = 'obj0: ' + JSON.stringify(info);
        return;
        
        var info2 = {};
        try {
            for (var name in info) {
                info2.name = name;
                info2.transform = info[name];
                break;
            }
            
        } catch(e) {
            alert('error');
        }
        info = info2;
        
        document.querySelector('#info-deviceId').textContent = 'obj!: ' + JSON.stringify(info);
        
        const cubeMesh = this.createCube(info.name);
        
        const axisHelper = new THREE.AxisHelper(45);
        cubeMesh.add(axisHelper);
        
        cubeMesh.matrixAutoUpdate = false;
        
        cubeMesh.matrix.fromArray(info2.transform);
        //~ cubeMesh.position.x = 0;
        //~ cubeMesh.position.y = 1.6;
        //~ cubeMesh.position.z = -2;
        
        /*

[
0.9914429783821106,
-0.10326667129993439,
0.079854816198349,
0,

0.12760323286056519,
0.8956893682479858,
-0.4259788990020752,
0,

-0.0275356974452734,
0.4325235188007355,
0.9012021422386169,
0,
 
0.07370418310165405,
-0.8629032373428345,
-1.7984013557434082,
1
]




         */
        
        
        this.scene.add(cubeMesh);
        this.cubesNum++;

        this.requestAnimationFrame();
        //~ alert('Object added ' + info.name);
    }
    
    onARInit(deviceId) {
        document.querySelector('#info-deviceId').textContent = deviceId;
        this.isARReady = true;
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
            console.log('apply matrices',cameraProjectionMatrix,cameraTransformMatrix);
            this.camera.projectionMatrix.fromArray(cameraProjectionMatrix);
            this.camera.matrix.fromArray(cameraTransformMatrix);
            //~ this.camera.updateMatrixWorld(true);
        }
        
        
        if (this.isDebug) {
            this.logDebugData(data);
        }
        
        this.requestAnimationFrame();
    }
    
    logDebugData(data) {
        const date = (new Date()).toTimeString();
        document.querySelector('#info-iniLocation').textContent = JSON.stringify(this.initialARData.location);
        document.querySelector('#info-iniLocation2d').textContent = JSON.stringify(this.initialLocation);
        
        const objPositions = [];
        this.scene.children.forEach(child => {
            if (child.name.substr(0, 3) !== 'obj') {
                return;
            }
            objPositions.push(child.getWorldPosition());
            //~ objPositions.push(child.position);
        });
        document.querySelector('#info-location').value = 
            JSON.stringify(this.camera.position) + "\n---WP\n" +
            JSON.stringify(this.camera.getWorldPosition()) + "\n WP---\n" +
            JSON.stringify(objPositions) + "\n---\n" +
            JSON.stringify(this.diffLocation) + "\n---\n" +
            JSON.stringify(data) + ':' + date;
            
        document.querySelector('#info-objectsCnt').textContent = this.scene.children.length - 2;
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
