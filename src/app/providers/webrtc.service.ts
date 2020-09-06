import { Injectable } from '@angular/core';
import Peer from 'peerjs';
import { HttpClient } from '@angular/common/http';
import { promise } from 'protractor';
import { Room } from '../modelos/room'

const constraints: MediaStreamConstraints = {video: true, audio: false};
let peerConnection = null;
let localStream = null;
let remoteStream = null;





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
  dataWebRTC: Room;
  url = 'https://attend-1.herokuapp.com/';
  stunServer: RTCIceServer = {
    urls: '',
    username: '',
    credential: ''
  };
  peerConnection = null;
  pc: RTCPeerConnection;
  options: { // not used, by default it'll use peerjs server
    key: string; debug: number;
  };
  configuration = null;

  constructor(public http: HttpClient) {
    
  }

  getMedia() {
    const constraints = {
      video: true,
      audio: true
    };
    //return navigator.mediaDevices.getUserMedia(constraints);
    navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
      localStream = stream;
    })
    .catch(error => {
      this.handleError(error);
      console.error('Error accessing media devices.', error);
    });
  }


  async init(usuario: string, myEl: HTMLMediaElement, partnerEl: HTMLMediaElement) {
    this.myEl = myEl;
    localStream = myEl;
    this.partnerEl = partnerEl;
    remoteStream = partnerEl;
    this.postIceServer(usuario);
    try {
      this.getMedia();
    } catch (e) {
      this.handleError(e);
    }
  }


  getIceServer(user){
    return new Promise <RTCIceServer>(resolve => {
      this.http.get(this.url + 'get_ice_candidate/' + user).subscribe(data  => {
        this.configuration = data;
      }, error => {
        console.log(error);
      });
    });
  }

  postIceServer(user){
    const dataToSend = {
      usuario: user
    };
    return new Promise <RTCIceServer>(resolve => {
      this.http.post(this.url + 'post_ice_servers', dataToSend).subscribe(data  => {
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
      this.http.post(this.url + 'rooms', data).subscribe(data  => {
        console.log('data :');
        console.log(data);
      }, error => {
        console.log(error);
      });
    });
  }
  postRoom(user, tipo, sdpin, uCarller){
    const postData = {
      usuario: user,
      type: tipo,
      sdp: sdpin,
      caller: uCarller
    };
    return new Promise <RTCIceServer>(resolve => {
      this.http.post(this.url + 'rooms', postData).subscribe((data: Room)  => {
        this.dataWebRTC.id = data.id;
        this.dataWebRTC.store = data.store;
        this.dataWebRTC.type = data.type;
        this.dataWebRTC.sdp = data.sdp;
        this.dataWebRTC.caller = data.caller;
        console.log('datos traidos del servidor');
        console.log(this.dataWebRTC);
      }, error => {
        console.log(error);
      });
    });
  }

  getRoom(user){
    return new Promise (resolve => {
      this.http.get(this.url + 'room/' + user).subscribe((data: Room)  => {

        this.dataWebRTC.id = data.id;
        this.dataWebRTC.store = data.store;
        this.dataWebRTC.type = data.type;
        this.dataWebRTC.sdp = data.sdp;
        this.dataWebRTC.caller = data.caller;
        console.log('datos traidos del servidor');
        console.log(this.dataWebRTC);
        resolve(data);
      }, error => {
        console.log(error);
      });
    });
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

  async createRoom(caller, store) {
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
    const roomRef = this.postRoom(caller, offer.type, offer.sdp, store);
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
    let i = 0;
    // Listening for remote session description below
    this.call = setInterval(async () => {
      i = i+1;
      console.log("intento: "+ i);
      const  Valor = await this.getRoom(caller);
      if (roomWithOffer.offer.type !== this.dataWebRTC.type) {
        const answerRoom = {
          offer: {
            type: this.dataWebRTC.type,
            sdp: this.dataWebRTC.sdp
          }
        };
        const answer = new RTCSessionDescription(answerRoom.offer as RTCSessionDescriptionInit);
        await peerConnection.setRemoteDescription(answer);
        const usuario = 'llamador';
        console.log("estableciendo llamada");
        await this.collectIceCandidates(caller, usuario);
        clearInterval(this.call);
      }
    }, 4000);

    setTimeout( () => {
      clearInterval(this.call);
    }
      , 60000);

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

  async joinRoomByUser(user, to) {
    const  Valor = await this.getRoom(user);
    const offer = {
      type: this.dataWebRTC.type,
      sdp: this.dataWebRTC.sdp
    };
    console.log('offer: ');
    console.log(offer);

    if (this.dataWebRTC.id !== null) {
      console.log('Create PeerConnection with configuration: ', this.configuration);
      peerConnection = new RTCPeerConnection(this.configuration);
      this.registerPeerConnectionListeners();
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
  
      // Code for collecting ICE candidates below
      // this.collectIceCandidates(roomRef, this.peerConnection, this.localName, remoteName)
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

    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    const roomWithAnswer = {
      answer: {
        type: answer.type,
        sdp: answer.sdp
      }
    };
    await this.postRoom(user, answer.type, answer.sdp, to);

    
  }

  async hangUp(user) {
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
      });
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
    }

    if (peerConnection) {
      peerConnection.close();
    }

    // Delete room on hangup
    if (user !== null) {
      this.deleteRoom(user);
    }

  }


  async collectIceCandidates(localUser, remoteUser) {

    peerConnection.addEventListener('icecandidate', event => {
      console.log('imprime evento: ');
      console.log(event);
      if (event.candidate) {
        const json = event.candidate.toJSON();
        json.usuario = localUser;
        console.log('peer conections informacion: ');
        console.log(json);
      }
    });



    // let i = 0;
    // // Listening for remote session description below
    // this.call = setInterval(async () => {
    //   i = i + 1;
    //   console.log('intento: ' + i);
    //   const  Valor = await this.getRoom(user);
    //   if (roomWithOffer.offer.type !== this.dataWebRTC.type) {
    //     const answerRoom = {
    //       offer: {
    //           type: this.dataWebRTC.type,
    //           sdp: this.dataWebRTC.sdp
    //       }
    //   };
    //     const answer = new RTCSessionDescription(answerRoom.offer as RTCSessionDescriptionInit);
    //     await peerConnection.setRemoteDescription(answer);
    //     clearInterval(this.call);
    //   }
    // }, 4000);

    // setTimeout( () => {
    //   clearInterval(this.call);
    // }
    //   , 60000);

    // roomRef.collection(remoteName).onSnapshot(snapshot => {
    //   snapshot.docChanges().forEach(change => {
    //     if (change.type === "added") {
    //       const candidate = new RTCIceCandidate(change.doc.data());
    //       peerConneciton.addIceCandidate(candidate);
    //     }
    //   });
    // });
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
