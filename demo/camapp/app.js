class App {
    constructor() {
        this.startVideoBtn = document.querySelector('#startVideoBtn');
        this.cameraVideoEl = document.querySelector('#cameraVideo');

        this.cameraVideoEl.addEventListener('loadedmetadata', () => {
            this.cameraVideoEl.play();
        });
        this.startVideoBtn.addEventListener('click', () => {
            this.getUserMedia();
        });
    }
    getUserMedia() {
        this.startVideoBtn.disabled = true;

        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        }).then(streamInfo => {
            console.log('streamInfo', streamInfo);

            this.cameraVideoEl.srcObject = streamInfo;

        }, err => {
            alert('getUserMedia error! ' + err.name + ": " + err.message);
            console.log('getUserMedia error', err);
        });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    let app = new App();
    window.app = app;
});
