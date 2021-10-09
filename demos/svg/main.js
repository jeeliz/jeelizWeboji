let _SVGpupilLeft = null, _SVGpupilRight = null, _SVGhead = null;


function move_pupil(SVGpupil, dx, dy){
  JeelizWebojiSVGHelper.pos_SVGpath(SVGpupil, dx, dy);
}


function rotate_headZ(rz){
  JeelizWebojiSVGHelper.rot_SVGpath(_SVGhead, rz);
}


// entry point:
function main(){
  _SVGpupilLeft = document.getElementById('svgPupilLeft');
  _SVGpupilRight = document.getElementById('svgPupilRight');
  _SVGhead = document.getElementById('svgHead');

  JeelizWebojiSVGHelper.init({
    canvasId: 'jeelizFaceExpressionsCanvas',
    NNCPath: '../../dist/',
    hysteresis: 0.02, // bonus score for already selected expression. Against flickering
    isMirror: true,

    expressions: [ // list of uncorrelated expressions (for example the mouth is uncorrelated with the right eye)
      { // mouth. Inside a group each expression is an exclusive choice
        // the key of an expression is its CSS class. the value is the score class
        // the chosen expression is the one which has the higher score
        /*
        All factors are between 0 and 1. names:
          smileRight -> closed mouth smile right
          smileLeft  -> closed mouth smile left
          eyeBrowLeftDown -> eyebrow left frowned
          eyeBrowRightDown -> eyebrow right frowned
          eyeBrowLeftUp -> eyebrow left up (surprised)
          eyeBrowRightUp -> eyebrow right up (surprised)
          mouthOpen -> mouth open
          mouthRound -> mouth round
          eyeRightClose -> close right eye
          eyeLeftClose  -> close left eye
          mouthNasty   -> mouth nasty (upper lip raised)
        */
        svgMouthRound: function(ks){
           return 0.7 * ks.mouthRound - 0.1 * ks.mouthOpen - 0.2;
        },

        svgMouthOpen: function(ks){
           return 1.0 * ks.mouthOpen;
        },

        svgMouthRest:function(ks){
           return 0.45;
        },

        svgMouthNasty: function(ks){
           return ks.mouthNasty * 2.0 + 0.2 * ks.mouthOpen;
        },

        svgSmileLeft: function(ks){
            return ks.smileLeft - ks.smileRight;
        },

        svgSmileRight: function(ks){
            return ks.smileRight - ks.smileLeft;
        },

        svgSmile: function(ks){
           return (ks.smileRight + ks.smileLeft);
        }
      },

      { // left eye
        svgEyeLeftOpen: function(ks){
          return 1. - ks.eyeLeftClose;
        },
        svgEyeLeftClose: function(ks){
          return 1.5 * ks.eyeLeftClose;
        }
      },

      { // right eye
        svgEyeRightOpen: function(ks){
          return 1. - ks.eyeRightClose;
        },
        svgEyeRightClose: function(ks){
          return 1.0 * ks.eyeRightClose;
        }
      },

      { // left eyebrow
        eyeBrowLeftRest: function(ks){
          return 0.4;
        },
        eyeBrowLeftUp: function(ks){
          return ks.eyeBrowLeftUp;
        },
         eyeBrowLeftDown: function(ks){
          return 1.0 * ks.eyeBrowLeftDown;
        }
      },

      { // right eyebrow
        eyeBrowRightRest: function(ks){
          return 0.4;
        },
        eyeBrowRightUp: function(ks){
          return ks.eyeBrowRightUp;
        },
         eyeBrowRightDown: function(ks){
          return 1.0 * ks.eyeBrowRightDown;
        }
      }
    ], //end expressions[]

    rotationCallback: function(xyz){
      const rx = xyz[0], // head angle: rotation around X (look up/down)
          ry = xyz[1], // rotation around Y: look right/left
          rz = xyz[2]; // rotation around Z: head bending

      const dx = 12*ry, dy = -5+20*rx;
      move_pupil(_SVGpupilRight, dx,dy);
      move_pupil(_SVGpupilLeft, dx,dy);
      
      rotate_headZ(-rz*150);    
    }

  });
} //end main()


window.addEventListener('load', main);