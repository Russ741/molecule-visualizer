# Molecule Visualizer

A 3D visualizer for [PDB format](https://en.wikipedia.org/wiki/Protein_Data_Bank_(file_format)) molecular structures.

## How To Use

The live demo can be seen [here](https://russ741.github.io/molecule-visualizer/).

The camera controls follow the OrbitControls conventions
(see [this page](https://github.com/mrdoob/three.js/blob/841d2e791d3e8a2463322c5ca31b16956828b91c/examples/jsm/controls/OrbitControls.js#L17) for details)
and can be controlled with combinations of mouse, keyboard (including ctrl keys) and one/two finger touch.

## Selecting a Molecule

The molecule shown by default is [human insulin](https://www.rcsb.org/structure/3i40).<br />
To select a different molecule:
* Obtain the PDB file for the desired molecule
(for example, by searching the [RCSB Protein Data Bank](https://www.rcsb.org/search/advanced))
* Copy **a single model** (see Known Limitations) from the file's contents
* Paste the single model into the live demo's upper form
* Press the "Click to update scene" button.

### Non-default Chemical Components
To provide bond data for chemical components other than the basic amino acids (already provided by default):
* Go to the [PDB HET Dictionary](https://files.wwpdb.org/pub/pdb/data/monomers/)
* Select the component by three-character name (e.g. https://files.wwpdb.org/pub/pdb/data/monomers/HPR)
* Copy the contents of the selected file
* **Append** it to the live demo's lower form
  * Be careful not to erase other component definitions that are still needed
* Repeat for other component definitions
* When all component definitions have been added, press the "Click to update scene" button.

## Known Limitations

* Does not automatically load chemical component definitions or flag definitions that are missing
* Does not gracefully handle multiple models (behavior is undefined, but will likely superimpose both)
* Does not attempt to infer the locations of hydrogen atoms that are present in the chemical components but not the PDB file
* Does not label, color code, or otherwise distinguish the constituent atoms/residues/chains
* Does not specially handle HELIX or SHEET annotations
* May render all alternate locations of a given atom concurrently, rather than filtering to a single altLoc
* Does not currently parse mmCIF for molecules or components
* Does not currently support other camera control schemes
