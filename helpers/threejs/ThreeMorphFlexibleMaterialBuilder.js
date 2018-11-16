/*
    returns an instance of MeshLambertMaterial but with a second modelViewMatrix, modelViewMatrixDelayed
    the position is a linear interpolation of the 2 matrix, using a coefficient stored in a texture

*/
//PRECOMPILER_BEGINNOGLSLX
function ThreeMorphFlexibleMaterialBuilder(matParameters, rotationOrder){
    var _nMorphs=matParameters.nMorphs;
    if (_nMorphs%2!==0) ++_nMorphs;

    var threeMat=THREE.ShaderLib.phong; //also works with a standard material
    var vertexShaderSource=threeMat.vertexShader;

    var fragmentShaderSource=threeMat.fragmentShader;

    var _rotMatrixDelayed=new THREE.Matrix4();
    var _eulerDelayed=new THREE.Euler(0,0,0,rotationOrder);

    var uniforms=Object.assign({
        'modelMatrixDelayed': {
            'value': _rotMatrixDelayed
        },
        'morphJeelizPrecision': {
            'value': matParameters.morphPrecision
        },
        'morphJeelizRadius': {
            'value': matParameters.morphRadius
        },
        'morphJeelizInfluences': {
            'value': lib_array.create(0,_nMorphs)
        }
    }, threeMat.uniforms);

    //tweak shaders
    function tweak_shaderAdd(code, chunk, glslCode){
        return code.replace(chunk, chunk+"\n"+glslCode);
    }
    function tweak_shaderDel(code, chunk){
        return code.replace(chunk, '');
    }
    function tweak_shaderRepl(code, chunk, glslCode){
        return code.replace(chunk, glslCode);
    }

    var nMorphsAttribs=_nMorphs/2;
    var glslMorphJeelizCode='', morphAttribs=[];
    var iMorph, iA, iB;
    for (iMorph=0; iMorph<nMorphsAttribs; ++iMorph){
        iA=2*iMorph;
        iB=2*iMorph+1;
        glslMorphJeelizCode+=
        'vec3 morphTargetJeeliz'+iA+' = morphJeelizRadius*(vec3(-1.,-1.,-1.) + 2.*floor(morphJeeliz'+iMorph+')/morphJeelizPrecision);\n'
        +'vec3 morphTargetJeeliz'+iB+' = morphJeelizRadius*(vec3(-1.,-1.,-1.) + 2.*fract(morphJeeliz'+iMorph+'));\n'
        +'transformed += morphTargetJeeliz'+iA+' * morphJeelizInfluences['+iA+'];\n'
        +'transformed += morphTargetJeeliz'+iB+' * morphJeelizInfluences['+iB+'];\n';
        morphAttribs.push('morphJeeliz'+iMorph);
    }

    vertexShaderSource=tweak_shaderAdd(vertexShaderSource, '#include <common>',
        'uniform mat4 modelMatrixDelayed;\n'
        +'uniform sampler2D flexMap;\n'
        +'uniform float morphJeelizInfluences['+(2*nMorphsAttribs)+'];\n'
        +'uniform float morphJeelizPrecision, morphJeelizRadius;\n'
        +'attribute vec3 '+morphAttribs.join(',')+';'
    );
    vertexShaderSource=tweak_shaderDel(vertexShaderSource, '#include <worldpos_vertex>');
    vertexShaderSource=tweak_shaderRepl(vertexShaderSource, '#include <project_vertex>', 
        //"#include <worldpos_vertex>\n\
        "vec4 worldPosition = modelMatrix * vec4( transformed, 1.0 );\n\
        vec4 worldPositionDelayed = modelMatrixDelayed * vec4( transformed, 1.0 );\n\
        worldPosition = mix(worldPosition, worldPositionDelayed, texture2D(flexMap, uv).r);\n\
        vec4 mvPosition = viewMatrix* worldPosition;\n\
        gl_Position = projectionMatrix * mvPosition;"
        );
    vertexShaderSource=tweak_shaderRepl(vertexShaderSource, '#include <morphtarget_vertex>',
        glslMorphJeelizCode
    );

    //debugger;

    for (var key in matParameters){
        var val;
        switch(key){
            case 'specular':
            case 'diffuse':
            case 'color':
                val=new THREE.Color(matParameters[key]);
                break;

            default:
                val=matParameters[key];
                break;
        }
        uniforms[key]={
            'value': val
        }
    }
    
    var mat = new THREE.ShaderMaterial({
        'vertexShader': vertexShaderSource,
        'fragmentShader': fragmentShaderSource,
        'uniforms': uniforms,
        'morphTargets': false,
        'lights': true
    });
    for (var key in matParameters){
        if (['map', 'specularMap', 'envMap', 'aoMap', 'alphaMap', 'lightMap', 'emissiveMap'].indexOf(key)===-1) continue;
        mat[key]=matParameters[key];
        /*uniforms[key]={
            value: matParameters[key]
        };*/
    }
    
    mat.set_rotationAmortized=function(position, scale, rotationAmortized){
        _eulerDelayed.fromArray(rotationAmortized);
        _rotMatrixDelayed.makeRotationFromEuler(_eulerDelayed);
        _rotMatrixDelayed.setPosition(position);
        _rotMatrixDelayed.scale(scale);
    }

    return mat;
}
//PRECOMPILER_ENDNOGLSLX
