import React, { Component } from 'react';
import { PropTypes } from 'prop-types';

class MediaBridge extends Component {
  constructor(props) {
    super(props);
    this.state = {
      bridge: '',
      user: ''
    }
    this.onRemoteHangup = this.onRemoteHangup.bind(this);
    this.onMessage = this.onMessage.bind(this);
    this.sendData = this.sendData.bind(this);
    this.setupDataHandlers = this.setupDataHandlers.bind(this);
    this.setDescription = this.setDescription.bind(this);
    this.sendDescription = this.sendDescription.bind(this);
    this.hangup = this.hangup.bind(this);
    this.init = this.init.bind(this);
    this.setDescription = this.setDescription.bind(this);
  }
  componentDidMount() {
    this.props.media(this);
    this.props.getUserMedia
      .then(stream => this.localVideo.srcObject = this.localStream = stream);
    this.props.socket.on('message', this.onMessage);
    this.props.socket.on('hangup', this.onRemoteHangup);
  }
  componentWillUnmount() {
    this.props.media(null);
    if (this.localStream !== undefined) {
      this.localStream.getVideoTracks()[0].stop();
    }
    this.props.socket.emit('leave');
  }
  onRemoteHangup() {
    this.setState({user: 'host', bridge: 'host-hangup'});
  }
  onMessage(message) {
      if (message.type === 'offer') {
            // set remote description and answer
            this.pc.setRemoteDescription(new RTCSessionDescription(message))
                .then(() => this.pc.createAnswer())
                .then(this.setDescription)
                .then(this.sendDescription)
                .catch(this.handleError); // An error occurred, so handle the failure to connect

      } else if (message.type === 'answer') {
          // set remote description
          this.pc.setRemoteDescription(new RTCSessionDescription(message));
      } else if (message.type === 'candidate') {
            // add ice candidate
            this.pc.addIceCandidate(message.candidate);
      }
  }
  sendData(msg) {
    this.dc.send(JSON.stringify(msg))
  }
  // Set up the data channel message handler
  setupDataHandlers() {
      this.dc.onmessage = e => {
          var msg = JSON.parse(e.data);
          console.log('received message over data channel:' + msg);
      };
      this.dc.onclose = () => {
        this.remoteStream.getVideoTracks()[0].stop();
        console.log('The Data Channel is Closed');
      };
  }
  setDescription(offer) {
    return this.pc.setLocalDescription(offer);
  }
  // send the offer to a server to be forwarded to the other peer
  sendDescription() {
    this.props.socket.send(this.pc.localDescription);
  }
  hangup() {
    this.setState({user: 'guest', bridge: 'guest-hangup'});
    this.pc.close();
    this.props.socket.emit('leave');
  }
  handleError(e) {
    console.log(e);
  }
  init() {
    // wait for local media to be ready
    const attachMediaIfReady = () => {
      this.dc = this.pc.createDataChannel('chat');
      this.setupDataHandlers();
      console.log('attachMediaIfReady')
      this.pc.createOffer()
        .then(this.setDescription)
        .then(this.sendDescription)
        .catch(this.handleError); // An error occurred, so handle the failure to connect
    }
    // set up the peer connection
    // this is one of Google's public STUN servers
    // make sure your offer/answer role does not change. If user A does a SLD
    // with type=offer initially, it must do that during  the whole session
    this.pc = new RTCPeerConnection({iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]});
    // when our browser gets a candidate, send it to the peer
    this.pc.onicecandidate = e => {
        console.log(e, 'onicecandidate');
        if (e.candidate) {
            this.props.socket.send({
                type: 'candidate',
                candidate: e.candidate,
            });
        }
    };
    // when the other side added a media stream, show it on screen
    this.pc.onaddstream = e => {
        console.log('onaddstream', e) 
        this.remoteStream = e.stream;
        this.remoteVideo.srcObject = this.remoteStream = e.stream;
        this.setState({bridge: 'established'});
    };
    this.pc.ondatachannel = e => {
        // data channel
        this.dc = e.channel;
        this.setupDataHandlers();
        this.sendData({
          peerMediaStream: {
            video: this.localStream.getVideoTracks()[0].enabled
          }
        });
        //sendData('hello');
    };
    // attach local media to the peer connection
    this.localStream.getTracks().forEach(track => this.pc.addTrack(track, this.localStream));
    // call if we were the last to connect (to increase
    // chances that everything is set up properly at both ends)
    if (this.state.user === 'host') {
      this.props.getUserMedia.then(attachMediaIfReady);
    }  
  }
  render(){
    return (
      <div className={`media-bridge ${this.state.bridge}`}>
        <video className="remote-video" ref={(ref) => this.remoteVideo = ref} autoPlay></video>
        <video className="local-video" ref={(ref) => this.localVideo = ref} autoPlay muted></video>
      </div>
    );
  }
}
MediaBridge.propTypes = {
  socket: PropTypes.object.isRequired,
  getUserMedia: PropTypes.object.isRequired,
  media: PropTypes.func.isRequired
}
export default MediaBridge;