import { computed, inject, Injectable, signal } from '@angular/core';
import { Session } from '../models/session.interface';
import { ClimbEvent } from '../models/climb-event.interface';
import { LogService } from './log.service';
import { Geolocation } from '@capacitor/geolocation';
import { AltitudeRecorderService } from './altitude-recorder.service';
import { Subscription } from 'rxjs';
import { AltitudeReading } from '../models/altitude-reading.interface';
import { EventClassificationService, ClassificationOptions } from './event-classification.service';

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

  // Configuration for event classification
  private classificationOptions: ClassificationOptions = {};
  private requiredReadingsCount: number = 8;

  constructor() {
    // Set up classification options on initialization
    this.setClassificationMode('balanced');
  }


  setClassificationMode(mode: 'sensitive' | 'balanced' | 'conservative'): void {
    this.classificationOptions = this.classifierService.getRecommendedOptions(mode);
    this.requiredReadingsCount = this.classificationOptions.readingsCount || 8;
    console.log(`[SessionService] Classification mode set to ${mode}, using ${this.requiredReadingsCount} readings`);
  }


  setCustomClassificationOptions(options: ClassificationOptions): void {
    this.classificationOptions = options;
    this.requiredReadingsCount = options.readingsCount || 8;
    console.log(`[SessionService] Custom classification options set`, options);
  }

  async startSession(): Promise<void> {
    let location: { latitude: number; longitude: number } | undefined = undefined;

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

    // Clear any existing readings
    this.altitudeReadings.set([]);

    await this.startAltitudeRecording();
    console.log(`[SessionService] Session started with adaptive classification (starts with 8 readings, auto-adjusts based on activity)`);
  }

  recordEvent = (event: ClimbEvent): void => {
    const current = this.session();

    // Ensure session has started
    if (!current?.events?.some((e) => e.type === 'session-started')) {
      console.warn('Cannot record event: session has not started.');
      return;
    }

    // Prevent recording after session ended
    if (current.events.some((e) => e.type === 'session-ended')) {
      console.warn('Cannot record event: session has ended.');
      return;
    }

    if (event.altitude === undefined || event.altitude === null) {
      const lastAltitude = this.altService.lastAltitude;
      if (lastAltitude !== null && lastAltitude !== undefined) {
        event.altitude = lastAltitude;
      } else {
        console.warn(
          'No barometer reading available for event, altitude remains undefined.'
        );
      }
    }

    this.session.update((session) => {
      if (!session) return session;
      return {
        ...session,
        events: [...session.events, event],
      };
    });

    console.log(`[SessionService] Event recorded:`, event);
  };

  endSession(): void {
    console.log('SessionService: endSession called');

    const endEvent: ClimbEvent = {
      id: crypto.randomUUID(),
      time: new Date(),
      type: 'session-ended',
    };
    this.recordEvent(endEvent);

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
    this.altitudeReadings.set([]);
    this.stopAltitudeRecording();
  }

  private async startAltitudeRecording(): Promise<void> {
    await this.altService.startRecording();

    this.altitudeSub = this.altService.altitude$.subscribe((alt) => {
      if (alt !== null) {
        this.lastAltitude = alt;

        // Add new reading with timestamp
        const newReading: AltitudeReading = {
          time: new Date(),
          altitude: alt
        };

        this.altitudeReadings.update((readings) => [...readings, newReading]);

        // Check if we have enough readings for classification
        if (this.altitudeReadings().length >= this.requiredReadingsCount) {
          this.classifyAltitudeEvents(this.altitudeReadings());
        }
      }
    });
  }

  private stopAltitudeRecording(): void {
    this.altitudeSub?.unsubscribe();
    this.altitudeSub = null;
    this.altService.stopRecording();
  }

  private classifyAltitudeEvents(readings: AltitudeReading[]): void {
    // Use the exact number of readings required for classification
    const window = readings.slice(-this.requiredReadingsCount);

    console.log(`[SessionService] Attempting classification with ${window.length} readings`);

    const event = this.classifierService.createEventFromReadings(window, this.classificationOptions);

    if (event) {
      // Event detected - record it and clear buffer to avoid duplicates
      console.log(`[SessionService] Event detected and recorded:`, event);
      this.recordEvent(event);
      this.altitudeReadings.set([]);
    } else {
      // No event detected - slide the window by removing older readings
      // Keep more readings in buffer to maintain overlapping windows
      const keepCount = Math.max(1, this.requiredReadingsCount - 2);
      this.altitudeReadings.set(readings.slice(-keepCount));
    }
  }


  getCurrentReadingsCount(): number {
    return this.altitudeReadings().length;
  }


  getCurrentClassificationOptions(): ClassificationOptions {
    return { ...this.classificationOptions };
  }


  getCurrentReadings(): AltitudeReading[] {
    return [...this.altitudeReadings()];
  }
}
