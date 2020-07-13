import { Component, OnInit, ElementRef } from '@angular/core';
import { WebrtcService } from '../providers/webrtc.service';
import { Diagnostic } from '@ionic-native/diagnostic/ngx';
import { Platform } from '@ionic/angular'


@Component({
  selector: 'app-videocall',
  templateUrl: './videocall.page.html',
  styleUrls: ['./videocall.page.scss'],
})
export class VideocallPage implements OnInit {

  topVideoFrame = 'partner-video';
  userId: string;
  partnerId: string;
  myEl: HTMLMediaElement;
  partnerEl: HTMLMediaElement;
  permitCamera: boolean;
  permitAudio: boolean;
  isAndroid : boolean;
  listPermisions =[
    this.diagnostic.permission.CAMERA,
    this.diagnostic.permission.RECORD_AUDIO
  ];
  

  constructor(
    public webRTC: WebrtcService,
    private diagnostic: Diagnostic,
    public elRef: ElementRef,
    private platform: Platform
    
  ) { }

  ngOnInit(): void {
    this.myEl = this.elRef.nativeElement.querySelector('#my-video');
    this.partnerEl = this.elRef.nativeElement.querySelector('#partner-video');
    this.isAndroid = this.platform.is("android");
    if(this.isAndroid){
      this.checkPermissions();
    }
  }
  
  login() {

    if ((this.permitCamera && this.permitAudio) || !this.isAndroid) {
      this.webRTC.init(this.userId, this.myEl, this.partnerEl);
    } else {
      this.askPermissions();
    }
  }

  // call() {
  //   this.webRTC.call(this.partnerId);
  //   this.swapVideo('my-video');
  // }

  swapVideo(topVideo: string) {
    this.topVideoFrame = topVideo;
  }

  askPermissions() {

    this.diagnostic.requestRuntimePermissions(this.listPermisions).then(
      statuses =>{
        if (statuses["CAMERA"] === this.diagnostic.permissionStatus.GRANTED) {
          console.log("Se autorizó la camara");
          this.permitCamera = true;
        }
        if (statuses["RECORD_AUDIO"] === this.diagnostic.permissionStatus.GRANTED) {
          console.log("Se autorizó la camara");
          this.permitAudio = true;
        }
      },
      error =>{
        console.error(error);
      }
    );
        
  }

  checkPermissions() {
    this.diagnostic.getPermissionsAuthorizationStatus(this.listPermisions).then(
      statuses =>{
        if (statuses["CAMERA"] === this.diagnostic.permissionStatus.GRANTED) {
          console.log("la camara está autorizada");
          this.permitCamera = true;
        }
        if (statuses["RECORD_AUDIO"] === this.diagnostic.permissionStatus.GRANTED) {
          console.log("el audio está autorizado");
          this.permitAudio = true;
        }
        
      },
      error =>{
        console.error(error);
      }
    );
  }

}
