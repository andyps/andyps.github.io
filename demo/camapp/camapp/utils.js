const Utils = {
    isWebGLSupported: (canvas) => {
        let glContextNames = ['webgl', 'experimental-webgl'];
        for (let i = 0; i < glContextNames.length; i++) {
            try {
                if (canvas.getContext(glContextNames[i]) !== null && !!window.WebGLRenderingContext) {
                    return true;
                }
            } catch(e) {
                continue;
            }
        }
        return false;
    }
};
