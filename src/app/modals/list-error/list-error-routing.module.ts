import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ListErrorPage } from './list-error.page';

const routes: Routes = [
  {
    path: '',
    component: ListErrorPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ListErrorPageRoutingModule {}
