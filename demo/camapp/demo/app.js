class webkitSimulatorMessageHandler {
    constructor(simulator, name, isAsync) {
        this.name = name;
        this.isAsync = !(isAsync === false);
        this.simulator = simulator;
    }
    
    postMessage(data) {
        console.log('webkitSimulatorMessageHandler:postMessage', this.name, data);
        if (this.name === 'stopAR') {
            console.log('this.watchARIntervalId', this.watchARIntervalId);
            clearInterval(this.simulator.watchARIntervalId);
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
                this.simulator.watchARIntervalId = setInterval(() => {
                    window[data.callback]('data callback simulator: ' + this.name);
                }, 2000);
            } else {
                setTimeout(() => {
                    window[data.callback]('data callback simulator: ' + this.name);
                }, 2000);
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
            stopAR: new webkitSimulatorMessageHandler(this, 'stopAR')
        };
    }
}
if (!window.webkit) {
    window.webkit = new webkitSimulator();
}

class AR {
    constructor(initCallback) {
        this.callbackNum = 0;
        this.callbacksMap = {};
        this.userCallbacks = {};
        this.deviceId = null;
        this.isWatching = false;
        this.isInitialized = false;
        this.rawARData = null;
        
        this.generateCallbacks();
        this.userCallbacks.onInit = initCallback;
        
        // get device id
        window.webkit.messageHandlers.initAR.postMessage({
            callback: this.callbacksMap.onInit
        });
        
    }
    
    onInit(data) {
        this.log('onInit');
        this.deviceId = data;
        this.isInitialized = true;
        this.userCallbacks.onInit(data);
    }
    
    onStop() {
        this.log('Stop watching...');
    }
    
    onWatch(data) {
        this.rawARData = data;
        this.userCallbacks.onWatch(data);
    }
    
    getDeviceId() {
        return this.deviceId;
    }
    isWatching() {
        return this.isWatching;
    }
    
    log(msg) {
        var nEl = document.querySelector('#notification');
        nEl.value += msg + '\n';
        nEl.scrollTop = nEl.scrollHeight;
    }
    stop() {
        if (!this.isWatching) {
            return;
        }
        try {
            window.webkit.messageHandlers.stopAR.postMessage({
                callback: this.callbacksMap.onStop
            });
            this.log('stopAR has been called');
        } catch(e) {
            this.log('Error: ' + e.message);
        }
        
        
        this.isWatching = false;
    }
    
    watch(options, callback) {
        if (this.isWatching || !this.isInitialized) {
            return;
        }
        this.isWatching = true;
        
        this.userCallbacks.onWatch = callback;
        
        const data = {
            options: options,
            callback: this.callbacksMap.onWatch
        };
        window.webkit.messageHandlers.watchAR.postMessage(data);
    }
    
    generateCallbacks() {
        ['onInit', 'onWatch', 'onStop'].forEach((callbackName, num) => {
            this.generateCallback(callbackName, num);
        });
    }
    
    generateCallback(callbackName, num) {
        const name = 'ARCallback' + num;
        this.callbacksMap[callbackName] = name;
        this.userCallbacks[callbackName] = function() {};
        const self = this;
        window[name] = function(deviceData) {
            console.log(callbackName);
            self[callbackName](deviceData);
        }
    }
}

class App {
    constructor() {
        //~ const argonApp = Argon.init();
        //~ argonApp.context.subscribeGeolocation({enableHighAccuracy: true});
        
        this.ar = new AR(deviceId => {
            document.querySelector('#info-deviceId').textContent = deviceId;
        });
        
        document.querySelector('#btn-stop').addEventListener('click', () => {
            this.ar.stop();
        });
        
        document.querySelector('#btn-watch').addEventListener('click', () => {
            this.ar.watch(
                {
                    'location': true
                },
                this.onWatch
            );
        });

    }
    
    onWatch(data) {
        const date = (new Date()).toTimeString();
        document.querySelector('#info-location').value = JSON.stringify(data) + ':' + date;
    }
    
}

window.addEventListener('DOMContentLoaded', () => {
    let app = new App();
    window.app = app;
});
