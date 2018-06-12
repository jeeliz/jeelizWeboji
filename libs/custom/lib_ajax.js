"use strict";
var lib_ajax={
    get: function(url, func) {    
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("GET", url, true);
        xmlHttp.withCredentials=false;
        xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState === 4 && xmlHttp.status===200) {
                func(xmlHttp.responseText);   // la fonction de prise en charge
            }
        };
        xmlHttp.send();
    }
};
