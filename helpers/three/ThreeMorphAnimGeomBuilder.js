/*
  spec:
    - url: url of the weboji mesh
    - successCallback: success callback
    - mat: three material
    - morphPrecision: should be POT, precision of morphing
    - nMorphs: number of morphs

*/
"use strict";
function ThreeMorphAnimGeomBuilder(specArg){
  const spec = Object.assign({
    morphPrecision: 2048,
    nMorphs: 11,
    mat: null,
    successCallback: null,
    url: null,
    isUVFlipŶ: false,
    basePositions: null
  }, specArg);

  const _nMorphs = (spec.nMorphs%2===0) ? spec.nMorphs : spec.nMorphs + 1;

  lib_ajax.get(spec.url, function(data){
    const dataObj = JSON.parse(data);
    
    
    const scaleEncoding = dataObj['scaleEncoding'] || 1;
    let vertices = null, scaleEncodingBase = 1.0;
    if (spec.basePositions){
      vertices =  spec.basePositions;
      scaleEncodingBase = 1.0;
    } else {
      vertices = dataObj['base']['vertices'];
      scaleEncodingBase = scaleEncoding;
    }
    const nVertices0 = vertices.length;

    // construct geom:
    const geom = new THREE.BufferGeometry();

    // Construct faces:
    const facesIndices = [],
      uviByVertexIndex = lib_array.create(-1, vertices.length),
      verticesDuplicatedIndices = [];

    function duplicate_ifNecessary(vi, vti){
      if (uviByVertexIndex[vi] === -1){
        uviByVertexIndex[vi] = vti;
        return vi;
      } else if (uviByVertexIndex[vi] === vti){
        return vi;
      } else { // we should duplicate the vertex
        const duplicateVertexIndex = uviByVertexIndex.length;
        uviByVertexIndex.push(vti);
        vertices.push(vertices[vi]);
        verticesDuplicatedIndices.push(vi);
        return duplicateVertexIndex;
      }
    } //end duplicate_ifNecessary()

    dataObj['base']['faces'].forEach(function(f){
      let via = f[0][0];
      let vib = f[1][0];
      let vic = f[2][0];
      
      const vtia = f[0][1];
      const vtib = f[1][1];
      const vtic = f[2][1];

      via = duplicate_ifNecessary(via, vtia);
      vib = duplicate_ifNecessary(vib, vtib);
      vic = duplicate_ifNecessary(vic, vtic);
      
      facesIndices.push(via, vic, vib);

      if (f.length > 3){ // quad face
        let vid = f[3][0];
        const vtid = f[3][1];
        vid = duplicate_ifNecessary(vid, vtid);
      
        facesIndices.push(via, vid, vic);
      }
    }); //end loop on faces
    geom.setIndex(facesIndices);


    // Construct base vertices:
    const vertices32 = new Float32Array(vertices.length*3);
    vertices.forEach(function(v, vi){
      vertices32[3*vi] = v[0] / scaleEncodingBase;
      vertices32[3*vi+1] = v[1] / scaleEncodingBase;
      vertices32[3*vi+2] = v[2] / scaleEncodingBase;
    });
    geom.setAttribute('position', new THREE.BufferAttribute(vertices32, 3, false));


    // Construct uvs:
    const uv32 = new Float32Array(vertices.length*2);
    uviByVertexIndex.forEach(function(uvi, vi){
      let uv = dataObj['base']['vts'][uvi];
      if (typeof(uv)==='undefined') {
        uv = [0,0];
      }
      uv32[2*vi] = uv[0];
      uv32[2*vi+1] = (spec.isUVFlipŶ) ? 1.0 - uv[1] : uv[1];
    });
    geom.setAttribute('uv', new THREE.BufferAttribute(uv32, 2, false));


    // Construct morphs:
    console.log('INFO in ThreeMorphAnimMeshBuilder: ', dataObj['morphs'].length, 'morphs found');

    const morphs = [];
    const nVertices = nVertices0 + verticesDuplicatedIndices.length;
    dataObj['morphs'].forEach(function(morph, morphIndex){
      const morphPositions = new Float32Array(nVertices*3);
      morph.forEach(function(v, vi){
        v[0] /= scaleEncoding;
        v[1] /= scaleEncoding;
        v[2] /= scaleEncoding;
        morphPositions[3*vi] = v[0];
        morphPositions[3*vi+1] = v[1];
        morphPositions[3*vi+2] = v[2];
      });

      verticesDuplicatedIndices.forEach(function(vi, i){
        const j = 3 * (nVertices0+i);
        const vMorph = morph[vi];
        morphPositions[j] = vMorph[0];
        morphPositions[j+1] = vMorph[1];
        morphPositions[j+2] = vMorph[2];
      });
      morphs.push(morphPositions);
    }); //end loop on morphs */
    if (morphs.length%2 !== 0){
      morphs.push(new Float32Array(morphs[0].length));
    }


    // Multiplex morphs:
    geom.computeBoundingSphere();
    const morphRadius = geom.boundingSphere.radius * 0.5;
    
    for (let iMorphMultiplexed=0; iMorphMultiplexed < (_nMorphs/2); ++iMorphMultiplexed){
      
      const morphMultiplexed = new Float32Array(nVertices*3);
      const morphA = morphs[2*iMorphMultiplexed];
      const morphB = morphs[2*iMorphMultiplexed+1];

      for (let i=0; i<nVertices*3; ++i){
        const a = Math.round(spec.morphPrecision * (1+morphA[i]/morphRadius) / 2); // between 0 (-morphRadius) and 1 (maxRadius)
        const b = Math.round(spec.morphPrecision * (1+morphB[i]/morphRadius) / 2); // between 0 (-morphRadius) and 1 (maxRadius)
        morphMultiplexed[i] = a + b / spec.morphPrecision;
      }
      geom.setAttribute('morphJeeliz' + iMorphMultiplexed.toString(), new THREE.BufferAttribute(morphMultiplexed, 3, false));
    }

    geom.computeVertexNormals();

    geom.userData.morphRadius = morphRadius;
    spec.successCallback(geom);
  }); //end ajax callback
};
