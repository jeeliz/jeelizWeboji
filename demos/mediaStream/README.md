# WebRTC video chat app with ReactJS and Weboji


This demo has been developed from [webrtc-video-room](https://github.com/dondido/webrtc-video-room) by [Dian Dimitrov](https://github.com/dondido). It is released on Github under MIT software license.


## Demo notes

There is no hot loading. You need to run:

```bash
npm run dev
```

to recompile the app each time you do a change. You don't need to restart `npm starŧ`, but you need to reload the web page. You are welcome to submit a PR to add the feature :).

I have changed the `RoomPage.js` component, and more especially the `getUserMedia Promise`. Instead of directly returning the camera video `MediaStreamTrack`, I chain another promise to:

* Init `WEBOJI`, create the THREE.js canvas,
* Get the `videoStreamTrack` from the Weboji canvas,
* Get the `audioStreamTrack` from the original video,
* Create a new `MediastreamTrack` using original video and canvas as video.

Modifications in the source code are commented. Comments begin by `JEELIZ:`.

This demo relies on `canvas.captureStream` to extract the video stream from the canvas. Please check the compatibility here: [caniuse.com/mediacapture-fromelement](https://caniuse.com/mediacapture-fromelement).


## Original documentation

### Synopsis

WebRTC audio/video conferencing app with user authentication using ReactJS.

### Motivation

Simple ReactJS app that interacts with the WebRTC APIs to establish audio/video conference between 2 users, without a trip through a server.

### Application Logic and Implementations

To connect two users over WebRTC, we exchange information to allow browsers to talk to each other. This process is called signaling and it is facilitated by using NodeJS and socket server chained to the express 4.0 engine to provide the plumbing. Other than signaling, no data has to be sent through a server. When a connection is successfully established and authentication and authorization are complete, stream data exchanged between peers is directed to a React component for rendering.

### Installation

Once you have forked this project, go ahead and use npm through the command line to install all required dependecies:

```bash
npm i
npm start
```

The app can be accessed at:

```bash
https://localhost:3000
```

