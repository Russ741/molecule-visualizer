import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1.0, 0.01, 15);
let container = null;

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

const ATOM_RADIUS = 0.3;

const material = new THREE.MeshNormalMaterial();

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

function getAtomsFromPdb(pdbText) {
    const lines = pdbText.split('\n');

    const idToAtom = new Map();

    for (const line of lines) {
        const cells = line.split(/\s+/)
        if (cells[0] === "HETATM" || cells[0] === "ATOM") {
            const atom_id = parseInt(cells[1]);
            const x = parseFloat(cells[6]);
            const y = parseFloat(cells[7]);
            const z = parseFloat(cells[8]);
            const bonds = [];
            idToAtom.set(atom_id, {x, y, z, bonds});
        }
    }
    return idToAtom;
}

export function updateScene(pdbText) {
    scene.clear();

    const idToAtom = getAtomsFromPdb(pdbText);

    for (const [atom_id, {x, y, z, bonds}] of idToAtom) {
        const atom = new THREE.Mesh(new THREE.SphereGeometry(ATOM_RADIUS), material);
        atom.position.x = x;
        atom.position.y = y;
        atom.position.z = z;
        scene.add(atom);
    }
}

export function render(parent) {
    container = parent;
    camera.position.z = 3;
    camera.position.y = 2;
    camera.lookAt(0, 0, 0);

    renderer.setAnimationLoop(animation);

    parent.appendChild(renderer.domElement);
}