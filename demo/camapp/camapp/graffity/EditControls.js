import EventHandlerBase from '../fill/EventHandlerBase.js'

const DOUBLETAP_TIME_SENSITIVITY = 500;

const STATE_NONE = 0;
//~ const STATE_MOVE_Y = 1;
//~ const STATE_SCALE = 2;
const STATE_MOVE_Y_OR_SCALE = 3;
const STATE_MOVE_XZ = 4;

const MOVE_SPEED = 0.001;

export default class EditControls extends EventHandlerBase {
    constructor(app) {
        super();
        this.app = app;
        this.canvas = app.canvas;
        
        this.state = STATE_NONE;
        this.touches = [];
        this.pickInfo = null;
        this.cameraBasis = null;
        
        this.canvas.addEventListener('touchstart', e => {
            this.onTouchStart(e);
        }, false);
        this.canvas.addEventListener('touchmove', e => {
            this.onTouchMove(e);
        }, false);
        this.canvas.addEventListener('touchend', e => {
            this.onTouchEnd(e);
        }, false);
        this.canvas.addEventListener('touchcancel', e => {
            this.onTouchCancel(e);
        }, false);
    }
    copyTouch(touch) {
        return {
            identifier: touch.identifier,
            clientX: touch.clientX,
            clientY: touch.clientY
        };
    }
    saveTouchInfo(touch, slot) {
        const saveTouch = this.copyTouch(touch);
        saveTouch.ts = performance.now();
        this.touches[slot] = saveTouch;
    }
    getTouchInfoById(touchList, id) {
        for (let i = 0; i < touchList.length; i++) {
            if (touchList[i].identifier === id) {
                return this.copyTouch(touchList[i]);
            }
        }
        return null;
    }
    isDoubleTap(touch) {
        const lastTouch = this.touches[0];
        if (!lastTouch) {
            return false;
        }
        const ts = performance.now();
        if (ts - lastTouch.ts <= DOUBLETAP_TIME_SENSITIVITY) {
            return true;
        }
        return false;
    }
    handleModeOnTap(pickInfo, isDoubleTap) {
        const lastPickInfo = this.pickInfo;
        let mode;
        if (!isDoubleTap && pickInfo.hit && this.app.mode == EditControls.MODE_VIEW) {
            this.app.setMode(EditControls.MODE_EDIT_TRANSLATE);
            return;
        }
        if (lastPickInfo && pickInfo && lastPickInfo.hit && pickInfo.hit && lastPickInfo.pickedMesh.name == pickInfo.pickedMesh.name) {
            // edit modes
            if (this.app.mode == App.MODE_EDIT_TRANSLATE) {
                mode = EditControls.MODE_EDIT_TRANSLATE;
            } else {
                mode = EditControls.MODE_EDIT_TRANSLATE;
            }
        } else {
            // view mode
            mode = EditControls.MODE_VIEW;
        }
        this.app.setMode(mode);
    }
    obtainStateOnTouchStart(touchesLen) {
        if (touchesLen == 1) {
            this.state = STATE_MOVE_XZ;
        } else if (touchesLen == 2) {
            this.state = STATE_MOVE_Y_OR_SCALE;
        }
        this.state = STATE_NONE;
    }
    onTouchStart(e) {
        e.preventDefault();
        
        const touch = e.changedTouches[0];
        if (e.touches.length == 1) {
            const pickInfo = this.app.pick(this.getTouchPos(touch));
            
            let isDoubleTap = this.isDoubleTap(touch);
            this.saveTouchInfo(touch, 0);
            
            this.handleModeOnTap(pickInfo, isDoubleTap);
            
        } else if (e.touches.length == 2) {
            this.saveTouchInfo(touch, 1);
        }
        
        this.obtainStateOnTouchStart(e.touches.length);
        this.calculateCameraBasis();
    }
    onTouchEnd(e) {
        e.preventDefault();
        if (!this.touches.length) {
            return;
        }
        
        const savedTouch1 = this.touches[0];
        const savedTouch2 = this.touches[1];
        let touch1 = this.getTouchInfoById(e.changedTouches, savedTouch1.identifier);
        let touch2;
        
        if (savedTouch2) {
            touch2 = this.getTouchInfoById(e.changedTouches, savedTouch2.identifier);
        }
        
        if (touch2) {
            this.touches.pop();
            return;
        }
        if (touch1) {
            this.touches.shift();
            return;
        }
    }
    onTouchMove(e) {
        e.preventDefault();
        
        // check mode and state
        if (this.app.mode == EditControls.MODE_VIEW || this.state == STATE_NONE) {
            return;
        }
        if (!this.touches || !this.pickInfo) {
            return;
        }
        
        if (e.touches.length == 1) {
            if (this.state != STATE_MOVE_XZ) {
                return;
            }
            this.handleOneTouchMove(e.touches[0]);
        } else if (e.touches.length == 2) {
            if (this.state != STATE_MOVE_Y_OR_SCALE) {
                return;
            }
            this.handleTwoTouchesMove(e.touches);
        }
    }

