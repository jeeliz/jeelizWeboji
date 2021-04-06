# Mesh converter script


This specific document details the generation of animated meshes used by the THREE.JS Helper.

## Use the builder

In this path there is:

* `buildJson.py`: the python script to build the meshes
* `/meshes/`: the path with the different meshes sets.

To build a mesh set, juste launch `python buildJson.py <mesh_set>` from this directory. For example:
```
python buildJson.py fox11_v0
```
It will generate `../../assets/3D/meshes/fox11_v0.json`




## Meshes specifications

To build a JSON animated mesh, you must first make these meshes and save them using text .OBJ file format:

* `base.obj`, which is the base mesh of the weboji (the rest position),
* `morph_<X>.obj`, with `X` going from `0` to `10` included, which is the morph n°`X`.

All the file name characters are lowercases (the file extension too).
You only have to take a look at `/meshes/fox11_v0/` which is the weboji of the fox used for the demonstration, and to do the same for your own mesh.

All the .obj files should:

* have the same number of points and the points should have the same indices,
* be saved as text based .OBJ (not binary),
* have the same format than `/meshes/fox11_v0/base.obj`: only 1 geometry, no encapsulation/parent-child relation, no vertex groups,
* the scale and the position of the mesh should match the fox scale and position. The 3D origin matches the center of rotation,
* you should not add a 3D transformation (scale, translation or rotation) between 2 morphs, or between the base and a morph,
* the meshes should have exactly 1 UV mapping.

Of course you can improve this conversion script, or the `THREE.JS` helper in order to accept more sophisticated meshes, with multiple parts or multiple UV maps. But we want to keep it as simple as possible.

Here is the morph numbering:

* 0:  smileRight &rarr; closed mouth smile right
* 1:  smileLeft  &rarr; closed mouth smile left
* 2:  eyeBrowLeftDown &rarr; eyebrow left frowned
* 3:  eyeBrowRightDown &rarr; eyebrow right frowned
* 4:  eyeBrowLeftUp &rarr; eyebrow left up (surprised)
* 5:  eyeBrowRightUp &rarr; eyebrow right up (surprised)
* 6:  mouthOpen &rarr; mouth open
* 7:  mouthRound &rarr; mouth round
* 8:  eyeRightClose &rarr; close right eye
* 9:  eyeLeftClose  &rarr; close left eye
* 10: mouthNasty   &rarr; mouth nasty (upper lip raised)

This side (left or right) is the side from the weboji point of view. For example *the right eye* is the right eye of the fox.



## Advice

It is better to amplify the facial expressions. A smile for example will go to the ears. And you should also model the coupling between the face parts.
There are about 50 uncorrelated muscles in the face and we estimate only a dozen expressions. So if you want a smooth resulting animation, you should make deformations large and take account of secondary movements. For example if the fox is happy, his muzzle will raise a bit and its ears too.

3D computer graphics is an art and if you are not familiar with a 3D modeling software it will be very difficult to do this by yourself. We can provide some 3D computer graphics services, please [contact-us](https://jeeliz.com/contact-us/) if you are interested.

