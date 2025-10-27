import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RemoteDatabaseService } from './remote-database.service';
import { DatabaseService } from './database.service';
import { environment } from 'src/environments/environment.test';

describe('RemoteDatabaseService', () => {
  let service: RemoteDatabaseService;
  let httpMock: HttpTestingController;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      getDatabase: jasmine.createSpy('getDatabase').and.returnValue({
        exportToJson: jasmine.createSpy('exportToJson').and.resolveTo({ tables: [] }),
      }),
      replaceDatabase: jasmine.createSpy('replaceDatabase').and.resolveTo(),
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        RemoteDatabaseService,
        { provide: DatabaseService, useValue: mockDb },
      ],
    });

    service = TestBed.inject(RemoteDatabaseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create the service', () => {
    expect(service).toBeTruthy();
  });

  it('should upload database successfully', async () => {
    await service.upload();

    const req = httpMock.expectOne(`${environment.serverUrl}/backup/upload/`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.sqlite_blob).toBeTruthy();

    req.flush({ success: true, message: 'Backup saved', last_sync: new Date().toISOString() });

    const status = service['backupStatus']();
    expect(status?.status).toBeTrue();
    expect(status?.last_sync).toBeInstanceOf(Date);
  });

  it('should handle upload error', async () => {
    await service.upload();

    const req = httpMock.expectOne(`${environment.serverUrl}/backup/upload/`);
    req.error(new ErrorEvent('Network error'));

    const status = service['backupStatus']();
    expect(status?.status).toBeFalse();
    expect(status?.last_sync).toBeUndefined();
  });

  it('should decode Base64 correctly', () => {
    const data = { foo: 'bar' };
    const base64 = btoa(JSON.stringify(data));
    const decoded = service['decode'](base64);
    expect(decoded).toEqual(data);
  });

  it('should throw error on invalid Base64', () => {
    expect(() => service['decode']('invalid')).toThrow();
  });

  it('should download and replace database', async () => {
    service.download();

    const req = httpMock.expectOne(`${environment.serverUrl}/backup/download/`);
    const blob = { tables: [] };
    req.flush({ sqlite_blob: btoa(JSON.stringify(blob)), last_sync: new Date().toISOString() });

    expect(mockDb.replaceDatabase).toHaveBeenCalledWith(blob);
  });

  it('should handle download error gracefully', async () => {
    service.download();

    const req = httpMock.expectOne(`${environment.serverUrl}/backup/download/`);
    req.error(new ErrorEvent('Network error'));

    expect(mockDb.replaceDatabase).not.toHaveBeenCalled();
  });
});
