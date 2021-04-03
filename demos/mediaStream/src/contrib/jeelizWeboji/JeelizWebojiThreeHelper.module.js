/* eslint-disable */

/*
Helper for THREE.JS
it requires ThreeMorphAnimGeomBuilder.js and ThreeMorphFlexibleMaterialBuilder.js
*/
import * as THREE from 'three';


// import main library:
import JEELIZFACEEXPRESSIONS from './jeelizFaceExpressions.module.js';

// import helpers:
import ThreeMorphAnimGeomBuilder from './ThreeMorphAnimGeomBuilder.module.js';
import ThreeMorphFlexibleMaterialBuilder from './ThreeMorphFlexibleMaterialBuilder.module.js';


/*
  spec of JeelizWebojiThreeHelper.init:
    - <HTMLCanvasElement> canvasThree: id of the canvas with the THREE.js 3D Weboji rendering
    - <HTMLCanvasElement> canvas: id of the Jeeliz Face expressions canvas

    - <function> successCallback: launched when all is ready
    - <function> errorCallback: launched if an error happens

    - <string> assetsParentPath: string, path where assets are
    - <object> NN: neural network, typically jeelizFaceTransferNNC.json

    - <string> meshURL: url of the mesh
    - <dict> matParams: parameters of the material
    
    - <array3> position: position of the mesh (default: [0,0,0])
    - <float> scale: scale of the mesh (default: 1)
*/

