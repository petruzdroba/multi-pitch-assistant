import { TestBed } from '@angular/core/testing';
import { DatabaseService } from './database.service';
import { SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Session } from '../models/session.interface';
import { ClimbEvent } from '../models/climb-event.interface';

describe('DatabaseService (detailed)', () => {
  let service: DatabaseService;
  let mockConn: jasmine.SpyObj<SQLiteConnection>;
  let mockDb: jasmine.SpyObj<SQLiteDBConnection>;

  beforeEach(() => {
    mockDb = jasmine.createSpyObj('SQLiteDBConnection', [
      'open', 'execute', 'run', 'query'
    ]);
    mockConn = jasmine.createSpyObj('SQLiteConnection', ['createConnection']);
    mockConn.createConnection.and.returnValue(Promise.resolve(mockDb));

    TestBed.configureTestingModule({ providers: [DatabaseService] });
    service = TestBed.inject(DatabaseService);
    // Override the internal sqlite connection
    (service as any).sqlite = mockConn;
  });

  describe('before init()', () => {
    it('getDatabase() should throw', () => {
      expect(() => service.getDatabase()).toThrowError('Database not initialized');
    });

    it('run() should throw', async () => {
      await expectAsync(service.run('')).toBeRejectedWithError('Database not initialized');
    });

    it('query() should throw', async () => {
      await expectAsync(service.query('')).toBeRejectedWithError('Database not initialized');
    });

    it('close() should do nothing (no throw)', async () => {
      await expectAsync(service.close()).toBeResolved();
    });
  });

  describe('after init()', () => {
    beforeEach(async () => {
      await service.init();
    });

    it('should call createConnection and open()', () => {
      expect(mockConn.createConnection)
        .toHaveBeenCalledWith('app_db', false, 'no-encryption', 1, false);
      expect(mockDb.open).toHaveBeenCalled();
    });

    it('close() should clear the db reference', async () => {
      await service.close();
      // internal db should be null now
      expect((service as any).db).toBeNull();
    });

    describe('addSession()', () => {
      let session: Session;

      beforeEach(() => {
        session = {
          id: 'sess1',
          timeStart: new Date('2025-01-01T00:00:00Z'),
          timeEnd:   new Date('2025-01-01T01:00:00Z'),
          events: [{
            id: 'evt1',
            time: new Date('2025-01-01T00:10:00Z'),
            altitude: 100,
            type: 'fall',
            notes: 'note'
          }],
          name: 'Test Sess',
          type: 'trad',
          location: { latitude: 10, longitude: 20 },
          notes: 'abc',
          completed: false,
          pitchCount: 3
        };
      });

      it('should insert session and events', async () => {
        await service.addSession(session);
        // expect two run calls
        expect(mockDb.run).toHaveBeenCalledTimes(2);

        const [sessSql, sessParams] = mockDb.run.calls.argsFor(0);
        expect(sessSql).toContain('INSERT INTO sessions');
        expect(sessParams).toEqual([
          session.id,
          session.timeStart.toISOString(),
          session.timeEnd.toISOString(),
          session.name,
          session.type,
          session.location?.latitude,
          session.location?.longitude,
          session.notes,
          0,
          session.pitchCount
        ]);

        const [evtSql, evtParams] = mockDb.run.calls.argsFor(1);
        expect(evtSql).toContain('INSERT INTO climb_events');
        expect(evtParams).toEqual([
          session.events[0].id,
          session.id,
          session.events[0].time.toISOString(),
          session.events[0].altitude,
          session.events[0].type,
          session.events[0].notes
        ]);
      });

      it('addSession() should throw if db missing', async () => {
        // simulate db lost
        (service as any).db = null;
        await expectAsync(service.addSession(session))
          .toBeRejectedWithError('Database not initialized');
      });
    });

    describe('getFullLog()', () => {
      it('should return empty array if no sessions', async () => {
        mockDb.query.and.returnValue(Promise.resolve({ values: [] }));
        const log = await service.getFullLog();
        expect(log).toEqual([]);
      });

      it('should assemble sessions with events', async () => {
        // First call: sessions
        mockDb.query.and.callFake((sql: string) => {
          if (sql.includes('FROM sessions')) {
            return Promise.resolve({
              values: [{
                id: 's1',
                time_start: '2025-01-01T00:00:00Z',
                time_end:   '2025-01-01T01:00:00Z',
                name: 'S1',
                type: 'sport',
                latitude: 5,
                longitude: 6,
                notes: 'n',
                completed: 1,
                pitch_count: 2
              }]
            });
          }
          // Second call: events
          return Promise.resolve({
            values: [{
              id: 'e1',
              session_id: 's1',
              time: '2025-01-01T00:10:00Z',
              altitude: 50,
              type: 'belay',
              notes: 'ev-note'
            }]
          });
        });

        const log = await service.getFullLog();
        expect(log.length).toBe(1);
        const sess = log[0];
        expect(sess.id).toBe('s1');
        expect(sess.completed).toBeTrue();
        expect(sess.events.length).toBe(1);
        expect(sess.events[0].type).toBe('belay');
      });

      it('getFullLog() should throw if db missing', async () => {
        (service as any).db = null;
        await expectAsync(service.getFullLog())
          .toBeRejectedWithError('Database not initialized');
      });
    });

    describe('updateEvent()', () => {
      it('should update the climb event in the database', async () => {
        const event: ClimbEvent = {
          id: 'ev999',
          time: new Date('2025-01-01T12:34:56Z'),
          altitude: 123.45,
          type: 'fall',
          notes: 'It was slippery'
        };
        const sessionId = 'sess999';

        await service.updateEvent(event, sessionId);

        expect(mockDb.run).toHaveBeenCalledOnceWith(
          jasmine.stringMatching(/^UPDATE climb_events SET/),
          [
            event.time.toISOString(),
            event.altitude,
            event.type,
            event.notes,
            event.id,
            sessionId
          ]
        );
      });

      it('should throw if db is not initialized', async () => {
        (service as any).db = null;
        const dummyEvent: ClimbEvent = {
          id: 'bad',
          time: new Date(),
          type: 'fall'
        };
        await expectAsync(service.updateEvent(dummyEvent, 'some-session'))
          .toBeRejectedWithError('Database not initialized');
      });
    });

    describe('updateSession()', () => {
      it('should update the session in the database', async () => {
        const session: Session = {
          id: 'sess123',
          timeStart: new Date('2025-01-01T10:00:00Z'),
          timeEnd: new Date('2025-01-01T11:00:00Z'),
          events: [],
          name: 'Updated Session',
          type: 'sport',
          location: { latitude: 42.1, longitude: -71.2 },
          notes: 'Updated notes',
          completed: true,
          pitchCount: 4
        };

        await service.updateSession(session);

        expect(mockDb.run).toHaveBeenCalledOnceWith(
          jasmine.stringMatching(/^UPDATE sessions SET/),
          [
            session.timeStart.toISOString(),
            session.timeEnd.toISOString(),
            session.name,
            session.type,
            session.location?.latitude,
            session.location?.longitude,
            session.notes,
            1,
            session.pitchCount,
            session.id
          ]
        );
      });

      it('should throw if db is not initialized', async () => {
        (service as any).db = null;
        const dummySession: Session = {
          id: 'bad',
          timeStart: new Date(),
          timeEnd: new Date(),
          events: []
        };
        await expectAsync(service.updateSession(dummySession))
          .toBeRejectedWithError('Database not initialized');
      });
    });
  });
});
