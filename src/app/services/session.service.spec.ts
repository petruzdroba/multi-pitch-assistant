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
  addSession(s: Session) {
    this.sessions.push(s);
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
}

describe('SessionService stress tests', () => {
  let service: SessionService;
  let logService: MockLogService;
  let altService: MockAltitudeRecorderService;
  let classifierService: MockClassifierService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SessionService,
        { provide: LogService, useClass: MockLogService },
        {
          provide: AltitudeRecorderService,
          useClass: MockAltitudeRecorderService,
        },
        {
          provide: EventClassificationService,
          useClass: MockClassifierService,
        },
      ],
    });

    service = TestBed.inject(SessionService);
    logService = TestBed.inject(LogService) as unknown as MockLogService;
    altService = TestBed.inject(
      AltitudeRecorderService
    ) as unknown as MockAltitudeRecorderService;
    classifierService = TestBed.inject(
      EventClassificationService
    ) as unknown as MockClassifierService;
  });

  describe('lifecycle', () => {
    it('should not allow recording events before session starts', () => {
      const event: ClimbEvent = {
        id: 'x1',
        type: 'manual-note',
        time: new Date(),
      };

      service.recordEvent(event);

      const session = service.session$();
      // session exists, but should have no events yet
      expect(session.events?.length ?? 0).toBe(0); // no "manual-note" added
    });

    it('should log a session only once it has been ended', async () => {
      await service.startSession();
      expect(logService.sessions.length).toBe(0);
      service.endSession();
      expect(logService.sessions.length).toBe(1);
    });

    it('should not crash if endSession is called without start', () => {
      expect(() => service.endSession()).not.toThrow();
    });
  });

  describe('events', () => {
    beforeEach(async () => {
      await service.startSession();
    });

    it('should always attach an altitude if available', () => {
      altService.lastAltitude = 321;
      const e: ClimbEvent = {
        id: 'e1',
        type: 'rest',
        time: new Date(),
      };
      service.recordEvent(e);

      const session = service.session$()!;
      const stored = session.events.find((ev) => ev.id === 'e1');
      expect(stored?.altitude).toBe(321);
    });

    it('should preserve notes when provided', () => {
      const e: ClimbEvent = {
        id: 'e2',
        type: 'manual-note',
        time: new Date(),
        notes: 'crux was hard',
      };
      service.recordEvent(e);

      const session = service.session$()!;
      expect(session.events.find((ev) => ev.id === 'e2')?.notes).toBe(
        'crux was hard'
      );
    });

    it('should add a "session-ended" event when ended', () => {
      service.endSession();
      const ended = logService.sessions[0];
      expect(ended.events.some((ev) => ev.type === 'session-ended')).toBeTrue();
    });
  });

  describe('altitude readings & classification', () => {
    beforeEach(async () => {
      await service.startSession();
    });

    it('should buffer readings and attempt classification after 5 samples', () => {
      classifierService.createEventFromReadings.and.returnValue(null);

      for (let i = 0; i < 5; i++) {
        altService.altitude$.next(100 + i);
      }

      expect(classifierService.createEventFromReadings).toHaveBeenCalled();
    });

    it('should record classified events into session', () => {
      const fakeEvent: ClimbEvent = {
        id: 'c1',
        type: 'fall',
        time: new Date(),
        altitude: 250,
      };
      classifierService.createEventFromReadings.and.returnValue(fakeEvent);

      for (let i = 0; i < 5; i++) {
        altService.altitude$.next(200 + i);
      }

      const session = service.session$()!;
      expect(session.events.some((ev) => ev.id === 'c1')).toBeTrue();
    });

    it('should keep sliding buffer if no event is detected', () => {
      classifierService.createEventFromReadings.and.returnValue(null);

      for (let i = 0; i < 10; i++) {
        altService.altitude$.next(300 + i);
      }

      const buf = (service as any).altitudeReadings();
      expect(buf.length).toBeLessThanOrEqual(5); // sliding window behavior
    });
  });

  describe('model contract consistency', () => {
    beforeEach(async () => {
      await service.startSession();
    });

    it('should never assign invalid event types', () => {
      const session = service.session$()!;
      for (const ev of session.events) {
        // TypeScript guards this, but runtime test enforces it
        const validTypes: ClimbEvent['type'][] = [
          'session-started',
          'session-ended',
          'fall',
          'fall-arrested',
          'pitch-changed',
          'rest',
          'retreat',
          'manual-note',
          'lead-started',
          'lead-ended',
          'second-started',
          'second-ended',
          'error',
          'belay',
          'barometer-reading',
        ];
        expect(validTypes).toContain(ev.type);
      }
    });

    it('should leave optional fields undefined if not set', () => {
      const s = service.session$()!;
      expect(s.notes).toBeUndefined();
      expect(s.name).toBeUndefined();
      expect(s.pitchCount).toBeUndefined();
    });
  });
});
