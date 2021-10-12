"use strict";
/* spec properties of JeelizWebojiSVGHelper.init method:
   * <string> canvasId: id of the <canvas> element where the head search will be displayed
   * <string> NNCPath: where to find the neural net model
   * <array> Expression logic

*/

var JeelizWebojiSVGHelper = (function(){
  // private variables
  let _morphFactorsArr = null;
  const _morphFactorsDict = {
    smileRight: 0,        // 0
    smileLeft: 0,         // 1
    eyeBrowLeftDown: 0,   // 2
    eyeBrowRightDown: 0,  // 3
    eyeBrowLeftUp: 0,     // 4
    eyeBrowRightUp: 0,    // 5
    mouthOpen: 0,         // 6
    mouthRound: 0,        // 7
    eyeRightClose: 0,     // 8
    eyeLeftClose: 0,      // 9
    mouthNasty: 0         // 10
  };
  const _morphIndexToName = Object.keys(_morphFactorsDict);
  let _expressions = null;

  let _hysteresis = 0;
  let _rotation = [0,0,0];
  let _rotationCallback = null;
  let _bestCssClassName = null;


  // private functions:
  function callbackReady(errCode){
    if (errCode){
      console.log('ERROR in JeelizWebojiSVGHelper - CANNOT INITIALIZE JEELIZFACEEXPRESSIONS: errCode =', errCode);
      return;
    }
    console.log('INFO: JEELIZFACEEXPRESSIONS is ready!');
    _morphFactorsArr = JEELIZFACEEXPRESSIONS.get_morphTargetInfluencesStabilized();
    if (_rotationCallback){
      _rotation = JEELIZFACEEXPRESSIONS.get_rotationStabilized();
    }
    JEELIZFACEEXPRESSIONS.set_morphUpdateCallback(onMorphUpdate);
  }


  function onMorphUpdate(quality, benchmarkCoeff){
    _morphIndexToName.forEach(function(morphKey, morphIndex){
      _morphFactorsDict[morphKey]=_morphFactorsArr[morphIndex];
    });

    _expressions.forEach(function(expressionVariants, expressionVariantsIndex){
      // which expression variant has the best score ?
      let bestScore = -1e12, bestScoreCSSclassName = null;
      for (let cssClassName in expressionVariants){
        let score = expressionVariants[cssClassName](_morphFactorsDict);
        if (cssClassName === _bestCssClassName){ // add a bonus if last selected position
          score += _hysteresis;        // to avoid position flickering
        }
        if (score > bestScore){
          bestScore = score;
          bestScoreCSSclassName = cssClassName;
        }
      }
      if (bestScore < -1) return;

      // expression variant which has the best score should be the only visible
      for (let cssClassName in expressionVariants){
        const isVisible = (cssClassName === bestScoreCSSclassName);
        if (expressionVariants[cssClassName].visibility === isVisible){
          continue;
        }
        if (isVisible){
          _bestCssClassName = cssClassName;
        }
        expressionVariants[cssClassName].visibility = isVisible;
        setClassCSSVisibility(cssClassName, isVisible);
      }

    }); //end loop on expression groups

    if (_rotationCallback){
      _rotationCallback(_rotation);
    }
  } //end onMorphUpdate()


  function setClassCSSVisibility(className, isVisible){
    const domElts = document.getElementsByClassName(className);
    const CSSpropVal = (isVisible) ? 'initial' : 'none';
    for (let i=0; i<domElts.length; ++i){
      domElts[i].style.display = CSSpropVal;
    }
  }


  // permut 2 element in an array:
  function permut(arr, i, j){
    const a = arr[j];
    arr[j] = arr[i];
    arr[i] = a;
  }


  // public methods:
  const that = {

    init: function(spec){
       _expressions=spec.expressions;
       if (typeof(spec.hysteresis)!=='undefined') _hysteresis=spec.hysteresis;
       if (typeof(spec.rotationCallback)!=='undefined')_rotationCallback=spec.rotationCallback;

       if (spec.isMirror){
         permut(_morphIndexToName, 0,1);
         permut(_morphIndexToName, 2,3);
         permut(_morphIndexToName, 4,5);
         permut(_morphIndexToName, 8,9);
       }

       JEELIZFACEEXPRESSIONS.init({
        canvasId: spec.canvasId,
        NNCPath: (spec.NNCPath) ? spec.NNCPath : './',
        callbackReady: callbackReady,
        videoSettings: {
          isAudio: false
        }
      });
    },


    // SOME HANDY SVG MANIP FUNCZ:
    posX_SVGpath: function(path, x){
      const CSStransform = path.style.transform;
      const xPx = x.toString() + 'px';
      if (CSStransform.indexOf('translate')===-1){
        path.style.transform = 'translate(' + xPx + ', 0px) ' + CSStransform;
      } else {
        path.style.transform = CSStransform.replace(/translate\([0-9\.\-px]+\s*/, 'translate(' + xPx);
      }
    },


    posY_SVGpath: function(path, y){
      const CSStransform = path.style.transform;
      const yPx = y.toString() + 'px';
      if (CSStransform.indexOf('translate')===-1){
        path.style.transform = 'translate(0px, ' + yPx + ') ' + CSStransform;
      } else {
        path.style.transform = CSStransform.replace(/translate\(([0-9\.\-px]+\s*),\s*[0-9\.\-px]+\s*/, 'translate($1,' + yPx);
      }
    },


    pos_SVGpath: function(path, x, y){
      const CSStransform = path.style.transform;
      const xPx = Math.round(x).toString() + 'px';
      const yPx = Math.round(y).toString() + 'px';
      if (CSStransform.indexOf('translate') === -1){
        path.style.transform = 'translate(' + xPx + ',' + yPx + ') ' + CSStransform;
      } else {
        path.style.transform = CSStransform.replace(/translate\(\s*[0-9\.\-px]+\s*,\s*[0-9\.\-px]+\s*/, 'translate(' + xPx + ',' + yPx);
      }
    },


    rot_SVGpath: function(path, angleDeg){
      const CSStransform = path.style.transform;
      const angleStr = angleDeg.toFixed(2) + 'deg';
      if (CSStransform.indexOf('rotate') === -1){
        path.style.transform = 'rotate(' + angleStr + ') ' + CSStransform;
      } else {
        path.style.transform = CSStransform.replace(/rotate\(\s*[0-9\.\-deg]+/, 'rotate(' + angleStr);
      }
    }
  };//end that
  return that;
})();
