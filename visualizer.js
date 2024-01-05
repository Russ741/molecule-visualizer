import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


class ResidueBonds {
    srcNameToDstNames = new Map();

    addBond(src, dst) {
        var dsts = this.srcNameToDstNames.get(src);
        if (dsts === undefined) {
            dsts = new Set();
            this.srcNameToDstNames.set(src, dsts);
        }
        dsts.add(dst);
    }
}

class ResidueDict {
    residueNameToAtomsAndBonds = new Map();

    addBonds(residueName, srcName, dstNamesStr) {
        var residueBonds = this.residueNameToAtomsAndBonds.get(residueName);
        if (residueBonds === undefined) {
            residueBonds = new ResidueBonds();
            this.residueNameToAtomsAndBonds.set(residueName, residueBonds);
        }

        const dstNames = dstNamesStr.split(' ').filter((dstName) => dstName.length > 0);
        for (const dstName of dstNames) {
            residueBonds.addBond(srcName, dstName);
        }
    }

    getResidueBonds(residueName) {
        const result = this.residueNameToAtomsAndBonds.get(residueName);
        if (result === undefined) {
            console.log("Undefined residue: ", residueName);
        }
        return result;
    }
}

class Residue {
    resSeq;
    resName = "";
    atomNameToId = new Map();

    constructor(resSeq) {
        this.resSeq = resSeq;
    }

    addAtom(atomName, atomId) {
        // If there are multiple alternate locations, the last one will win
        this.atomNameToId.set(atomName, atomId);
    }
}

class Chain {
    chainId;
    residues = new Map();

    constructor(chainId) {
        this.chainId = chainId;
    }

    residue(resSeq) {
        var residue = this.residues.get(resSeq);
        if (residue === undefined) {
            residue = new Residue(resSeq);
            this.residues.set(resSeq, residue);
        }
        return residue;
    }
}

class Molecule {
    chains = new Map();

    chain(chainId) {
        var chain = this.chains.get(chainId);
        if (chain === undefined) {
            chain = new Chain(chainId);
            this.chains.set(chainId, chain);
        }
        return chain;
    }
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1.0, 0.01, 1000);
let container = null;

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

const controls = new OrbitControls(camera, renderer.domElement);

let moleculeBoxDiag = 0;

const ATOM_RADIUS = 0.3;
const PI = Math.PI;
const V_X = {x: 1, y: 0, z: 0};
const SRC_INTER_RESIDUE_ATOM_NAME = "C";
const DST_INTER_RESIDUE_ATOM_NAME = "N";

const material = new THREE.MeshNormalMaterial();

function animation(time) {
    // Logic to handle the enclosing container being resized.
    const width = container.offsetWidth, height = container.offsetHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);

    renderer.render(scene, camera);
}

function getBondGeometry(src, dst) {
    const diff = (new THREE.Vector3()).subVectors(dst, src);
    const middle = (new THREE.Vector3()).addVectors(dst, src).divideScalar(2);

    const geometry = new THREE.CylinderGeometry(0.1, 0.1, diff.length());
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(middle);
    mesh.lookAt(dst);
    mesh.rotateOnAxis(V_X, PI/2);
    return mesh;
}

function getResidueDict(dictText) {
    const lines = dictText.split('\n');

    const residueDict = new ResidueDict();

    var residueName = null;
    for (const line of lines) {
        const recordName = line.slice(0, 6).trim();
        switch (recordName) {
            case "RESIDU":
                residueName = line.slice(10, 14).trim();
                break;
            case "CONECT":
                const srcAtomName = line.slice(12, 17).trim();
                const dstNamesStr = line.slice(21);
                residueDict.addBonds(residueName, srcAtomName, dstNamesStr)
                break;
        }
    }

    return residueDict;
}

