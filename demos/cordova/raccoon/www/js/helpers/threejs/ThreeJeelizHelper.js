/*
Helper for THREE.JS
it requires ThreeMorphAnimGeomBuilder.js and ThreeMorphFlexibleMaterialBuilder.js
*/
"use strict";

/*
  spec of THREE.JeelizHekper.init :
    - <string> canvasThreeId : id of the canvas with the THREE.js 3D Weboji rendering
    - <string> canvasId : id of the JEEFACETRANSFER canvas

    - <function> successCallback : launched when all is ready
    - <function> errorCallback : launched if an error happens

    - <string> assetsParentPath : string, path where assets are
    - <string> NNCPath : string, where to find the dist/jeelizFaceTransferNNC.json

    - <string> meshURL : url of the mesh
    - <dict> matParams : parameters of the material
    
    - <array3> position : position of the mesh (default: [0,0,0])
    - <float> scale : scale of the mesh (default : 1)
*/

THREE.JeelizHelper = (function(){
  //INTERNAL SETTINGS :  
  const _settings = {
    //THREE LIGHTS
    ambientLightIntensity: 1.0,
    dirLightIntensity: 0.8, //fox : 1.2
    dirLightDirection: [0,0.5,1],

    //ROTATION :
    rotationOrder: 'XZY',
    rotationSpringCoeff: 0.0002,
    rotationAmortizationCoeff: 0.9, //1-> no amortization, 0-> big amortization
    
    morphPrecision: 2048
  }; //end _settings

  //PRIVATE VARS :
  var _nMorphs = JEELIZFACEEXPRESSIONS.get_nMorphs();
  var _ThreeRenderer, _DOMcanvas, _ThreeScene, _ThreeCamera, _ThreeMorphAnimMesh = false, _ThreeAmbientLight, _ThreeDirLight;
  var _assetsParentPath, _isFaceDetected = false;

  const _states = { //all possibles states (ENUM like)
    notLoaded:-10,
    jeefacetransferInitialized: -9,
    threeInitialized: -8,
    loading: -1,
    idle: 0,
    animate: 1
  };
  let _state = _states.notLoaded; //initial state
  let _animationHandler = false;
  const _loading = {
    modelURL: false,
    threeMat: false,
    callback: false,
    restoreState: _states.idle
  };
  const _rotationAmortized=[0,0,0], _rotationSpeed=[0,0,0];
  let _prevT = 0;


  //PRIVATE FUNCTIONS :
  //render loop :
  function animate(t) {
    if (_state !== _states.animate){
      return;
    }
    const dt = Math.min(Math.max(t-_prevT, 5), 30); //in ms
    const rotation = JEELIZFACEEXPRESSIONS.get_rotationStabilized();
    _ThreeMorphAnimMesh.rotation.fromArray(rotation);
    
    //apply these kinematic formulas :
    //accl=(rotAmortized - rot) = dv/dt
    //dv=dt(rotAmortized - rot)
    //dp=dt*v

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

    if (_ThreeMorphAnimMesh.material.type === 'ShaderMaterial'){
      _ThreeMorphAnimMesh.material.set_rotationAmortized(_ThreeMorphAnimMesh.position, _ThreeMorphAnimMesh.scale, _rotationAmortized);
    }
    _ThreeRenderer.render(  _ThreeScene, _ThreeCamera ); //trigger the THREE.JS scene rendering

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
  } //else start_animate()

  //init the THREE.JS scene !
  function init_three(canvasThreeId) {
     
    _DOMcanvas = document.getElementById(canvasThreeId);
    _ThreeRenderer = new THREE.WebGLRenderer({
       'antialias'  : true,
       'canvas' : _DOMcanvas,
       'preserveDrawingBuffer': true,
       'alpha': true
    });
    _ThreeRenderer.setClearAlpha(0);

      //create the scene
    _ThreeScene = new THREE.Scene();
    
    //add some lights
    _ThreeAmbientLight = new THREE.AmbientLight(0xffffff);
    _ThreeAmbientLight.intensity = _settings.ambientLightIntensity;
    _ThreeScene.add(_ThreeAmbientLight);

    _ThreeDirLight = new THREE.DirectionalLight(0xffffff);
    _ThreeDirLight.position.fromArray(_settings.dirLightDirection);
    _ThreeDirLight.intensity = _settings.dirLightIntensity;
    _ThreeScene.add(_ThreeDirLight);

    //create the camera
    _ThreeCamera = new THREE.PerspectiveCamera(35, _DOMcanvas.width / _DOMcanvas.height, 10, 10000 );
    _ThreeCamera.position.set(0,0,500);
    _ThreeCamera.lookAt(new THREE.Vector3(0.,0.,0.));
  } //end init_three()

  //change the material of the weboji :
  function change_material(mat){
    if (!_ThreeMorphAnimMesh){
      return;
    }
    _loading.threeMat = mat;

    if (_state === _states.loading){
      const previousCallback = _loading.callback;
      _loading.callback = function(){
        previousCallback();
        _ThreeMorphAnimMesh.material = mat;
      }
    } else {
      _ThreeMorphAnimMesh.material = mat;
    }
  } //end change_material()

  //load a weboji mesh :
  function load_model(url, mat, callback){
    if (url===_loading.modelURL && mat===_loading.threeMat){ //called 2 times with same parameters
      return true;
    }
    
    if (_state === _states.loading){
      console.log('WARNING in THREE.JeelizHelper - load_model() : currently loading a model');
      const previousCallback = _loading.callback;
      _loading.callback = function(){
        previousCallback();
        load_model(url, mat, callback);
      };
      return true;

    } else if (_state!==_states.idle && _state!==_states.animate){
      console.log('WARNING in  THREE.JeelizHelper - load_model() : invalid state');
      return false;
    }

    if (url===_loading.url && _ThreeMorphAnimMesh){
      change_material(mat);
      callback();
      return true;
    }

    _loading.modelURL = url;
    _loading.threeMat = mat;
    _loading.callback = callback;
    _loading.restoreState = _state;

    _state = _states.loading;

    if (_ThreeMorphAnimMesh){ //remove previously loaded emoji
      _ThreeScene.remove(_ThreeMorphAnimMesh);
      _ThreeMorphAnimMesh = false;
    }

    ThreeMorphAnimGeomBuilder({
      url: _assetsParentPath + url,
      morphPrecision: _settings.morphPrecision,
      nMorphs: _nMorphs,
      successCallback: function(geom){
        const mesh = new THREE.Mesh(geom, mat);
        mesh.onAfterRender=function(){ //fix a bug with THREE.js r93
          if (mesh.material){
            mesh.material.side = THREE.DoubleSide;
            delete(mesh.onAfterRender);
            mesh.material.needsUpdate = true; //another THREE bug workaround : otherwise wrong lighting direction
          }
        }
    
        mesh.rotation.order = _settings.rotationOrder; //default : XYZ
        _ThreeMorphAnimMesh = mesh;
        const morphTargetInfluencesDst = JEELIZFACEEXPRESSIONS.get_morphTargetInfluencesStabilized();
          
        //_ThreeMorphAnimMesh.morphTargetInfluences=morphTargetInfluencesDst;
        _ThreeMorphAnimMesh.userData.morphJeelizInfluences=morphTargetInfluencesDst;

        JEELIZFACEEXPRESSIONS.on_detect(function(isDetected){
          _isFaceDetected = isDetected;
        });

        _ThreeScene.add(_ThreeMorphAnimMesh);

        _state = _loading.restoreState;
        start_animate();
        _loading.callback(mesh);
      } //end successCallback
    }); //end ThreeMorphAnimGeomBuilder call

    return true;
  } //end load_model()

  function load_texture(imageURL){
    return new THREE.TextureLoader().load(_assetsParentPath+imageURL);
  }
  


  //PUBLIC METHODS :
  const that = {
    'ready': false,

    'init': function(spec){
      if (!spec) var spec = {};
      _assetsParentPath = (spec.assetsParentPath) ? spec.assetsParentPath : './';
      
      //init JEELIZFACEEXPRESSIONS
      JEELIZFACEEXPRESSIONS.init({
        canvasId: spec.canvasId,
        NNCPath: (spec.NNCPath) ? spec.NNCPath : './',
        videoSettings: (spec.videoSettings) ? spec.videoSettings : null,
        callbackReady: function(errCode){
          if (errCode){
            console.log('ERROR - cannot init JEELIZFACEEXPRESSIONS. errCode =', errCode);
            if (spec.errorCallback){
              spec.errorCallback(errCode);
            }
            return;
          }
          console.log('INFO : JEELIZFACEEXPRESSIONS is ready !!!');
            
          _state = _states.jeefacetransferInitialized;
          init_three(spec.canvasThreeId);
          _state = _states.threeInitialized;
          _state = _states.idle;
          that.ready = true;

          function start(){
            that.set_positionScale((spec.position)?spec.position:[0,0,0], (spec.scale)?spec.scale:1);
            if (spec.successCallback){
              spec.successCallback();
            }
            that.animate();
          } //end start()

          if (typeof(spec.model) === 'undefined'){//mainly for debug
            load_model(spec.meshURL, false,
                function(){ //load_model success callback
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

      'get_three': function(){ //get three object in order to be able to change them into the final app
        return {
          'three': THREE,
          'threeRenderer': _ThreeRenderer,
          'threeCamera': _ThreeCamera,
          'threeAmbientLight': _ThreeAmbientLight,
          'threeDirLight': _ThreeDirLight,
          'threeScene': _ThreeScene
        }
      },

      'get_threeEmoji': function(){
        return _ThreeMorphAnimMesh;
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
          _ThreeMorphAnimMesh.position.fromArray(vector3Array);
        }
        if (typeof(scale) !== 'undefined'){
          _ThreeMorphAnimMesh.scale.set(-scale, scale, scale);
        }
      },

      'set_materialParameters': function(params){
        //change_material(new THREE.MeshBasicMaterial({map: load_texture(params.diffuseMapURL)})); return;
        var matParameters=Object.assign({
          'shininess': 30,

          'color': 0xffffff, //default parameters
          'diffuse': 0xffffff,
          'specular': 0xffffff,

          //morphing
          'morphTargets': false, //disable default THREE.JS morphing
          morphPrecision: _settings.morphPrecision,
          morphRadius: _ThreeMorphAnimMesh.geometry.morphRadius,
          nMorphs: _nMorphs,
          'morphJeelizInfluences': _ThreeMorphAnimMesh.userData.morphJeelizInfluences
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
          _state=_states.animate;
          JEELIZFACEEXPRESSIONS.switch_sleep(false);
          start_animate();
        }
      },

      'stop': function(){
        JEELIZFACEEXPRESSIONS.switch_sleep(true);
        if (_animationHandler){
          cancelAnimationFrame(_animationHandler);
          _animationHandler = false;
        }
        if (_state === _states.loading){
          _loading.state = _states.idle;
        } else {
          _state = _states.idle;
        }
      },

      'resize': function(w, h){ //call this method if canvas resize
        _ThreeRenderer.setSize(w,h);
        _DOMcanvas.style.width = null;
        _DOMcanvas.style.height = null;
        _ThreeCamera.aspect = w / h;
        _ThreeCamera.updateProjectionMatrix();
      },
  } //end that
  return that;
})(); //end THREE.JeelizHelper