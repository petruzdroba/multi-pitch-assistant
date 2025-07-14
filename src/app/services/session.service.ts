import { computed, Injectable, signal } from '@angular/core';
import { Session } from '../models/session.interface';
import { ClimbEvent } from '../models/climb-event.interface';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private session = signal<Session>({} as Session);
  private recording = signal<boolean>(false);

  readonly session$ = computed(() => this.session());
  readonly recording$ = computed(() => this.recording());

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

  endSession(): void {
    //here send data thru http on backend and then change tab
    this.session.update((session) => {
      if (!session) return session;
      return {
        ...session,
        timeEnd: new Date(),
      };
    });

    this.recording.set(false);
  }
}
