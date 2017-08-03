function onLoaded() {
    console.log('onLoaded');
}

AFRAME.registerElement('a-assets-loader', {
  prototype: Object.create(AFRAME.ANode.prototype, {
    createdCallback: {
      value: function () {
        this.isAssets = true;
        this.fileLoader = new THREE.FileLoader();
        this.timeout = null;
      }
    },

    attachedCallback: {
      value: function () {
        var self = this;
        var i;
        var loaded = [];
        var mediaEl;
        var mediaEls;
        var imgEl;
        var imgEls;
        var timeout;

        if (!this.parentNode.isScene) {
          throw new Error('<a-assets> must be a child of a <a-scene>.');
        }

        // Wait for <img>s.
        imgEls = this.querySelectorAll('img');
        for (i = 0; i < imgEls.length; i++) {
          imgEl = fixUpMediaElement(imgEls[i]);
          loaded.push(new Promise(function (resolve, reject) {
            // Set in cache because we won't be needing to call three.js loader if we have.
            // a loaded media element.
            THREE.Cache.files[imgEls[i].getAttribute('src')] = imgEl;
            imgEl.onload = resolve;
            imgEl.onerror = reject;
          }));
        }

        // Wait for <audio>s and <video>s.
        mediaEls = this.querySelectorAll('audio, video');
        for (i = 0; i < mediaEls.length; i++) {
          mediaEl = fixUpMediaElement(mediaEls[i]);
          loaded.push(mediaElementLoaded(mediaEl));
        }

        // Trigger loaded for scene to start rendering.
        Promise.all(loaded).then(AFRAME.utils.bind(this.load, this));

        // Timeout to start loading anyways.
        timeout = parseInt(this.getAttribute('timeout'), 10) || 3000;
        this.timeout = setTimeout(function () {
          if (self.hasLoaded) { return; }
          warn('Asset loading timed out in ', timeout, 'ms');
          self.emit('timeout');
          self.load();
        }, timeout);
      }
    },

    detachedCallback: {
      value: function () {
        if (this.timeout) { clearTimeout(this.timeout); }
      }
    },

    load: {
      value: function () {
        AFRAME.ANode.prototype.load.call(this, null, function waitOnFilter (el) {
          return el.isAssetItem && el.hasAttribute('src');
        });
      }
    }
  })
});

//~ AFRAME.registerElement('a-assets-loader', {
    //~ prototype: Object.create(AFRAME.ANode.prototype, {
        
    //~ })
//~ });

AFRAME.registerComponent('xxxloader', {
    multiple: false,
    schema: {
        target: {type: 'string'},
        xxx: {type: 'string'},
    },
    init() {
        console.log('init', this.data.target);
        const items = this.el.querySelectorAll('a-asset-item');
        
        this.preloadEl = document.querySelector('#preload');
        this.progressEl = this.preloadEl.querySelector('#preload progress');
        this._reset();
        
        this.total = items.length;
        this.progressEl.max = this.total;
        let item;
        for (let i = 0; i < this.total; i++) {
            item = items[i];
            item.addEventListener('loaded', e => {
                console.log('item loaded');
                this.onItemLoaded(e);
            });
            item.addEventListener('error', e => {
                console.log('item error');
                this.onItemError(e);
            });
        }
        
        this._show();
    },
    remove() {
        const items = this.el.querySelectorAll('a-asset-item');
        let item;
        for (let i = 0; i < this.total; i++) {
            item = items[i];
            item.removeEventListener('loaded', this.onItemLoaded);
            item.removeEventListener('loaded', this.onItemError);
        }
    },
    _onComplete() {
        console.log('Loading completed');
        this.isComplete = true;
        this._hide();
    },
    _onItemError(e) {
        console.log('There was an error loading #' + e.target.getAttribute('id') + ': ' + e.target.getAttribute('src'));
        this.progress++;
        if (this.progress >= this.total) {
            this._onComplete();
        }
    },
    _onItemLoaded(e) {
        this.progress++;
        console.log('Loaded ' + this.progress + ' of ' + this.total);
        //~ console.log(e.target.getAttribute('id'), e.target.getAttribute('src'));
        
        this.progressEl.value = this.progress;
        
        this.progressEl.textContent = this.progress;
        
        if (this.progress >= this.total) {
            this._onComplete();
        }
    },
    _reset() {
        this.progress = 0;
        this.total = 0;
        this.isComplete = false;

        this.progressEl.value = 0;
        this.progressEl.max = 100;
        this.progressEl.textContent = '';
    },
    _hide() {
        this.preloadEl.classList.add('hidden');
    },
    _show() {
        this.preloadEl.classList.remove('hidden');
    }
});

