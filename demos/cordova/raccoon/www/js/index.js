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
var vidElement;


function stopAllStreams() {
  if (localStream) {
    localStream.getTracks().forEach(function (track) {
      track.stop();
    });
  }
}

function gum(width) {
  if (width) {
    var constraints = {
      audio: false,
      video: {
        width: {
          min: width,
          max: width
        },
      }
    };
    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
      localStream = stream;
      video.src = window.URL.createObjectURL(stream);
      video.srcObject = stream;
    }, function (err) { console.log(err) });
  }
}

function onDeviceReady() {
  canvas = document.getElementById('canvas');
  //canvasWeb = document.getElementById('canvasWebgl');
  //gl = canvasWeb.getContext("webgl");
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
      //render(gl,frame.image);
      initWeboji();
    }
  };
  CanvasCamera.start(options);

  console.log("canv",canvas);
  
  var gumButton640 = document.getElementById('getUserMedia640');
  gumButton640.addEventListener("click", function () {
    stopAllStreams();
    gum(1280);
  });

  var gumButton1280 = document.getElementById('getUserMedia1280');
  gumButton1280.addEventListener("click", function () {
     (function loop() {
          //drawImage(gl, frame.img, 0, 0,canvas.clientWidth,canvas.clientHeight);
          setTimeout(loop, 1000 / 30); // drawing at 30fps
      })();
  });

}

/*function initTextureWith(videoUrl) {
  console.log(videoUrl);
  vidElement = document.createElement('video');

  vidElement.src = videoUrl;
  // TODO - confirm its necessary to add to DOM
  // vidElement.style.display = 'none';
  // document.body.appendChild(vidElement);
  
}*/

function initWeboji(){
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

    position: [0,-80, 0],
    scale: 1.2
  });
} //end main()


//https://webglfundamentals.org/webgl/lessons/webgl-2d-drawimage.html
/*function drawImage(gl, tex, texWidth, texHeight, dstX, dstY) {
  gl.bindTexture(gl.TEXTURE_2D, tex);
 
}


function render(gl, image) {
  
  var program = webglUtils.createProgramFromScripts(gl, ["2d-vertex-shader", "2d-fragment-shader"]);
  gl.useProgram(program);

  // look up where the vertex data needs to go.
  var positionLocation = gl.getAttribLocation(program, "a_position"); 
  
  // look up uniform locations
  var u_imageLoc = gl.getUniformLocation(program, "u_image");
  var u_matrixLoc = gl.getUniformLocation(program, "u_matrix");

  // provide texture coordinates for the rectangle.
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0.0,  0.0,
      1.0,  0.0,
      0.0,  1.0,
      0.0,  1.0,
      1.0,  0.0,
      1.0,  1.0]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the parameters so we can render any size image.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  // Upload the image into the texture.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  
  var dstWidth = 288;
  var dstHeight = 352;
  var dstX = 0;
  var dstY = 0;

  // convert dst pixel coords to clipspace coords      
  var clipX = dstX / gl.canvas.width  *  2 - 1;
  var clipY = dstY / gl.canvas.height * -2 + 1;
  var clipWidth = dstWidth  / gl.canvas.width  *  2;
  var clipHeight = dstHeight / gl.canvas.height * -2;

  // build a matrix that will stretch our
  // unit quad to our desired size and location
  gl.uniformMatrix3fv(u_matrixLoc, false, [
      clipWidth, 0, 0,
      0, clipHeight, 0,
      clipX, clipY, 1,
    ]);

  // Draw the rectangle.
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  
}


function makeTextureFrom(gl, imgElement) {
  var texture = this.gl.createTexture();
  console.log("hello", imgElement);
  // var img = "a";
  gl.bindTexture(this.gl.TEXTURE_2D, texture);
  gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, gl.UNSIGNED_BYTE, imgElement);
  gl.texParameteri(this.gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(this.gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

  // tidy up
  this.gl.bindTexture(this.gl.TEXTURE_2D, null);

  return texture;
}


function textureLoaded(texture) {
  console.log('yay my texture ' + texture + ' has loaded');
}
*/

app.initialize();