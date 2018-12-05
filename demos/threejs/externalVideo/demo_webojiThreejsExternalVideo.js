"use strict";

//entry point :
function main(){
   const videoElement=document.getElementById('myVideo');

   if (videoElement['currentTime'] && videoElement['videoWidth'] && videoElement['videoHeight']){
        start(videoElement);
   } else {
        setTimeout(main, 100);
        videoElement['play']();
   }
}

function start(videoElement){
    THREE.JeelizHelper.init({
        canvasThreeId: 'webojiCanvas',
        canvasId: 'jeefacetransferCanvas',

        assetsParentPath: '../../../assets/3D/',
        NNCpath: '../../../dist/',

        //FOX :
        meshURL: 'meshes/fox11_v0.json',
        matParameters: {
          diffuseMapURL: 'textures/Fox_albedo.png',
          specularMapURL: 'textures/Fox_specular.png',
          flexMapURL: 'textures/Fox_flex.png'
        }, //*/

        position: [0,-80,0],
        scale: 1.2,
        videoSettings: {
          videoElement: videoElement
        }
    });
} //end main()
