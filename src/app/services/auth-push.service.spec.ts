import { TestBed } from '@angular/core/testing';

import { AuthPushService } from './auth-push.service';

describe('AuthPushService', () => {
  let service: AuthPushService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthPushService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
