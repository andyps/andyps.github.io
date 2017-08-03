class App {
    constructor() {
        this.canvas3dActive = false;
        this.canvas3dEl = document.querySelector('#canvas3d');
        this.disable3dBtn = document.querySelector('#disable3dBtn');
        this.disable3dBtn.addEventListener('click', e => {
            this.canvas3dActive = false;
            // this.canvas3dEl.parentNode.removeChild(this.canvas3dEl);
        });

        this.startVideoBtn = document.querySelector('#startVideoBtn');
        this.saveVideoBtn = document.querySelector('#saveVideoBtn');
        this.record2dBtn = document.querySelector('#record2dBtn');
        this.record3dBtn = document.querySelector('#record3dBtn');
        this.cameraVideoEl = document.querySelector('#cameraVideo');
        this.resultVideoEl = document.querySelector('#resultVideo');
        this.canvas2dEl = document.querySelector('#canvas2d');

        this.fps2dEl = document.querySelector('#fps2d');

        this.canvas2dActive = false;

        this.videoRecorded = false;
        this.frames2d = [];
        this.frames3d = [];
        this.frameTimestamps2d = [];
        this.lastFps2dTimestamp = 0;
        this.deltaTime2d = 0;
        this.animationRatio2d = 1;
        this.animationRatio3d = 1;
        this.record2d = false;
        this.record3d = false;
        this.fps2d = 60;
        this.anim2d = { x: 150, y: 0, dir: 1 };
        this.canvas2dCtx = this.canvas2dEl.getContext('2d');
        if (!this.canvas2dCtx) {
            alert('Canvas 2d context is not supported');
            return;
        }
        if (!this.isWebGLSupported) {
            alert('WebGL is not supported');
            return;
        }
        this.initWebGLContext();

        this.canvasRecorder2d = new CanvasRecorder(this.canvas2dEl, { disableLogs: true });
        this.canvasRecorder3d = new CanvasRecorder(this.canvas3dEl, { disableLogs: true });

        this.record2dBtn.addEventListener('click', e => {
            if (!this.canvas2dActive || this.record3d) {
                return;
            }
            if (!this.record2d) {
                this.frames2d = [];
                this.record2d = true;
                e.target.textContent = 'Recording 2d Canvas';
                e.target.style.color = 'red';

                this.canvasRecorder2d.clearRecordedData();
                this.canvasRecorder2d.record();

            } else {
                this.record2d = false;
                e.target.textContent = 'Record 2d Canvas';
                e.target.style.color = 'black';

                this.canvasRecorder2d.stop(blob => {
                    this.resultVideoEl.src = window.URL.createObjectURL(blob);
                    this.videoRecorded = true;
                });
            }
        });
        this.record3dBtn.addEventListener('click', e => {
            if (!this.canvas3dActive || this.record2d) {
                return;
            }
            if (!this.record3d) {
                this.frames3d = [];
                this.record3d = true;
                e.target.textContent = 'Recording 3d Canvas';
                e.target.style.color = 'red';

                this.canvasRecorder3d.clearRecordedData();
                this.canvasRecorder3d.record();

            } else {
                this.record3d = false;
                e.target.textContent = 'Record 3d Canvas';
                e.target.style.color = 'black';

                this.canvasRecorder3d.stop(blob => {
                    this.resultVideoEl.src = window.URL.createObjectURL(blob);
                    this.videoRecorded = true;
                });
            }
        });

        this.cameraVideoEl.addEventListener('loadedmetadata', e => {
            e.target.play();
        });
        this.resultVideoEl.addEventListener('loadedmetadata', e => {
            e.target.play();
        });
        this.startVideoBtn.addEventListener('click', () => {
            this.getUserMedia();
        });
        this.saveVideoBtn.addEventListener('click', () => {
            this.saveVideo();
        });
    }

    getUserMedia() {
        this.startVideoBtn.disabled = true;

        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        }).then(streamInfo => {
            console.log('streamInfo', streamInfo);

            this.cameraVideoEl.srcObject = streamInfo;

            this.canvas2dRun(0, 0);
            this.canvas2dActive = true;

            this.canvas3dActive = true;
            this.canvas3dRun();

        }, err => {
            alert('getUserMedia error! ' + err.name + ": " + err.message);
            console.log('getUserMedia error', err);
        });
    }

    initWebGLContext() {
        if (!this.gl) {
            const ctxParams = {
                antialias: true
            };
            const gl = this.canvas3dEl.getContext('webgl', ctxParams);
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

    canvas2dRun(t2, t1) {
        this.measureStat2d(t2);
        this.updateFpsCounter2d(t2);

        this.render2d();

        if (this.record2d) {
            // this.saveFrames2d();
        }

        window.requestAnimationFrame(t2 => {
            this.canvas2dRun(t2, t1);
        });
    }

    updateFpsCounter2d(t2) {
        if (t2 - this.lastFps2dTimestamp > 1000) {
            this.lastFps2dTimestamp = t2;
            this.fps2dEl.textContent = this.fps2d;
        }
    }

    canvas3dRun() {
        this.scene = new THREE.Scene();
        this.engine = new THREE.WebGLRenderer({
            antialias: true,
            canvas: this.canvas3dEl
        });
        this.engine.setSize(this.canvas3dEl.width, this.canvas3dEl.height, true);
        this.engine.setClearColor(0x000000);


        this.camera = new THREE.PerspectiveCamera(50, this.canvas3dEl.width / this.canvas3dEl.height, 1, 10000);

        this.camera.position.set(
            -220, 314, 340
        );
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));

        let light = new THREE.PointLight(0xffffff, 2);
        this.camera.add(light);
        this.scene.add(this.camera);
        light.position.set(0, 1000, 9000);
        light.intensity = 1.2;
        this.light = light;

        let axisHelper = new THREE.AxisHelper(6000);
        this.axis  = axisHelper;
        this.scene.add(axisHelper);

        let geometry = new THREE.PlaneGeometry(512, 256);
        const texture = new THREE.CanvasTexture(this.canvas2dEl);
        let material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.FrontSide
        });
        material.map.needsUpdate = true;
        let tv = new THREE.Mesh(geometry, material);
        tv.name = 'tv';

        this.scene.add(tv);

        this.tv = tv;

        this.fpsStats = new Stats();
        this.fpsStats.setMode(0);
        document.body.appendChild(this.fpsStats.domElement);
        this.fpsStats.domElement.style.left = 'auto';
        this.fpsStats.domElement.style.right = '0px';


        this.clock = new THREE.Clock();

        this.render3d();
    }

    render3d() {
        let deltaTime = Math.max(0.001, Math.min(this.clock.getDelta(), 1));
        this.animationRatio3d = deltaTime * 60.0;

        this.fpsStats.begin();

        this.tv.rotation.y += this.animationRatio3d * 0.01;

        this.tv.material.map.needsUpdate = true;
        this.engine.render(this.scene, this.camera);

        this.fpsStats.end();

        if (this.canvas3dActive) {
            window.requestAnimationFrame(() => {
                this.render3d();
            });
        }
    }

    render2d() {
        this.canvas2dCtx.clearRect(0, 0, this.canvas2dEl.width, this.canvas2dEl.height);
        this.canvas2dCtx.drawImage(this.cameraVideoEl, 0, 0, this.canvas2dEl.width, this.canvas2dEl.height);


        this.canvas2dCtx.fillRect(this.anim2d.x, this.anim2d.y, 50, 50);

        this.anim2d.y += 10 * this.animationRatio2d * this.anim2d.dir;
        if (this.anim2d.y >= 250) {
            this.anim2d.y = 250;
            this.anim2d.dir = -this.anim2d.dir;
            this.canvas2dCtx.fillStyle = 'red';
        }
        if (this.anim2d.y <= 0) {
            this.anim2d.y = 0;
            this.anim2d.dir = -this.anim2d.dir;
            this.canvas2dCtx.fillStyle = 'green';
        }
    }

    measureStat2d(t) {
        if (t <= 0) {
            return;
        }
        this.frameTimestamps2d.push(t);
        let len = this.frameTimestamps2d.length;
        if (len >= 2) {
            this.deltaTime2d = this.frameTimestamps2d[len - 1] - this.frameTimestamps2d[len - 2];
        }
        const deltaTime2d = Math.max(1, Math.min(this.deltaTime2d, 1000));
        this.animationRatio2d = deltaTime2d * (60.0 / 1000.0);

        if (len >= 61) {
            if (len > 61) {
                this.frameTimestamps2d.shift();
                len = this.frameTimestamps2d.length;
            }
            let dt = 0;
            const dCnt = len - 1;
            for (let i = 0; i < dCnt; i++) {
                dt += this.frameTimestamps2d[i + 1] - this.frameTimestamps2d[i];
            }
            this.fps2d = Math.round(1000 * dCnt / dt);
        }
    }

    saveVideo() {
        if (!this.resultVideoEl.src || !this.videoRecorded) {
            return;
        }
        this.saveVideoBtn.href = this.resultVideoEl.src;
    }

    saveFrames2d() {
        this.frames2d.push(this.canvas2dEl.toDataURL('image/webp'));
    }
}

window.addEventListener('DOMContentLoaded', () => {
    let app = new App();
    window.app = app;
});

/******************/
window.addEventListener('DOMContentLoaded', () => {
    window.takeScreenShot = function() {
        var canvas = document.querySelector('canvas');
        
        return this.canvas.toDataURL('image/webp');
    }
});
