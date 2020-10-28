"use strict";

// entry point:
function main(){
  JeelizWebojiThreeHelper.init({
    canvasThreeId: 'webojiCanvas',
    canvasId: 'jeefacetransferCanvas',

    assetsParentPath: '../../../assets/3D/',
    NNCPath: '../../../dist/',

    //FOX :
    meshURL: 'meshes/fox11_v0.json',
    matParameters: {
      diffuseMapURL: 'textures/Fox_albedo.png',
      specularMapURL: 'textures/Fox_specular.png',
      flexMapURL: 'textures/Fox_flex.png'
    }, //*/

    //HUMAN CREEPY FACE :
    /*meshURL: 'meshes/faceCustom11_v0.json',
    matParameters: {
      diffuseMapURL: 'textures/skin.jpg'
    },  //*/

    position: [0, -80, 0],
    scale: 1.2
  });
}
