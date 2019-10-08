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
  //gl = canvasWeb.getContext("webgl"); jeefacetransferCanvas
  //gl = canvasWeb.getContext("jeefacetransferCanvas");

  CanvasCamera.initialize(canvas);

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
      //var dest;
      //dest = canvasWeb.getContext('2d');
      //dest.drawImage(canvas,0,0);
    }
  };
  CanvasCamera.start(options);

  console.log("canv",canvas);

  initWeboji();
}

function initWeboji(){
  alert("initialising jeeliz 2");  
  console.log("using source image of ",canvas);

  /*THREE.JeelizHelper.onLoad = function(){
  alert('JeelizHelper.onLoad called')
  console.log("jeelize canvas is: ",THREE.JeelizHelper.get_cv() );
  };*/
  try (){
    THREE.JeelizHelper.init({
      canvasThreeId: 'canvasWebgl',
      canvasId: 'jeefacetransferCanvas',

      assetsParentPath: './assets/3D/',
      NNCpath: './js/dist/',

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
        alert('successCallback');
      },
      errorCallback: function(errCode){
        alert('error: ' + errCode);
      },
      position: [0,-80, 0],
      scale: 1.2
    });
  } catch(e) {
    alert('JS ERROR: ' + e.message);
  } 
} //end main()

app.initialize();
