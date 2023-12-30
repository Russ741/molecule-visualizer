import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1.0, 0.01, 15);
let container = null;

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

const ATOM_RADIUS = 0.3;
const PI = Math.PI;
const V_X = {x: 1, y: 0, z: 0};

const material = new THREE.MeshNormalMaterial();

function animation(time) {
    // Logic to handle the enclosing container being resized.
    const width = container.offsetWidth, height = container.offsetHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);

    // Rotate the objects in the scene.
    scene.rotation.x = PI / 2;
    scene.rotation.z = time / 3000;

    renderer.render(scene, camera);
}

function getBondGeometry(src, dst) {
    const diff = (new THREE.Vector3()).subVectors(dst, src);
    const middle = (new THREE.Vector3()).addVectors(dst, src).divideScalar(2);

    const geometry = new THREE.CylinderGeometry(0.1, 0.1, diff.length());
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = middle.x;
    mesh.position.y = middle.y;
    mesh.position.z = middle.z;
    mesh.lookAt(dst);
    mesh.rotateOnAxis(V_X, PI/2);
    return mesh;
}

function getAtomsFromPdb(pdbText) {
    const lines = pdbText.split('\n');

    const idToAtom = new Map();

    for (const line of lines) {
        const recordName = line.slice(0, 6).trim();
        if (recordName === "HETATM" || recordName === "ATOM") {
            // https://www.wwpdb.org/documentation/file-format-content/format33/sect9.html
            const atom_id = parseInt(line.slice(6, 11));
            const x = parseFloat(line.slice(30, 38));
            const y = parseFloat(line.slice(38, 46));
            const z = parseFloat(line.slice(46, 54));
            const bonds = [];
            idToAtom.set(atom_id, {x, y, z, bonds});
        } else if (recordName == "CONECT") {
            // https://www.wwpdb.org/documentation/file-format-content/format33/sect10.html
            const srcId = parseInt(line.slice(6, 11));
            const destRanges = [11, 16, 21, 26, 31];
            for (var i = 0; i < 4; ++i) {
                const dest = parseInt(line.slice(destRanges[i], destRanges[i+1]));
                if (isFinite(dest)) {
                    idToAtom.get(srcId).bonds.push(dest);
                }
            }
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

        for (const destId of bonds) {
            const dest = idToAtom.get(destId);
            const cylinder = getBondGeometry({x, y, z}, new THREE.Vector3(dest.x, dest.y, dest.z));
            scene.add(cylinder);
        }
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