class App {
    constructor() {
        this.canvas = document.querySelector('#app');
        this.initWebGLContext();
        
        document.querySelector('#msg').onclick = function() {
            this.style.display = 'none';
        }
        this.initVR();
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

    run() {

    }
    
    showMsg(txt) {
        document.querySelector('#msg').textContent = txt;
        document.querySelector('#msg').style.display = 'block';
    }
    
    initVR() {
        this.vr = {};
        if (!navigator.getVRDisplays) {
            this.showMsg('WebVR is not supported');
            return;
        }
        navigator.getVRDisplays().then(displays => {
            
            displays = displays.filter(display => display.capabilities.canPresent);
            if (!displays.length) {
                this.showMsg('No devices that can present' + JSON.stringify(displays));
                return;
            }
            
            
            this.vr.display = displays[0];
            
            this.showMsg('Devices: ' + displays.length + ', Device info: ' + this.vr.display.displayName + JSON.stringify(this.vr.display));
        });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    let app = new App();
    window.app = app;
});

