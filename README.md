# JavaScript/WebGL library to detect and reproduce facial expressions


You can build your own animoji embedded in web applications with this library. The video is only processes client-side. You do not need any specific device except a standard webcam.

By default a webcam feedback image is displayed overlaid by the face detection frame. The face detection is quite robust to all lighting conditions, but the evaluation of the expressions can be noisy if the lighting is too directional, too weak or if there is an important backlight. The webcam feedback image is useful to see the quality of the input video feed.

The computing power of the GPU is also important. If it is powerful, many detections per second will be processed and the result will be smooth and accurate. On an old or low end mobile device it may be a bit slow. But it should work well on medium or high end mobile devices.


## Table of contents

* [Features](#features)
* [Architecture](#architecture)
* [Demonstrations](#demonstrations)
  * [Run locally](#run-locally)
  * [Using the ES6 module](#using-the-es6-module)
* [Hosting](#hosting)
* [About the tech](#about-the-tech)
  * [Under the hood](#under-the-hood)
  * [Compatibility](#compatibility)
  * [Future improvements](#future-improvements)
* [Documentation](#documentation)
* [Need more ?](#need-more)
* [License](#license)
* [See also](#see-also)
* [References](#references)


## Features

* face detection and tracking,
* recognize 11 facial expressions,
* face rotation along the 3 axis,
* robust for all lighting conditions,
* mobile friendly,
* example provided using SVG and THREE.js.

## Architecture

* `/assets/`: assets, both for 3D and 2D demonstrations (3D meshes, images),
* `/demos/`: the most interesting: the demos !,
* `/dist/`: heart of the library:
  * `jeelizFaceTransfer.js`: main minified script. It gets the webcam video feed, exploit the neural network to detect the face and the expressions and stabilize the result,
  * `jeelizFaceTransferNNC.json`: neural network model loaded by the main script,
* `/doc/`: some additionnal documentation,
* `/helpers/`: The outputs of the main script are very raw. It is convenient to use these helpers to animate a 3D model with the THREE.js helper or a SVG file with the SVG helper. All demos use these helpers,
* `/libs/`: some javascript libs,
* `/meshConverter/`: only for the THREE.js use. Tool to build the 3D model file including morphs from separate .OBJ files.


## Demonstrations

We have built a demo application based on this library, available on [webojis.com](http://webojis.com). We have add recording capabilities using [RecordRTC](https://recordrtc.org) JavaScript library to save separately video from the `<canvas>` and audio from the microphone. Then we send them to the server and we encode the video using [FFMPEG](https://www.ffmpeg.org).

All the following demos are included in this repository, in the `/demos` path. You can try them:

* THREE.JS based demos:

  * **Cute fox**: [source code](/demos/threejs/fox/), [live demo](https://jeeliz.com/demos/weboji/demos/threejs/fox/)
  * **Cute fox from a MP4 video**: [source code](/demos/threejs/externalVideo/), [live demo](https://jeeliz.com/demos/weboji/demos/threejs/externalVideo/)

* SVG based demos:

  * **Cool Cartman**: [source code](/demos/svg), [live demo](https://jeeliz.com/demos/weboji/demos/svg/)

* Third party demos:

  * **Piano Genie**: play the piano with your face expressions! This is pretty addictive ;). [live demo - ace-piano-genie.glitch.me](https://face-piano-genie.glitch.me/), [code and further details](https://glitch.com/edit/#!/piano-genie)

  * **Browse Hands Free**, by [Oz Ramos](https://twitter.com/LabOfOz): The demo improves web accessibility for disabled people. You can control the mouse cursor with your head (turn your head to move the cursor, smile to click). [live demo - browsehandsfree.com - click on the camera icon to start](https://browsehandsfree.com/), [further details](https://github.com/jeeliz/jeelizWeboji/issues/13#issuecomment-473500657)

  * **Vauta**, by [Nono](https://twitter.com/ke4563): You can anime a .VRM 3D character avatar in the browser. This web application is only in Japanese. [live demo - vauta.netlify.com](https://vauta.netlify.com/), [tweet and video](https://twitter.com/ke4563/status/1099673171777617922)

#### Run locally

1. Run docker-compose

```
docker-compose up
```

2. Open a browser and go to `localhost:8888`

If you have not bought a webcam yet, a screenshot video of the Cartman Demo is available here:

<p align="center">
<a href='https://www.youtube.com/watch?v=WxaL_kXwtRE'><img src='https://img.youtube.com/vi/WxaL_kXwtRE/0.jpg'></a>
</p>

You can subscribe to the [Jeeliz Youtube channel](https://www.youtube.com/channel/UC3XmXH1T3d1XFyOhrRiiUeA) or to the [@StartupJeeliz Twitter account](https://twitter.com/StartupJeeliz) to be kept informed of our cutting edge developments.

If you have made an application or a fun demonstration using this library, we would love to see it and insert a link here ! Just contact us on [Twitter @StartupJeeliz](https://twitter.com/StartupJeeliz) or [LinkedIn](https://www.linkedin.com/company/jeeliz).




#### Using the ES6 module
`/dist/jeelizFaceTransferES6.js` is exactly the same than `/dist/jeelizFaceTransfer.js` except that it works with ES6, so you can import it directly using:

```javascript
import 'dist/jeelizFaceTransferES6.js'
```

or using `require`:

```javascript
const faceTransfer =require('./lib/jeelizFaceTransferES6.js')
//...
```

The demos have not been ported to ES6 yet. You are welcome to submit a pull request :).



## Hosting

This library requires the user's webcam feed through `MediaStream API`. Your application should then be hosted with a HTTPS server (the certificate can be self-signed). It won't work at all with unsecure HTTP, even locally with some web browsers.

Be careful to enable gzip HTTP/HTTPS compression for JSON and JS files. Indeed, the neuron network JSON in, `/dist/` is quite heavy, but very well compressed with GZIP. You can check the gzip compression of your server [here](https://checkgzipcompression.com/).

The neuron network JSON file is loaded using an ajax `XMLHttpRequest` after the user has accepted to share its camera. We proceed this way to avoid to load this quite heavy file if the user refuses to share its webcam or if there is no webcam available. The loading will be faster if you systematically preload the JSON file using a service worker or a simple raw `XMLHttpRequest` just after the loading of the HTML page. Then the file will be in the browser cache and will be fast to request.




## About the tech
### Under the hood
The heart of the lib is `JEEFACETRANSFERAPI`. It is implemented by `/dist/jeelizFaceTransfer.js` script. It relies on Jeeliz WebGL Deep Learning technology to detect and track the user's face using a deep learning network, and to simultaneously evaluate the expression factors. The accuracy is adaptative: the best is the hardware, the more detections are processed per second. All is done client-side.

The documentation of `JEEFACETRANSFERAPI` is included in this repository as a PDF file, [/doc/jeefacetransferAPI.pdf](/doc/jeefacetransferAPI.pdf). In the main scripts of the demonstration, we never call these methods directly, but always through the helpers. Here is the indices of the morphs returned by this API:

* 0:  smileRight &rarr; closed mouth smile right
* 1:  smileLeft  &rarr; closed mouth smile left
* 2:  eyeBrowLeftDown &rarr; eyebrow left frowned
* 3:  eyeBrowRightDown &rarr; eyebrow right frowned
* 4:  eyeBrowLeftUp &rarr; eyebrow left up (surprised)
* 5:  eyeBrowRightUp &rarr; eyebrow right up (surprised)
* 6:  mouthOpen &rarr; mouth open
* 7:  mouthRound &rarr; mouth round
* 8:  eyeRightClose &rarr; close right eye
* 9:  eyeLeftClose  &rarr; close left eye
* 10: mouthNasty   &rarr; mouth nasty (upper lip raised)



### Compatibility
* If `WebGL2` is available, it uses `WebGL2` and no specific extension is required,
* If `WebGL2` is not available but `WebGL1`, we require either `OES_TEXTURE_FLOAT` extension or `OES_TEXTURE_HALF_FLOAT` extension,
* If `WebGL2` is not available, and if `WebGL1` is not available or neither `OES_TEXTURE_FLOAT` or `OES_HALF_TEXTURE_FLOAT` are implemented, the user is not compatible.

In all cases, you need to have WebRTC implemented in the web browser, otherwise this library will not be able to get the webcam video feed. The compatibility tables are on, [caniuse.com](https://caniuse.com/): [WebGL1](https://caniuse.com/#feat=webgl), [WebGL2](https://caniuse.com/#feat=webgl2), [WebRTC](https://caniuse.com/#feat=stream).

If a compatibility error is triggered, please post an issue on this repository. If this is a camera access error, please first retry after closing all applications which could use your device (Skype, Messenger, other browser tabs and windows, ...). Please include:
* a screenshot of [webglreport.com - WebGL1](http://webglreport.com/?v=1) (about your `WebGL1` implementation),
* a screenshot of [webglreport.com - WebGL2](http://webglreport.com/?v=2) (about your `WebGL2` implementation),
* the log from the web console,
* the steps to reproduce the bug, and screenshots.

This library works quite everywhere, and it works very well with a high end device like an Iphone X. But if your device is too cheap or too old, it will perform too few evaluations per second and the application will be slow.


### Future improvements
We are currently working hard on this project. New neural networks are training and we confident about improving this library. Here are our ways to improve:
* Better emotion detection with a better neural network (improving the structure, the face generator, ...),
* Better tracking stabilization,
* Add a calibration estimation to better take into account the variations of the coefficients between different faces.



## Documentation
 ### Documentation

 * `JEEFACETRANSFERAPI`: All the helpers rely on this API to get the facial morph coefficients. With this documentation you can interface this library with your own 3D or 2D engine. [Click here to read the PDF of the specs](/doc/jeefacetransferAPI.pdf),
 * [README.md about using the meshConverter](/meshConverter): Used in the THREE.JS Fox demo


 ### Articles and tutorials
 We list articles and tutorials about using this library:

 * [Create your own animoji for the web](https://jeeliz.com/blog/create-animojis-for-the-web/)
 * [Integrate the animoji on your website](https://jeeliz.com/blog/add-a-weboji-on-website/)



## Need more?
@Jeeliz we have fully developed this library so we can still improve it or fit it to your needs. In particular:

* adapt it to your own 3D/2D engine,
* train a new neural network model adapted for a specific case (take account of new expressions for example),
* use your specific mesh format,
* integrate it better to your workflow,
* manage the video/audio capture and encoding of the weboji.

If you are interested, please [contact-us here](https://jeeliz.com/contact-us/).



## License
[Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0.html). This application is free for both commercial and non-commercial use.

We appreciate attribution by including the [Jeeliz logo](https://jeeliz.com/wp-content/uploads/2018/01/LOGO_JEELIZ_BLUE.png) and a link to the [Jeeliz website](https://jeeliz.com) in your application or desktop website. Of course we do not expect a large link to Jeeliz over your face filter, but if you can put the link in the credits/about/help/footer section it would be great.


## See also
Jeeliz main face detection and tracking library is called [Jeeliz FaceFilter API](https://github.com/jeeliz/jeelizFaceFilter). It handles multi-face detection, and for each tracked face it provides the rotation angles and the mouth opening factor. It is perfect to build your own Snapchat/MSQRD like face filters running in the browser. It comes with dozen of integration demo, including a face swap.

If you want to detect if the user is looking at the screen or not, [Jeeliz Glance Tracker](https://github.com/jeeliz/jeelizGlanceTracker) is what you are looking for. It can be useful to play a video only if the user is watching it (and to pause it otherwise). This library needs fewer resources and the neural network file is much lighter.

If are interested by glasses virtual try-on (sunglasses, spectacles, ski masks), you can take a look at [Jeeliz VTO widget](https://github.com/jeeliz/jeelizGlassesVTOWidget). It includes a high quality and lightweight 3D engine which implements the following features: deferred shading, PBR, raytraced shadows, normal mapping, ... It also reconstructs the lighting environment around the user (ambient and directional lighting). But the glasses comes from a database hosted in our servers. If you want to add some models, please contact-us.


## References
* [Jeeliz official website](https://jeeliz.com)
* [Three.JS official website with documentation, demos, examples...](https://threejs.org/)
* [Webgl Academy: tutorials about WebGL and THREE.JS](http://www.webglacademy.com)

