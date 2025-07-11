import { computed, Injectable, signal } from '@angular/core';
import { Session } from '../models/session.interface';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private session = signal<Session>({} as Session);
  readonly session$ = computed(() => this.session());

  startSession(): void {
    const newSession: Session = {
      id: crypto.randomUUID(),
      timeStart: new Date(),
      timeEnd: new Date(), // placeholder, real value set in endSession()
      events: [
        {
          id: crypto.randomUUID(),
          time: new Date(),
          type: 'session-started',
        },
      ],
    };

    this.session.set(newSession);
  }

  recordEvend(event: Event): void {}

  endSession(): void {}
}
