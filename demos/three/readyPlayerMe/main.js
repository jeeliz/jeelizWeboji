const _three = { // gather THREE.js instances
  renderer: null,
  scene: null,
  camera: null
};

let _morphAnimMesh = null, _morphAnimMeshParent = null, _morphAnimMeshParentPivot = null, _morphAnimMeshRoot = null, _teethMesh = null;
let _morphTargetInfluences = null;

const _webojiSettings = {
  nMorphs: 11,
  morphPrecision: 2048,
  rotationXOffset: -Math.PI/10,
  teethOpenFactor: 2,
  pivotYZ: [-0.5, 0],
  moveTeethBackward: 0.01 // move teeth a bit backward to avoid intersections with skin
};

// entry point:
function main(){
  init_three();

  new THREE.GLTFLoader().load('./readyPlayerMeAvatar.glb', function(gltf){
    const model = gltf.scene;
    _morphAnimMeshParentPivot.add(model);

    // get teeth:
    _teethMesh = extract_threeNodeByName(model, 'Wolf3D_Teeth');
    _teethMesh.material = cast_materialToBasic(_teethMesh.material);
    _teethMesh.position.set(0, 0, -_webojiSettings.moveTeethBackward);

    // transform some other mats to basic:
    ['eyeLeft', 'eyeRight', 'Wolf3D_Shirt'].forEach(function(partName){
      const partMesh = extract_threeNodeByName(model, partName);
      if (partMesh){
        partMesh.material = cast_materialToBasic(partMesh.material);
      }
    });

    const avatarFace = extract_threeNodeByName(model, 'Wolf3D_Head');
    const avatarFaceParent = avatarFace.parent;
    avatarFaceParent.remove(avatarFace);
    const avatarMat = create_avatarMorphMat(avatarFace.material);

    const basePositions = get_unflattenPositions(avatarFace.geometry);

    Promise.all([init_morphAnimMesh(avatarFaceParent, basePositions, avatarMat), init_weboji()]).then(function(results){
      _morphTargetInfluences = JEELIZFACEEXPRESSIONS.get_morphTargetInfluencesStabilized();

      // setup the morphAnimMesh:
      _morphAnimMesh = results[0];
      avatarFaceParent.add(_morphAnimMesh);
      _morphAnimMesh.material.uniforms.morphJeelizInfluences.value = _morphTargetInfluences;
      animate();
    });
  });
}


function cast_materialToBasic(mat){
  if (mat.isMeshBasicMaterial){
    return mat;
  }
  return new THREE.MeshBasicMaterial({
    map: mat.map,
    color: 0xffffff,
    morphTargets: mat.morphTargets,
    fog: false
  });
}


function open_teeth(k){
  if (!_teethMesh) return;
  const morphIndex = _teethMesh.morphTargetDictionary.mouthOpen;
  _teethMesh.morphTargetInfluences[morphIndex] = _webojiSettings.teethOpenFactor * k;
}


function get_unflattenPositions(geom){
  const positionsFlatten = geom.attributes.position.array;
  const n = positionsFlatten.length/3;
  const r = new Array(n);
  for (let i = 0; i<n; ++i){
    r[i] = positionsFlatten.slice(i*3, i*3+3);
  }
  return r;
}


function create_avatarMorphMat(oldMat){
  let nMorphs = _webojiSettings.nMorphs;
  if (nMorphs%2 !== 0) ++nMorphs;

  const threeMatTemplate = THREE.ShaderLib.basic;
  let vertexShaderSource = threeMatTemplate.vertexShader;
  let fragmentShaderSource = threeMatTemplate.fragmentShader;

  const uniforms = Object.assign({
    morphJeelizPrecision: {
      value: _webojiSettings.morphPrecision
    },
    morphJeelizRadius: {
      value: 1
    },
    'morphJeelizInfluences': {
      'value': new Float32Array(nMorphs)
    }}, threeMatTemplate.uniforms);

  // tweak shaders:
  function tweak_shaderAdd(code, chunk, glslCode){
    return code.replace(chunk, chunk+"\n"+glslCode);
  }
  function tweak_shaderDel(code, chunk){
    return code.replace(chunk, '');
  }
  function tweak_shaderRepl(code, chunk, glslCode){
    return code.replace(chunk, glslCode);
  }

  const nMorphsAttribs = nMorphs / 2;
  let glslMorphJeelizCode = ''
  const morphAttribs = [];
  for (let iMorph=0; iMorph<nMorphsAttribs; ++iMorph){
    const iA = 2 * iMorph;
    const iB = 2 * iMorph + 1;
    const iAStr = iA.toString();
    const iBStr = iB.toString();
    const iMorphStr = iMorph.toString();
    glslMorphJeelizCode +=
    'vec3 morphTargetJeeliz' + iAStr + ' = morphJeelizRadius*(vec3(-1.,-1.,-1.) + 2.*floor(morphJeeliz' + iMorphStr + ')/morphJeelizPrecision);\n'
    +'vec3 morphTargetJeeliz' + iBStr + ' = morphJeelizRadius*(vec3(-1.,-1.,-1.) + 2.*fract(morphJeeliz' + iMorphStr + '));\n'
    +'transformed += morphTargetJeeliz' + iAStr + ' * morphJeelizInfluences[' + iAStr + '];\n'
    +'transformed += morphTargetJeeliz' + iBStr + ' * morphJeelizInfluences[' + iBStr + '];\n';
    morphAttribs.push('morphJeeliz' + iMorphStr);
  }

  vertexShaderSource = tweak_shaderAdd(vertexShaderSource, '#include <common>',
    'uniform float morphJeelizInfluences[' + (2*nMorphsAttribs).toString() + '];\n'
    +'uniform float morphJeelizPrecision, morphJeelizRadius;\n'
    +'attribute vec3 ' + morphAttribs.join(',') + ';'
  );
  
  //vertexShaderSource = tweak_shaderDel(vertexShaderSource, '#include <worldpos_vertex>');
  vertexShaderSource = tweak_shaderRepl(vertexShaderSource, '#include <morphtarget_vertex>',
    glslMorphJeelizCode
  );

  // create mat:
  const mat = new THREE.ShaderMaterial({
    vertexShader: vertexShaderSource,
    fragmentShader: fragmentShaderSource,
    morphTargets: false,
    lights: false,
    fog: false,
    side: THREE.DoubleSide,
    precision: 'highp',
    uniforms: uniforms
  });

  mat.map = oldMat.map
  mat.uniforms.map.value = oldMat.map;

  return mat;
}


