"use strict";

var lib_array = {
  create: function(a, n){
    const r = new Array(n);
    for (let i=0; i<n; ++i) {
      r[i] = a;
    }
    return r;
  },
  
  copy: function(from, to){
    for (let i=0; i<from.length; ++i){
      to[i] = from[i];
    }
  },

  clone: function(arr){
    const zou = new Array(arr.length);
    for (let i=0; i<arr.length; ++i) {
      zou[i] = arr[i];
    }
  },
  
  scaleNew: function(src, dst, factor){
    src.forEach(function(a, i){
       dst[i] = a * factor; 
    });
  },

  shuffle: function(arr){
    for (let i = arr.length - 1; i > 0; --i) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
  }
};
