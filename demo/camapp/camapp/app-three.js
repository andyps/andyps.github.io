const EARTH_RADIUS = 6371032;
const PI_180 = Math.PI / 180;

class App {
    constructor(canvasId) {
        this.isDebug = false;
        
        this.clock = new THREE.Clock();
        this.initScene(canvasId);
        
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

    createObjects() {
        let geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        let material = new THREE.MeshLambertMaterial({color: 0x4d4db2, reflectivity: 0});
        let cubeMesh = new THREE.Mesh(geometry, material);
        cubeMesh.name = 'obj-1';
        
        let axisHelper = new THREE.AxisHelper(45);
        cubeMesh.add(axisHelper);
        
        cubeMesh.position.set(2, 0.5, -4);
        this.scene.add(cubeMesh);
        
        this.mesh = cubeMesh;
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
                        'location': true
                    },
                    this.onARWatch.bind(this)
                );
            } catch (e) {
                alert('Error: ' + e.message);
            }
        });
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
    
    getARData(key) {
        if (this.ar.rawARData && typeof(this.ar.rawARData[key]) != 'undefined') {
            return this.ar.rawARData[key];
        }
        return null;
    }
    
    onARInit(deviceId) {
        document.querySelector('#info-deviceId').textContent = deviceId;
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

            this.run();
            
        } else {
            this.userLocation = this.geo2Cartesian(this.getARData('location'));
            this.diffLocation.x = this.userLocation.x - this.initialLocation.x;
            this.diffLocation.y = this.userLocation.y - this.initialLocation.y;
            this.diffLocation.z = this.userLocation.z - this.initialLocation.z;
        }
        
        if (this.isDebug) {
            this.logDebugData(data);
        }
    }
    
    logDebugData(data) {
        const date = (new Date()).toTimeString();
        document.querySelector('#info-iniLocation').textContent = JSON.stringify(this.initialARData.location);
        document.querySelector('#info-iniLocation2d').textContent = JSON.stringify(this.initialLocation);
        
        document.querySelector('#info-location').value = JSON.stringify(this.diffLocation) + "\n"
            + JSON.stringify(data) + ':' + date;
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
