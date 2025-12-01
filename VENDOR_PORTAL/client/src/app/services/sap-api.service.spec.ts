import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SapApiService } from './sap-api.service';

describe('SapApiService', () => {
  let service: SapApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SapApiService]
    });
    service = TestBed.inject(SapApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Add more tests as needed
});

