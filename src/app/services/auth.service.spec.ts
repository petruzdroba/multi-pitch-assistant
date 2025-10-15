import { TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from 'src/environments/environment.test';
import { Storage } from '@capacitor/storage';
import { UserData } from '../models/user-data.interface';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockUser: UserData = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
  };

  const mockTokens = {
    access: 'mock-access-token',
    refresh: 'mock-refresh-token',
  };

  let storageSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    spyOn(Storage, 'set').and.returnValue(Promise.resolve());
    storageSpy = spyOn(Storage, 'get').and.returnValue(Promise.resolve({ value: null }));
    spyOn(Storage, 'remove').and.returnValue(Promise.resolve());
  });

  afterEach(() => {
    // This ensures each test closed or flushed every request
    httpMock.verify();
  });

  describe('logIn', () => {
    it('should log in user and store tokens', (done) => {
      const loginData = { email: 'test@example.com', password: 'password123' };
      const mockResponse = { access: mockTokens.access, refresh: mockTokens.refresh, user: mockUser };

      service.logIn(loginData).subscribe({
        next: (user) => {
          expect(user).toEqual(mockUser);

          // allow async tap() Storage.set calls
          setTimeout(() => {
            expect(service.user()).toEqual(mockUser);
            expect(service.isLoggedIn()).toBe(true);
            done();
          }, 50);
        },
        error: (err) => done.fail(err),
      });

      const req = httpMock.expectOne(`${environment.serverUrl}/login/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(loginData);
      req.flush(mockResponse);
    });
  });

  describe('signUp', () => {
    it('should sign up user and store tokens', (done) => {
      const signupData = { username: 'testuser', email: 'test@example.com', password: 'password123' };
      const mockResponse = { access: mockTokens.access, refresh: mockTokens.refresh, user: mockUser };

      service.signUp(signupData).subscribe({
        next: (user) => {
          expect(user).toEqual(mockUser);

          setTimeout(() => {
            expect(service.user()).toEqual(mockUser);
            expect(service.isLoggedIn()).toBe(true);
            done();
          }, 50);
        },
        error: (err) => done.fail(err),
      });

      const req = httpMock.expectOne(`${environment.serverUrl}/signup/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(signupData);
      req.flush(mockResponse);
    });
  });

  describe('logOut', () => {
    it('should clear tokens and user data', async () => {
      service['userData'].set(mockUser);
      expect(service.isLoggedIn()).toBe(true);

      await service.logOut();

      expect(service.user()).toBeNull();
      expect(service.isLoggedIn()).toBe(false);
    });
  });


});
