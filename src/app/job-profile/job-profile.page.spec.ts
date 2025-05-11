import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JobProfilePage } from './job-profile.page';
 
describe('JobProfilePage', () => {
  let component: JobProfilePage;
  let fixture: ComponentFixture<JobProfilePage>;
 
  beforeEach(() => {
    fixture = TestBed.createComponent(JobProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
 
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
 