AFRAME.registerComponent('log', {
    multiple: true,
    schema: {
        message: {type: 'string', default: 'Hello, World!'},
        event: {type: 'string', default: ''},
        speed: {type: 'number', default: 1}
    },
    init() {
        console.log('init', this.id, this.attrName, this.data);
        
        var self = this;
        this.eventHandlerFn = function() { console.log('event', self.data.message); };
    },
    update(oldData) {
        var data = this.data;
        var el = this.el;
        
        if (oldData.event && data.event !== oldData.event) {
            el.removeEventListener(oldData.event, this.eventHandlerFn);
        }
        
        
        if (data.event) {
            el.addEventListener(data.event, this.eventHandlerFn);
        } else {
            console.log('update', data.message);
        }
    },
    remove() {
        var data = this.data;
        var el = this.el;
        // Remove event listener.
        if (data.event) {
            el.removeEventListener(data.event, this.eventHandlerFn);
        }
    }
});

AFRAME.registerComponent('xxx', {
    schema: {
        target: {type: 'selector'},
        speed: {type: 'number', default: 1}
    },
    init() {
        this.directionVec3 = new THREE.Vector3();
        
        console.log(this.data.target);
    },
    tick(time, timeDelta) {
        var directionVec3 = this.directionVec3;

        var targetPosition = this.data.target.object3D.position;
        var currentPosition = this.el.object3D.position;
        
        directionVec3.copy(targetPosition).sub(currentPosition);
        var distance = directionVec3.length();
        if (distance < 1) { return; }
        
        var factor = this.data.speed / distance;
        ['x', 'y', 'z'].forEach(axis => {
            directionVec3[axis] *= factor * (timeDelta / 1000);
        });
        
        this.el.setAttribute('position', {
            x: currentPosition.x + directionVec3.x,
            y: currentPosition.y + directionVec3.y,
            z: currentPosition.z + directionVec3.z
        });
    }
});

AFRAME.registerComponent('change-color-on-hover', {
    schema: {
      color: {default: 'red'}
    },
    init: function () {
      var data = this.data;
      var el = this.el;
      var defaultColor = el.getAttribute('material').color;
      el.addEventListener('mouseenter', function () {
        el.setAttribute('color', data.color);
      });
      el.addEventListener('mouseleave', function () {
        el.setAttribute('color', defaultColor);
      });
    }
});
  
class App {
    constructor() {
        return;
        console.log('hello app');
        var $this = this;
        
        const assetsEl = document.querySelector('#assets');
        
        assetsEl.addEventListener('loaded', function(e) {
            console.log('LOADED', this, e);
        });
        
        assetsEl.addEventListener('error', function(e) {
            console.log('ERROR', this, e);
        });
        /*
        assetsEl.addEventListener('progress', function(e, a) {
            console.log('progress', e);
        });
        */
        this.preloadEl = document.querySelector('#preload');
        this.progressEl = this.preloadEl.querySelector('#preload progress');
        this.reset();
        
        const items = assetsEl.querySelectorAll('a-asset-item');
        this.total = items.length;
        this.progressEl.max = this.total;
        let item;
        for (let i = 0; i < this.total; i++) {
            item = items[i];
            item.addEventListener('loaded', e => {
                console.log('item loaded');
                this.onItemLoaded(e);
            });
            item.addEventListener('error', e => {
                console.log('item error');
                this.onItemError(e);
            });
            //~ item.addEventListener('progress', function(e) {
                //~ console.log('item progress', this, e);
            //~ });
        }
        
        this.show();
    }
    onComplete() {
        console.log('Loading completed');
        this.isComplete = true;
        this.hide();
    }
    onItemError(e) {
        console.log('There was an error loading #' + e.target.getAttribute('id') + ': ' + e.target.getAttribute('src'));
        this.progress++;
        if (this.progress >= this.total) {
            this.onComplete();
        }
    }
    onItemLoaded(e) {
        this.progress++;
        console.log('Loaded ' + this.progress + ' of ' + this.total);
        //~ console.log(e.target.getAttribute('id'), e.target.getAttribute('src'));
        
        this.progressEl.value = this.progress;
        
        this.progressEl.textContent = this.progress;
        
        if (this.progress >= this.total) {
            this.onComplete();
        }
    }
    reset() {
        this.progress = 0;
        this.total = 0;
        //~ this.isComplete = true;
        this.isComplete = false;

        this.progressEl.value = 0;
        this.progressEl.max = 100;
        this.progressEl.textContent = '';
    }
    hide() {
        this.preloadEl.classList.add('hidden');
    }
    show() {
        this.preloadEl.classList.remove('hidden');
    }
    run() {
    }

    update() {
    }

    render() {
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    window.app = app;
});
