import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { VideocallPageRoutingModule } from './videocall-routing.module';

import { VideocallPage } from './videocall.page';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HttpClientModule,
    VideocallPageRoutingModule
  ],
  declarations: [VideocallPage]
})
export class VideocallPageModule {}
