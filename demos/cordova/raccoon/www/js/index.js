var app = {
  // Application Constructor
  initialize: function () {
    document.addEventListener('deviceready', onDeviceReady, false);
  }
};

var video;
var localStream;
var ctx;
var canvas;
var canvasWeb;
var jeefacetransferCanvas;
var vidElement;

function onDeviceReady() {
  canvas = document.getElementById('canvas');
  canvasWeb = document.getElementById('canvasWebgl');
  jeefacetransferCanvas = document.getElementById('jeefacetransferCanvas');
  
  CanvasCamera.initialize(canvas);
  let isFirstTime = true;

  var options = {
    cameraFacing: 'front',
    fps:30,
    width: 288,
    height: 352,
    canvas: {
      width: 288,
      height: 352
    },
    capture: {
      width: 288,
      height: 352
    },
    onAfterDraw: function(frame) {
      if (isFirstTime) {
        isFirstTime = false;
        // We init Weboji here otherwise the size of the video canvas is wrong.
        initWeboji();
      }
    }
  };
  CanvasCamera.start(options);
}

function initWeboji(){
  THREE.JeelizHelper.init({
    canvasThreeId: 'canvasWebgl',
    canvasId: 'jeefacetransferCanvas',

    assetsParentPath: './assets/3D/',
    NNCPath: './js/dist/',

    videoSettings: {
      videoElement: canvas
    },

    //FOX :
    meshURL: 'meshes/fox11_v0.json',
    matParameters: {
      diffuseMapURL: 'textures/Fox_albedo.png',
      specularMapURL: 'textures/Fox_specular.png',
      flexMapURL: 'textures/Fox_flex.png'
    },
    successCallback: function(){
      console.log('INFO in index.js: successCallback() called');
    },
    errorCallback: function(errCode){
      console.log('ERROR in index.js: ', errCode);
    },
    position: [0,-80, 0],
    scale: 1.2
  });
} //end main()

app.initialize();
