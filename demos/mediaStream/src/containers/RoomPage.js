import React, { Component } from 'react';
import MediaContainer from './MediaContainer'
import CommunicationContainer from './CommunicationContainer'
import { connect } from 'react-redux'
import store from '../store'
import io from 'socket.io-client'

import webojiThreeHelper from '../contrib/jeelizWeboji/JeelizWebojiThreeHelper.module.js'
import NN from '../contrib/jeelizWeboji/jeelizFaceExpressionsNNC.json'


class RoomPage extends Component {
  constructor(props) {
    super(props);

    // JEELIZ: this.getUserMedia was before just used to get the user camera video stream
    // We now use it to also initialize WEBOJI and construct a new video stream
    // using user audio and the video from the canvas
    
    // compute the canvas resolution:
    let cvResolution = Math.min(window.innerWidth, window.innerHeight);
    cvResolution *= (window.devicePixelRatio || 1);

    // create the new canvas:          
    const cv = document.createElement('canvas');
    cv.width = cv.height = cvResolution

    this.getUserMedia = new Promise((accept, reject) => {
      const cvCompute = document.createElement('canvas');

      // init Jeeliz weboji throught the THREE helper:
      webojiThreeHelper.init({
        canvasThree: cv,
        canvas: cvCompute,
        videoSettings: {
          isAudio: true
        },

        assetsParentPath: '../../assets/3D/',
        NN: NN,

        // RACCOON:
        meshURL: 'meshes/fox11_v0.json',
        matParameters: {
          diffuseMapURL: 'textures/Fox_albedo.png',
          specularMapURL: 'textures/Fox_specular.png',
          flexMapURL: 'textures/Fox_flex.png'
        },

        successCallback: (videoElement) => {
          // for debug: append user camera video in the DOM:
          //document.body.appendChild(videoElement);
          
          // append the feedback video canvas to the DOM:
          
          document.body.appendChild(cvCompute);
          cvCompute.style.position = 'fixed';
          cvCompute.style.top = '0';
          cvCompute.style.right = '0';
          cvCompute.style.maxWidth = '33vmin';
          cvCompute.style.borderRadius = '0px 0px 0px 20px';

          // extract mediaStream:
          const originalUserMedia = videoElement.srcObject;

          // extract audio track:
          const audioTrack = originalUserMedia.getAudioTracks()[0];

          // get video from canvas:
          const canvasVideoStream = cv.captureStream(30);
          const canvasVideoTrack = canvasVideoStream.getVideoTracks()[0];

          // composite the new mediastream:
          // see https://stackoverflow.com/questions/39992048/how-can-we-mix-canvas-stream-with-audio-stream-using-mediarecorder
          const stream = new MediaStream([canvasVideoTrack, audioTrack]);
          accept(stream);
        },
        errorCallback: (err) => {
          alert('CANNOT INIT WEBOJI: ' + err);
          reject(err);
        },

        position: [0, -60, 0],
        scale: 1.1
      })
    })

    this.socket = io.connect();
  }
  componentDidMount() {
    this.props.addRoom();
  }
  render(){
    return (
      <div>
        <MediaContainer media={media => this.media = media} socket={this.socket} getUserMedia={this.getUserMedia} />
        <CommunicationContainer socket={this.socket} media={this.media} getUserMedia={this.getUserMedia} />
      </div>
    );
  }
}
const mapStateToProps = store => ({rooms: new Set([...store.rooms])});
const mapDispatchToProps = (dispatch, ownProps) => (
    {
      addRoom: () => store.dispatch({ type: 'ADD_ROOM', room: ownProps.match.params.room })
    }
  );
export default connect(mapStateToProps, mapDispatchToProps)(RoomPage);
