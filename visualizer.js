import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1.0, 0.01, 15);
let container = null;

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

function animation(time) {
    // Logic to handle the enclosing container being resized.
    const width = container.offsetWidth, height = container.offsetHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);

    // Rotate the objects in the scene.
    scene.rotation.x = Math.PI / 2;
    scene.rotation.z = time / 3000;

    renderer.render(scene, camera);
}

export function updateScene(pdbText) {
    scene.clear();

    const cube = new THREE.Mesh(new THREE.BoxGeometry( 1, 1, 1 ), new THREE.MeshNormalMaterial());
    scene.add(cube);

    console.log(pdbText);
}

export function render(parent) {
    container = parent;
    camera.position.z = 3;
    camera.position.y = 2;
    camera.lookAt(0, 0, 0);

    renderer.setAnimationLoop(animation);

    parent.appendChild(renderer.domElement);
}