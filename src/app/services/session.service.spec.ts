import { TestBed } from '@angular/core/testing';
import { SessionService } from './session.service';
import { LogService } from './log.service';
import { AltitudeRecorderService } from './altitude-recorder.service';
import { EventClassificationService } from './event-classification.service';
import { Subject } from 'rxjs';
import { ClimbEvent } from '../models/climb-event.interface';
import { Session } from '../models/session.interface';

// Mock services
class MockLogService {
  sessions: Session[] = [];
  addSession(session: Session) {
    this.sessions.push(session);
  }
}

class MockAltitudeRecorderService {
  altitude$ = new Subject<number | null>();
  lastAltitude: number | null = null;
  startRecording = jasmine.createSpy().and.returnValue(Promise.resolve());
  stopRecording = jasmine.createSpy();
}

class MockClassifierService {
  createEventFromReadings = jasmine.createSpy();
  getRecommendedOptions = jasmine.createSpy().and.returnValue({
    readingsCount: 8,
    fallDropThreshold: 0.4,
    allowedNoiseThreshold: 0.4,
    restMaxChangeThreshold: 0.25,
  });
}

describe('SessionService', () => {
  let service: SessionService;
  let logService: MockLogService;
  let altService: MockAltitudeRecorderService;
  let classifierService: MockClassifierService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SessionService,
        { provide: LogService, useClass: MockLogService },
        { provide: AltitudeRecorderService, useClass: MockAltitudeRecorderService },
        { provide: EventClassificationService, useClass: MockClassifierService },
      ],
    });

    service = TestBed.inject(SessionService);
    logService = TestBed.inject(LogService) as unknown as MockLogService;
    altService = TestBed.inject(AltitudeRecorderService) as unknown as MockAltitudeRecorderService;
    classifierService = TestBed.inject(EventClassificationService) as unknown as MockClassifierService;
  });

  describe('session lifecycle', () => {
    it('should start and end a session properly', async () => {
      await service.startSession();
      expect(service.session$()).toBeTruthy();
      expect(service.recording$()).toBeTrue();

      service.endSession();
      expect(service.recording$()).toBeFalse();
      expect(logService.sessions.length).toBe(1);
      const session = logService.sessions[0];
      expect(session.events.some(e => e.type === 'session-started')).toBeTrue();
      expect(session.events.some(e => e.type === 'session-ended')).toBeTrue();
    });

    it('should not crash when ending a session without starting', () => {
      expect(() => service.endSession()).not.toThrow();
    });
  });

  describe('recording events', () => {
    beforeEach(async () => {
      await service.startSession();
    });

    it('should attach last altitude if available', () => {
      altService.lastAltitude = 123;
      const event: ClimbEvent = { id: 'e1', type: 'rest', time: new Date() };
      service.recordEvent(event);

      const stored = service.session$().events.find(e => e.id === 'e1');
      expect(stored?.altitude).toBe(123);
    });

    it('should preserve notes', () => {
      const event: ClimbEvent = { id: 'e2', type: 'manual-note', time: new Date(), notes: 'test note' };
      service.recordEvent(event);

      const stored = service.session$().events.find(e => e.id === 'e2');
      expect(stored?.notes).toBe('test note');
    });
  });

  describe('altitude readings & classification', () => {
    beforeEach(async () => {
      await service.startSession();
    });

    it('should call classifier when buffer reaches required readings', () => {
      classifierService.createEventFromReadings.and.returnValue(null);

      const count = service.getCurrentClassificationOptions().readingsCount || 8;
      for (let i = 0; i < count; i++) {
        altService.altitude$.next(100 + i);
      }

      expect(classifierService.createEventFromReadings).toHaveBeenCalled();
    });

    it('should record classified events into session', () => {
      const fakeEvent: ClimbEvent = { id: 'f1', type: 'fall', time: new Date(), altitude: 250 };
      classifierService.createEventFromReadings.and.returnValue(fakeEvent);

      const count = service.getCurrentClassificationOptions().readingsCount || 8;
      for (let i = 0; i < count; i++) {
        altService.altitude$.next(200 + i);
      }

      const session = service.session$();
      expect(session.events.some(e => e.id === 'f1')).toBeTrue();
    });

    it('should maintain a sliding buffer if no event is detected', () => {
      classifierService.createEventFromReadings.and.returnValue(null);

      const count = (service.getCurrentClassificationOptions().readingsCount || 8) * 2;
      for (let i = 0; i < count; i++) {
        altService.altitude$.next(300 + i);
      }

      const buf = service.getCurrentReadings();
      expect(buf.length).toBeLessThanOrEqual((service.getCurrentClassificationOptions().readingsCount || 8) - 1);
    });
  });

  describe('classification options', () => {
    it('should set recommended options', () => {
      service.setClassificationMode('sensitive');
      const opts = service.getCurrentClassificationOptions();
      expect(opts.readingsCount).toBe(8);
    });

    it('should allow custom options', () => {
      service.setCustomClassificationOptions({ readingsCount: 10 });
      expect(service.getCurrentClassificationOptions().readingsCount).toBe(10);
    });
  });

  describe('model consistency', () => {
    beforeEach(async () => {
      await service.startSession();
    });

    it('should only assign valid event types', () => {
      const validTypes: ClimbEvent['type'][] = [
        'session-started', 'session-ended', 'fall', 'fall-arrested',
        'pitch-changed', 'rest', 'retreat', 'manual-note',
        'lead-started', 'lead-ended', 'second-started', 'second-ended',
        'error', 'belay', 'barometer-reading'
      ];

      const session = service.session$();
      for (const ev of session.events) {
        expect(validTypes).toContain(ev.type);
      }
    });

    it('should leave optional fields undefined if not set', () => {
      const session = service.session$();
      expect(session.notes).toBeUndefined();
      expect(session.name).toBeUndefined();
      expect(session.pitchCount).toBeUndefined();
    });
  });
});
