import { Injectable } from '@angular/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';
import { Session } from '../models/session.interface';
import { ClimbEvent } from '../models/climb-event.interface';
import { Capacitor } from '@capacitor/core';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private readonly dbName = 'app_db';

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  async init(): Promise<void> {
    if (Capacitor.getPlatform() === 'web' && !environment.test) {
      console.log('Running on Web: skipping DB initialization');
      return;
    }

    try {
      this.db = await this.sqlite.createConnection(
        this.dbName,
        false,
        'no-encryption',
        1,
        false
      );
      await this.db.open();
      await this.createTables();
      console.log('Native DB initialized on device');
    } catch (err) {
      console.error('Failed to initialize DB on device', err);
      throw err;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // await this.db.execute(`
    //   CREATE TABLE IF NOT EXISTS logs (
    //     id TEXT PRIMARY KEY,
    //     created_at TEXT NOT NULL
    //   );
    // `); if multiple logs were needed

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        time_start TEXT NOT NULL,
        time_end TEXT NOT NULL,
        name TEXT,
        type TEXT CHECK(type IN ('sport','trad','undefined')),
        latitude REAL,
        longitude REAL,
        notes TEXT,
        completed INTEGER CHECK(completed IN (0,1)),
        pitch_count INTEGER
      );
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS climb_events (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        time TEXT NOT NULL,
        altitude REAL,
        type TEXT NOT NULL CHECK(type IN (
          'session-started','session-ended','fall','fall-arrested',
          'pitch-changed','rest','retreat','manual-note',
          'lead-started','lead-ended','second-started','second-ended',
          'error','belay','barometer-reading'
        )),
        notes TEXT,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      );
    `);
  }

  async addEvent(event: ClimbEvent, sessionId: string): Promise<void> {
    const db = this.getDatabase();

    if (!db) throw new Error('Database not initialized');

    await db.run(
      `INSERT INTO climb_events
        (id, session_id, time, altitude, type, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        event.id,
        sessionId,
        event.time.toISOString(),
        event.altitude,
        event.type,
        event.notes,
      ]
    );
  }

  async addSession(session: Session): Promise<void> {
    const db = this.getDatabase();

    if (!db) throw new Error('Database not initialized');

    await db.run(
      `INSERT INTO sessions
        (id, time_start, time_end, name, type, latitude, longitude, notes, completed, pitch_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.id,
        session.timeStart.toISOString(),
        session.timeEnd.toISOString(),
        session.name ?? null,
        session.type ?? 'undefined',
        session.location?.latitude ?? null,
        session.location?.longitude ?? null,
        session.notes ?? null,
        session.completed ? 1 : 0,
        session.pitchCount ?? null,
      ]
    );

    for (const ev of session.events) {
      await db.run(
        `INSERT INTO climb_events
          (id, session_id, time, altitude, type, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          ev.id,
          session.id,
          ev.time.toISOString(),
          ev.altitude ?? null,
          ev.type,
          ev.notes ?? null,
        ]
      );
    }
  }

  async getFullLog(): Promise<Session[]> {
    if (!this.db) throw new Error('Database not initialized');

    const sessionsResult = await this.db.query(
      `SELECT * FROM sessions ORDER BY time_start`
    );
    const fullSessions: Session[] = [];

    for (const row of sessionsResult.values ?? []) {
      const eventsResult = await this.db.query(
        `SELECT * FROM climb_events WHERE session_id = ? ORDER BY time`,
        [row.id]
      );

      const events: ClimbEvent[] = (eventsResult.values ?? []).map((ev) => ({
        id: ev.id,
        time: new Date(ev.time),
        altitude: ev.altitude,
        type: ev.type,
        notes: ev.notes,
      }));

      const session: Session = {
        id: row.id,
        timeStart: new Date(row.time_start),
        timeEnd: new Date(row.time_end),
        events,
        name: row.name ?? undefined,
        type: row.type ?? undefined,
        location:
          row.location_latitude != null && row.location_longitude != null
            ? {
                latitude: row.location_latitude,
                longitude: row.location_longitude,
              }
            : undefined,
        notes: row.notes ?? undefined,
        completed: row.completed === 1,
        pitchCount: row.pitch_count ?? undefined,
      };

      fullSessions.push(session);
    }

    return fullSessions;
  }

  async updateEvent(event: ClimbEvent, sessionId: string): Promise<void> {
    const db = this.getDatabase();

    await db.run(
      `UPDATE climb_events SET
      time = ?, altitude = ?, type = ?, notes = ?
     WHERE id = ? AND session_id = ?`,
      [
        event.time.toISOString(),
        event.altitude ?? null,
        event.type,
        event.notes ?? null,
        event.id,
        sessionId,
      ]
    );
  }

  async updateSession(session: Session): Promise<void> {
    const db = this.getDatabase();

    await db.run(
      `UPDATE sessions SET
      time_start = ?, time_end = ?, name = ?, type = ?, latitude = ?, longitude = ?,
      notes = ?, completed = ?, pitch_count = ?
     WHERE id = ?`,
      [
        session.timeStart.toISOString(),
        session.timeEnd.toISOString(),
        session.name ?? null,
        session.type ?? 'undefined',
        session.location?.latitude ?? null,
        session.location?.longitude ?? null,
        session.notes ?? null,
        session.completed ? 1 : 0,
        session.pitchCount ?? null,
        session.id,
      ]
    );
  }

  async deleteEvent(eventId: string, sessionId: string): Promise<void> {
    const db = this.getDatabase();
    await db.run(`DELETE FROM climb_events WHERE id = ? AND session_id = ?`, [
      eventId,
      sessionId,
    ]);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const db = this.getDatabase();
    await db.run(`DELETE FROM sessions WHERE id = ?`, [sessionId]);
    // Thanks to ON DELETE CASCADE, associated climb_events will also be deleted.
  }

  getDatabase(): SQLiteDBConnection {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  async run(query: string, values: any[] = []): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.run(query, values);
  }

  async query<T = any>(query: string, values: any[] = []): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.query(query, values);
    return result.values ?? [];
  }

  async close(): Promise<void> {
    if (this.db) {
      try {
        await (this.sqlite as any).closeConnection(this.dbName, false);
      } catch {
        console.error('Error closing database connection');
      }
      this.db = null;
    }
  }
}
