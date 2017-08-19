class webkitSimulatorMessageHandler {
    constructor(simulator, name, isAsync) {
        this.name = name;
        this.isAsync = !(isAsync === false);
        this.simulator = simulator;
        this.data = {
            location: null,
            projection_camera: null,
            camera_transform: null
        };
    }
    
    postMessage(data) {
        console.log('webkitSimulatorMessageHandler:postMessage', this.name, data);
        
        if (this.name === 'stopAR') {
            //~ clearInterval(this.simulator.watchARIntervalId);
            navigator.geolocation.clearWatch(this.simulator.watchARIntervalId);
            this.simulator.watchARIntervalId = null;
            
            window[data.callback]('data callback simulator: ' + this.name);
            return;
        }

        if (data && data.callback) {
            if (!this.isAsync) {
                console.log('webkitSimulatorMessageHandler:postMessage callback', this.name);
                window[data.callback]('data callback simulator: ' + this.name);
                return;
            } 

            if (this.name === 'watchAR') {
                const options = {
                    enableHighAccuracy: true,
                    maximumAge: 0,
                    timeout: 3000
                };
                this.simulator.watchARIntervalId = navigator.geolocation.watchPosition(
                    pos => {
                        console.log('get location success', pos, this.data);
                        this.data.location = {};
                        this.data.location.latitude = pos.coords.latitude;
                        this.data.location.longitude = pos.coords.longitude;
                        
                        this.data.projection_camera = [1.636377, 0, 0, 0, 0, 2.909114, 0, 0,  0.004712701, 0.02586138, -1.000002, -1,  0, 0, -0.002000002, 0];
                        this.data.camera_transform = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 2, 0, 1];
                        
                        console.log('this.data', this.data);
                        window[data.callback](this.data);
                    },
                    err => {
                        console.log('cannot get location', err);
                    },
                    options
                );
                
                //~ setInterval(() => {console.log('this.data',  this.data); window[data.callback](this.data);}, 3000);
                
                console.log('this.simulator.watchARIntervalId', this.simulator.watchARIntervalId);
            } else {
                setTimeout(() => {
                    if (this.name === 'addObject') {
                        data.transform = [
                            0.9914429783821106,
                            -0.10326667129993439,
                            0.079854816198349,
                            0,

                            0.12760323286056519,
                            0.8956893682479858,
                            -0.4259788990020752,
                            0,

                            -0.0275356974452734,
                            0.4325235188007355,
                            0.9012021422386169,
                            0,
                             
                            0.07370418310165405,
                            -0.8629032373428345,
                            -1.7984013557434082,
                            1
                        ];
                        window[data.callback](data);
                        return;
                    }
                    window[data.callback]('data callback simulator: ' + this.name);
                }, 3000);
            }
        }
    }

}
class webkitSimulator {
    constructor() {
        this.watchARIntervalId = null;
        
        this.messageHandlers = {
            initAR: new webkitSimulatorMessageHandler(this, 'initAR'),
            watchAR: new webkitSimulatorMessageHandler(this, 'watchAR'),
            stopAR: new webkitSimulatorMessageHandler(this, 'stopAR'),
            addObject: new webkitSimulatorMessageHandler(this, 'addObject'),
            showDebug: new webkitSimulatorMessageHandler(this, 'showDebug')
        };
    }
}
if (!window.webkit) {
    window.webkit = new webkitSimulator();
}
