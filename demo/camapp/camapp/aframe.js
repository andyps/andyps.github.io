AFRAME.registerComponent('picker', {
    dependencies: ['raycaster'],
    init: function () {
        var self = this;
        var sel = null;
        this.el.addEventListener('raycaster-intersection', function(e) {
            console.log('Picked!', e.detail.els[0]);
            sel = e.detail.els[0];
        });
        this.el.addEventListener('raycaster-intersection-cleared', function(e) {
            sel = null;
        });
        
        window.addEventListener('click', function(e) {
            if (e.target.nodeName.toUpperCase() == 'BUTTON') {
                return;
            }
            if (sel) {
                sel.parentEl.remove(sel);
                sel = null;
                self.el.components.raycaster.refreshObjects();
            }
        });

    }
});

window.addEventListener('DOMContentLoaded', () => {
    window.ray = document.querySelector('#ray');
    window.ray.setAttribute('picker', '');
});

function up() {
    if (!window.ray) return;
    window.ray.setAttribute('position', {x: 0, y: 1, z: 0})
}
function down() {
    if (!window.ray) return;
    window.ray.setAttribute('position', {x: 0, y: -1, z: 0})
}
