import { computed, inject, Injectable, signal } from '@angular/core';
import { Session } from '../models/session.interface';
import { ClimbEvent } from '../models/climb-event.interface';
import { LogService } from './log.service';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private session = signal<Session>({} as Session);
  private recording = signal<boolean>(false);

  readonly session$ = computed(() => this.session());
  readonly recording$ = computed(() => this.recording());

  private logService = inject(LogService);

  startSession(): void {
    const newSession: Session = {
      id: crypto.randomUUID(),
      timeStart: new Date(),
      timeEnd: new Date(), // This will be updated when the session ends
      events: [
        {
          id: crypto.randomUUID(),
          time: new Date(),
          type: 'session-started',
          altitude: Math.random() * 1000, // Example altitude, add real one later
        },
      ],
    };

    this.session.set(newSession);
    this.recording.set(true);
  }

  recordEvent(event: ClimbEvent): void {
    this.session.update((session) => {
      if (!session) return session;
      return {
        ...session,
        events: [...session.events, event],
      };
    });
  }

  //recorder function, that will have an interval that will record altitude and time, and maybe after it will clasify events and add them

  endSession(): void {
    //here send data thru http on backend and then change tab
    this.session.update((session) => {
      if (!session) return session;
      return {
        ...session,
        timeEnd: new Date(),
        altitude: Math.random() * 1000, // Example altitude, add real one later
      };
    });

    this.recording.set(false);
    this.logService.addSession(this.session());
    this.session.set({} as Session); // Reset session after ending
  }
}
