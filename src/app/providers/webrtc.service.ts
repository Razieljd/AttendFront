import { Injectable } from '@angular/core';
import Peer from 'peerjs';
import { HttpClient } from '@angular/common/http';
import { promise } from 'protractor';

const constraints: MediaStreamConstraints = {video: true, audio: false};
let peerConnection = null;
let localStream = null;
let remoteStream = null;
let roomId = null;




@Injectable({
  providedIn: 'root'
})
export class WebrtcService {
  call: any;
  peer: Peer;
  myStream: MediaStream;
  myEl: HTMLMediaElement;
  partnerEl: HTMLMediaElement;
  streamTotal: any;
  stun: string;
  dataWebRTC = {
    id: '',
    usuario: '',
    type: '',
    sdp: ''
  };
  url = 'https://attend-1.herokuapp.com/';
  stunServer: RTCIceServer = {
    urls: '',
    username: '',
    credential: ''
  };
  peerConnection = null;
  localStream = null;
  remoteStream = null;

  pc: RTCPeerConnection;
  options: { // not used, by default it'll use peerjs server
    key: string; debug: number;
  };
  configuration = null;

  constructor(public http: HttpClient) {
    this.getIceServer();
    this.options = {  // not used, by default it'll use peerjs server
      key: 'cd1ft79ro8g833di',
      debug: 3
    };
  }

