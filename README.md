
**NOTICE: Apple<sup>&copy;</sup>'s lawyers threatened us to file a complain on the 21th of August 2019 for infringing their intellectual property. So we have removed our main demo [webojis.com](http://webojis.com) and we have replaced the 3D animated fox by a raccoon.**

**Indeed, Apple<sup>&copy;</sup> owns the intellectual property of 3D animated foxes (but not on raccoons yet). Thank you for your understanding.**



# JavaScript/WebGL library to detect and reproduce facial expressions


With this library, you can build your own animated emoticon embedded in your web applications. The video is processed on client-side only.

By default the current camera video feed is overlaid by the face detection frame. The face detection will adapt to all lighting conditions, but the evaluation of expressions can be noisy if the lighting is too high, too weak, or if there is backlighting. The camera feedback image is useful to see the quality of the input video feed.

The computing power of your GPU is important. If your GPU is powerful, many detections per second will be processed and the result will be smooth and accurate. An old or low quality mobile device it may be slower.


## Table of contents

* [Features](#features)
* [Architecture](#architecture)
* [Demonstrations](#demonstrations)
  * [Run locally](#run-locally)
  * [Using module](#using-module)
* [Integration](#integration)
  * [With a bundler](#with-a-bundler)
  * [With JavaScript frontend frameworks](#with-javascript-frontend-frameworks)
  * [Native](#native)
* [Hosting](#hosting)
* [About the tech](#about-the-tech)
  * [Under the hood](#under-the-hood)
  * [Compatibility](#compatibility)
* [Documentation](#documentation)
* [License](#license)
* [References](#references)


## Features

* face detection and tracking,
* detects 11 facial expressions,
* face rotation around the 3 axis,
* robust to lighting conditions,
* mobile friendly,
* examples provided using SVG and THREE.js.

## Architecture

* `/assets/`: assets, both for 3D and 2D demonstrations (3D meshes, images),
* `/demos/`: the most interesting: the demos !,
* `/dist/`: heart of the library:
  * `jeelizFaceTransfer.js`: main minified script. It gets the camera video feed, exploit the neural network to detect the face and the expressions and stabilize the result,
  * `jeelizFaceTransferNNC.json`: neural network model loaded by the main script,
* `/doc/`: some additionnal documentation,
* `/helpers/`: The outputs of the main script are very raw. It is convenient to use these helpers to animate a 3D model with the THREE.js helper or a SVG file with the SVG helper. All demos use these helpers,
* `/libs/`: some javascript libs,
* `/meshConverter/`: only for the THREE.js use. Tool to build the 3D model file including morphs from separate .OBJ files.


## Demonstrations

We have built a demo application based on this library, available on [webojis.com](http://webojis.com). We have add recording capabilities using [RecordRTC](https://recordrtc.org) JavaScript library to save separately video from the `<canvas>` and audio from the microphone. Then we send them to the server and we encode the video using [FFMPEG](https://www.ffmpeg.org).

All the following demos are included in this repository, in the `/demos` path. You can try them:

* THREE.JS based demos:

  * **Cute raccoon**: [source code](/demos/threejs/raccoon/), [live demo](https://jeeliz.com/demos/weboji/demos/threejs/raccoon/)
  * **Cute raccoon from a MP4 video**: [source code](/demos/threejs/externalVideo/), [live demo](https://jeeliz.com/demos/weboji/demos/threejs/externalVideo/)

* SVG based demos:

  * **Cool Cartman**: [source code](/demos/svg), [live demo](https://jeeliz.com/demos/weboji/demos/svg/)

* Native demos:

  * **Cute raccoon**: [source code and instruction to build and run it](/demos/cordova/raccoon) This demo works as a native application using Apache Cordova. It has been tested successfully on iOS. The base code is the same than the THREE.js raccoon demo.


* Third party demos:

  * **Piano Genie**: play the piano with your face expressions! This is pretty addictive ;). [live demo - ace-piano-genie.glitch.me](https://face-piano-genie.glitch.me/), [code and further details](https://glitch.com/edit/#!/piano-genie)

  * **Browse Hands Free**, by [Oz Ramos](https://twitter.com/LabOfOz): The demo improves web accessibility for disabled people. You can control the mouse cursor with your head (turn your head to move the cursor, smile to click). [live demo - browsehandsfree.com - click on the camera icon to start](https://handsfree.js.org/#/), [further details](https://github.com/jeeliz/jeelizWeboji/issues/13#issuecomment-473500657). The code is available on github here: [handsfreejs/handsfree](https://github.com/handsfreejs/handsfree).

  * **Vauta**, by [Nono](https://twitter.com/ke4563): You can anime a .VRM 3D character avatar in the browser. This web application is only in Japanese. [live demo - vauta.netlify.com](https://vauta.netlify.com/), [tweet and video](https://twitter.com/ke4563/status/1099673171777617922)

  * **Drowsiness detection**, by [Abhilash26](https://github.com/abhilash26) aka [Dinodroid](https://ko-fi.com/dinodroid): Be sure to don't fall asleep when driving thanks to this webapp! You can try it here: [dont-drive-drowsy.glitch.me](https://dont-drive-drowsy.glitch.me/), [view the source code](https://github.com/abhilash26/dont-drive-drowsy) or a [demo video](https://www.youtube.com/watch?v=FjqySZE8CTY)

  * **Expressions reader**, by [Abhilash26](https://github.com/abhilash26) aka [Dinodroid](https://ko-fi.com/dinodroid): detects 5 high level expressions (happiness, fear, anger, surprise, sadness) from the morph coefficients given by this lib, and display them as smileys. You can try it here: [emotion-reader.glitch.me](https://emotion-reader.glitch.me/) or [browse the source code](https://github.com/abhilash26/emotion-reader)


If you have made an application or a fun demonstration using this library, we would love to check it out and add a link here ! Just contact us on [Twitter @StartupJeeliz](https://twitter.com/StartupJeeliz) or [LinkedIn](https://www.linkedin.com/company/jeeliz).


#### Run locally

You just have to serve the content of this directory using a HTTPS server. Camera access can be not authorized depending on the web browser the application is hosted by an unsecured HTTP server. You can use *Docker* for example to run a HTTPS server:


1. Run docker-compose

```
docker-compose up
```

2. Open a browser and go to `localhost:8888`


If you have not bought a camera yet, a screenshot video of the Cartman Demo is available here:

<p align="center">
<a href='https://www.youtube.com/watch?v=WxaL_kXwtRE'><img src='https://img.youtube.com/vi/WxaL_kXwtRE/0.jpg'></a>
</p>



#### Using module
`/dist/jeelizFaceTransfer.module.js` is exactly the same as `/dist/jeelizFaceTransfer.js` except that it works as JavaScript module, so you can import it directly using:

```javascript
import 'dist/jeelizFaceTransfer.module.js'
```

or using `require`:

```javascript
const faceTransfer = require('./lib/jeelizFaceTransfer.module.js')
//...
```

There is no demo using the module version yet.



## Integration

### With a bundler
If you use this library with a bundler (typically *Webpack* or *Parcel*), first you should use the [module version](#using-module).

Then, with the standard library, we load the neural network model (specified by `NNCPath` provided as initialization parameter) using AJAX for the following reasons:
* If the user does not accept to share its camera, or if WebGL is not enabled, we don't have to load the neural network model,
* We suppose that the library is deployed using a static HTTPS server.

With a bundler, it is a bit more complicated. It is easier to load the neural network model using a classical `import` or `require` call and to provide it using the `NNC` init parameter:

```javascript
const faceTransferAPI = require('./lib/jeelizFaceTransfer.module.js')
const neuralNetworkModel = require('./dist/jeelizFaceTransferNNC.json')

faceTransferAPI.init({
  NNC: neuralNetworkModel, //instead of NNCPath
  //... other init parameters
});
```

### With JavaScript frontend frameworks
We don't cover here the integration with mainstream JavaScript frontend frameworks (*React*, *Vue*, *Angular*).
If you submit Pull Request adding the boilerplate or a demo integrated with specific frameworks, you are welcome and they will be accepted of course.
We can provide this kind of integration as a specific development service ( please contact us [here](https://jeeliz.com/contact-us/) ). But it is not so hard to do it by yourself. Here is a bunch of submitted issues dealing with *React* integration. Most of them are for [Jeeliz FaceFilter](https://github.com/jeeliz/jeelizFaceFilter), but the problem is similar:

* Angular integration: [Jeff Winder](https://www.linkedin.com/in/jeffwinder/) has integrated this library with Angular / Electron. His amazing work is published on Github here: [JeffWinder/jeelizWeboji-angular-electron-example](https://github.com/JeffWinder/jeelizWeboji-angular-electron-example),
* React integration: [#74](https://github.com/jeeliz/jeelizFaceFilter/issues/74#issuecomment-455624092) and [#122](https://github.com/jeeliz/jeelizFaceFilter/issues/122#issuecomment-533185928)
* [is it possible to use this library in react native project](https://github.com/jeeliz/jeelizFaceFilter/issues/21)
* [Having difficulty using JeelizThreejsHelper in ReactApp](https://github.com/jeeliz/jeelizFaceFilter/issues/137)

You can also take a look at these Github code repositories:
* [ikebastuz/jeelizTest](https://github.com/ikebastuz/jeelizTest): React demo of a CSS3D FaceFilter. It is based on [Create React App](https://github.com/facebook/create-react-app)
* [CloffWrangler/facevoice](https://github.com/CloffWrangler/facevoice): Another demo based on [Create React App]
* [nickydev100/FFMpeg-Angular-Face-Filter](https://github.com/nickydev100/FFMpeg-Angular-Face-Filter): Angular boilerplate


### Native
It is possible to execute a JavaScript application using this library into a *Webview* for a native app integration.
But with IOS the camera access is disabled inside webviews. You have to implement a hack to stream the camera video into the webview using websockets.

His hack has been implemented into this repository:

* [Apache Cordova IOS demo (it should also work on Android)](/tree/master/demos/cordova)
* [Youtube video of the demo](https://youtu.be/yx9uA1g6-rA)
* [Github submitted issue](/issues/27)
* [Linkedin post detailing pros and cons](https://www.linkedin.com/feed/update/urn:li:activity:6587781973287198720)

But it is still a dirty hack introducing a bottleneck. It still run pretty well on a high end device (tested on Iphone XR), but it is better to stick on a full web environment.



## Hosting

This library requires the user's camera feed through `MediaStream API`. Your application should then be hosted with a HTTPS server (the certificate can be self-signed). It won't work at all with unsecure HTTP, even locally with some web browsers.

Be careful to enable gzip HTTP/HTTPS compression for JSON and JS files. Indeed, the neuron network JSON in, `/dist/` is quite heavy, but very well compressed with GZIP. You can check the gzip compression of your server [here](https://checkgzipcompression.com/).

The neuron network JSON file is loaded using an ajax `XMLHttpRequest` after the user has accepted to share its camera. We proceed this way to avoid to load this quite heavy file if the user refuses to share its camera or if there is no camera available. The loading will be faster if you systematically preload the JSON file using a service worker or a simple raw `XMLHttpRequest` just after the loading of the HTML page. Then the file will be in the browser cache and will be fast to request.



## About the tech
### Under the hood
The heart of the lib is `JEEFACETRANSFERAPI`. It is implemented by `/dist/jeelizFaceTransfer.js` script. It relies on Jeeliz WebGL Deep Learning technology to detect and track the user's face using a deep learning network, and to simultaneously evaluate the expression factors. The accuracy is adaptative: the best is the hardware, the more detections are processed per second. All is done client-side.

The documentation of `JEEFACETRANSFERAPI` is included in this repository as a PDF file, [/doc/jeefacetransferAPI.pdf](/doc/jeefacetransferAPI.pdf). In the main scripts of the demonstration, we never call these methods directly, but always through the helpers. Here is the indices of the morphs returned by this API:

* 0:  smileRight &rarr; closed mouth smile right
* 1:  smileLeft  &rarr; closed mouth smile left
* 2:  eyeBrowLeftDown &rarr; left eyebrow frowned
* 3:  eyeBrowRightDown &rarr; right eyebrow frowned
* 4:  eyeBrowLeftUp &rarr; raise left eyebrow (surprise)
* 5:  eyeBrowRightUp &rarr; raise right eyebrow (surprise)
* 6:  mouthOpen &rarr; open mouth
* 7:  mouthRound &rarr; o shaped mouth
* 8:  eyeRightClose &rarr; close right eye
* 9:  eyeLeftClose  &rarr; close left eye
* 10: mouthNasty   &rarr; nasty mouth (show teeth)



### Compatibility
* If `WebGL2` is available, it uses `WebGL2` and no specific extension is required,
* If `WebGL2` is not available but `WebGL1`, we require either `OES_TEXTURE_FLOAT` extension or `OES_TEXTURE_HALF_FLOAT` extension,
* If `WebGL2` is not available, and if `WebGL1` is not available or neither `OES_TEXTURE_FLOAT` or `OES_HALF_TEXTURE_FLOAT` are implemented, the user is not compatible.

In all cases, you need to have WebRTC implemented in the web browser, otherwise this library will not be able to get the camera video feed. The compatibility tables are on, [caniuse.com](https://caniuse.com/): [WebGL1](https://caniuse.com/#feat=webgl), [WebGL2](https://caniuse.com/#feat=webgl2), [WebRTC](https://caniuse.com/#feat=stream).

If a compatibility error is triggered, please post an issue on this repository. If this is a camera access error, please first retry after closing all applications which could use your device (Skype, Messenger, other browser tabs and windows, ...). Please include:
* a screenshot of [webglreport.com - WebGL1](http://webglreport.com/?v=1) (about your `WebGL1` implementation),
* a screenshot of [webglreport.com - WebGL2](http://webglreport.com/?v=2) (about your `WebGL2` implementation),
* the log from the web console,
* the steps to reproduce the bug, and screenshots.

This library works quite everywhere, and it works very well with a high end device like an Iphone X. But if your device is too cheap or too old, it will perform too few evaluations per second and the application will be slow.


## Documentation
 ### Documentation

 * `JEEFACETRANSFERAPI`: All the helpers rely on this API to get the facial morph coefficients. With this documentation you can interface this library with your own 3D or 2D engine. [Click here to read the PDF of the specs](/doc/jeefacetransferAPI.pdf),
 * [README.md about using the meshConverter](/meshConverter): Used in the THREE.JS Raccoon demo


 ### Articles and tutorials
 We list articles and tutorials about using this library:

 * [Create your own animated emoticon for the web](https://jeeliz.com/blog/create-animojis-for-the-web/)
 * [Integrate the animated emoticon on your website](https://jeeliz.com/blog/add-a-weboji-on-website/)


## License
[Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0.html). This application is free for both commercial and non-commercial use.

We appreciate attribution by including the [Jeeliz logo](https://jeeliz.com/wp-content/uploads/2018/01/LOGO_JEELIZ_BLUE.png) and a link to the [Jeeliz website](https://jeeliz.com) in your application or desktop website. Of course we do not expect a large link to Jeeliz over your face filter, but if you can put the link in the credits/about/help/footer section it would be great.


## References
* [Jeeliz official website](https://jeeliz.com)
* [Three.JS official website with documentation, demos, examples...](https://threejs.org/)
* [Webgl Academy: tutorials about WebGL and THREE.JS](http://www.webglacademy.com)

