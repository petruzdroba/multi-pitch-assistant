import { computed, inject, Injectable, signal } from '@angular/core';
import { Session } from '../models/session.interface';
import { ClimbEvent } from '../models/climb-event.interface';
import { DatabaseService } from './database.service';

@Injectable({ providedIn: 'root' })
export class LogService {
  private logs = signal<Session[]>([] as Session[]);
  private dbService = inject(DatabaseService);

  readonly logs$ = computed(() => this.logs());

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    try {
      const sessions = await this.dbService.getFullLog().catch((error) => {
        console.error('Error fetching logs from database:', error);
        return [];
      });
      this.logs.set(sessions);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  }

  addSession(session: Session): void {
    this.logs.update((currentLogs) => [...currentLogs, session]);
    this.dbService.addSession(session).catch((error) => {
      console.error('Error adding session to database:', error)});
  }

  updateEvent(event: ClimbEvent, sessionId: string): void {
    this.logs.update((currentLogs) => {
      return currentLogs.map((session) => {
        if (session.id === sessionId) {
          return {
            ...session,
            events: session.events.map((e) =>
              e.id === event.id ? { ...e, ...event } : e
            ),
          };
        }
        return session;
      });
    });
    this.dbService.updateEvent(event, sessionId).catch((error) => {
      console.error('Error updating event in database:', error);
    });
  }

  updateSession(updatedSession: Session): void {
    this.logs.update((sessions) =>
      sessions.map((session) =>
        session.id === updatedSession.id
          ? { ...session, ...updatedSession }
          : session
      )
    );
    this.dbService.updateSession(updatedSession).catch((error) => {
      console.error('Error updating session in database:', error);
    });
  }

  deleteEvent(eventId:string, sessionId:string):void{
    this.logs.update((currentLogs) => {
      return currentLogs.map((session) => {
        if (session.id === sessionId) {
          return {
            ...session,
            events: session.events.filter((e) => e.id !== eventId),
          };
        }
        return session;
      });
    });
    this.dbService.deleteEvent(eventId, sessionId).catch((error) => {
      console.error('Error deleting event from database:', error);
    });
  }

  deleteSession(sessionId: string):void {
    this.logs.update((currentLogs) =>
      currentLogs.filter((session) => session.id !== sessionId)
    );
    this.dbService.deleteSession(sessionId).catch((error) => {
      console.error('Error deleting session from database:', error);
    });
  }

  addEvent(event: ClimbEvent, sessionId: string): void {
    this.logs.update((currentLogs) => {
      return currentLogs.map((session) => {
        if (session.id === sessionId) {
          return {
            ...session,
            events: [...session.events, event],
          };
        }
        return session;
      });
    });
    this.dbService.addEvent(event, sessionId).catch((error) => {
      console.error('Error adding event to database:', error);
    });
  }

  getSessionById(id: string): Session | undefined {
    return this.logs().find((session) => session.id === id);
  }
}
