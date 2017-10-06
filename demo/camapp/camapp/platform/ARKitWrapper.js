import EventHandlerBase from '../fill/EventHandlerBase.js'

/*
ARKitWrapper talks to Apple ARKit, as exposed by Mozilla's test ARDemo app.
It won't function inside a browser like Firefox.

ARKitWrapper is a singleton. Use ARKitWrapper.GetOrCreate() to get the instance, then add event listeners like so:

	if(ARKitWrapper.HasARKit()){
		let arKitWrapper = ARKitWrapper.GetOrCreate()
        arKitWrapper.init().then(ev => { console.log('ARKit initialized', ev) })
		arKitWrapper.addEventListener(ARKitWrapper.WATCH_EVENT, ev => { console.log('ARKit update', ev) })
		arKitWrapper.watch({
			location: boolean,
			camera: boolean,
			anchors: boolean,
			light_estimate: boolean
		})
	}

*/
const DEFAULT_OPTIONS = {
    init: {
        ui: {
            arkit: {},
            custom: {
                browser: true,
                rec: true,
                warnings: true
            }
        }
    },
    setUIOptions: {
        ui: {
            arkit: {},
            custom: {}
        }
    }
}

export default class ARKitWrapper extends EventHandlerBase {
	constructor(){
		super()
		if(ARKitWrapper.HasARKit() === false){
			throw 'ARKitWrapper will only work in Mozilla\'s ARDemo test app'
		}
		if(typeof ARKitWrapper.GLOBAL_INSTANCE !== 'undefined'){
			throw 'ARKitWrapper is a singleton. Use ARKitWrapper.GetOrCreate() to get the global instance.'
		}

		//~ this._deviceId = null
		this._deviceInfo = null
		this._isWatching = false
		this._isInitialized = false
		this._rawARData = null

		this._globalCallbacksMap = {} // Used to map a window.arkitCallback method name to an ARKitWrapper.on* method name
		// Set up the window.arkitCallback methods that the ARKit bridge depends on
		//~ let callbackNames = ['onInit', 'onWatch']
		let callbackNames = ['onWatch']
		for(let i=0; i < callbackNames.length; i++){
			this._generateGlobalCallback(callbackNames[i], i)
		}

		// Set up some named global methods that the ARKit to JS bridge uses and send out custom events when they are called
		let eventCallbacks = [
			['arkitStartRecording', ARKitWrapper.RECORD_START_EVENT],
			['arkitStopRecording', ARKitWrapper.RECORD_STOP_EVENT],
			['arkitDidMoveBackground', ARKitWrapper.DID_MOVE_BACKGROUND_EVENT],
			['arkitWillEnterForeground', ARKitWrapper.WILL_ENTER_FOREGROUND_EVENT],
			['arkitInterrupted', ARKitWrapper.INTERRUPTED_EVENT],
			['arkitInterruptionEnded', ARKitWrapper.INTERRUPTION_ENDED_EVENT], 
			['arkitShowDebug', ARKitWrapper.SHOW_DEBUG_EVENT]
		]
		for(let i=0; i < eventCallbacks.length; i++){
			window[eventCallbacks[i][0]] = (detail) => {
				detail = detail || null
				this.dispatchEvent(
					new CustomEvent(
						eventCallbacks[i][1],
						{
							source: this,
							detail: detail
						}
					)
				)
			}
		}
	}

	//~ static GetOrCreate(options=null){
	static GetOrCreate(){
		if(typeof ARKitWrapper.GLOBAL_INSTANCE === 'undefined'){
			ARKitWrapper.GLOBAL_INSTANCE = new ARKitWrapper()
			//~ options = (options && typeof(options) == 'object') ? options : {}
			//~ let defaultUIOptions = {
				//~ browser: true,
				//~ rec: true,
				//~ warnings: true
			//~ }
			//~ let uiOptions = (typeof(options.ui) == 'object') ? options.ui : {}
			//~ options.ui = Object.assign(defaultUIOptions, uiOptions)
			//~ ARKitWrapper.GLOBAL_INSTANCE._sendInit(options)
		}
		return ARKitWrapper.GLOBAL_INSTANCE
	}

	static HasARKit(){
		return typeof window.webkit !== 'undefined'
	}

	get deviceInfo(){ return this._deviceInfo } // The ARKit provided device information
	//~ get deviceId(){ return this._deviceId } // The ARKit provided device ID
	get isWatching(){ return this._isWatching } // True if ARKit is sending frame data
	get isInitialized(){ return this._isInitialized } // True if this instance has received the onInit callback from ARKit
	get hasData(){ return this._rawARData !== null } // True if this instance has received data via onWatch

