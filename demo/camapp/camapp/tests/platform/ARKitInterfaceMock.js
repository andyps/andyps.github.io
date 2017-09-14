class webkitMessageHandler {
    constructor(name) {
        this.name = name;
    }
    
    postMessage(data) {
        if (data && data.callback) {
            window[data.callback](data);
        }
    }
}

class ARKitInterfaceMock {
    constructor() {
        this.messageHandlers = {
            initAR: new webkitMessageHandler('initAR'),
            watchAR: new webkitMessageHandler('watchAR'),
            stopAR: new webkitMessageHandler('stopAR'),
            addObject: new webkitMessageHandler('addObject'),
            addAnchor: new webkitMessageHandler('addAnchor'),
            hitTest: new webkitMessageHandler('hitTest'),
            showDebug: new webkitMessageHandler('showDebug'),
            didMoveBackground: new webkitMessageHandler('didMoveBackground'),
            willEnterForeground: new webkitMessageHandler('willEnterForeground'),
            loadUrl: new webkitMessageHandler('loadUrl')
        };
    }
}

export default ARKitInterfaceMock;
