AFRAME.registerComponent('log', {
    schema: {type: 'string'},
    init() {
        console.log(this.data);
    }
});

class App {
    constructor() {
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
