/*
  returns an instance of MeshLambertMaterial but with a second modelViewMatrix, modelViewMatrixDelayed
  the position is a linear interpolation of the 2 matrix, using a coefficient stored in a texture
*/

//PRECOMPILER_BEGINNOGLSLX
function ThreeMorphFlexibleMaterialBuilder(matParameters, rotationOrder){
  let _nMorphs = matParameters.nMorphs;
  if (_nMorphs%2 !== 0) ++_nMorphs;

  let threeMat = null, isLights = true;
  switch(matParameters.render){
    case 'BASIC':
      threeMat = THREE.ShaderLib.basic;
      isLights = false;
      break;
    case 'STANDARD':
      threeMat = THREE.ShaderLib.standard;
      break;
    case 'PHONG':
    default:
      threeMat = THREE.ShaderLib.phong; // also works with a standard material
      break;
  }
  
  let vertexShaderSource = threeMat.vertexShader;
  let fragmentShaderSource = threeMat.fragmentShader;

  const _modelMatrixDelayed = new THREE.Matrix4();
  const _eulerDelayed = new THREE.Euler(0, 0, 0, rotationOrder);

  const uniforms = Object.assign({
    'modelMatrixDelayed': {
      'value': _modelMatrixDelayed
    },
    'morphJeelizPrecision': {
      'value': matParameters.morphPrecision
    },
    'morphJeelizRadius': {
      'value': matParameters.morphRadius
    },
    'morphJeelizInfluences': {
      'value': new Float32Array(_nMorphs)
    }
  }, threeMat.uniforms);

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

  const nMorphsAttribs = _nMorphs / 2;
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
    'uniform mat4 modelMatrixDelayed;\n'
    +'uniform sampler2D flexMap;\n'
    +'uniform float morphJeelizInfluences[' + (2*nMorphsAttribs).toString() + '];\n'
    +'uniform float morphJeelizPrecision, morphJeelizRadius;\n'
    +'attribute vec3 ' + morphAttribs.join(',') + ';'
  );
  vertexShaderSource = tweak_shaderDel(vertexShaderSource, '#include <worldpos_vertex>');
  vertexShaderSource = tweak_shaderRepl(vertexShaderSource, '#include <project_vertex>', 
    //"#include <worldpos_vertex>\n\
    "vec4 worldPosition = modelMatrix * vec4( transformed, 1.0 );\n\
    vec4 worldPositionDelayed = modelMatrixDelayed * vec4( transformed, 1.0 );\n\
    worldPosition = mix(worldPosition, worldPositionDelayed, texture2D(flexMap, uv).r);\n\
    vec4 mvPosition = viewMatrix * worldPosition;\n\
    gl_Position = projectionMatrix * mvPosition;"
    );
  vertexShaderSource = tweak_shaderRepl(vertexShaderSource, '#include <morphtarget_vertex>',
    glslMorphJeelizCode
  );

  for (let key in matParameters){
      let val = null;
      switch(key){
        case 'specular':
        case 'diffuse':
        case 'color':
          val = new THREE.Color(matParameters[key]);
          break;

        default:
          val = matParameters[key];
          break;
      }
      uniforms[key] = {
        'value': val
      }
  }
  
  const mat = new THREE.ShaderMaterial({
    'vertexShader': vertexShaderSource,
    'fragmentShader': fragmentShaderSource,
    'uniforms': uniforms,
    'morphTargets': false,
    'lights': isLights,
    'side': THREE['DoubleSide'],
    'precision': 'highp'
  });

  for (let key in matParameters){
    if (['map', 'specularMap', 'envMap', 'aoMap', 'alphaMap', 'lightMap', 'emissiveMap'].indexOf(key) === -1) continue;
    mat[key] = matParameters[key];
  }
  
  mat.update_flex = function(parentWorldMatrix, position, scale, rotationAmortized){
    _eulerDelayed.fromArray(rotationAmortized);
    _modelMatrixDelayed.makeRotationFromEuler(_eulerDelayed);
    _modelMatrixDelayed.setPosition(position);
    _modelMatrixDelayed.scale(scale);
    _modelMatrixDelayed.premultiply(parentWorldMatrix);
  }

  return mat;
}
//PRECOMPILER_ENDNOGLSLX