	//~ _sendInit(options){
		//~ // get device id
		//~ window.webkit.messageHandlers.initAR.postMessage({
			//~ options: options,
			//~ callback: this._globalCallbacksMap.onInit
		//~ })
	//~ }

	init(options=null){
        options = this._mergeOptions(DEFAULT_OPTIONS.init, options);
		return new Promise((resolve, reject) => {
			if (this._isInitialized){
				resolve(this.deviceInfo);
				return;
			}
			window.webkit.messageHandlers.initAR.postMessage({
				callback: this._createPromiseCallback('init', resolve, reject),
                options: options
			})
		})
	}

    _mergeOptions(defOptions, options){
        options = (options && typeof(options) == 'object') ? options : {}
        options = Object.assign({}, options)
        let result = {}
        for (let key in defOptions) {
            if (typeof(options[key]) == 'undefined') {
                result[key] = defOptions[key];
            } else if (typeof(defOptions[key]) != 'object') {
                result[key] = options[key];
            } else {
                result[key] = this._mergeOptions(defOptions[key], options[key]);
            }
            delete options[key];
        }
        return Object.assign(result, options);
    }

	/*
	Useful for waiting for or immediately receiving notice of ARKit initialization
	*/
	//~ waitForInit(){
		//~ return new Promise((resolve, reject) => {
			//~ if(this._isInitialized){
				//~ resolve()
				//~ return
			//~ }
			//~ const callback = (evt) => {
				//~ this.removeEventListener(ARKitWrapper.INIT_EVENT, callback, false)
				//~ resolve(evt)
			//~ }
			//~ this.addEventListener(ARKitWrapper.INIT_EVENT, callback, false)
		//~ })
	//~ }

	/*
	getData looks into the most recent ARKit data (as received by onWatch) for a key
	returns the key's value or null if it doesn't exist or if a key is not specified it returns all data
	*/
	getData(key=null){
		if (key === null){
			return this._rawARData
		}
		if(this._rawARData && typeof this._rawARData[key] !== 'undefined'){
			return this._rawARData[key]
		}
		return null
	}	

	/*
	returns
		{
			uuid: DOMString,
			transform: [4x4 column major affine transform]
		}

	return null if object with `uuid` is not found
	*/
	getObject(uuid){
		if (!this._isInitialized){
			return null
		}
		const objects = this.getKey('objects')
		if(objects === null) return null
		for(const object of objects){
			if(object.uuid === uuid){
				return object
			}
		}
		return null
	}

	/*
	Sends a hitTest message to ARKit to get hit testing results
	x, y - screen coordinates normalized to 0..1 (0,0 is at top left and 1,1 is at bottom right)
	types - bit mask of hit testing types
	
	Returns a Promise that resolves to a (possibly empty) array of hit test data:
	[
		{
			type: 1,							// A packed mask of types ARKitWrapper.HIT_TEST_TYPE_*
			distance: 1.0216870307922363,		// The distance in meters from the camera to the detected anchor or feature point.
			world_transform:  [float x 16],		// The pose of the hit test result relative to the world coordinate system. 
			local_transform:  [float x 16],		// The pose of the hit test result relative to the nearest anchor or feature point

			// If the `type` is `HIT_TEST_TYPE_ESTIMATED_HORIZONTAL_PLANE`, `HIT_TEST_TYPE_EXISTING_PLANE`, or `HIT_TEST_TYPE_EXISTING_PLANE_USING_EXTENT` (2, 8, or 16) it will also have anchor data:
			anchor_center: { x:float, y:float, z:float },
			anchor_extent: { x:float, y:float },
			uuid: string,

			// If the `type` is `HIT_TEST_TYPE_EXISTING_PLANE` or `HIT_TEST_TYPE_EXISTING_PLANE_USING_EXTENT` (8 or 16) it will also have an anchor transform:
			anchor_transform: [float x 16]
		},
		...
	]
	@see https://developer.apple.com/documentation/arkit/arframe/2875718-hittest
	*/
	hitTest(x, y, types=ARKitWrapper.HIT_TEST_TYPE_ALL){
		return new Promise((resolve, reject) => {
			if (!this._isInitialized){
				reject(new Error('ARKit is not initialized'));
				return;
			}
			window.webkit.messageHandlers.hitTest.postMessage({
                options: {
                    point: {x: x, y: y},
                    type: types
                },
				callback: this._createPromiseCallback('hitTest', resolve, reject)
			})
		})
	}

	/*
	Sends an addAnchor message to ARKit
	Returns a promise that returns:
	{
		world_transform - anchor transformation matrix
	}
	*/
	addAnchor(transform){
		return new Promise((resolve, reject) => {
			if (!this._isInitialized){
				reject(new Error('ARKit is not initialized'));
				return;
			}
			window.webkit.messageHandlers.addAnchor.postMessage({
                options: {
                    transform: transform
                },
				callback: this._createPromiseCallback('addAnchor', resolve, reject)
			})
		})
	}