    handleTwoTouchesMove(touches) {
        const savedTouch1 = this.touches[0];
        const savedTouch2 = this.touches[1];
        
        let touch1 = this.getTouchInfoById(touches, savedTouch1.identifier);
        let touch2;
        if (savedTouch2) {
            touch2 = this.getTouchInfoById(touches, savedTouch2.identifier);
        }
        if (!touch2) {
            return;
        }
        let dx = touch1.clientX - savedTouch1.clientX;
        let dy = touch1.clientY - savedTouch1.clientY;

        let dx2 = touch2.clientX - savedTouch2.clientX;
        let dy2 = touch2.clientY - savedTouch2.clientY;

        if (Math.sign(dx) != Math.sign(dx2) && Math.sign(dy) != Math.sign(dy2)) {
            // scale
            
            
            
            
            
            
        } else {
            // move
            this.pickInfo.pickedMesh.position.addScaledVector(new THREE.Vector3(0, -1, 0), MOVE_SPEED * dy);
        }
    }
    handleOneTouchMove(touch) {
        const savedTouch = this.touches[0];
        const dx = touch.clientX - savedTouch.clientX;
        const dy = touch.clientY - savedTouch.clientY;
        
        if (Math.abs(dx) >= Math.abs(dy)) {
            this.pickInfo.pickedMesh.position.addScaledVector(this.cameraBasis.x, MOVE_SPEED * dx);
        } else {
            this.pickInfo.pickedMesh.position.addScaledVector(this.cameraBasis.z, MOVE_SPEED * dy);
        }
        
        this.pickInfo.pickedMesh.updateMatrix();
        this.pickInfo.pickedMesh.updateMatrixWorld(true);
    }
    getTouchPos(e) {
        var x, y;
        var canvasRect = this.canvas.getBoundingClientRect();
        x = e.clientX - canvasRect.left;
        y = e.clientY - canvasRect.top;
        
        var ndcX = (x / canvasRect.width) * 2 - 1;
        var ndcY = -(y / canvasRect.height) * 2 + 1;
        return {x: x, y: y, ndcX: ndcX, ndcY: ndcY};
    }
    calculateCameraBasis() {
        this.cameraBasis = {
            x: new THREE.Vector3(),
            y: new THREE.Vector3(),
            z: new THREE.Vector3()
        };
        this.app.camera.matrix.extractBasis(this.cameraBasis.x, this.cameraBasis.y, this.cameraBasis.z);
        this.cameraBasis.x.normalize();
        this.cameraBasis.y.normalize();
        this.cameraBasis.z.normalize();
    }
}

EditControls.EVENT_DOUBLETAP = 'double-tap';
EditControls.MODE_VIEW = 'view';
EditControls.MODE_EDIT_TRANSLATE = 'edit-translate';
//~ EditControls.MODE_EDIT_ROTATE = 'edit-rotate'; @TODO implement rotating
