/*
    spec :
        - url: url of the weboji mesh
        - successCallback : success callback
        - mat : three material
        - morphPrecision : should be POT, precision of morphing
        - nMorphs : number of morphs

*/
"use strict";
function ThreeMorphAnimGeomBuilder(spec){
    var _nMorphs=(spec.nMorphs%2===0)?spec.nMorphs:spec.nMorphs+1;

    lib_ajax.get(spec.url, function(data){
        var dataObj=JSON.parse(data);
        
        var geom=new THREE.BufferGeometry();
        var vertices=dataObj.base.vertices;
        var nVertices0=vertices.length;

        //construct faces
        var facesIndices=[], uviByVertexIndex=lib_array.create(-1, vertices.length), verticesDuplicatedIndices=[];

        function duplicate_ifNecessary(vi, vti){
            if (uviByVertexIndex[vi]===-1){
                uviByVertexIndex[vi]=vti;
                return vi;
            } else if (uviByVertexIndex[vi]===vti){
                return vi;
            } else { //we should duplicate the vertex
                //return vi; //KILL
                var duplicateVertexIndex=uviByVertexIndex.length;
                uviByVertexIndex.push(vti);
                vertices.push(vertices[vi]);
                verticesDuplicatedIndices.push(vi);
                return duplicateVertexIndex;
            }
        } //end duplicate_ifNecessary()

        dataObj.base.faces.forEach(function(f){
            var via=f[0][0];
            var vib=f[1][0];
            var vic=f[2][0];
            
            var vtia=f[0][1];
            var vtib=f[1][1];
            var vtic=f[2][1];

            via=duplicate_ifNecessary(via, vtia);
            vib=duplicate_ifNecessary(vib, vtib);
            vic=duplicate_ifNecessary(vic, vtic);
            
            facesIndices.push(via,vic,vib);

            if (f.length>3){ //quad face
                var vid=f[3][0];
                var vtid=f[3][1];
                vid=duplicate_ifNecessary(vid, vtid);
            
                facesIndices.push(via, vid, vic);
            }
        }); //end loop on faces
        geom.setIndex(facesIndices);


        //construct base vertices
        var vertices32=new Float32Array(vertices.length*3);
        vertices.forEach(function(v, vi){
            vertices32[3*vi]=v[0];
            vertices32[3*vi+1]=v[1];
            vertices32[3*vi+2]=v[2];
        });
        geom.addAttribute('position', new THREE.BufferAttribute(vertices32, 3, false));


        //construct uvs
        var uv32=new Float32Array(vertices.length*2);
        uviByVertexIndex.forEach(function(uvi, vi){
            var uv=dataObj.base.vts[uvi];
            if (typeof(uv)==='undefined') {
                uv=[0,0];
            }
            uv32[2*vi]=uv[0];
            uv32[2*vi+1]=uv[1];
        });
        geom.addAttribute('uv', new THREE.BufferAttribute(uv32, 2, false));


        //construct morphs
        
        console.log('INFO in ThreeMorphAnimMeshBuilder : ', dataObj.morphs.length, 'morphs found');
        

        var morphs=[];
        var nVertices=nVertices0+verticesDuplicatedIndices.length;
        dataObj.morphs.forEach(function(morph, morphIndex){
            var morphPositions=new Float32Array(nVertices*3);
            morph.forEach(function(v, vi){
                morphPositions[3*vi]=v[0];
                morphPositions[3*vi+1]=v[1];
                morphPositions[3*vi+2]=v[2];
            });

            verticesDuplicatedIndices.forEach(function(vi, i){
                var j=3*(nVertices0+i);
                var vMorph=morph[vi];
                morphPositions[j]=vMorph[0];
                morphPositions[j+1]=vMorph[1];
                morphPositions[j+2]=vMorph[2];
            });
            morphs.push(morphPositions);
        }); //end loop on morphs */
        if (morphs.length%2!==0){
            morphs.push(new Float32Array(morphs[0].length));
        }



        //multiplex morphs
        geom.computeBoundingSphere();
        var morphRadius=geom.boundingSphere.radius*0.5;
        
        var morphMultiplexed, morphA, morphB, iMorphMultiplexed, i, a, b;
        for (iMorphMultiplexed=0; iMorphMultiplexed<(_nMorphs/2); ++iMorphMultiplexed){
            
            morphMultiplexed=new Float32Array(nVertices*3);
            morphA=morphs[2*iMorphMultiplexed];
            morphB=morphs[2*iMorphMultiplexed+1];

            for (i=0; i<nVertices*3; ++i){
                a=Math.round(spec.morphPrecision*(1+morphA[i]/morphRadius)/2); //between 0 (-morphRadius) and 1 (maxRadius)
                b=Math.round(spec.morphPrecision*(1+morphB[i]/morphRadius)/2); //between 0 (-morphRadius) and 1 (maxRadius)
                morphMultiplexed[i]=a+b/spec.morphPrecision;
                //morphMultiplexed[i]=morphA[i]; //KILL
            }
            geom.addAttribute('morphJeeliz'+iMorphMultiplexed, new THREE.BufferAttribute(morphMultiplexed, 3, false));
        }


        //some computations...
        geom.computeVertexNormals();

        

        geom.morphRadius=morphRadius;
        spec.successCallback(geom);
    }); //end ajax callback
};