	removeAnchor(uid){
		return new Promise((resolve, reject) => {
			window.webkit.messageHandlers.removeAnchor.postMessage({
                options: {
                    uuid: uid
                },
				callback: this._createPromiseCallback('removeAnchor', resolve, reject)
			})
		})
	}
    /*
    anchor {
      uuid: DOMString,
      world_transform - anchor transformation matrix
    }
    */
	updateAnchor(anchor){
		return new Promise((resolve, reject) => {
			window.webkit.messageHandlers.updateAnchor.postMessage({
                options: {
                    anchor: anchor
                },
				callback: this._createPromiseCallback('updateAnchor', resolve, reject)
			})
		})
	}

	/*
	If this instance is currently watching, send the stopAR message to ARKit to request that it stop sending data on onWatch
	*/
	stop(){
		return new Promise((resolve, reject) => {
			if (!this._isWatching){
				resolve();
				return;
			}
			window.webkit.messageHandlers.stopAR.postMessage({
				callback: this._createPromiseCallback('stop', resolve, reject)
			})
		})
	}
	
	/*
	If not already watching, send a watchAR message to ARKit to request that it start sending per-frame data to onWatch
	options: the options map for ARKit
		{
			location: {
                accuracy: DOMString
            },
            heading: {
                accuracy: float
            },
			camera: boolean,
			anchors: boolean,
			planes: boolean,
			light_estimate: boolean
		}
	*/
	watch(options=null){
		if (!this._isInitialized){
			return false
		}
		if(this._isWatching){
			return true
		}
		this._isWatching = true

		if(options === null){
			options = {
				camera: true,
				anchors: true,
				planes: true,
				light_estimate: true
			}
		}
		
		const data = {
			options: options,
			callback: this._globalCallbacksMap.onWatch
		}
		window.webkit.messageHandlers.watchAR.postMessage(data)
		return true
	}


/*
UIOptions {
   arkit: {
   	statistics: Boolean?
   	plane: Boolean?
   	focus: Boolean?
   	anchors: Boolean?
   }
   custom : {

//        browser: Boolean?
//        points: Boolean?
//        rec: Boolean?
//        rec_time: Boolean?
//        mic: Boolean?
//        build: Boolean?
//        warnings: Boolean?  
//        debug: Boolean?
        _ : Boolean?
   }
}
*/

	/*
	Sends a setUIOptions message to ARKit to set ui options (show or hide ui elements)
	options: {
		browser: boolean,
		points: boolean,
		focus: boolean,
		rec: boolean,
		rec_time: boolean,
		mic: boolean,
		build: boolean,
		plane: boolean,
		warnings: boolean,
		anchors: boolean,
		debug: boolean,
		statistics: boolean
	}
	*/
	setUIOptions(options){
        options = this._mergeOptions(DEFAULT_OPTIONS.setUIOptions, options);
		return new Promise((resolve, reject) => {
			window.webkit.messageHandlers.setUIOptions.postMessage({
				callback: this._createPromiseCallback('setUIOptions', resolve, reject),
                options: options
			})
		})
	}

	loadURL(url){
        window.webkit.messageHandlers.loadURL.postMessage({
            options: {url: url}
        })
	}
    
	/*
	Called during instance creation to send a message to ARKit to initialize and create a device ID
	Usually results in ARKit calling back to _onInit with a deviceId
	options: {
		ui: {
			browser: boolean,
			points: boolean,
			focus: boolean,
			rec: boolean,
			rec_time: boolean,
			mic: boolean,
			build: boolean,
			plane: boolean,
			warnings: boolean,
			anchors: boolean,
			debug: boolean,
			statistics: boolean
		}
	}
	*/
	//~ _sendInit(options){
		//~ // get device id
		//~ window.webkit.messageHandlers.initAR.postMessage({
			//~ options: options,
			//~ callback: this._globalCallbacksMap.onInit
		//~ })
	//~ }

	/*
	Callback for when ARKit is initialized
	Callback returns device info: {
		deviceUUID: DOMString - AR device ID,
		screenScale: float,
		systemVersion: DOMString,
		isIpad: boolean,
		screenSize: {
			width: float,
			height: float
		}
	}
	*/
	_onInit(info){
        this._deviceInfo = info
        //~ this._deviceId = info.deviceUUID
		this._isInitialized = true
		//~ this.dispatchEvent(new CustomEvent(ARKitWrapper.INIT_EVENT, {
			//~ source: this,
			//~ detail: info
		//~ }))
	}

