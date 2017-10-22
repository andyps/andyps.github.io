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
        
        //~ this.run();
    }
    run() {
        let render = (time) => {
            this.render(time);
            window.requestAnimationFrame(render);
        };
        render();
    }
    initAR() {
        this.ar = ARKitWrapper.GetOrCreate();
        this.ar.init({
            ui: {
                arkit: {
                    statistics: this.isDebug,
                    plane: true,
                    focus: true,
                    anchors: true,
                    points: false
                },
                custom: {
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
            this.addMessage('resized:' + JSON.stringify(e.detail));
            this.resize(e.detail.size.width, e.detail.size.height);
        });

        this.ar.addEventListener(ARKitWrapper.PLAINS_ADDED_EVENT, (e) => {
            // do something when new plains appear
            console.log('PLAINS_ADDED_EVENT', e.detail);
        });

        this.ar.addEventListener(ARKitWrapper.PLAINS_REMOVED_EVENT, (e) => {
            // do something when plains are removed
            console.log('PLAINS_REMOVED_EVENT', e.detail);
        });

        this.updateAnchors = false;
        this.updateAnchorsUuid = null;
        this.ar.addEventListener(ARKitWrapper.ANCHORS_UPDATED_EVENT, (e) => {
            // do something when anchors are updated
            console.log('ANCHORS_UPDATED_EVENT', e.detail);
            //~ this.addMessage('updateanchors:' +  e.detail.planes.length + ' a:' + e.detail.anchors.length);
        });
        
        this.ar.addEventListener(ARKitWrapper.LOCATION_UPDATED_EVENT, (e) => {
            // do something when location is updated
            console.log('LOCATION_UPDATED_EVENT', e.detail);
        });
        
        this.ar.addEventListener(ARKitWrapper.SHOW_DEBUG_EVENT, e => {
            const options = e.detail;
            this.isDebug = Boolean(options.debug);
            
            this.fpsStats.domElement.style.display = this.isDebug ? '' : 'none';
        });
        
        this.ar.addEventListener(ARKitWrapper.ORIENTATION_CHANGED_EVENT, (e) => {
            // do something when orientation is updated
            this.addMessage('orientation:' + JSON.stringify(e.detail) + 'window: ' + window.innerWidth);
            
            
        });
        
    }

    createCube(name, origin) {
        let geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
        let color = 0x7d4db2;
        if (origin) {
            color = 0x00ff00;
        }
        let material = new THREE.MeshLambertMaterial({color: color, reflectivity: 0, wireframe: false, opacity: 0.8});
        let cubeMesh = new THREE.Mesh(geometry, material);
        cubeMesh.name = name;
        
        return cubeMesh;
    }
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.engine.setSize(width, height, true);
    }
    initScene(canvasId) {
        this.canvas = document.getElementById(canvasId);
        
        this.scene = new THREE.Scene();
        this.engine = new THREE.WebGLRenderer({
            antialias: true,
            canvas: this.canvas,
            alpha: true
        });
        this.resize(window.innerWidth, window.innerHeight);
        
        this.engine.setClearColor('#000', 0);

        this.camera = new THREE.PerspectiveCamera(37.94, this.width / this.height, 0.001, 1000);
        
        this.camera.position.z = 10;
        this.camera.position.set(0, 1.6, 0);
        this.camera.lookAt(new THREE.Vector3(0, 1.6, -100));

        this.scene.add(this.camera);
        
        this.root = new THREE.Object3D();
        
        //~ let axis = new THREE.AxisHelper(100);
        //~ axis.name = 'axis';
        //~ this.scene.add(axis);
        //~ this.axis = axis;
        //~ axis.matrixAutoUpdate = false;
        
        this.scene.add(this.root);
        
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
            let normX = e.clientX / this.width;
            let normY = e.clientY / this.height;
            
            this.tapPos = {x: 2 * normX - 1, y: -2 * normY + 1};
            
            this.ar.hitTest(normX, normY).then(data => this.onARHitTest(data)).catch(e => e);
        });
        
        document.querySelector('#message').onclick = function() {
            this.style.display = 'none';
            this.innerHTML = '';
        }
        
        document.querySelector('#btn-snapdebug').addEventListener('click', () => {
            document.querySelector('#info-snapdebug').value = document.querySelector('#info-debug').value;
        });
        
        document.querySelector('#btn-options').addEventListener('click', () => {
            document.querySelector('#area-options').style.display = '';
            document.querySelector('#info-debug').style.display = 'none';
            document.querySelector('#info-snapdebug').style.display = 'none';
        });
        
        document.querySelector('#btn-set-options').addEventListener('click', () => {
            const frm = document.querySelector('#form-options');
            let options = {
                arkit: {
                    statistics: frm.elements['opt-statistics'].checked,
                    plane: frm.elements['opt-plane'].checked,
                    focus: frm.elements['opt-focus'].checked,
                    anchors: frm.elements['opt-anchors'].checked,
                    points: frm.elements['opt-points'].checked
                },
                custom: {
                    browser: frm.elements['opt-browser'].checked,
                    rec: frm.elements['opt-rec'].checked,
                    rec_time: frm.elements['opt-rec_time'].checked,
                    mic: frm.elements['opt-mic'].checked,
                    build: frm.elements['opt-build'].checked,
                    warnings: frm.elements['opt-warnings'].checked,
                    debug: frm.elements['opt-debug'].checked
                }
            };
            this.isDebug = options.debug;
            
            this.showMessage('options:' + JSON.stringify(options));
            
            this.ar.setUIOptions(options).then(() => { console.log('options are set'); }).catch(e => { 
                console.log('cannot set options');
                this.showMessage('cannot set options: ' + JSON.stringify(e))
            });
        });
        
        this.rot = 0;
        document.querySelector('#btn-rotate1').addEventListener('click', () => {
            //~ let rot = this.rot + 90;
            //~ if (rot >= 360) {
                //~ rot = 0;
            //~ }
            //~ this.rot = rot;
            
            //~ this.canvas.style.transform = 'rotate(' + this.rot + 'deg)';
            //~ this.canvas.style.position = 'relative';
            //~ this.canvas.style.left = -this.width/2 + this.height/2 + 'px';
            
            //~ this.canvas.style.top = this.width/2 - this.height/2 + "px";
            
            //~ this.canvas.style.width = this.width + "px";
            //~ this.canvas.style.height = this.height + "px";
            
            //~ document.querySelector('#btn-rotate1').innerHTML = '+Rot:' + this.rot;
            //~ document.querySelector('#btn-rotate2').innerHTML = '-Rot:' + this.rot;

            //~ return;
            let rotZ = this.root.rotation.z * 180 / Math.PI + 90;
            if (rotZ >= 360) {
                rotZ = 0;
            } else {
                rotZ = this.root.rotation.z + Math.PI / 2;
            }
            
            this.root.rotation.z = rotZ;
            
            document.querySelector('#btn-rotate1').innerHTML = '+Rot:' + Math.round(this.root.rotation.z * 180 / Math.PI);
            document.querySelector('#btn-rotate2').innerHTML = '-Rot:' + Math.round(this.root.rotation.z * 180 / Math.PI);
        });
        document.querySelector('#btn-rotate2').addEventListener('click', () => {
            //~ let rot = this.rot - 90;
            //~ if (rot <= -360) {
                //~ rot = 0;
            //~ }
            //~ this.rot = rot;
            
            //~ this.canvas.style.transform = 'rotate(' + this.rot + 'deg)';
            //~ this.canvas.style.position = 'relative';
            //~ this.canvas.style.left = -this.width/2 + this.height/2 + 'px';
            //~ this.canvas.style.top = this.width/2 - this.height/2 + "px";

            //~ this.canvas.style.width = this.width + "px";
            //~ this.canvas.style.height = this.height + "px";

            //~ document.querySelector('#btn-rotate1').innerHTML = '+Rot:' + this.rot;
            //~ document.querySelector('#btn-rotate2').innerHTML = '-Rot:' + this.rot;


            //~ return;
            let rotZ = this.root.rotation.z * 180 / Math.PI - 90;
            if (rotZ <= -360) {
                rotZ = 0;
            } else {
                rotZ = this.root.rotation.z - Math.PI / 2;
            }
            
            this.root.rotation.z = rotZ;
            
            document.querySelector('#btn-rotate1').innerHTML = '+Rot:' + Math.round(this.root.rotation.z * 180 / Math.PI);
            document.querySelector('#btn-rotate2').innerHTML = '-Rot:' + Math.round(this.root.rotation.z * 180 / Math.PI);
        });
        
        document.querySelector('#btn-def').addEventListener('click', () => {
            
            let transform = new THREE.Matrix4();
            transform = transform.toArray();
            transform = this.ar.createARMatrix(transform);

            this.ar.addAnchor(
                null,
                transform
            ).then(info => {
                const cubeMesh = this.createCube(info.uuid, true);
                cubeMesh.matrixAutoUpdate = false;

                this.showMessage('add:' + JSON.stringify(info));
                
                cubeMesh.matrix.fromArray(this.ar.flattenARMatrix(info.transform));
                this.root.add(cubeMesh);
                this.cubesNum++;

                let axis = new THREE.AxisHelper(100);
                axis.matrixAutoUpdate = false;
                cubeMesh.add(axis);

                this.requestAnimationFrame();
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
        this.ar.addAnchor(
            null,
            transform
        ).then(info => this.onARAddObject(info));
    }
    onARAddObject(info) {
        const cubeMesh = this.createCube(info.uuid);
        cubeMesh.matrixAutoUpdate = false;

        this.showMessage('add:' + JSON.stringify(info));
        
        info.transform.v3.y += CUBE_SIZE / 2;
        cubeMesh.matrix.fromArray(this.ar.flattenARMatrix(info.transform));
        this.root.add(cubeMesh);
        this.cubesNum++;

        let axis = new THREE.AxisHelper(100);
        axis.matrixAutoUpdate = false;
        cubeMesh.add(axis);

        this.requestAnimationFrame();
    }
    
    onARDidMoveBackground() {
        this.ar.stop().then(() => {
            this.cleanScene();
        });
    }
    
    onARWillEnterForeground() {
        this.watchAR();
    }
    
    onARInit(e) {
        this.showMessage('G' + JSON.stringify(e));
        if (!this.ar.deviceInfo || !this.ar.deviceInfo.uuid) {
            return;
        }
        
        this.deviceId = this.ar.deviceInfo.uuid;

        this.resize(
            this.ar.deviceInfo.viewportSize.width,
            this.ar.deviceInfo.viewportSize.height
        );
        
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
    
    logDebugData() {
        let data = this.ar.getData();
        const date = (new Date()).toTimeString();
        
        const rot = this.camera.getWorldRotation();
        const camera = {
            pos: this.camera.getWorldPosition(),
            rot: {
                o: rot.order,
                x: rot.x * 180 / Math.PI,
                y: rot.y * 180 / Math.PI,
                z: rot.z * 180 / Math.PI
            },
            dir: this.camera.getWorldDirection(),
            s: this.camera.getWorldScale()
        };
        document.querySelector('#info-debug').value = JSON.stringify(camera) + '\n---\n' +
            JSON.stringify(data) + ':' + date;
    }
    showMessage(txt) {
        document.querySelector('#message').textContent = txt;
        document.querySelector('#message').style.display = 'block';
    }
    addMessage(txt) {
        document.querySelector('#message').style.display = 'block';
        document.querySelector('#message').innerHTML += '<br>';
        document.querySelector('#message').innerHTML += txt;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.app = new App('app-canvas');
});