const JeelizWebojiThreeHelper = (function(){
  // INTERNAL SETTINGS:  
  const _settings = {
    // THREE LIGHTS:
    ambientLightIntensity: 0.5,
    dirLightIntensity: 0.5,
    dirLightDirection: [0, 0.5, 1],

    // ROTATION:
    rotationOrder: 'ZYX', //'XZY',
    rotationSpringCoeff: 0.0002,
    rotationAmortizationCoeff: 0.9, // 1 -> no amortization, 0 -> big amortization
    
    morphPrecision: 2048
  }; //end _settings

  // PRIVATE VARS:
  const _nMorphs = JEELIZFACEEXPRESSIONS.get_nMorphs();
  let _DOMcanvas = null, _assetsParentPath = '', _isFaceDetected = false;

  const _three = { // gather THREE.js instances
    renderer: null,
    scene: null,
    camera: null,
    morphAnimMesh: null,
    ambientLight: null,
    dirLight: null
  };

  const _states = { // all possibles states (ENUM like)
    notLoaded:-10,
    jeefacetransferInitialized: -9,
    threeInitialized: -8,
    loading: -1,
    idle: 0,
    animate: 1
  };
  let _state = _states.notLoaded; // initial state
  let _animationHandler = null;
  const _loading = {
    modelURL: false,
    threeMat: false,
    callback: false,
    restoreState: _states.idle
  };
  const _rotationAmortized = [0,0,0], _rotationSpeed = [0,0,0];
  let _prevT = 0;


  // PRIVATE FUNCTIONS:
  // render loop:
  function animate(t) {
    if (_state !== _states.animate){
      return;
    }
    const dt = Math.min(Math.max(t-_prevT, 5), 30); // in ms
    const rotation = JEELIZFACEEXPRESSIONS.get_rotationStabilized();
    _three.morphAnimMesh.rotation.fromArray(rotation);

    // apply these kinematic formulas:
    // accl = (rotAmortized - rot) = dv / dt
    // dv = dt * (rotAmortized - rot)
    // dp = dt * v

    const amortizationCoeff = Math.pow(_settings.rotationAmortizationCoeff, dt/16);
    _rotationSpeed[0] *= amortizationCoeff;
    _rotationSpeed[1] *= amortizationCoeff;
    _rotationSpeed[2] *= amortizationCoeff;
    
    _rotationSpeed[0] += _settings.rotationSpringCoeff * dt * (rotation[0]-_rotationAmortized[0]);
    _rotationSpeed[1] += _settings.rotationSpringCoeff * dt * (rotation[1]-_rotationAmortized[1]);
    _rotationSpeed[2] += _settings.rotationSpringCoeff * dt * (rotation[2]-_rotationAmortized[2]);

    _rotationAmortized[0] += dt * _rotationSpeed[0];
    _rotationAmortized[1] += dt * _rotationSpeed[1];
    _rotationAmortized[2] += dt * _rotationSpeed[2];

    if (_three.morphAnimMesh.material.type === 'ShaderMaterial'){
      _three.morphAnimMesh.material.set_rotationAmortized(_three.morphAnimMesh.position, _three.morphAnimMesh.scale, _rotationAmortized);
    }
    _three.renderer.render(  _three.scene, _three.camera ); // trigger the THREE.JS scene rendering

    _prevT = t;
    _animationHandler = requestAnimationFrame( animate );
  }; //end animate()

  function start_animate(){
    if (_state !== _states.animate){
      return false;
    }
    if (_animationHandler){
      window.cancelAnimationFrame(_animationHandler);
      _animationHandler = false;
    }
    animate(0);
    return true;
  }

  // init the THREE.JS scene:
  function init_three(canvasThree) {
     
    _DOMcanvas = canvasThree;
    _three.renderer = new THREE.WebGLRenderer({
      'antialias': true,
      'canvas': _DOMcanvas,
      'preserveDrawingBuffer': true,
      'alpha': true
    });

    // improve WebGLRenderer settings:
    _three.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    _three.renderer.outputEncoding = THREE.sRGBEncoding;

    _three.renderer.setClearAlpha(0);

    // create the scene:
    _three.scene = new THREE.Scene();
    
    // debug: add a cube into the scene
    /* const debugCube = new THREE.Mesh(new THREE.BoxGeometry(150,150,150), new THREE.MeshNormalMaterial({side: THREE.DoubleSide}));
    _three.scene.add(debugCube); */

    // add some lights:
    _three.ambientLight = new THREE.AmbientLight(0xffffff);
    _three.ambientLight.intensity = _settings.ambientLightIntensity;
    _three.scene.add(_three.ambientLight);

    _three.dirLight = new THREE.DirectionalLight(0xffffff);
    _three.dirLight.position.fromArray(_settings.dirLightDirection);
    _three.dirLight.intensity = _settings.dirLightIntensity;
    _three.scene.add(_three.dirLight);

    // create the camera:
    _three.camera = new THREE.PerspectiveCamera(35, _DOMcanvas.width / _DOMcanvas.height, 10, 10000 );
    _three.camera.position.set(0, 0, 500);
    _three.camera.lookAt(new THREE.Vector3(0.,0.,0.));
  } //end init_three()

  // change the material of the weboji:
  function change_material(mat){
    if (!_three.morphAnimMesh){
      return;
    }
    _loading.threeMat = mat;

    if (_state === _states.loading){
      const previousCallback = _loading.callback;
      _loading.callback = function(){
        previousCallback();
        _three.morphAnimMesh.material = mat;
      }
    } else {
      _three.morphAnimMesh.material = mat;
    }
  }

  // load a weboji mesh:
  function load_model(url, mat, callback){
    if (url===_loading.modelURL && mat===_loading.threeMat){ // called 2 times with same args
      return true;
    }
    
    if (_state === _states.loading){
      console.log('WARNING in THREE.JeelizHelper - load_model(): currently loading a model');
      const previousCallback = _loading.callback;
      _loading.callback = function(){
        previousCallback();
        load_model(url, mat, callback);
      };
      return true;

    } else if (_state!==_states.idle && _state!==_states.animate){
      console.log('WARNING in  THREE.JeelizHelper - load_model(): invalid state');
      return false;
    }

    if (url===_loading.url && _three.morphAnimMesh){
      change_material(mat);
      callback();
      return true;
    }

    _loading.modelURL = url;
    _loading.threeMat = mat;
    _loading.callback = callback;
    _loading.restoreState = _state;

    _state = _states.loading;

    if (_three.morphAnimMesh){ // remove previously loaded emoji
      _three.scene.remove(_three.morphAnimMesh);
      _three.morphAnimMesh = false;
    }

    ThreeMorphAnimGeomBuilder({
      url: _assetsParentPath + url,
      morphPrecision: _settings.morphPrecision,
      nMorphs: _nMorphs,
      successCallback: function(geom){
        const mesh = new THREE.Mesh(geom, mat);
       
        mesh.rotation.order = _settings.rotationOrder; // default: XYZ
        _three.morphAnimMesh = mesh;
        const morphTargetInfluencesDst = JEELIZFACEEXPRESSIONS.get_morphTargetInfluencesStabilized();
          
        _three.morphAnimMesh.userData.morphJeelizInfluences = morphTargetInfluencesDst;

        JEELIZFACEEXPRESSIONS.on_detect(function(isDetected){
          _isFaceDetected = isDetected;
        });

        _three.scene.add(_three.morphAnimMesh);

        _state = _loading.restoreState;
        start_animate();
        _loading.callback(mesh);

        // fix a weird bug on IOS 14.0.1 / Iphone11
        // The canvas is not visible because of a Safari DOM update problem.
        // So we append a random <div> to the DOM to force DOM refresh
        const uselessDiv = document.createElement('div');
        document.body.appendChild(uselessDiv);
        
      } //end successCallback
    }); //end ThreeMorphAnimGeomBuilder call

    return true;
  } //end load_model()

  function load_texture(imageURL){
    return new THREE.TextureLoader().load(_assetsParentPath + imageURL);
  }  


  // PUBLIC METHODS:
  const that = {
    'ready': false,

    'init': function(spec){
      if (!spec) var spec = {};
      _assetsParentPath = (spec.assetsParentPath) ? spec.assetsParentPath : './';
      
      // init JEELIZFACEEXPRESSIONS:
      JEELIZFACEEXPRESSIONS.init({
        canvas: spec.canvas,
        NNC: spec.NN,
        videoSettings: spec.videoSettings,
        callbackReady: function(errCode){
          if (errCode){
            console.log('ERROR: cannot init JEELIZFACEEXPRESSIONS. errCode =', errCode);
            if (spec.errorCallback){
              spec.errorCallback(errCode);
            }
            return;
          }
          console.log('INFO: JEELIZFACEEXPRESSIONS is ready!');
            
          _state = _states.jeefacetransferInitialized;
          init_three(spec.canvasThree);
          _state = _states.threeInitialized;
          _state = _states.idle;
          that.ready = true;

          const start = function(){
            that.set_positionScale((spec.position) ? spec.position : [0,0,0], (spec.scale) ? spec.scale : 1);
            if (spec.successCallback){
              const videoElement = JEELIZFACEEXPRESSIONS.get_video();
              spec.successCallback(videoElement);
            }
            that.animate();
          }

          if (typeof(spec.model) === 'undefined'){
            load_model(spec.meshURL, false,
              function(){ // load_model success callback
                that.set_materialParameters(spec.matParameters);
                start();
              }
            ); //end load_model() cb
          } else if (spec.model && spec.mat){
            load_model(spec.model, spec.mat, start);
          } else if (spec.model && spec.matParams){
            load_model(spec.model, false, function(){
              that.set_materialParameters(spec.matParams);
              start();
            });
          }
        } //end callbackReady()
        });
      }, //end helper init()

      'get_three': function(){ // get three object in order to be able to change them into the final app
        return {
          'three': THREE,
          'threeRenderer': _three.renderer,
          'threeCamera': _three.camera,
          'threeAmbientLight': _three.ambientLight,
          'threeDirLight': _three.dirLight,
          'threeScene': _three.scene
        }
      },

      'get_threeEmoji': function(){
        return _three.morphAnimMesh;
      },

      'load_weboji': function(modelURL, matParams, callback){
        return load_model(modelURL, false, function(){
          that.set_materialParameters(matParams);
          if (callback) callback();
        });
      },

      'change_material': function(threeMaterial){
        change_material(threeMaterial);
      },

      'set_positionScale': function(vector3Array, scale){
        if (vector3Array){
          _three.morphAnimMesh.position.fromArray(vector3Array);
        }
        if (typeof(scale) !== 'undefined'){
          _three.morphAnimMesh.scale.set(-scale, scale, scale);
        }
      },

      'set_materialParameters': function(params){
        // change_material(new THREE.MeshBasicMaterial({map: load_texture(params.diffuseMapURL)})); return;
        const matParameters = Object.assign({
          'shininess': 30,

          'color': 0xffffff, // default parameters
          'diffuse': 0xffffff,
          'specular': 0xffffff,

          // morphing:
          'morphTargets': false, // disable default THREE.JS morphing
          morphPrecision: _settings.morphPrecision,
          morphRadius: _three.morphAnimMesh.geometry.morphRadius,
          nMorphs: _nMorphs,
          'morphJeelizInfluences': _three.morphAnimMesh.userData.morphJeelizInfluences
        }, params);
        ['specularMap', 'flexMap', 'envMap', 'alphaMap', 'lightMap', 'emissiveMap'].forEach(function(keyMap){
          if (params[keyMap + 'URL']){
            matParameters[keyMap] = load_texture(params[keyMap+'URL']);
          }
        });
        if (params.diffuseMapURL){
          matParameters.map = load_texture(params.diffuseMapURL);
        }
        const mat = ThreeMorphFlexibleMaterialBuilder(matParameters, _settings.rotationOrder);
        change_material(mat);
      }, //end set_materialParameters()

      'animate': function(){
        if (  _state===_states.idle
          || (_state===_states.loading && _loading.state===_state.idle)){
          _state = _states.animate;
          JEELIZFACEEXPRESSIONS.switch_sleep(false);
          start_animate();
        }
      },

      'stop': function(){
        JEELIZFACEEXPRESSIONS.switch_sleep(true);
        if (_animationHandler){
          cancelAnimationFrame(_animationHandler);
          _animationHandler = null;
        }
        if (_state === _states.loading){
          _loading.state = _states.idle;
        } else {
          _state = _states.idle;
        }
      },

      'resize': function(w, h){ // call this method if canvas resize
        _three.renderer.setSize(w, h);
        _DOMcanvas.style.width = null;
        _DOMcanvas.style.height = null;
        _three.camera.aspect = w / h;
        _three.camera.updateProjectionMatrix();
      },
  } //end that
  return that;
})();

export default JeelizWebojiThreeHelper;