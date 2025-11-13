import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalaryViewComponent } from './salary-view.component';

describe('SalaryViewComponent', () => {
  let component: SalaryViewComponent;
  let fixture: ComponentFixture<SalaryViewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SalaryViewComponent]
    });
    fixture = TestBed.createComponent(SalaryViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
