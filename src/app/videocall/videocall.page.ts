import { Component, OnInit, ElementRef } from '@angular/core';
import { WebrtcService } from '../providers/webrtc.service';
import { Diagnostic } from '@ionic-native/diagnostic/ngx';
import { Platform } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { Room } from '../modelos/room';
import { IceConfiguration } from '../modelos/ice-configuration';

const constraints: MediaStreamConstraints = {video: true, audio: false};
let peerConnection = null;
let localStream = null;
let remoteStream = null;

@Component({
  selector: 'app-videocall',
  templateUrl: './videocall.page.html',
  styleUrls: ['./videocall.page.scss'],
})
export class VideocallPage implements OnInit {

  myEl: HTMLMediaElement;
  partnerEl: HTMLMediaElement;
  permitCamera: boolean;
  permitAudio: boolean;
  isAndroid: boolean;
  localUser: string;
  roomId = '';
  listPermisions = [
    this.diagnostic.permission.CAMERA,
    this.diagnostic.permission.RECORD_AUDIO
  ];
  call: any;
  myStream: MediaStream;
  dataWebRTC: Room = {
    id: 0,
    store: '',
    type: '',
    sdp: '',
    caller: ''
  };
  url = 'https://attend-1.herokuapp.com/';
  stunServer: RTCIceServer = {
    urls: '',
    username: '',
    credential: ''
  };
  configuration = null;
  configurationRemote = null;


  constructor(
    public webRTC: WebrtcService,
    private diagnostic: Diagnostic,
    public elRef: ElementRef,
    private platform: Platform,
    public http: HttpClient
  ) { }

  ngOnInit(): void {
    this.myEl = this.elRef.nativeElement.querySelector('#my-video');
    this.partnerEl = this.elRef.nativeElement.querySelector('#partner-video');
    this.isAndroid = this.platform.is("android");
    this.init();
    if (this.isAndroid){
      this.checkPermissions();
    }
  }

  askPermissions() {

    this.diagnostic.requestRuntimePermissions(this.listPermisions).then(
      statuses => {
        if (statuses["CAMERA"] === this.diagnostic.permissionStatus.GRANTED) {
          console.log("Se autorizó la camara");
          this.permitCamera = true;
        }
        if (statuses["RECORD_AUDIO"] === this.diagnostic.permissionStatus.GRANTED) {
          console.log("Se autorizó la camara");
          this.permitAudio = true;
        }
      },
      error => {
        console.error(error);
      }
    );

  }

  checkPermissions() {
    this.diagnostic.getPermissionsAuthorizationStatus(this.listPermisions).then(
      statuses => {
        if (statuses["CAMERA"] === this.diagnostic.permissionStatus.GRANTED) {
          console.log("la camara está autorizada");
          this.permitCamera = true;
        }
        if (statuses["RECORD_AUDIO"] === this.diagnostic.permissionStatus.GRANTED) {
          console.log("el audio está autorizado");
          this.permitAudio = true;
        }

      },
      error => {
        console.error(error);
      }
    );
  }


