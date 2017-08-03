let AppComponent = {
    init() {
        this.instance = new App();
        window.app = this.instance;
    },
    tick(time, timeDelta) {
        this.instance.render(time, timeDelta);
    },
    remove() {
        
    },
    pause() {
        
    },
    play() {
        
    }
};

AFRAME.registerComponent('app', AppComponent);

const EARTH_RADIUS = 6371.032;
class App {
    constructor() {
        this.ar = new AR(this.onARInit.bind(this));

        this.registerEvents();
        this.initialARData = null;
        this.userLocation = null;
        this.initialLocation = null;
        this.diffLocation = {x: 0, y: 0, z: 0};
        this.cameraPositionEl = document.querySelector('#cameraPosition');
    }
    
    registerEvents() {
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
    
    render(time, timeDelta) {
        if (!this.initialARData) {
            return;
        }
        
        this.cameraPositionEl.setAttribute(
            'position', 
            new THREE.Vector3(
                this.diffLocation.x,
                this.cameraPositionEl.getAttribute('position').y,
                this.diffLocation.z
            )
        );
        
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
        const date = (new Date()).toTimeString();
        
        if (!this.initialARData) {
            this.initialARData = this.ar.rawARData;
            this.userLocation = this.geo2Cartesian(this.initialARData.location);
            this.initialLocation = {
                x: this.userLocation.x,
                y: this.userLocation.y,
                z: this.userLocation.z
            }
        } else {
            this.userLocation = this.geo2Cartesian(this.getARData('location'));
            this.diffLocation.x = this.userLocation.x - this.initialLocation.x;
            this.diffLocation.y = this.userLocation.y - this.initialLocation.y;
            this.diffLocation.z = this.userLocation.z - this.initialLocation.z;
        }
        
        document.querySelector('#info-location').value = JSON.stringify(data) + ':' + date +
            "\n" + JSON.stringify(this.diffLocation);
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
});
