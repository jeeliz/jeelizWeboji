/*
Helper for THREE.JS
it requires ThreeMorphAnimGeomBuilder.js and ThreeMorphFlexibleMaterialBuilder.js
*/
"use strict";

/*
  spec of JeelizWebojiThreeHelper.init:
    - <string> canvasThreeId: id of the canvas with the THREE.js 3D Weboji rendering
    - <string> canvasId: id of the Jeeliz Face Expressions canvas

    - <function> successCallback: launched when all is ready
    - <function> errorCallback: launched if an error happens

    - <string> assetsParentPath: string, path where assets are
    - <string> NNCPath: string, where to find the dist/jeelizFaceExpressionsNNC.json

    - <string> meshURL: url of the mesh
    - <dict> matParams: parameters of the material
    
    - <array3> position: position of the mesh (default: [0,0,0])
    - <float> scale: scale of the mesh (default: 1)
*/

const JeelizWebojiThreeHelper = (function(){
  const _defaultSpec = {
    threshold: 0, // detection threshold, between 0 (easy) and 1 (hard). 0 -> keep lib internal default value

    isMirror: false,
    isToneMapping: true,
    isSrgbOutputEncoding: true,
    videoSettings: {
      isAudio: false
    },

    errorCallback: null,
    successCallback: null,
    
    canvasThreeId: null,
    canvasId: null,

    // paths:
    assetsParentPath: './',
    NNCPath: './',

    model: null,
    meshURL: null,
    matParams: null,

    // misc:
    morphPrecision: 2048,

    // lighting:
    isLights: true,
    ambientLightIntensity: 0.5,
    dirLightIntensity: 0.5,
    dirLightDirection: [0, 0.5, 1],
    
    // camera parameters:
    cameraVerticalFoV: 35,
    cameraPosition: [0.0, 0.0, 500.0],

    // rotation:
    rotationOrder: 'ZYX', //'XZY',
    rotationSpringCoeff: 0.0002, // only for flex texture application
    rotationAmortizationCoeff: 0.9, // only for flex texture application - 1 -> no amortization, 0 -> big amortization

    // weboji mesh initial position:
    position: [0.0, 0.0, 0.0],
    rotation: [0.0, 0.0, 0.0],
    scale: 1.0
  }
  let _spec = null;

  // PRIVATE VARS:
  const _nMorphs = JEELIZFACEEXPRESSIONS.get_nMorphs();
  let _DOMcanvas = null, _isFaceDetected = false;

  const _three = { // gather THREE.js instances
    renderer: null,
    scene: null,
    camera: null,
    morphAnimMesh: null,
    morphAnimMeshParent: null,
    ambientLight: null,
    dirLight: null
  };

  const _states = { // all possibles states (ENUM like)
    notLoaded:-10,
    jeelizFaceExpressionsInitialized: -9,
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
    if (_spec.isMirror){ // mirror around X axis:
      rotation[1] *= -1.0;
      rotation[2] *= -1.0;
    }
    _three.morphAnimMesh.rotation.fromArray(rotation);

    // apply these kinematic formulas:
    // accl = (rotAmortized - rot) = dv / dt
    // dv = dt * (rotAmortized - rot)
    // dp = dt * v

    const amortizationCoeff = Math.pow(_spec.rotationAmortizationCoeff, dt/16);
    _rotationSpeed[0] *= amortizationCoeff;
    _rotationSpeed[1] *= amortizationCoeff;
    _rotationSpeed[2] *= amortizationCoeff;
    
    _rotationSpeed[0] += _spec.rotationSpringCoeff * dt * (rotation[0]-_rotationAmortized[0]);
    _rotationSpeed[1] += _spec.rotationSpringCoeff * dt * (rotation[1]-_rotationAmortized[1]);
    _rotationSpeed[2] += _spec.rotationSpringCoeff * dt * (rotation[2]-_rotationAmortized[2]);

    _rotationAmortized[0] += dt * _rotationSpeed[0];
    _rotationAmortized[1] += dt * _rotationSpeed[1];
    _rotationAmortized[2] += dt * _rotationSpeed[2];

    if (_three.morphAnimMesh.material.type === 'ShaderMaterial'){
      _three.morphAnimMesh.material.update_flex(_three.morphAnimMeshParent.matrixWorld, _three.morphAnimMesh.position, _three.morphAnimMesh.scale, _rotationAmortized);
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
  function init_three(canvasThreeId) {
     
    _DOMcanvas = document.getElementById(canvasThreeId);
    _three.renderer = new THREE.WebGLRenderer({
      'antialias': true,
      'canvas': _DOMcanvas,
      'preserveDrawingBuffer': true,
      'alpha': true
    });

    // improve WebGLRenderer settings:
    if (_spec.isToneMapping){
      _three.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    }
    if (_spec.isSrgbOutputEncoding){
      _three.renderer.outputEncoding = THREE.sRGBEncoding;
    }

    _three.renderer.setClearAlpha(0);

    // create the scene and parent object:
    _three.scene = new THREE.Scene();
    _three.morphAnimMeshParent = new THREE.Object3D();
    _three.scene.add(_three.morphAnimMeshParent);

    // debug: add a cube into the scene
    /*const debugCube = new THREE.Mesh(new THREE.BoxGeometry(150,150,150), new THREE.MeshNormalMaterial({side: THREE.DoubleSide}));
    _three.scene.add(debugCube); //*/

    // add some lights:
    if (_spec.isLights){
      _three.ambientLight = new THREE.AmbientLight(0xffffff);
      _three.ambientLight.intensity = _spec.ambientLightIntensity;
      _three.scene.add(_three.ambientLight);

      _three.dirLight = new THREE.DirectionalLight(0xffffff);
      _three.dirLight.position.fromArray(_spec.dirLightDirection);
      _three.dirLight.intensity = _spec.dirLightIntensity;
      _three.scene.add(_three.dirLight);
    }

    // create the camera:
    _three.camera = new THREE.PerspectiveCamera(_spec.cameraVerticalFoV, _DOMcanvas.width / _DOMcanvas.height, 10, 10000 );
    _three.camera.position.fromArray(_spec.cameraPosition);
    _three.camera.lookAt(new THREE.Vector3());
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
    if (url === _loading.modelURL && mat === _loading.threeMat){ // called 2 times with same args
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
      _three.morphAnimMeshParent.remove(_three.morphAnimMesh);
      _three.morphAnimMesh = null;
    }

    ThreeMorphAnimGeomBuilder({
      url: _spec.assetsParentPath + url,
      morphPrecision: _spec.morphPrecision,
      nMorphs: _nMorphs,
      successCallback: function(geom){
        const mesh = new THREE.Mesh(geom, mat);
       
        mesh.rotation.order = _spec.rotationOrder; // default: XYZ
        _three.morphAnimMesh = mesh;
        const morphTargetInfluences = JEELIZFACEEXPRESSIONS.get_morphTargetInfluencesStabilized();
          
        _three.morphAnimMesh.userData.morphJeelizInfluences = morphTargetInfluences;

        JEELIZFACEEXPRESSIONS.on_detect(function(isDetected){
          _isFaceDetected = isDetected;
        });

        _three.morphAnimMeshParent.add(_three.morphAnimMesh);

        _state = _loading.restoreState;
        start_animate();
        _loading.callback(mesh);

        // fix a weird bug on IOS 14.0.1 / Iphone11
        // The canvas is not visible because of a Safari DOM update problem.
        // So we append a random <div> to the DOM to force DOM refresh
        const uselessDiv = document.createElement('div');
        uselessDiv.style.width = '10px';
        uselessDiv.style.height = '10px';
        uselessDiv.style.position = 'fixed';
        uselessDiv.style.zIndex = '100';
        document.body.appendChild(uselessDiv);
        //uselessDiv.style.backgroundColor = 'lime';
        
      } //end successCallback
    }); //end ThreeMorphAnimGeomBuilder call

    return true;
  } //end load_model()


  function load_texture(imageURL){
    return new THREE.TextureLoader().load(_spec.assetsParentPath + imageURL);
  }  


  // PUBLIC METHODS:
  const that = {
    'ready': false,

    'init': function(specArg){
      _spec = Object.assign({}, _defaultSpec, specArg);
      
      // init JEELIZFACEEXPRESSIONS:
      JEELIZFACEEXPRESSIONS.init({
        canvasId: _spec.canvasId,
        NNCPath: _spec.NNCPath,
        videoSettings: _spec.videoSettings,
        threshold: _spec.threshold,
        callbackReady: function(errCode){
          if (errCode){
            console.log('ERROR: cannot init JEELIZFACEEXPRESSIONS. errCode =', errCode);
            if (_spec.errorCallback){
              _spec.errorCallback(errCode);
            }
            return;
          }
          console.log('INFO: JEELIZFACEEXPRESSIONS is ready!');
            
          _state = _states.jeelizFaceExpressionsInitialized;
          init_three(_spec.canvasThreeId);
          _state = _states.threeInitialized;
          _state = _states.idle;
          that.ready = true;

          const start = function(){
            that.set_pose(_spec.position, _spec.rotation, _spec.scale);
            if (_spec.successCallback){
              _spec.successCallback(_three);
            }
            that.animate();
          }

          if (_spec.model === null){
            load_model(_spec.meshURL, false,
              function(){ // load_model success callback
                that.set_materialParameters(_spec.matParameters);
                start();
              }
            ); //end load_model() cb
          } else if (_spec.model && _spec.mat){
            load_model(_spec.model, _spec.mat, start);
          } else if (_spec.model && _spec.matParams){
            load_model(_spec.model, false, function(){
              that.set_materialParameters(_spec.matParams);
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


    'set_pose': function(positionArray, rotationArray, scale){
      if (positionArray){
        _three.morphAnimMeshParent.position.fromArray(positionArray);
      }
      if (rotationArray){
        const d2g = Math.PI / 180.0;
        _three.morphAnimMeshParent.rotation.set(rotationArray[0] * d2g, rotationArray[1] * d2g, rotationArray[2] * d2g);
      }
      if (typeof(scale) !== 'undefined'){
        _three.morphAnimMeshParent.scale.set(-scale, scale, scale);
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
        morphPrecision: _spec.morphPrecision,
        morphRadius: _three.morphAnimMesh.geometry.userData.morphRadius,
        nMorphs: _nMorphs,
        'morphJeelizInfluences': _three.morphAnimMesh.userData.morphJeelizInfluences
      }, params);
      ['specularMap', 'flexMap', 'envMap', 'alphaMap', 'lightMap', 'emissiveMap'].forEach(function(keyMap){
        if (params[keyMap + 'URL']){
          matParameters[keyMap] = load_texture(params[keyMap + 'URL']);
        }
      });
      if (params.diffuseMapURL){
        matParameters.map = load_texture(params.diffuseMapURL);
      }
      const mat = ThreeMorphFlexibleMaterialBuilder(matParameters, _spec.rotationOrder);
      change_material(mat);
    },


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