function getAtomsFromPdb(pdbText) {
    const lines = pdbText.split('\n');

    var molecule = new Molecule();
    const idToAtom = new Map();
    const minV = new THREE.Vector3(Infinity, Infinity, Infinity);
    const maxV = new THREE.Vector3(-Infinity, -Infinity, -Infinity);

    for (const line of lines) {
        const recordName = line.slice(0, 6).trim();
        switch (recordName) {
            case "ATOM":
            case "HETATM":
                // https://www.wwpdb.org/documentation/file-format-content/format33/sect9.html

                // Shared code for ATOM and HETATM
                const atom_id = parseInt(line.slice(6, 11));
                const x = parseFloat(line.slice(30, 38));
                const y = parseFloat(line.slice(38, 46));
                const z = parseFloat(line.slice(46, 54));
                const xyz = new THREE.Vector3(x, y, z);
                minV.min(xyz);
                maxV.max(xyz);
                const bonds = [];
                idToAtom.set(atom_id, {xyz, bonds});
                // TODO: Handle alternate conformations better.
                // We probably don't want to draw both concurrently.

                if (recordName == "HETATM") {
                    break;
                }

                // ATOM-only code to add residue atoms to the residue hierarchy
                const atomName = line.slice(12, 16).trim();
                const resName = line.slice(17, 20);
                const chainId = line.slice(21, 22);
                const resSeq = parseInt(line.slice(22, 26));

                const residue = molecule.chain(chainId).residue(resSeq);
                residue.resName = resName;
                residue.addAtom(atomName, atom_id);
                break;
            case "CONECT":
                // https://www.wwpdb.org/documentation/file-format-content/format33/sect10.html
                const srcId = parseInt(line.slice(6, 11));
                const destRanges = [11, 16, 21, 26, 31];
                for (var i = 0; i < 4; ++i) {
                    const dest = parseInt(line.slice(destRanges[i], destRanges[i+1]));
                    if (isFinite(dest)) {
                        idToAtom.get(srcId).bonds.push(dest);
                    }
                }
                break;
        }
    }

    moleculeBoxDiag = (new THREE.Vector3()).subVectors(maxV, minV).length();
    const midV = new THREE.Vector3().addVectors(minV, maxV).divideScalar(2);
    // Move the midpoint of the molecule to the middle of the scene by translating all of the atoms' positions.
    for (const [, {xyz, }] of idToAtom.entries()) {
        xyz.sub(midV);
    }
    return [molecule, idToAtom];
}

function addIntraResidueBonds(molecule, residueDict, idToAtom) {
    for (const [, chain] of molecule.chains) {
        for (const [, residue] of chain.residues) {
            const resName = residue.resName;
            const atomNameToId = residue.atomNameToId;
            const residueBonds = residueDict.getResidueBonds(resName);
            if (residueBonds === undefined) {
                console.log(`Residue ${residue.resSeq} has undefined residue type ${resName}`);
                continue;
            }
            for (const [srcName, dstNames] of residueBonds.srcNameToDstNames) {
                if (!atomNameToId.has(srcName)) {
                    console.log(`Could not find src ${srcName} in ${resName} ${residue.resSeq}`);
                    continue;
                }

                const srcId = atomNameToId.get(srcName);
                const srcBonds = idToAtom.get(srcId).bonds;
                for (const dstName of dstNames) {
                    if (!atomNameToId.has(dstName)) {
                        console.log(`Could not find dst ${dstName} in ${resName} ${residue.resSeq}`);
                        continue;
                    }
                    const dstId = atomNameToId.get(dstName);
                    srcBonds.push(dstId);
                }
            }
        }
    }
}

function addInterResidueBonds(molecule, idToAtom) {
    for (const [, chain] of molecule.chains) {
        for (const [resSeq, residue] of chain.residues) {
            // TODO: Check residue type
            const lastResidue = chain.residues.get(resSeq - 1);
            if (!lastResidue) {
                continue;
            }
            const srcId = lastResidue.atomNameToId.get(SRC_INTER_RESIDUE_ATOM_NAME);
            const destId = residue.atomNameToId.get(DST_INTER_RESIDUE_ATOM_NAME);
            idToAtom.get(srcId).bonds.push(destId);
        }
    }
}

export function updateScene(pdbText, dictText) {
    scene.clear();

    const residueDict = getResidueDict(dictText);

    const [molecule, idToAtom] = getAtomsFromPdb(pdbText);
    addIntraResidueBonds(molecule, residueDict, idToAtom);
    addInterResidueBonds(molecule, idToAtom);

    for (const [atom_id, {xyz, bonds}] of idToAtom) {
        const atom = new THREE.Mesh(new THREE.SphereGeometry(ATOM_RADIUS), material);
        atom.position.copy(xyz);
        scene.add(atom);

        for (const destId of bonds) {
            const dest = idToAtom.get(destId);
            const cylinder = getBondGeometry(xyz, dest.xyz);
            scene.add(cylinder);
        }
    }

    camera.position.z = moleculeBoxDiag;
}

export function render(parent) {
    container = parent;

    renderer.setAnimationLoop(animation);

    parent.appendChild(renderer.domElement);
}