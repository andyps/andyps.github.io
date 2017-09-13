import assert from 'assert';
import ARKitWrapper from '../../platform/ARKitWrapper';

import ARKitInterfaceMock from './ARKitInterfaceMock';

//~ mocha.globals(['window']);

describe('ARKitWrapper', function() {
    it('should throw an error if ARKitInterface is not available', function() {
        assert.throws(() => { new ARKitWrapper(); }, Error);
    });
    
    it('should be a singleton', function() {
        let instance;
        window.webkit = new ARKitInterfaceMock();
        
        assert.throws(() => { new ARKitWrapper(); });
        
        assert.doesNotThrow(() => { instance = ARKitWrapper.GetOrCreate(); });
    });
})
