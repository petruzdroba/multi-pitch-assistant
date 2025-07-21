import { computed, inject, Injectable, signal } from '@angular/core';
import { Session } from '../models/session.interface';
import { ClimbEvent } from '../models/climb-event.interface';
import { LogService } from './log.service';
import { Geolocation } from '@capacitor/geolocation';
import { AltitudeRecorderService } from './altitude-recorder.service';
import { Subscription } from 'rxjs';
import { AltitudeReading } from '../models/altitude-reading.interface';
import { EventClassificationService } from './event-classification.service';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private session = signal<Session>({} as Session);
  private altitudeReadings = signal<AltitudeReading[]>([] as AltitudeReading[]);
  private recording = signal<boolean>(false);

  readonly session$ = computed(() => this.session());
  readonly recording$ = computed(() => this.recording());

  private logService = inject(LogService);
  private altService = inject(AltitudeRecorderService);
  private classifierService = inject(EventClassificationService);

  private altitudeSub: Subscription | null = null;
  private lastAltitude: number | null = null;

  async startSession(): Promise<void> {
    let location: { latitude: number; longitude: number } | undefined =
      undefined;

    try {
      const permission = await Geolocation.requestPermissions();

      if (permission.location === 'granted') {
        const position = await Geolocation.getCurrentPosition();
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      } else {
        console.warn('Geolocation permission not granted.');
      }
    } catch (err) {
      console.error('Error getting location:', err);
    }

    const newSession: Session = {
      id: crypto.randomUUID(),
      timeStart: new Date(),
      timeEnd: new Date(), // will update when session ends
      location: location, // undefined if GPS failed
      events: [
        {
          id: crypto.randomUUID(),
          time: new Date(),
          type: 'session-started',
          // no altitude
        },
      ],
    };

    this.session.set(newSession);
    this.recording.set(true);
    await this.startAltitudeRecording();
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
    console.log('SessionService: endSession called');
    this.session.update((session) => {
      if (!session) return session;
      return {
        ...session,
        timeEnd: new Date(),
        altitude: this.lastAltitude ?? 0,
      };
    });

    this.recording.set(false);
    this.logService.addSession(this.session());
    this.session.set({} as Session);
    this.stopAltitudeRecording();
  }

  private async startAltitudeRecording(): Promise<void> {
    await this.altService.startRecording();

    this.altitudeSub = this.altService.altitude$.subscribe((alt) => {
      if (alt !== null) {
        this.lastAltitude = alt;

        this.altitudeReadings.update((readings) => [
          ...readings,
          { time: new Date(), altitude: alt },
        ]);

        if (this.altitudeReadings().length >= 5) {
          this.classifyAltitudeEvents(this.altitudeReadings());
        }
      }
    });
  }

  private stopAltitudeRecording(): void {
    // unsubscribe from the stream
    this.altitudeSub?.unsubscribe();
    this.altitudeSub = null;

    this.altService.stopRecording();
  }

  private classifyAltitudeEvents(reads: AltitudeReading[]): void {
    // Keep only the last 3 readings
    const window = reads.slice(-5);
    const event = this.classifierService.createEventFromReadings(window);

    if (event) {
      // Record detected event and clear all buffered readings
      this.recordEvent(event);
      this.altitudeReadings.set([]);
    } else {
      // No event: slide window by dropping oldest, keep the last two
      this.altitudeReadings.set(window.slice(1));
    }
  }
}
