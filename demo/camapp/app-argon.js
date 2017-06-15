class App {
    constructor() {
        const argonApp = Argon.init();
        argonApp.context.subscribeGeolocation({enableHighAccuracy: true});
        // argonApp.context.setDefaultReferenceFrame(argonApp.context.localOriginEastUpSouth); // deprecated
        argonApp.context.defaultReferenceFrame = argonApp.context.localOriginEastUpSouth;

        // initialize THREE
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera();

        const userLocation = new THREE.Object3D();
        scene.add(camera);
        scene.add(userLocation);
        const axisHelper = new THREE.AxisHelper(6000);
        scene.add(axisHelper);

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            logarithmicDepthBuffer: true
        });
        // renderer.setClearColor(0x000000);
        renderer.setPixelRatio(window.devicePixelRatio);
        argonApp.view.element.appendChild(renderer.domElement);

        const boxGeoObject = new THREE.Object3D();
        const box = new THREE.Object3D();
        const loader = new THREE.TextureLoader();
        loader.load('box.png', texture => {
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshBasicMaterial({map: texture});
            const mesh = new THREE.Mesh(geometry, material);
            box.add(mesh);
        });
        boxGeoObject.add(box);

        const boxGeoEntity = new Argon.Cesium.Entity({
            name: 'I have a box',
            position: Argon.Cesium.Cartesian3.ZERO,
            orientation: Argon.Cesium.Quaternion.IDENTITY
        });


        const cssRenderer = new THREE.CSS3DArgonRenderer();
        const hud = new THREE.CSS3DArgonHUD();
        argonApp.view.element.appendChild(cssRenderer.domElement);
        argonApp.view.element.appendChild(hud.domElement);

        const hudEl = document.getElementById('hud');
        const hudInfoEl = document.getElementById('hudInfo');
        hud.appendChild(hudEl);
        const boxLocEl = document.getElementById('boxLocation');
        boxLocEl.onclick = function() {
            alert('Yes, this is an html button!');
        };
        const boxLabel = new THREE.CSS3DSprite(boxLocEl);
        boxLabel.scale.set(0.01, 0.01, 0.01);
        boxLabel.position.set(0, 0.7, 0);
        boxGeoObject.add(boxLabel);

        this.argonApp = argonApp;
        this.boxGeoEntity = boxGeoEntity;
        this.boxGeoObject = boxGeoObject;
        this.box = box;
        this.axis = axisHelper;
        this.userLocation = userLocation;
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.boxLocEl = boxLocEl;
        this.cssRenderer = cssRenderer;
        this.hudInfoEl = hudInfoEl;
        this.hud = hud;

        this.lastInfo = '';
        this.run();
    }

    run() {
        this.update();
        this.render();
    }

    update() {
        let boxInit = false;
        this.argonApp.updateEvent.addEventListener(frame => {
            // get the position and orientation (the 'pose') of the user
            // in the local coordinate frame.
            const userPose = this.argonApp.context.getEntityPose(this.argonApp.context.user);

            // assuming we know the user's pose, set the position of our
            // THREE user object to match it
            if (userPose.poseStatus & Argon.PoseStatus.KNOWN) {
                this.userLocation.position.copy(userPose.position);
                this.userLocation.quaternion.copy(userPose.orientation);
            } else {
                // if we don't know the user pose we can't do anything
                return;
            }

            // the first time through, we create a geospatial position for
            // the box somewhere near us
            if (!boxInit) {
                // const defaultFrame = this.argonApp.context.getDefaultReferenceFrame(); // deprecated
                const defaultFrame = this.argonApp.context.defaultReferenceFrame;

                // set the box's position to some meters away from the user.
                // First, clone the userPose postion, and add meters to the axis
                const boxPos = userPose.position.clone();
                boxPos.x += 2;
                boxPos.z -= 3;

                // set the value of the box Entity to this local position, by
                // specifying the frame of reference to our local frame
                this.boxGeoEntity.position.setValue(boxPos, defaultFrame);

                // orient the box according to the local world frame
                this.boxGeoEntity.orientation.setValue(Argon.Cesium.Quaternion.IDENTITY);

                // now, we want to move the box's coordinates to the FIXED frame, so
                // the box doesn't move if the local coordinate system origin changes.
                if (Argon.convertEntityReferenceFrame(
                    this.boxGeoEntity, frame.time, Argon.Cesium.ReferenceFrame.FIXED)
                ) {
                    this.scene.add(this.boxGeoObject);
                    boxInit = true;
                }
            }

            // get the local coordinates of the local box, and set the THREE object
            const boxPose = this.argonApp.context.getEntityPose(this.boxGeoEntity);
            if (boxPose.poseStatus & Argon.PoseStatus.KNOWN) {
                this.boxGeoObject.position.copy(boxPose.position);
                this.boxGeoObject.quaternion.copy(boxPose.orientation);

                this.axis.position.copy(boxPose.position);
                this.axis.quaternion.copy(boxPose.orientation);
            }


            // rotate the box at a constant speed, independent of frame rates
            // to make it a little less boring
            this.box.rotateY(3 * frame.deltaTime / 10000);

            const userWorldPos = this.userLocation.getWorldPosition();
            const boxWorldPos = this.box.getWorldPosition();
            let distanceToBox = userWorldPos.distanceTo(boxWorldPos);
            distanceToBox = Math.round(distanceToBox * 100) / 100;
            if (distanceToBox !== this.lastInfo) {
                this.lastInfo = distanceToBox;
                this.hudInfoEl.textContent = this.lastInfo + 'm';
                this.boxLocEl.textContent = 'BOX: ' + this.lastInfo + 'm';
            }
        });
    }

    render() {
        // renderEvent is fired whenever argon wants the app to update its display
        this.argonApp.renderEvent.addEventListener(() => {
            // set the renderer to know the current size of the viewport.
            // This is the full size of the viewport, which would include
            // both views if we are in stereo viewing mode
            // const viewport = this.argonApp.view.getViewport(); // deprecated
            const viewport = this.argonApp.view.viewport;

            this.renderer.setSize(viewport.width, viewport.height);
            this.hud.setSize(viewport.width, viewport.height);
            // this.renderer.setPixelRatio(this.argonApp.suggestedPixelRatio);

            // there is 1 subview in monocular mode, 2 in stereo mode
            // for (let subview of this.argonApp.view.getSubviews()) { // deprecated
            for (let subview of this.argonApp.view.subviews) {
                const frustum = subview.frustum;
                // set the position and orientation of the camera for
                // this subview
                this.camera.position.copy(subview.pose.position);
                this.camera.quaternion.copy(subview.pose.orientation);

                // the underlying system provide a full projection matrix
                // for the camera.
                this.camera.projectionMatrix.fromArray(subview.projectionMatrix);

                // set the viewport for this view
                let {x, y, width, height} = subview.viewport;

                this.camera.fov = THREE.Math.radToDeg(frustum.fovy);

                // set the webGL rendering parameters and render this view
                this.renderer.setViewport(x, y, width, height);
                this.renderer.setScissor(x, y, width, height);
                this.renderer.setScissorTest(true);
                this.renderer.render(this.scene, this.camera);

                this.hud.setViewport(x, y, width, height, subview.index);
                this.hud.render(subview.index);

                this.cssRenderer.setViewport(x, y, width, height, subview.index);
                this.cssRenderer.render(this.scene, this.camera, subview.index);
            }
        });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    window.app = app;
});
