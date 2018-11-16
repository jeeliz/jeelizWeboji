"use strict";

//entry point :
function main(){
    THREE.JeelizHelper.init({
        canvasThreeId: 'webojiCanvas',
        canvasId: 'jeefacetransferCanvas',

        assetsParentPath: '../../assets/3D/',
    NNCpath: '../../dist/',

        //FOX :
        meshURL: 'meshes/fox11_v0.json',
    matParameters: {
          diffuseMapURL: 'textures/Fox_albedo.png',
          specularMapURL: 'textures/Fox_specular.png',
          flexMapURL: 'textures/Fox_flex.png'
        }, //*/

    //KOALA :
    /*meshURL: 'meshes/koala.json', //mesh loaded by default - custom face
    atParameters: {
          diffuseMapURL: 'textures/diffuse_koala.jpg'
        }, //*/

    //HUMAN CREEPY FACE :
    /*meshURL: 'meshes/faceCustom11_v0.json',
      matParameters: {
          diffuseMapURL: 'textures/skin.jpg'
      },  //*/

      position: [0,-80,0],
    scale: 1.2
    });
} //end main()
