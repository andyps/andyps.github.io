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
        
        this.ar = new AR(this.onARInit.bind(this));
        
        this.registerEvents();
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
        let material = new THREE.MeshLambertMaterial({color: 0x7d4db2, reflectivity: 0, wireframe: true});
        let cubeMesh = new THREE.Mesh(geometry, material);
        cubeMesh.name = name;
        
        return cubeMesh;
    }
    addObject() {
        if (!this.isARReady) {
            return;
        }
        const name = 'obj-' + this.cubesNum;
        this.ar.addObject(name, 0, 0, -1, this.onARAddObject.bind(this));
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
        document.querySelector('#btn-add').addEventListener('click', () => {
            this.addObject();
        });
        
        document.querySelector('#btn-debug').addEventListener('click', () => {
            this.toggleDebug();
        });
        
        document.querySelector('#btn-reset').addEventListener('click', () => {
            this.reset();
        });

        // <temporal solution>
        window.onStartRecording = () => {
            document.querySelector('#btn-reset').style.display = 'none';
            document.querySelector('#btn-debug').style.display = 'none';
        }
        window.onStopRecording = () => {
            document.querySelector('#btn-reset').style.display = '';
            document.querySelector('#btn-debug').style.display = '';
        }
        
        window.didMoveBackground = () => {
            this.onARDidMoveBackground();
        }
        window.willEnterForeground = () => {
            this.onARWillEnterForeground();
        }
        
        document.querySelector('#btn-snapdebug').addEventListener('click', () => {
            document.querySelector('#info-snapdebug').value = document.querySelector('#info-debug').value;
        });
        document.querySelector('#input-fov').addEventListener('change', (e) => {
            this.fov = e.target.value;
        });
        // </temporal solution>
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
                debug: this.isDebug,
                h_plane: true,
                hit_test_result: 'hit_test_plane'
                
            },
            this.onARWatch.bind(this)
        );
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
        
        cubeMesh.matrixAutoUpdate = false;

        info.transform[13] += 0.2 / 2;
        cubeMesh.matrix.fromArray(info.transform);
        
        this.scene.add(cubeMesh);
        this.cubesNum++;

        this.requestAnimationFrame();
        
        document.querySelector('#info-objectsCnt').textContent = this.cubesNum;
    }
    
    onARDidMoveBackground() {
        this.ar.stop(() => {
            this.cleanScene();
            this.isWatchingAR = false;
        });
    }
    
    onARWillEnterForeground() {
        this.watchAR();
    }
    
    onARInit(deviceId) {
        this.deviceId = deviceId;
        this.isARReady = true;
        this.watchAR();
    }
    
    onARWatch(data) {
        const cameraProjectionMatrix = this.getARData('projection_camera');
        const cameraTransformMatrix = this.getARData('camera_transform');
        if (cameraProjectionMatrix && cameraTransformMatrix) {
            
            if (this.fov) {
                let aspect = 1.775;
                aspect = this.width / this.height;
                cameraProjectionMatrix[5] = 1 / Math.tan(Math.PI * this.fov / 360);
                cameraProjectionMatrix[0] = cameraProjectionMatrix[5] / aspect;
            }
            
            this.camera.projectionMatrix.fromArray(cameraProjectionMatrix);

            this.camera.matrix.fromArray(cameraTransformMatrix);
        }
        
        const arObjects = this.getARData('objects');
        if (arObjects && arObjects.forEach) {
            arObjects.forEach(info => {
                // is it needed?
                const mesh = this.scene.getObjectByName(info.name);
                // mesh.matrix.fromArray(info.transform);
            });
        }
        
        if (this.isDebug) {
            this.logDebugData(data);
        }
        
        this.requestAnimationFrame();
    }
    
    logDebugData(data) {
        const date = (new Date()).toTimeString();
        
        // show data in debug layer
        const objPositions = [];
        this.scene.children.forEach(child => {
            if (child.name.substr(0, 3) !== 'obj') {
                return;
            }
            objPositions.push(child.getWorldPosition());
        });
        
        document.querySelector('#info-debug').value = 
            'Camera:' + JSON.stringify(this.camera.getWorldPosition()) + "\n---\n" +
            'S:' + JSON.stringify({
                w: window.innerWidth, h: window.innerHeight, a: window.innerWidth / window.innerHeight,
                sw: screen.width, sh: screen.height, sa: screen.width / screen.height,
                p: window.devicePixelRatio, cw: this.canvas.width, ch: this.canvas.height,
                fovy: this.fov
            })
            + "\n---\n" +
            'Positions:' + JSON.stringify(objPositions) + "\n---\n" +
            JSON.stringify(data) + ':' + date;
    }
    
}

window.addEventListener('DOMContentLoaded', () => {
    window.app = new App('app-canvas');
});
