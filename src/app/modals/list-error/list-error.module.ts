import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ListErrorPageRoutingModule } from './list-error-routing.module';

import { ListErrorPage } from './list-error.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ListErrorPageRoutingModule
  ],
  declarations: [ListErrorPage]
})
export class ListErrorPageModule {}
