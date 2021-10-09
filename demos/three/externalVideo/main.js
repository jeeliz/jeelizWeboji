// entry point:
function main(e){
  document.getElementById('notice').style.display = 'none';

  const videoElement = document.getElementById('myVideo');
  videoElement['play']();

  if (videoElement['currentTime'] && videoElement['videoWidth'] && videoElement['videoHeight']){
    start(videoElement);
  } else {
    setTimeout(main, 100);
    videoElement['play']();
  }
}

function start(videoElement){
  JeelizWebojiThreeHelper.init({
    canvasThreeId: 'webojiCanvas',
    canvasId: 'jeelizFaceExpressionsCanvas',

    assetsParentPath: '../../../assets/3D/',
    NNCPath: '../../../dist/',

    //RACCOON :
    meshURL: 'meshes/fox11_v0.json',
    matParameters: {
      diffuseMapURL: 'textures/Fox_albedo.png',
      specularMapURL: 'textures/Fox_specular.png',
      flexMapURL: 'textures/Fox_flex.png'
    },

    position: [0,-80,0],
    scale: 1.2,
    videoSettings: {
      videoElement: videoElement
    }
  });
}

window.addEventListener('click', main);