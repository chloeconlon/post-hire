import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MessageListPage } from './message-list.page';

describe('MessageListPage', () => {
  let component: MessageListPage;
  let fixture: ComponentFixture<MessageListPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MessageListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