	/*
	_onWatch is called from native ARKit on each frame:
		data:
		{
			"camera_transform":[4x4 column major affine transform matrix],
			"projection_camera":[4x4 projection matrix],
			"location":{
				"altitude": 176.08457946777344,
				"longitude": -79.222516606740456,
				"latitude": 35.789005972772181
			}
		}

	*/
	_onWatch(data){
		this._rawARData = data
		this.dispatchEvent(new CustomEvent(ARKitWrapper.WATCH_EVENT, {
			source: this,
			detail: this._rawARData
		}))
	}

	/*
	Callback from ARKit for when sending per-frame data to onWatch is stopped
	*/
	_onStop(){
		this._isWatching = false
	}

	_createPromiseCallback(action, resolve, reject){
		const callbackName = this._generateCallbackUID(action);
		window[callbackName] = (data) => {
			delete window[callbackName]
            if (this._isError(data)){
                reject(new Error('ARKit responded with an error code ' + data));
                return;
            }
			const wrapperCallbackName = '_on' + action[0].toUpperCase() +
				action.slice(1);
			if (typeof(this[wrapperCallbackName]) == 'function'){
				this[wrapperCallbackName](data);
			}
			resolve(data)
		}
		return callbackName;
	}

	_generateCallbackUID(prefix){
		return 'arkitCallback_' + prefix + '_' + new Date().getTime() + 
			'_' + Math.floor((Math.random() * Number.MAX_SAFE_INTEGER))
	}

	/*
	The ARKit iOS app depends on several callbacks on `window`. This method sets them up.
	They end up as window.arkitCallback? where ? is an integer.
	You can map window.arkitCallback? to ARKitWrapper instance methods using _globalCallbacksMap
	*/
	_generateGlobalCallback(callbackName, num){
		const name = 'arkitCallback' + num
		this._globalCallbacksMap[callbackName] = name
		const self = this
		window[name] = function(deviceData){
			self['_' + callbackName](deviceData)
		}
	}
	
	_isError(info){
		if (typeof(info) == 'object' || typeof(info) == 'undefined') {
			return false;
		}
		return true;
	}
}

// ARKitWrapper event names:
//~ ARKitWrapper.INIT_EVENT = 'arkit-init'
ARKitWrapper.WATCH_EVENT = 'arkit-watch'
ARKitWrapper.RECORD_START_EVENT = 'arkit-record-start'
ARKitWrapper.RECORD_STOP_EVENT = 'arkit-record-stop'
ARKitWrapper.DID_MOVE_BACKGROUND_EVENT = 'arkit-did-move-background'
ARKitWrapper.WILL_ENTER_FOREGROUND_EVENT = 'arkit-will-enter-foreground'
ARKitWrapper.INTERRUPTED_EVENT = 'arkit-interrupted'
ARKitWrapper.INTERRUPTION_ENDED_EVENT = 'arkit-interruption-ended'
ARKitWrapper.SHOW_DEBUG_EVENT = 'arkit-show-debug'

// hit test types
ARKitWrapper.HIT_TEST_TYPE_FEATURE_POINT = 1
ARKitWrapper.HIT_TEST_TYPE_EXISTING_PLANE = 8
ARKitWrapper.HIT_TEST_TYPE_ESTIMATED_HORIZONTAL_PLANE = 2
ARKitWrapper.HIT_TEST_TYPE_EXISTING_PLANE_USING_EXTENT = 16

ARKitWrapper.HIT_TEST_TYPE_ALL = ARKitWrapper.HIT_TEST_TYPE_FEATURE_POINT |
	ARKitWrapper.HIT_TEST_TYPE_EXISTING_PLANE |
	ARKitWrapper.HIT_TEST_TYPE_ESTIMATED_HORIZONTAL_PLANE |
	ARKitWrapper.HIT_TEST_TYPE_EXISTING_PLANE_USING_EXTENT

ARKitWrapper.HIT_TEST_TYPE_EXISTING_PLANES = ARKitWrapper.HIT_TEST_TYPE_EXISTING_PLANE |
	ARKitWrapper.HIT_TEST_TYPE_EXISTING_PLANE_USING_EXTENT

// location accuracies
ARKitWrapper.LOCATION_ACCURACY_BEST_FOR_NAVIGATION = 'BestForNavigation'
ARKitWrapper.LOCATION_ACCURACY_BEST = 'Best'
ARKitWrapper.LOCATION_ACCURACY_NEAREST_TEN_METERS = 'NearestTenMeters'
ARKitWrapper.LOCATION_ACCURACY_HUNDRED_METERS = 'HundredMeters'
ARKitWrapper.LOCATION_ACCURACY_KILOMETER = 'Kilometer'
ARKitWrapper.LOCATION_ACCURACY_THREE_KILOMETERS = 'ThreeKilometers'