function extract_threeNodeByName(model, name){
  let threeNodeFound = null;
  model.traverse(function(threeNode){
    if (threeNode.name === name){
      threeNodeFound = threeNode;
    }
  });
  return threeNodeFound;
}


function init_morphAnimMesh(avatarFaceParent, basePositions, mat){
  return new Promise(function(accept, reject){
    ThreeMorphAnimGeomBuilder({
      url: '../../../assets/3D/meshes/readyPlayerMe.json',
      nMorphs: _webojiSettings.nMorphs,
      morphPrecision: _webojiSettings.morphPrecision,
      isUVFlipŶ: true,
      basePositions: basePositions,
      successCallback: function(geom){
        const mesh = new THREE.Mesh(geom, mat);
        mat.uniforms.morphJeelizRadius.value = geom.userData.morphRadius;
        accept(mesh);
      }
    });
  }); //end returned promise
}


function init_weboji(){
  return new Promise(function(accept, reject){
    JEELIZFACEEXPRESSIONS.init({
      canvas: document.getElementById('jeelizFaceExpressionsCanvas'),
      NNCPath: '../../../dist/',
      callbackReady: function(errCode){
        if (errCode){
          alert('ERROR: cannot init JEELIZFACEEXPRESSIONS. errCode =' + errCode);
          reject(errCode);
          return;
        }
        console.log('INFO: JEELIZFACEEXPRESSIONS is ready!');
        accept();
      } //end callbackReady()
    });
  }); //end returned promise
}


function animate(){
  update_avatarFaceRotation();
  update_avatarTeeth();
  _three.renderer.render(_three.scene, _three.camera);
  window.requestAnimationFrame(animate);
}


function update_avatarTeeth(){
  const k = JEELIZFACEEXPRESSIONS.is_detected() ? _morphTargetInfluences[6] : 0;
  open_teeth(k);
}

function update_avatarFaceRotation(){
  const rotation = JEELIZFACEEXPRESSIONS.get_rotationStabilized();
  const rx = rotation[0] + _webojiSettings.rotationXOffset;
  const ry = -rotation[1];
  const rz = -rotation[2];
  _morphAnimMeshParent.rotation.set(rx, ry, rz, 'ZYX');
}


function init_three(){
  const DOMcanvas = document.getElementById('webojiCanvas');

  _three.renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: DOMcanvas,
    alpha: true
  });

  // improve WebGLRenderer settings:
  _three.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  _three.renderer.outputEncoding = THREE.sRGBEncoding;
  _three.renderer.setClearAlpha(0);

  // create scene and camera:
  _three.camera = new THREE.PerspectiveCamera(35, DOMcanvas.width / DOMcanvas.height, 10, 10000 );
  _three.camera.position.set(0, 0, 500);
  _three.camera.lookAt(new THREE.Vector3());

  _three.scene = new THREE.Scene();

   // set avatar pose:
   _morphAnimMeshRoot = new THREE.Object3D();
   _morphAnimMeshRoot.scale.multiplyScalar(400);
   _morphAnimMeshRoot.position.set(0,-200,0);
   _three.scene.add(_morphAnimMeshRoot);

  // set parent and pivot:
  _morphAnimMeshParent = new THREE.Object3D();
  _morphAnimMeshParentPivot = new THREE.Object3D();
  _morphAnimMeshParent.add(_morphAnimMeshParentPivot);
  const pivot = new THREE.Vector3(0, _webojiSettings.pivotYZ[0], _webojiSettings.pivotYZ[1]);
  _morphAnimMeshParentPivot.position.copy(pivot);
  _morphAnimMeshParent.position.copy(pivot).multiplyScalar(-1);
  _morphAnimMeshRoot.add(_morphAnimMeshParent);

    // add some lights:
  const ambientLight = new THREE.AmbientLight(0xffffff);
  ambientLight.intensity = 0.5;
  _three.scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff);
  dirLight.position.fromArray([0, 0.5, 1]);
  dirLight.intensity = 0.5;
  _three.scene.add(dirLight);
}


window.addEventListener('load', main);