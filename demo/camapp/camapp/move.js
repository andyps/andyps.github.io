import ARKitWrapper from './platform/ARKitWrapper.js'

const CUBE_SIZE = 0.1;

class App {
    constructor(canvasId) {
        this.isDebug = true;
        this.deviceId = null;
        this.cubesNum = 0;
        
        this.clock = new THREE.Clock();
        this.initScene(canvasId);
        
        this.initAR();

        this.raycaster = new THREE.Raycaster();
        this.registerUIEvents();
        
        this.orientation = null;
        this.fixOrientationMatrix = new THREE.Matrix4();
        this.orientationAngle = 0;
        
        this.run();
        
        this.pickableMeshes = null;
        this.mouseDown = null;
        this.mousePos = null;
        this.moveSpeed = 0.001;
        this.scaleSpeed = 0.1;
        this.cameraBasis = null;
        this.touches = null;
        this.pickInfo = null;
        // this.startTouches = null;
        // this.startTouchTime = 0;
        this.scaleDistance = 0;
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

        //~ this.ar.addEventListener(ARKitWrapper.WATCH_EVENT, this.onARWatch.bind(this));

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

        this.ar.addEventListener(ARKitWrapper.ANCHORS_UPDATED_EVENT, (e) => {
            // do something when anchors are updated
            console.log('ANCHORS_UPDATED_EVENT', e.detail);
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
        
        this.ar.addEventListener(ARKitWrapper.ORIENTATION_CHANGED_EVENT, e => {
            this.updateOrientation(e.detail.orientation);
        });
    }

    updateOrientation(orientation) {
        this.orientation = orientation;
        switch (this.orientation) {
            case ARKitWrapper.ORIENTATION_PORTRAIT:
                this.orientationAngle = Math.PI / 2;
                break;
            case ARKitWrapper.ORIENTATION_UPSIDE_DOWN:
                this.orientationAngle = -Math.PI / 2;
                break;
            case ARKitWrapper.ORIENTATION_LANDSCAPE_LEFT:
                this.orientationAngle = -Math.PI;
                break;
            default:
                this.orientationAngle = 0;
                break;
        }
    }

    createCube(name) {
        let geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
        let material = new THREE.MeshLambertMaterial({color: 0x7d4db2, reflectivity: 0, wireframe: false, opacity: 0.8});
        let cubeMesh = new THREE.Mesh(geometry, material);
        cubeMesh.name = name;
        
        return cubeMesh;
    }
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.engine.setSize(width, height, false);
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
        
        this.camera.position.set(0, 1.6, 10);
        this.camera.lookAt(new THREE.Vector3(0, 1.6, -100));

        this.scene.add(this.camera);
        
        let light = new THREE.PointLight(0xffffff, 2, 0);
        this.camera.add(light);
        
        const cameraAxis = new THREE.AxisHelper(0.1);
        cameraAxis.name = 'cameraAxis';
        this.camera.add(cameraAxis);
        cameraAxis.position.z = -1;
        
        //~ this.camera.matrixAutoUpdate = false;
        
        const axis = new THREE.AxisHelper(100);
        axis.name = 'axis';
        this.scene.add(axis);
        this.axis = axis;
        
        const cubeMesh = this.createCube('cube1');
        cubeMesh.position.set(3, 1.6, 1);
        cubeMesh.scale.set(10, 10, 10);
        this.scene.add(cubeMesh);
        this.cubeMesh = cubeMesh;
        this.cubesNum++;

        const cubeMesh2 = this.createCube('cube2');
        cubeMesh2.position.set(3, 0.2, 1);
        cubeMesh2.scale.set(10, 10, 10);
        this.scene.add(cubeMesh2);
        this.cubeMesh2 = cubeMesh2;
        this.cubesNum++;
        
        
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
        
        // this.tapPos = {x: 0, y: 0};
        this.canvas.addEventListener('click', e => {
            this.showMessage('click');
            //~ let normX = e.clientX / this.width;
            //~ let normY = e.clientY / this.height;
            
            //~ this.tapPos = {x: 2 * normX - 1, y: -2 * normY + 1};
            
            //~ this.ar.hitTest(normX, normY).then(data => this.onARHitTest(data)).catch(e => e);
        });
        
        document.querySelector('#message').onclick = function() {
            this.style.display = 'none';
        }
        
        window.addEventListener('resize', () => {
            this.resize(window.innerWidth, window.innerHeight);
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        });
        
        document.querySelector('#btn-test').addEventListener('click', () => {
            //~ this.testMove();
            document.querySelector('#info').value = '';
        });
        
        /*
        this.canvas.addEventListener('mousedown', e => {
            this.onMouseDown(e);
        }, false);
        this.canvas.addEventListener('mouseout', e => {
            this.onMouseOut();
        }, false);
        this.canvas.addEventListener('mousemove', e => {
            this.onMouseMove(e);
        }, false);
        this.canvas.addEventListener('mouseup', e => {
            this.onMouseUp();
        }, false);
        */
        this.canvas.addEventListener('touchstart', e => {
            this.onTouchStart(e);
        }, false);
        this.canvas.addEventListener('touchmove', e => {
            this.onTouchMove(e);
        }, false);
        this.canvas.addEventListener('touchend', e => {
            this.onTouchEnd(e);
        }, false);
        this.canvas.addEventListener('touchcancel', e => {
            this.onTouchCancel(e);
        }, false);
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
    onARHitTest(data, tapPos) {
        //~ this.showMessage('onARHitTest:' + tapPos.x + ', ' + tapPos.y + '; ' + this.cubesNum);
        console.log('onARHitTest:' + tapPos.x + ', ' + tapPos.y);
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
                {x: tapPos.x, y: tapPos.y},
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
        //~ cubeMesh.matrixAutoUpdate = false;
        
        info.transform.v3.y += CUBE_SIZE / 2;
        cubeMesh.matrix.fromArray(this.ar.flattenARMatrix(info.transform));
        this.scene.add(cubeMesh);
        this.cubesNum++;

        this.getPickableMeshes(true);
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
        this.showMessage('H');
        if (!this.ar.deviceInfo || !this.ar.deviceInfo.uuid) {
            return;
        }

        this.deviceId = this.ar.deviceInfo.uuid;
        this.updateOrientation(this.ar.deviceInfo.orientation);
        
        this.resize(
            this.ar.deviceInfo.viewportSize.width,
            this.ar.deviceInfo.viewportSize.height
        );
        
        this.watchAR();
    }
    
    onARWatch() {
        const camera = this.ar.getData('camera');
        if (!camera) return;

        if (this.orientationAngle != 0) {
            this.fixOrientationMatrix.makeRotationZ(this.orientationAngle);
            this.camera.matrix.fromArray(
                this.ar.flattenARMatrix(camera.cameraTransform)
            ).multiply(this.fixOrientationMatrix);
        } else {
            this.camera.matrix.fromArray(
                this.ar.flattenARMatrix(camera.cameraTransform)
            );
        }
        
        this.camera.projectionMatrix.fromArray(
            this.ar.flattenARMatrix(camera.projectionCamera)
        );
        
        this.requestAnimationFrame();
    }
    
    showMessage(txt) {
        document.querySelector('#message').textContent = txt;
        document.querySelector('#message').style.display = 'block';
    }
    
    testMove() {
        //~ this.cubeMesh
        const cameraBasis = {
            x: new THREE.Vector3(),
            y: new THREE.Vector3(),
            z: new THREE.Vector3()
        };
        this.camera.matrix.extractBasis(cameraBasis.x, cameraBasis.y, cameraBasis.z);
        
        cameraBasis.x.normalize();
        cameraBasis.y.normalize();
        cameraBasis.z.normalize();
        
        this.cubeMesh.position.addScaledVector(cameraBasis.x, 1);
    }
    
    calculateCameraBasis() {
        this.cameraBasis = {
            x: new THREE.Vector3(),
            y: new THREE.Vector3(),
            z: new THREE.Vector3()
        };
        this.camera.matrix.extractBasis(this.cameraBasis.x, this.cameraBasis.y, this.cameraBasis.z);
        this.cameraBasis.x.normalize();
        this.cameraBasis.y.normalize();
        this.cameraBasis.z.normalize();
    }
    onMouseDown(e) {
        if (this.cubesNum <= 0) {
            return;
        }
        e.preventDefault();
        this.mousePos = null;
        if (e.button !== 0) {
            if (this.mouseDown) {
                this.mouseDown = null;
            }
            return;
        }
        
        const mouseDown = this.pick(this.getMousePos(e));
        if (!mouseDown.hit) {
            this.mouseDown = null;
            return;
        }
        
        this.calculateCameraBasis();
        this.mouseDown = mouseDown;
    }
    getPickableMeshes(forceUpdate) {
        if (this.pickableMeshes && !forceUpdate) {
            return this.pickableMeshes;
        }
        this.pickableMeshes = [];
        var cnt = this.scene.children.length;
        for (var i = 0; i < cnt; i++) {
            const mesh = this.scene.children[i];
            if (mesh.type != 'Mesh') {
                continue;
            }
            
            this.pickableMeshes.push(mesh);
        }
        return this.pickableMeshes;
    }
    pick(mousePos) {
        let pickInfo = {};
        this.raycaster.setFromCamera(
            {x: mousePos.ndcX, y: mousePos.ndcY},
            this.camera
        );
        const intersects = this.raycaster.intersectObjects(this.getPickableMeshes());
        if (!intersects.length) {
            pickInfo.hit = false;
            return pickInfo;
        }
        pickInfo.hit = true;
        pickInfo.pickedMesh = intersects[0].object;
        pickInfo.pickedPoint = intersects[0].point;
        pickInfo.pointerX = mousePos.x;
        pickInfo.pointerY = mousePos.y;
        pickInfo.ndcX = mousePos.ndcX;
        pickInfo.ndcY = mousePos.ndcY;
        return pickInfo;
    }
    getMousePos(e) {
        var x, y;
        var canvasRect = this.canvas.getBoundingClientRect();
        x = e.clientX - canvasRect.left;
        y = e.clientY - canvasRect.top;
        
        var ndcX = (x / canvasRect.width) * 2 - 1;
        var ndcY = -(y / canvasRect.height) * 2 + 1;
        return {x: x, y: y, ndcX: ndcX, ndcY: ndcY};
    }
    
    onMouseMove(e) {
        if (!this.mouseDown && !this.mousePos) {
            return;
        }
        const mousePos = this.getMousePos(e);
        const prevMousePosX = this.mousePos ? this.mousePos.x : this.mouseDown.pointerX;
        
        const mouseDX = mousePos.x - prevMousePosX;
        
        //~ console.log(prevMousePosX, mousePos.x, mouseDX, this.moveSpeed * mouseDX);
        
        this.mousePos = mousePos;
        
        this.mouseDown.pickedMesh.position.addScaledVector(this.cameraBasis.x, this.moveSpeed * mouseDX);
    }
    onMouseUp() {
        this.resetMouse();
    }
    onMouseOut() {
        this.resetMouse();
    }
    resetMouse() {
        this.mouseDown = null;
        this.mousePos = null;
    }
    addMessage(txt) {
        document.querySelector('#info').style.display = 'block';
        document.querySelector('#info').value += '\n';
        document.querySelector('#info').value += txt;
    }
    getTouchesLog(e) {
        let touches = [];
        let targetTouches = [];
        let changedTouches = [];
        
        let i = 0;
        for (i = 0; i < e.touches.length; i++) {
            touches.push({
                id: e.touches[i].identifier,
                x: e.touches[i].clientX,
                y: e.touches[i].clientY
            });
        }
        for (i = 0; i < e.targetTouches.length; i++) {
            targetTouches.push({
                id: e.targetTouches[i].identifier,
                x: e.targetTouches[i].clientX,
                y: e.targetTouches[i].clientY
            });
        }
        for (i = 0; i < e.changedTouches.length; i++) {
            changedTouches.push({
                id: e.changedTouches[i].identifier,
                x: e.changedTouches[i].clientX,
                y: e.changedTouches[i].clientY
            });
        }
        
        return {touches: touches, targetTouches: targetTouches, changedTouches: changedTouches};
    }
    copyTouch(touch) {
        return {
            identifier: touch.identifier,
            clientX: touch.clientX,
            clientY: touch.clientY
        }
    }
    getTouchInfoById(touchList, id) {
        for (let i = 0; i < touchList.length; i++) {
            if (touchList[i].identifier === id) {
                return this.copyTouch(touchList[i]);
            }
        }
        return null;
    }
    hitTest(clientX, clientY) {
        //~ this.showMessage('hitTest:' + clientX + ', ' + clientY);
        console.log('hitTest:' + clientX + ', ' + clientY);
        
        const normX = clientX / this.width;
        const normY = clientY / this.height;
        this.ar.hitTest(normX, normY).then(
            data => {
                const tapPos = {x: 2 * normX - 1, y: -2 * normY + 1};
                this.onARHitTest(data, tapPos);
            }
        ).catch(e => e);
    }
    onTouchStart(e) {
        // save original touch in addition to the last one
        // if touchmove then it's not a tap
        // in ontouchend check if it was a move then it's not a tap otherwise check coordinates of original first toucch and current one (from event.changedTouches)
        e.preventDefault();
        console.log('onTouchStart', e);
        if (!e.changedTouches.length) {
            return;
        }
        
        this.addMessage('start:' + JSON.stringify(this.getTouchesLog(e)) + '\n---\n');
        
        // if (this.cubesNum <= 0) {
            // return;
        // }
        
        const touch = e.changedTouches[0];
        if (!this.touches) {
            const pickInfo = this.pick(this.getMousePos(touch));
            if (!pickInfo.hit) {
                this.pickInfo = null;
                this.touches = null;
                
                // if (this.startTouches) {
                     
                    // return;
                // }
                // this.startTouches = [];
                // this.startTouches.push(this.copyTouch(touch));
                
                if (!this.pickInfo) {
                    // add new object
                    this.hitTest(touch.clientX, touch.clientY);
                }
                
                return;
            }
            
            //~ this.showMessage('PICK!');
            
            this.calculateCameraBasis();
            this.pickInfo = pickInfo;
            this.touches = [];
            this.touches.push(this.copyTouch(touch));
            
            if (e.changedTouches.length > 1) {
                this.touches.push(this.copyTouch(e.changedTouches[1]));
            }
        } else {
            this.touches.push(this.copyTouch(touch));
        }
    }
    onTouchMove(e) {
        e.preventDefault();
        // console.log('onTouchMove', e);
        
        this.addMessage(
            'move' + (this.pickInfo && this.pickInfo.hit ? 'picked' : '0') +
            JSON.stringify(this.getTouchesLog(e)) + '\n---\n'
        );
        
        if (!e.changedTouches.length) {
            return;
        }
        if (!this.touches) {
            return;
        }
        if (!this.pickInfo) {
            
            return;
        }
        const savedTouch = this.touches[0];
        const savedTouch2 = this.touches[1]; // if 2 touches
        
        //~ const touch = this.getTouchInfoById(e.changedTouches, savedTouch.identifier);
        //~ if (!touch) {
            //~ return;
        //~ }
        //~ const dx = touch.clientX - savedTouch.clientX;
        //~ const dy = touch.clientY - savedTouch.clientY;
        
        //~ this.touches[0] = this.copyTouch(touch);
        
        let dx = 0;
        let dy = 0;
        let touch, touch2;
        
        const position = this.pickInfo.pickedMesh.position.setFromMatrixPosition(this.pickInfo.pickedMesh.matrix);
        
        touch = this.getTouchInfoById(e.changedTouches, savedTouch.identifier);
        if (!touch) {
            return;
        }
        this.touches[0] = this.copyTouch(touch);
        dx = touch.clientX - savedTouch.clientX;
        dy = touch.clientY - savedTouch.clientY;

        if (e.touches.length == 1) {
            // axis x or z
            this.scaleDistance = 0;
            this.showMessage('move x or z');
            if (Math.abs(dx) >= Math.abs(dy)) {
                this.pickInfo.pickedMesh.position.addScaledVector(this.cameraBasis.x, this.moveSpeed * dx);
            } else {
                this.pickInfo.pickedMesh.position.addScaledVector(this.cameraBasis.z, this.moveSpeed * dy);
            }
            
        } else {
            // axis y or scale
            
            if (savedTouch2) {
                touch2 = this.getTouchInfoById(e.changedTouches, savedTouch2.identifier);
            }
            
            this.showMessage('savedTouch2 ' + touch2 + ':::' + JSON.stringify(savedTouch2.identifier));
            
            if (!touch2) {
                // move along axis y
                //~ this.showMessage('move y');
                this.pickInfo.pickedMesh.position.addScaledVector(new THREE.Vector3(0, -1, 0), this.moveSpeed * dy);
                this.scaleDistance = 0;
            } else {
                // move or scale
                this.touches[1] = this.copyTouch(touch2);
                
                let dx2 = touch2.clientX - savedTouch2.clientX;
                let dy2 = touch2.clientY - savedTouch2.clientY;
                
                if (Math.sign(dx) != Math.sign(dx2) && Math.sign(dy) != Math.sign(dy2)) {
                    // scale
                    dx = touch2.clientX - touch.clientX;
                    dy = touch2.clientY - touch.clientY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    const delta = distance - this.scaleDistance;
                    
                    if (this.scaleDistance > 0) {
                        this.pickInfo.pickedMesh.scale.addScalar(this.scaleSpeed * delta);
                        
                        this.showMessage(
                            'scale' + distance + ';' + this.scaleDistance + ';' + (distance - this.scaleDistance) + ';' + this.scaleSpeed * delta +
                            ':::' + JSON.stringify(this.pickInfo.pickedMesh.scale)
                        );
                    }
                    this.scaleDistance = distance;
                } else {
                    // move
                    //~ this.showMessage('move y2');
                    this.pickInfo.pickedMesh.position.addScaledVector(new THREE.Vector3(0, -1, 0), this.moveSpeed * dy);
                    this.scaleDistance = 0;
                }
                
            }
        }
        
        this.pickInfo.pickedMesh.updateMatrix();
        this.pickInfo.pickedMesh.updateMatrixWorld(true);
        
        let transform = this.pickInfo.pickedMesh.matrix.toArray();
        transform = this.ar.createARMatrix(transform);
        
        //~ this.ar.updateAnchor({
            //~ uuid: this.pickInfo.pickedMesh.name,
            //~ transform: transform
        //~ }).then(info => {
            //~ this.showMessage(
                //~ 'anchor updated ' + JSON.stringify(info) + '***' +
                //~ JSON.stringify(transform.toArray())
            //~ )
        //~ });
    }
    resetTouch() {
        this.touches = null;
        this.pickInfo = null;
        this.cameraBasis = null;
        
        this.scaleDistance = 0;
        // this.startTouches = null;
        // this.startTouchTime = 0;
    }
    onTouchEnd(e) {
        //~ e.preventDefault();
        console.log('onTouchEnd', e);
        
        this.addMessage('end' + JSON.stringify(this.getTouchesLog(e)) + '\n---\n');
        
        if (!e.changedTouches.length) {
            return;
        }
        
        // if (this.startTouches) {
            // const savedStartTouch = this.startTouches[0];
            // const startTouch = this.getTouchInfoById(e.changedTouches, savedStartTouch.identifier);
            // if (startTouch && startTouch.clientX == savedStartTouch.clientX && startTouch.clientY == savedStartTouch.clientY) {
                // if (this.startTouchTime) {
                    // tap
                    
                // }
            // }
            // this.startTouches = null;
            // this.startTouchTime = 0;
        // }
        
        if (!this.touches) {
            return;
        }
        const savedTouch = this.touches[0];
        const touch = this.getTouchInfoById(e.changedTouches, savedTouch.identifier);
        
        let touch2;
        const savedTouch2 = this.touches[1];
        if (savedTouch2) {
            touch2 = this.getTouchInfoById(e.changedTouches, savedTouch2.identifier);
        }
        if (touch2) {
            this.touches.pop();
            this.scaleDistance = 0;
        }
        
        if (!touch) {
            return;
        }
        
        this.resetTouch();
    }
    onTouchCancel(e) {
        e.preventDefault();
        console.log('onTouchCancel', e);
        
        this.resetTouch();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.app = new App('app-canvas');
});
