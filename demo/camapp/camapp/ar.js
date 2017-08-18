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
        this.isWatching = false;
        this.userCallbacks.onStop();
    }
    
    onWatch(data) {
        this.rawARData = data;
        this.userCallbacks.onWatch(data);
    }
    
    onAddObject(data) {
        this.userCallbacks.onAddObject(data);
    }
    
    getDeviceId() {
        return this.deviceId;
    }
    isWatching() {
        return this.isWatching;
    }
    
    log(msg) {
        console.log(msg);
        //~ var nEl = document.querySelector('#notification');
        //~ nEl.value += msg + '\n';
        //~ nEl.scrollTop = nEl.scrollHeight;
    }
    stop(callback) {
        if (!this.isWatching) {
            return;
        }

        this.userCallbacks.onStop = callback;
        
        try {
            window.webkit.messageHandlers.stopAR.postMessage({
                callback: this.callbacksMap.onStop
            });
            this.log('stopAR has been called');
        } catch(e) {
            this.log('Error: ' + e.message);
        }
    }
    
    toggleDebug(isDebug) {
        window.webkit.messageHandlers.showDebug.postMessage({
            debug: isDebug
        });
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
    
    addObject(name, x, y, z, callback) {
        this.userCallbacks.onAddObject = callback;
        
        window.webkit.messageHandlers.addObject.postMessage({
            name: name,
            x: x,
            y: y,
            z: z,
            callback: this.callbacksMap.onAddObject
        });
    }
    
    generateCallbacks() {
        ['onInit', 'onWatch', 'onStop', 'onAddObject'].forEach((callbackName, num) => {
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

