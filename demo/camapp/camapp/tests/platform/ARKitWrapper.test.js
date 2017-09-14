import assert from 'assert';
import ARKitWrapper from '../../platform/ARKitWrapper';

import ARKitInterfaceMock from './ARKitInterfaceMock';

describe('ARKitWrapper', function() {
    afterEach(function() {
        delete ARKitWrapper.GLOBAL_INSTANCE;
    });
    
    it('should throw an error if ARKitInterface is not available', function() {
        assert.throws(() => { ARKitWrapper.GetOrCreate(); });
    });
    
    it('should HasARKit return false if ARKitInterface is not available', function() {
        assert.equal(ARKitWrapper.HasARKit(), false, 'should return false');
    });
    
    it('should HasARKit return true if ARKitInterface is available', function() {
        window.webkit = new ARKitInterfaceMock();
        assert.equal(ARKitWrapper.HasARKit(), true, 'should return true');
    });
    
    it('should initialize', function() {
        let instance;
        window.webkit = new ARKitInterfaceMock();
        
        assert.doesNotThrow(() => { instance = ARKitWrapper.GetOrCreate(); });
    });
    
    it('should isInitialized be true after initializing', function() {
        window.webkit = new ARKitInterfaceMock();
        const instance = ARKitWrapper.GetOrCreate()
        
        assert.equal(instance.isInitialized, true, 'isInitialized was false');
    });
    
    it('should hitTest work and pass ARKitWrapper.HIT_TEST_TYPE_ALL by default', function() {
        window.webkit = new ARKitInterfaceMock();
        const instance = ARKitWrapper.GetOrCreate();
        let correctCallbacks = 0;
        
        instance.addEventListener(ARKitWrapper.HIT_TEST_EVENT, function(e) {
            if (e.type == ARKitWrapper.HIT_TEST_EVENT 
                && e.detail.x == 0 && e.detail.y == 1
                && e.detail.type === ARKitWrapper.HIT_TEST_TYPE_ALL
            ) {
                correctCallbacks++;
            }
        });
        
        instance.hitTest(0, 1);
        
        assert.equal(correctCallbacks, 1, 'expected 1 hitTest callback');
    });

    it('should hitTest work and accept hitTest types correctly', function() {
        window.webkit = new ARKitInterfaceMock();
        const instance = ARKitWrapper.GetOrCreate();
        let correctCallbacks = 0;
        
        const addHitTestListener = (x, y, type) => {
            const callback = (e) => {
                if (e.type == ARKitWrapper.HIT_TEST_EVENT 
                    && e.detail.x == x && e.detail.y == y
                    && e.detail.type === type
                ) {
                    correctCallbacks++;
                    instance.removeEventListener(ARKitWrapper.HIT_TEST_EVENT, callback);
                }
            };
            instance.addEventListener(ARKitWrapper.HIT_TEST_EVENT, callback);
        };
        
        addHitTestListener(0.5, 0.3, ARKitWrapper.HIT_TEST_TYPE_FEATURE_POINT);
        instance.hitTest(0.5, 0.3, ARKitWrapper.HIT_TEST_TYPE_FEATURE_POINT);
        assert.equal(correctCallbacks, 1, 'expected correct hitTest callback1');
        correctCallbacks = 0;
        
        addHitTestListener(0.7, 0.1, ARKitWrapper.HIT_TEST_TYPE_EXISTING_PLANE);
        instance.hitTest(0.7, 0.1, ARKitWrapper.HIT_TEST_TYPE_EXISTING_PLANE);
        assert.equal(correctCallbacks, 1, 'expected correct hitTest callback2');
        correctCallbacks = 0;
        
        addHitTestListener(0.1, 0.6, ARKitWrapper.HIT_TEST_TYPE_ESTIMATED_HORIZONTAL_PLANE);
        instance.hitTest(0.1, 0.6, ARKitWrapper.HIT_TEST_TYPE_ESTIMATED_HORIZONTAL_PLANE);
        assert.equal(correctCallbacks, 1, 'expected correct hitTest callback3');
        correctCallbacks = 0;
        
        addHitTestListener(0, 0, ARKitWrapper.HIT_TEST_TYPE_EXISTING_PLANE_USING_EXTENT);
        instance.hitTest(0, 0, ARKitWrapper.HIT_TEST_TYPE_EXISTING_PLANE_USING_EXTENT);
        assert.equal(correctCallbacks, 1, 'expected correct hitTest callback4');
        correctCallbacks = 0;
        
        addHitTestListener(0, 0, ARKitWrapper.HIT_TEST_TYPE_FEATURE_POINT | ARKitWrapper.HIT_TEST_TYPE_EXISTING_PLANE);
        instance.hitTest(0, 0, ARKitWrapper.HIT_TEST_TYPE_FEATURE_POINT | ARKitWrapper.HIT_TEST_TYPE_EXISTING_PLANE);
        assert.equal(correctCallbacks, 1, 'expected correct hitTest callback5');
        correctCallbacks = 0;
    });
    
    it('should addAnchor work', function() {
        window.webkit = new ARKitInterfaceMock();
        const instance = ARKitWrapper.GetOrCreate();
        let correctCallbacks = 0;
        
        const transform = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
        instance.addEventListener(ARKitWrapper.ADD_ANCHOR_EVENT, function(e) {
            if (e.type == ARKitWrapper.ADD_ANCHOR_EVENT 
                && e.detail.uuid == 'anchor1'
                && JSON.stringify(e.detail.transform) == JSON.stringify(transform)
            ) {
                correctCallbacks++;
            }
        });
        
        instance.addAnchor('anchor1', transform);
        
        assert.equal(correctCallbacks, 1, 'expected 1 addAnchor callback');
    });
    
    it('should addAnchor return false if not initialized and not call arkit', function() {
        window.webkit = new ARKitInterfaceMock();
        const instance = ARKitWrapper.GetOrCreate();
        let callbacks = 0;
        
        instance.addEventListener(ARKitWrapper.ADD_ANCHOR_EVENT, function() {
            callbacks++;
        });
        
        instance._isInitialized = false;
        const ret = instance.addAnchor('anchor1', [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
        
        assert.equal(ret, false, 'should return false');
        assert.equal(callbacks, 0, 'expected no addAnchor callbacks');
    });
    
    it('should isWatching be false by default and become true after calling watch', function() {
        window.webkit = new ARKitInterfaceMock();
        const instance = ARKitWrapper.GetOrCreate();
        
        assert.equal(instance.isWatching, false, 'should be false');
        
        instance.watch();
        
        assert.equal(instance.isWatching, true, 'should become true');
    });
    
    it('should isWatching become false after stop', function() {
        window.webkit = new ARKitInterfaceMock();
        const instance = ARKitWrapper.GetOrCreate();
        
        instance.watch();
        assert.equal(instance.isWatching, true, 'should be true after watch');
        instance.stop();
        assert.equal(instance.isWatching, false, 'should be false after stop');
    });

    it('should create functions available for arkit', function() {
        window.webkit = new ARKitInterfaceMock();
        ARKitWrapper.GetOrCreate();
        
        assert.ok(typeof(window.arkitStartRecording) == 'function');
        assert.ok(typeof(window.arkitStopRecording) == 'function');
        assert.ok(typeof(window.arkitDidMoveBackground) == 'function');
        assert.ok(typeof(window.arkitWillEnterForeground) == 'function');
        assert.ok(typeof(window.arkitInterrupted) == 'function');
        assert.ok(typeof(window.arkitInterruptionEnded) == 'function');
        assert.ok(typeof(window.arkitShowDebug) == 'function');
    });
    
    it('should global arkit events work', function() {
        window.webkit = new ARKitInterfaceMock();
        const instance = ARKitWrapper.GetOrCreate();
        let callbacks = 0;
        
        instance.addEventListener(ARKitWrapper.RECORD_START_EVENT, () => {
            callbacks++;
        });
        instance.addEventListener(ARKitWrapper.RECORD_STOP_EVENT, () => {
            callbacks++;
        });
        instance.addEventListener(ARKitWrapper.DID_MOVE_BACKGROUND_EVENT, () => {
            callbacks++;
        });
        instance.addEventListener(ARKitWrapper.WILL_ENTER_FOREGROUND_EVENT, () => {
            callbacks++;
        });
        instance.addEventListener(ARKitWrapper.INTERRUPTED_EVENT, () => {
            callbacks++;
        });
        instance.addEventListener(ARKitWrapper.INTERRUPTION_ENDED_EVENT, () => {
            callbacks++;
        });
        instance.addEventListener(ARKitWrapper.SHOW_DEBUG_EVENT, () => {
            callbacks++;
        });

        window.arkitStartRecording();
        window.arkitStopRecording();
        window.arkitDidMoveBackground();
        window.arkitWillEnterForeground();
        window.arkitInterrupted();
        window.arkitInterruptionEnded();
        window.arkitShowDebug();
        
        assert.equal(callbacks, 7, 'expected number of calls does not match');
    });
})
