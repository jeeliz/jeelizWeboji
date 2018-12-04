"use strict";
var lib_array={
    create: function(a, n){
        var r=new Array(n), i;
        for (i=0; i<n; ++i) {
          r[i]=a;
        }
        return r;
    },
    
    copy: function(from, to){
        var i;
        for (i=0; i<from.length; ++i){
            to[i]=from[i];
        }
    },

    clone: function(arr){
        var zou=new Array(arr.length);
        for (var i=0; i<arr.length; ++i) {
            zou[i]=arr[i];
        }
    },
    
    scaleNew: function(src, dst, factor){
        src.forEach(function(a, i){
           dst[i]=a*factor; 
        });
    },

    shuffle: function(arr){
        var i=0, j=0, tmp = null;

        for (i = arr.length - 1; i > 0; --i) {
            j = Math.floor(Math.random() * (i + 1))
            tmp = arr[i]
            arr[i] = arr[j]
            arr[j] = tmp
        }
    }
};
