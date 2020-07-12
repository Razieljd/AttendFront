import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ListErrorPage } from './list-error.page';

describe('ListErrorPage', () => {
  let component: ListErrorPage;
  let fixture: ComponentFixture<ListErrorPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListErrorPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ListErrorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
