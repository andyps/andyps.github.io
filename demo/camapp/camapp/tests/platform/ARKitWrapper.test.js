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
        
        return instance.hitTest(0, 1).then(data => {
            assert.equal(data.x, 0);
            assert.equal(data.y, 1);
            assert.equal(data.type, ARKitWrapper.HIT_TEST_TYPE_ALL);
        });
    });

    it('should hitTest work and accept hitTest type HIT_TEST_TYPE_EXISTING_PLANE correctly', function() {
        window.webkit = new ARKitInterfaceMock();
        const instance = ARKitWrapper.GetOrCreate();
        
        return instance.hitTest(0.7, 0.1, ARKitWrapper.HIT_TEST_TYPE_EXISTING_PLANE).then(data => {
            assert.equal(data.x, 0.7);
            assert.equal(data.y, 0.1);
            assert.equal(data.type, ARKitWrapper.HIT_TEST_TYPE_EXISTING_PLANE);
        });
    });

    it('should hitTest work and accept hitTest type HIT_TEST_TYPE_ESTIMATED_HORIZONTAL_PLANE correctly', function() {
        window.webkit = new ARKitInterfaceMock();
        const instance = ARKitWrapper.GetOrCreate();
        
        return instance.hitTest(0.1, 0.6, ARKitWrapper.HIT_TEST_TYPE_ESTIMATED_HORIZONTAL_PLANE).then(data => {
            assert.equal(data.x, 0.1);
            assert.equal(data.y, 0.6);
            assert.equal(data.type, ARKitWrapper.HIT_TEST_TYPE_ESTIMATED_HORIZONTAL_PLANE);
        });
    });

    it('should hitTest work and accept hitTest type HIT_TEST_TYPE_EXISTING_PLANE_USING_EXTENT correctly', function() {
        window.webkit = new ARKitInterfaceMock();
        const instance = ARKitWrapper.GetOrCreate();
        
        return instance.hitTest(0, 0, ARKitWrapper.HIT_TEST_TYPE_EXISTING_PLANE_USING_EXTENT).then(data => {
            assert.equal(data.x, 0);
            assert.equal(data.y, 0);
            assert.equal(data.type, ARKitWrapper.HIT_TEST_TYPE_EXISTING_PLANE_USING_EXTENT);
        });
    });

    it('should hitTest work and accept hitTest type HIT_TEST_TYPE_FEATURE_POINT correctly', function() {
        window.webkit = new ARKitInterfaceMock();
        const instance = ARKitWrapper.GetOrCreate();
        
        return instance.hitTest(0.5, 0.3, ARKitWrapper.HIT_TEST_TYPE_FEATURE_POINT).then(data => {
            assert.equal(data.x, 0.5);
            assert.equal(data.y, 0.3);
            assert.equal(data.type, ARKitWrapper.HIT_TEST_TYPE_FEATURE_POINT);
        });
    });

    it('should addAnchor work', function() {
        window.webkit = new ARKitInterfaceMock();
        const instance = ARKitWrapper.GetOrCreate();
        const transform = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
        return instance.addAnchor('anchor1', transform).then(data => {
            assert.equal(data.uuid, 'anchor1', 'should uuid match');
            assert.equal(JSON.stringify(data.transform), JSON.stringify(transform), 'should transform match');
        });
    });

    it('should addAnchor fail if not initialized', function() {
        window.webkit = new ARKitInterfaceMock();
        const instance = ARKitWrapper.GetOrCreate();
        
        instance._isInitialized = false;
        let caught = false;
        return instance.addAnchor('anchor1', [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]).catch(() => {
            caught = true;
        }).then(() => {
            assert.ok(caught, 'should reject');
        });
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
        return instance.stop().then(() => {
            assert.equal(instance.isWatching, false, 'should be false after stop');
        });
        
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
