import { computed, Injectable, signal } from '@angular/core';
import { Session } from '../models/session.interface';
import { ClimbEvent } from '../models/climb-event.interface';

@Injectable({ providedIn: 'root' })
export class LogService {
  private logs = signal<Session[]>([] as Session[]);

  readonly logs$ = computed(() => this.logs());

  addSession(session: Session): void {
    this.logs.update((currentLogs) => [...currentLogs, session]);
    //here add to backend
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

    //here update to backend
  }

  updateSession(updatedSession: Session): void {
    this.logs.update((sessions) =>
      sessions.map((session) =>
        session.id === updatedSession.id
          ? { ...session, ...updatedSession }
          : session
      )
    );
    // Add backend update code
  }

  getSessionById(id: string): Session | undefined {
    return this.logs().find((session) => session.id === id);
  }
}
