class App {
    constructor() {
        this.startVideoBtn = document.querySelector('#startVideoBtn');
        this.saveVideoBtn = document.querySelector('#saveVideoBtn');
        this.record2dBtn = document.querySelector('#record2dBtn');
        this.cameraVideoEl = document.querySelector('#cameraVideo');
        this.resultVideoEl = document.querySelector('#resultVideo');
        this.canvas2dEl = document.querySelector('#canvas2d');
        this.canvas3dEl = document.querySelector('#canvas3d');
        this.fps2dEl = document.querySelector('#fps2d');

        this.canvas2dActive = false;
        this.videoRecorded = false;
        this.frames2d = [];
        this.frameTimestamps2d = [];
        this.lastFps2dTimestamp = 0;
        this.deltaTime2d = 0;
        this.animationRatio2d = 1;
        this.record2d = false;
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

        this.canvasRecorder = new CanvasRecorder(this.canvas2dEl, { disableLogs: true });

        this.record2dBtn.addEventListener('click', e => {
            if (!this.canvas2dActive) {
                return;
            }
            if (!this.record2d) {
                this.frames2d = [];
                this.record2d = true;
                e.target.textContent = 'Recording 2d Canvas';
                e.target.style.color = 'red';

                this.canvasRecorder.clearRecordedData();
                this.canvasRecorder.record();

            } else {
                this.record2d = false;
                e.target.textContent = 'Record 2d Canvas';
                e.target.style.color = 'black';

                this.canvasRecorder.stop(blob => {
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
