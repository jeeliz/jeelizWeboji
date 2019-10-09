"use strict";

var lib_ajax = {
  get: function(url, func) {  
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", url, true);
    xmlHttp.withCredentials = false;
    xmlHttp.onreadystatechange = function() {
      if (xmlHttp.readyState === 4
        && (xmlHttp.status === 200 || xmlHttp.status === 0)) {
        func(xmlHttp.responseText);
      }
    };
    xmlHttp.send();
  }
};
