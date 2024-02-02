# Molecule Visualizer

A 3D visualizer for [PDB format](https://en.wikipedia.org/wiki/Protein_Data_Bank_(file_format)) molecular structures.

## How To Use

Navigate to the [live demo](https://russ741.github.io/molecule-visualizer/) here.

The molecule shown by default is [human insulin](https://www.rcsb.org/structure/3i40).<br />
To select a different molecule:
* Obtain the PDB file for the desired molecule
(for example, by searching the [RCSB Protein Data Bank](https://www.rcsb.org/search/advanced))
* Copy **a single model** (see Known Limitations) from the file's contents
* Paste the single model into the live demo's upper form
* Press the "Click to update scene" button.

### Non-default Chemical Components
To provide bond data for chemical components other than the basic amino acids (already provided by default):

## Known Limitations

* Does not gracefully handle multiple models (behavior is undefined, but will likely superimpose both)
* Does not attempt to infer the locations of hydrogen atoms that are present in the chemical components but not the PDB file
* Does not label, color code, or otherwise distinguish the constituent atoms/residues/chains
* Does not specially handle HELIX or SHEET annotations
* May render all alternate locations of a given atom concurrently, rather than filtering to a single altLoc
* Does not currently parse mmCIF for molecules or components
