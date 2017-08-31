class App {
    constructor() {
        this.ready = false;
        this.isVREnabled = false;
        this.canvas = document.querySelector('#app');
        this.initWebGLContext();
        this.initScene();
        
        let cube = this.createCube('cube1');
        this.scene.add(cube);
        
        document.querySelector('#msg').onclick = function() {
            this.style.display = 'none';
        }

        this.initVR();
        
        document.querySelector('#btn-togglevr').addEventListener('click', () => {
            this.toggleVR();
        });
        
    }
    run() {
        this.clock = new THREE.Clock();
        this.fpsStats = new Stats();
        this.fpsStats.setMode(0);
        document.body.appendChild(this.fpsStats.domElement);
        
        let render = (time) => {
            let deltaTime = Math.max(0.001, Math.min(this.clock.getDelta(), 1));
            this.fpsStats.begin();
            
            this.render(time);
            
            this.fpsStats.end();
            if (this.isVREnabled) {
                this.vr.display.requestAnimationFrame(render);
            } else {
                this.vr.display.requestAnimationFrame(render);
            }
            
        };
        render();
    }
    render(time) {
        this.vr.display.getFrameData(this.vr.frameData);
        
        this.engine.clear();
        
        const EYE_WIDTH = this.width * 0.5;
        const EYE_HEIGHT = this.height;
        // left
        this.renderEye(
            this.vr.frameData.leftViewMatrix,
            this.vr.frameData.leftProjectionMatrix,
            {
                x: 0,
                y: 0,
                w: EYE_WIDTH,
                h: EYE_HEIGHT
            }
        );
        
        this.engine.clearDepth();
        
        // right
        this.renderEye(
            this.vr.frameData.rightViewMatrix,
            this.vr.frameData.rightProjectionMatrix,
            {
                x: EYE_WIDTH,
                y: 0,
                w: EYE_WIDTH,
                h: EYE_HEIGHT
            }
        );
        //~ this.engine.render(this.scene, this.camera);
        
        this.vr.display.submitFrame();
    }
    renderEye(viewMatrix, projectionMatrix, viewport) {
        this.engine.setViewport(viewport.x, viewport.y, viewport.w, viewport.h);
        this.camera.projectionMatrix.fromArray(projectionMatrix);
        this.scene.matrix.fromArray(viewMatrix);
        
        this.scene.updateMatrixWorld(true);
        this.engine.render(this.scene, this.camera);
    }
    createCube(name) {
        let geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
        let material = new THREE.MeshLambertMaterial({color: 0x7d4db2, reflectivity: 0, wireframe: false});
        let cubeMesh = new THREE.Mesh(geometry, material);
        cubeMesh.name = name;
        cubeMesh.position.set(0, 0, 0);
        return cubeMesh;
    }
    initScene() {
        this.scene = new THREE.Scene();
        this.engine = new THREE.WebGLRenderer({
            antialias: true,
            canvas: this.canvas
        });
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        this.engine.setSize(this.width, this.height, true);
        
        this.engine.setClearColor('#000', 0);

        this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 10000);
        
        this.camera.position.set(-3, 1.6, 5);
        this.camera.lookAt(new THREE.Vector3(0, 1.6, -100));

        this.scene.add(this.camera);
        
        let light = new THREE.PointLight(0xffffff, 2, 0);
        this.camera.add(light);
    }
    initWebGLContext() {
        if (!this.gl) {
            const ctxParams = {
                antialias: true
            };
            const gl = this.canvas.getContext('webgl', ctxParams);
            if (gl != null && !!window.WebGLRenderingContext) {
                this.gl = gl;
            }
        }
        return this.gl;
    }

    isWebGLSupported() {
        this.initWebGLContext();
        return !!this.gl;
    }
    
    showMsg(txt) {
        document.querySelector('#msg').textContent = txt;
        document.querySelector('#msg').style.display = 'block';
    }
    
    enableVR() {
        if (this.vr.display.isPresenting) {
            return;
        }
        
        this.engine.autoClear = false;
        this.scene.matrixAutoUpdate = false;
        
        this.vr.display.requestPresent([{
            source: this.canvas
        }])
        .then(() => {
            this.isVREnabled = true;
            document.querySelector('#btn-togglevr').removeAttribute('disabled');
            document.querySelector('#btn-togglevr').className = 'enabled';
        })
        .catch(e => {
            this.showMsg('Cannot enable VR');
            console.log(e);
            this.isVREnabled = false;
            document.querySelector('#btn-togglevr').className = '';
        });
    }
    disableVR() {
        if (!this.vr.display.isPresenting) {
            return;
        }
        this.vr.display.exitPresent()
        .then(() => {
            this.isVREnabled = false;
            document.querySelector('#btn-togglevr').removeAttribute('disabled');
            document.querySelector('#btn-togglevr').className = '';
        });
        
    }
    toggleVR() {
        if (!this.ready) {
            return;
        }
        if (document.querySelector('#btn-togglevr').getAttribute('disabled')) {
            return;
        }
        document.querySelector('#btn-togglevr').setAttribute('disabled', true);
        if (!this.isVREnabled) {
            this.enableVR();
        } else {
            this.disableVR();
        }
    }
    
    initVR() {
        this.vr = {};
        
        if (!navigator.getVRDisplays || typeof VRFrameData === 'undefined') {
            this.showMsg('WebVR is not supported');
            return;
        }
        
        this.vr.frameData = new VRFrameData();
        
        navigator.getVRDisplays().then(displays => {
            
            displays = displays.filter(display => display.capabilities.canPresent);
            if (!displays.length) {
                this.showMsg('No devices that can present' + JSON.stringify(displays));
                return;
            }
            
            
            this.vr.display = displays[0];
            
            this.showMsg('Devices: ' + displays.length + ', Device info: ' + this.vr.display.displayName + JSON.stringify(this.vr.display));
            
            this.ready = true;
            
            this.run();
        });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    let app = new App();
    window.app = app;
});

