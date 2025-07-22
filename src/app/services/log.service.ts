import { computed, Injectable, signal } from '@angular/core';
import { Session } from '../models/session.interface';

@Injectable({ providedIn: 'root' })
export class LogService {
  private logs = signal<Session[]>([] as Session[]);

  readonly logs$ = computed(() => this.logs());

  addSession(session: Session): void {
    this.logs.update((currentLogs) => [...currentLogs, session]);
    //here add to backend
  }

  getSessionById(id: string): Session | undefined {
    return this.logs().find((session) => session.id === id);
  }
}
