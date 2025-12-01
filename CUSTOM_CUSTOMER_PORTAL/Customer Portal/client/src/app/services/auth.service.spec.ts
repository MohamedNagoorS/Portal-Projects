import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return false when not authenticated', () => {
    localStorage.clear();
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('should store authentication on login', () => {
    // This is a skeleton test - implement based on your needs
    expect(service).toBeTruthy();
  });
});