  getMedia() {
    const constraints = {
      video: true,
      audio: false
    };
    //return navigator.mediaDevices.getUserMedia(constraints);
    navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
      localStream = stream;
      this.myEl.srcObject = stream;
    })
    .catch(error => {
      this.handleError(error);
      console.error('Error accessing media devices.', error);
    });
  }


  async init() {
    remoteStream = new MediaStream();

    this.partnerEl.srcObject = remoteStream;
    // this.postIceServer(usuario);
    try {
      this.getMedia();
      return true;
    } catch (e) {
      return false;
      this.handleError(e);
    }
  }


  getIceServer(user){
    return new Promise <RTCIceServer>(resolve => {
      this.http.get(this.url + 'get_ice_candidate/' + user).subscribe((data: IceConfiguration)  => {
        this.configuration = data;
        this.configuration.ice_servers = JSON.parse(data.ice_servers);
        resolve();
      }, error => {
        console.log(error);
      });
    });
  }

  postIceServer(user){
    const dataToSend = {
      store: user
    };
    return new Promise <RTCIceServer>(resolve => {
      this.http.post(this.url + 'post_ice_servers', dataToSend).subscribe((data: IceConfiguration)  => {
        console.log('configuration iceSErver: ');
        console.log(data);
        this.configuration = data;
        this.configuration.ice_servers = JSON.parse(data.ice_servers);
        
        resolve();
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
        resolve();
      }, error => {
        console.log(error);
      });
    });
  }
  postRoom(storeUser, tipo, sdpin, usuario){
    const postData = {
      store: storeUser,
      type: tipo,
      sdp: sdpin,
      caller: usuario
    };
    return new Promise <RTCIceServer>(resolve => {
      this.http.post(this.url + 'rooms', postData).subscribe((data: Room)  => {
        console.log(data);
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
    // await this.init();
    await this.postIceServer(store);
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
    const roomRef = this.postRoom(store, offer.type, offer.sdp, caller);
    const roomId = this.dataWebRTC.id;
    // document.querySelector('#currentRoom').innerText = `Current room is ${roomId} - You are the caller!`;

    // Code for creating room above
    // tslint:disable-next-line: prefer-for-of
    localStream.getTracks().forEach(track => {
      console.log("track: " + track);
      peerConnection.addTrack(track, localStream);
    });


    // Code for collecting ICE candidates below

    // this.collectIceCandidates(caller, store);

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
      i = i + 1;
      console.log('intento: ' + i);
      const  Valor = await this.getRoom(store);
      if (roomWithOffer.offer.type !== this.dataWebRTC.type) {
        const answerRoom = {
          offer: {
            type: this.dataWebRTC.type,
            sdp: this.dataWebRTC.sdp
          }
        };
        const answer = new RTCSessionDescription(answerRoom.offer as RTCSessionDescriptionInit);
        await peerConnection.setRemoteDescription(answer);
        console.log("estableciendo llamada");
        this.collectIceCandidates(caller, store);
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

  async joinRoomByUser(store) {
    // await this.init();
    await this.getIceServer(store);
    const  Valor = await this.getRoom(store);
    console.log('this.dataWebRTC: ');
    console.log(this.dataWebRTC);
    const offer = {
      type: this.dataWebRTC.type,
      sdp: this.dataWebRTC.sdp
    };
    console.log('offer: ');
    console.log(offer);

    if (this.dataWebRTC.id !== 0) {
      console.log('Create PeerConnection with configuration: ', this.configuration);
      peerConnection = new RTCPeerConnection(this.configuration);
      this.registerPeerConnectionListeners();
      localStream.getTracks().forEach(track => {
        console.log("track: " + track);
        peerConnection.addTrack(track, localStream);
      });
  
      // Code for collecting ICE candidates below
      // this.collectIceCandidates(store, this.dataWebRTC.caller);
      // Code for collecting ICE candidates above
  
      peerConnection.addEventListener('track', event => {
        console.log('Got remote track:', event.streams[0]);
        event.streams[0].getTracks().forEach(track => {
          console.log('Add a track to the remoteStream:', track);
          remoteStream.addTrack(track);
        });
      });
  
      // Code for creating SDP answer below
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
  
      const roomWithAnswer = {
        answer: {
          type: answer.type,
          sdp: answer.sdp
        }
      };
      await this.postRoom(store, answer.type, answer.sdp, this.dataWebRTC.caller);
      // Code for creating SDP answer above
  
      // Listening for remote ICE candidates below
      this.collectIceCandidates(store, this.dataWebRTC.caller);
      // Listening for remote ICE candidates above
    }

    
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

    // this.getIceServer(remoteUser);
    // const candidate = new RTCIceCandidate(this.configurationRemote);
    // peerConnection.addIceCandidate(candidate);


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
