import { TestBed } from '@angular/core/testing';
import { LogService } from './log.service';
import { DatabaseService } from './database.service';
import { Session } from '../models/session.interface';
import { ClimbEvent } from '../models/climb-event.interface';

// Mock DatabaseService
class MockDatabaseService {
  sessions: Session[] = [];
  async getFullLog() {
    return [...this.sessions];
  }
  async addSession(session: Session) {
    this.sessions.push(session);
  }
  async updateSession(updated: Session) {
    const idx = this.sessions.findIndex(s => s.id === updated.id);
    if (idx !== -1) this.sessions[idx] = updated;
  }
  async addEvent(event: ClimbEvent, sessionId: string) {
    const s = this.sessions.find(s => s.id === sessionId);
    if (s) s.events.push(event);
  }
  async updateEvent(event: ClimbEvent, sessionId: string) {
    const s = this.sessions.find(s => s.id === sessionId);
    if (s) {
      const idx = s.events.findIndex(e => e.id === event.id);
      if (idx !== -1) s.events[idx] = event;
    }
  }
  async deleteEvent(eventId: string, sessionId: string) {
    const s = this.sessions.find(s => s.id === sessionId);
    if (s) s.events = s.events.filter(e => e.id !== eventId);
  }
  async deleteSession(sessionId: string) {
    this.sessions = this.sessions.filter(s => s.id !== sessionId);
  }
}

describe('LogService Stress Tests', () => {
  let service: LogService;
  let db: MockDatabaseService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        LogService,
        { provide: DatabaseService, useClass: MockDatabaseService },
      ],
    });

    service = TestBed.inject(LogService);
    db = TestBed.inject(DatabaseService) as unknown as MockDatabaseService;

    // wait for async init() to complete
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  it('should start with empty logs', () => {
    expect(service.logs$()).toEqual([]);
  });

  it('should add a new session', async () => {
    const session: Session = {
      id: 's1',
      timeStart: new Date(),
      timeEnd: new Date(),
      events: [],
    };

    service.addSession(session);
    const stored = service.getSessionById('s1');
    expect(stored).toBeTruthy();
    expect(stored?.id).toBe('s1');
  });

  it('should not crash when updating non-existent session', () => {
    const fakeSession: Session = {
      id: 'non-existent',
      timeStart: new Date(),
      timeEnd: new Date(),
      events: [],
    };
    expect(() => service.updateSession(fakeSession)).not.toThrow();
  });

  it('should add events to existing session', () => {
    const session: Session = { id: 's2', timeStart: new Date(), timeEnd: new Date(), events: [] };
    service.addSession(session);

    const event: ClimbEvent = { id: 'e1', time: new Date(), type: 'manual-note' };
    service.addEvent(event, 's2');

    const stored = service.getSessionById('s2');
    expect(stored?.events.length).toBe(1);
    expect(stored?.events[0].id).toBe('e1');
  });

  it('should ignore adding event to non-existent session', () => {
    const event: ClimbEvent = { id: 'eX', time: new Date(), type: 'manual-note' };
    expect(() => service.addEvent(event, 'missing')).not.toThrow();
  });

  it('should update existing event', () => {
    const session: Session = { id: 's3', timeStart: new Date(), timeEnd: new Date(), events: [] };
    service.addSession(session);

    const event: ClimbEvent = { id: 'e2', time: new Date(), type: 'manual-note' };
    service.addEvent(event, 's3');

    const updated: ClimbEvent = { ...event, notes: 'updated' };
    service.updateEvent(updated, 's3');

    const stored = service.getSessionById('s3');
    expect(stored?.events[0].notes).toBe('updated');
  });

  it('should delete existing event', () => {
    const session: Session = { id: 's4', timeStart: new Date(), timeEnd: new Date(), events: [] };
    service.addSession(session);

    const event: ClimbEvent = { id: 'e3', time: new Date(), type: 'manual-note' };
    service.addEvent(event, 's4');

    service.deleteEvent('e3', 's4');
    const stored = service.getSessionById('s4');
    expect(stored?.events.length).toBe(0);
  });

  it('should delete existing session', () => {
    const session: Session = { id: 's5', timeStart: new Date(), timeEnd: new Date(), events: [] };
    service.addSession(session);

    service.deleteSession('s5');
    expect(service.getSessionById('s5')).toBeUndefined();
  });

  it('should handle multiple sessions and events correctly', () => {
    const s1: Session = { id: 'multi1', timeStart: new Date(), timeEnd: new Date(), events: [] };
    const s2: Session = { id: 'multi2', timeStart: new Date(), timeEnd: new Date(), events: [] };
    service.addSession(s1);
    service.addSession(s2);

    service.addEvent({ id: 'e1', type: 'manual-note', time: new Date() }, 'multi1');
    service.addEvent({ id: 'e2', type: 'manual-note', time: new Date() }, 'multi2');

    const logs = service.logs$();
    expect(logs.length).toBe(2);
    expect(logs.find(s => s.id === 'multi1')?.events.length).toBe(1);
    expect(logs.find(s => s.id === 'multi2')?.events.length).toBe(1);
  });

  it('should not crash when deleting non-existent event/session', () => {
    expect(() => service.deleteEvent('nope', 'missing')).not.toThrow();
    expect(() => service.deleteSession('nope')).not.toThrow();
  });
});
