import { Injectable } from '@angular/core';
import { ClimbEvent } from '../models/climb-event.interface';

export interface AltitudeReading {
  altitude: number;
  time: Date;
}

export type ClassifiedType = 'fall' | 'pitch-changed' | 'retreat' | null;

@Injectable({ providedIn: 'root' })
export class EventClassificationService {
  // Thresholds in meters
  private readonly FALL_THRESHOLD = 5; // drop >5m => fall
  private readonly PITCH_THRESHOLD = 10; // gain >10m => pitch change
  private readonly RETREAT_THRESHOLD = 2; // drop between 2m and FALL_THRESHOLD => retreat

  classify(readings: AltitudeReading[]): ClassifiedType {
    if (!readings || readings.length !== 3) {
      return null;
    }

    const first = readings[0].altitude;
    const last = readings[2].altitude;
    const delta = last - first;

    if (delta <= -this.FALL_THRESHOLD) {
      return 'fall';
    }

    if (delta < -this.RETREAT_THRESHOLD) {
      return 'retreat';
    }

    if (delta >= this.PITCH_THRESHOLD) {
      return 'pitch-changed';
    }

    return null;
  }

  createEventFromReadings(readings: AltitudeReading[]): ClimbEvent | null {
    const type = this.classify(readings);
    if (!type) return null;

    const event: ClimbEvent = {
      id: crypto.randomUUID(),
      time: readings[2].time,
      altitude: readings[2].altitude,
      type,
    };
    return event;
  }
}