  getMedia() {
    const constraints = {
      video: true,
      audio: true
    };
    navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
      console.log('Got MediaStream:', stream);
      this.localStream = stream;
      this.handleSuccess(stream);
    })
    .catch(error => {
      this.handleError(error);
      console.error('Error accessing media devices.', error);
    });
  }


  async init(userId: string, myEl: HTMLMediaElement, partnerEl: HTMLMediaElement) {
    this.myEl = myEl;
    console.log('local stream: ');
    console.log(myEl);
    this.partnerEl = partnerEl;
    console.log(partnerEl);
    console.log('this.stun:' + this.stun);
    console.log(this.stunServer);
    this.remoteStream = partnerEl;
    try {
      this.getMedia();
    } catch (e) {
      this.handleError(e);
    }
  }


  getIceServer(){
    return new Promise <RTCIceServer>(resolve => {
      this.http.get(this.url + 'get_ice_servers').subscribe(data  => {
        this.stunServer.urls = data[1].urls;
        this.stunServer.username = data[1].username;
        this.stunServer.credential = data[1].credential;
        console.log(this.stunServer);
        this.configuration = data;
      }, error => {
        console.log(error);
      });
    });
  }

  deleteRoom(usuario) {
    const data = {
      user: usuario
    };
    return new Promise <RTCIceServer>(resolve => {
      this.http.post(this.url + 'room', data).subscribe(data  => {
        console.log('data :');
        console.log(data);
      }, error => {
        console.log(error);
      });
    });
  }
  postRoom(user, tipo, sdpin){
    const postData = {
      usuario: user,
      type: tipo,
      sdp: sdpin
    };
    return new Promise <RTCIceServer>(resolve => {
      this.http.post(this.url + 'room', postData).subscribe(data  => {
        console.log('data :');
        console.log(data);
        this.dataWebRTC.id = data[1].id;
        this.dataWebRTC.usuario = data[1].usuario;
        this.dataWebRTC.type = data[1].type;
        this.dataWebRTC.sdp = data[1].sdp;
        console.log('datos traidos del servidor');
        console.log(this.dataWebRTC);
      }, error => {
        console.log(error);
      });
    });
  }

  getRoom(user){
      return new Promise <RTCIceServer>(resolve => {
        this.http.get(this.url + 'room', user).subscribe(data  => {
        console.log('data :');
        console.log(data);
        this.dataWebRTC.id = data[1].id;
        this.dataWebRTC.usuario = data[1].usuario;
        this.dataWebRTC.type = data[1].type;
        this.dataWebRTC.sdp = data[1].sdp;
        console.log('datos traidos del servidor');
        console.log(this.dataWebRTC);
      }, error => {
        console.log(error);
      });
    });
  }


  handleSuccess(stream: MediaStream) {
    this.myStream = stream;
    this.myEl.srcObject = stream;
    this.streamTotal = stream;
    console.log(stream);
  }

  handleError(error: any) {
    if (error.name === 'ConstraintNotSatisfiedError') {
      const v = constraints.video;
     // this.errorMsg(`The resolution ${v.width.exact}x${v.height.exact} px is not supported by your device.`);
      this.errorMsg(`The resolution px is not supported by your device.`);
    } else if (error.name === 'PermissionDeniedError') {
      this.errorMsg('Permissions have not been granted to use your camera and ' +
        'microphone, you need to allow the page access to your devices in ' +
        'order for the demo to work.');
    }
    this.errorMsg(`getUserMedia error: ${error.name}`, error);
  }

  errorMsg(msg: string, error?: any) {
    const errorElement = document.querySelector('#errorMsg');
    errorElement.innerHTML += `<p>${msg}</p>`;
    if (typeof error !== 'undefined') {
      console.error(error);
    }
  }

  async createRoom(user) {
    console.log('Create PeerConnection with configuration: ', this.configuration);
    peerConnection = new RTCPeerConnection(this.configuration);

    this.registerPeerConnectionListeners();

    // Add code for creating a room here

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    const roomWithOffer = {
        offer: {
            type: offer.type,
            sdp: offer.sdp
        }
    };
    const roomRef = this.postRoom(user, offer.type, offer.sdp);
    const roomId = this.dataWebRTC.id;
    // document.querySelector('#currentRoom').innerText = `Current room is ${roomId} - You are the caller!`;

    // Code for creating room above
    // tslint:disable-next-line: prefer-for-of

    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });


    // Code for collecting ICE candidates below


    // Code for collecting ICE candidates above

    peerConnection.addEventListener('track', event => {
      console.log('Got remote track:', event.streams[0]);
      event.streams[0].getTracks().forEach(track => {
        console.log('Add a track to the remoteStream:', track);
        remoteStream.addTrack(track);
      });
    });

    // Listening for remote session description below
    // this.call = setInterval(() => {
    //   this.getRoom(user);
    //   if (roomWithOffer.offer.sdp !== this.dataWebRTC.sdp || roomWithOffer.offer.type !== this.dataWebRTC.type) {

    //   }
    // }, 4000);

    // roomRef.onSnapshot(async snapshot => {
    //   console.log('Got updated room:', snapshot.data());
    //   const data = snapshot.data();
    //   if (!peerConnection.currentRemoteDescription && data.answer) {
    //       console.log('Set remote description: ', data.answer);
    //       const answer = new RTCSessionDescription(data.answer)
    //       await peerConnection.setRemoteDescription(answer);
    //   }
    // });

    // Listening for remote session description above

    // Listen for remote ICE candidates below
  
    // Listen for remote ICE candidates above
  }

  async joinRoomByUser(user) {
    const room = this.getRoom(user);
    const offer = {
      type: this.dataWebRTC.type,
      sdp: this.dataWebRTC.sdp
    };
    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    const roomWithAnswer = {
      answer: {
        type: answer.type,
        sdp: answer.sdp
      }
    };
    await this.postRoom(user, answer.type, answer.sdp);

    if (this.dataWebRTC.id !== null) {
      console.log('Create PeerConnection with configuration: ', this.configuration);
      peerConnection = new RTCPeerConnection(this.configuration);
      this.registerPeerConnectionListeners();
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
  
      // Code for collecting ICE candidates below
      this.collectIceCandidates(roomRef, this.peerConnection, this.localName, remoteName)
      // Code for collecting ICE candidates above
  
      peerConnection.addEventListener('track', event => {
        console.log('Got remote track:', event.streams[0]);
        event.streams[0].getTracks().forEach(track => {
          console.log('Add a track to the remoteStream:', track);
          remoteStream.addTrack(track);
        });
      });
  
      // Code for creating SDP answer below
  
      // Code for creating SDP answer above
  
      // Listening for remote ICE candidates below
  
      // Listening for remote ICE candidates above
    }
  }

  async hangUp(tracks, user) {
    tracks.forEach(track => {
      track.stop();
    });

    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
    }

    if (peerConnection) {
      peerConnection.close();
    }

    // Delete room on hangup
    if (user !== null) {

      const roomRef = db.collection('rooms').doc(roomId);
      const calleeCandidates = await roomRef.collection('calleeCandidates').get();
      calleeCandidates.forEach(async candidate => {
        await candidate.delete();
      });
      const callerCandidates = await roomRef.collection('callerCandidates').get();
      callerCandidates.forEach(async candidate => {
        await candidate.delete();
      });
      await roomRef.delete();
    }

  }


  async collectIceCandidates(roomRef, peerConneciton, localName, remoteName) {
    const candidatesCollection = roomRef.collection(localName);

    peerConnection.addEventListener('icecandidate', event => {
      if (event.candidate) {
        const json = event.candidate.toJSON();
        candidatesCollection.add(json);
      }
    });

    roomRef.collection(remoteName).onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());
          peerConneciton.addIceCandidate(candidate);
        }
      });
    });
  }

  registerPeerConnectionListeners() {
    peerConnection.addEventListener('icegatheringstatechange', () => {
      console.log(
          `ICE gathering state changed: ${peerConnection.iceGatheringState}`);
    });

    peerConnection.addEventListener('connectionstatechange', () => {
      console.log(`Connection state change: ${peerConnection.connectionState}`);
    });

    peerConnection.addEventListener('signalingstatechange', () => {
      console.log(`Signaling state change: ${peerConnection.signalingState}`);
    });

    peerConnection.addEventListener('iceconnectionstatechange ', () => {
      console.log(
          `ICE connection state change: ${peerConnection.iceConnectionState}`);
    });
  }

}
