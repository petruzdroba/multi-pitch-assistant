import { Injectable } from '@angular/core';
import { ClimbEvent } from '../models/climb-event.interface';
import { AltitudeReading } from '../models/altitude-reading.interface';

export type ClassifiedType = 'fall' | 'retreat' | 'rest' | null;

export interface ClassificationOptions {
  /** Minimum drop in one reading to be considered a fall (meters). */
  fallDropThreshold?: number;
  /** Minimum overall altitude change to ignore as noise (meters). */
  allowedNoiseThreshold?: number;
  /** Maximum altitude change to be considered a rest (meters). */
  restMaxChangeThreshold?: number;
}

@Injectable({ providedIn: 'root' })
export class EventClassificationService {
  private readonly DEFAULT_NOISE_THRESHOLD = 0.5;
  private readonly DEFAULT_FALL_DROP = 0.5;
  private readonly READINGS_COUNT = 5;
  private readonly DEFAULT_REST_MAX_CHANGE = 0.3; // 5cm max difference for rest

  private detectRest(
    readings: AltitudeReading[],
    restMaxChange: number
  ): boolean {
    // For rest, all readings should be very close to first reading
    const firstAlt = readings[0].altitude;
    return readings.every(
      (r) => Math.abs(r.altitude - firstAlt) <= restMaxChange
    );
  }

  private detectFall(
    deltas: number[],
    fallDrop: number,
    noiseThresh: number
  ): boolean {
    const firstClimb = deltas[0] > noiseThresh;
    const dropIndex = deltas.findIndex((d, i) => i > 0 && d <= -fallDrop);

    if (!firstClimb || dropIndex === -1) return false;

    const afterDrop = deltas.slice(dropIndex + 1);
    return afterDrop.every((d) => d > -fallDrop);
  }

  private detectRetreat(deltas: number[], noiseThresh: number): boolean {
    // First three deltas must show decline
    const firstThreeDeltas = deltas.slice(0, 3);
    const finalDeltas = deltas.slice(3);

    // Check for consistent decline in first three deltas
    const consistentDecline = firstThreeDeltas.every((d) => d < 0);

    // Last deltas should be flat (within noise threshold)
    const endsFlat = finalDeltas.every((d) => Math.abs(d) <= noiseThresh);

    return consistentDecline && endsFlat;
  }

  /**
   * Classify five altitude readings into 'fall', 'retreat', or 'rest'.
   * Options allow customizing thresholds:
   * - fallDropThreshold: override min single-step drop for a fall
   * - allowedNoiseThreshold: override min change considered as event
   * - restMaxChangeThreshold: override max change for rest
   */
  classify(
    readings: AltitudeReading[],
    options: ClassificationOptions = {}
  ): ClassifiedType {
    if (!readings || readings.length !== this.READINGS_COUNT) {
      return null;
    }

    const fallDrop = options.fallDropThreshold ?? this.DEFAULT_FALL_DROP;
    const noiseThresh =
      options.allowedNoiseThreshold ?? this.DEFAULT_NOISE_THRESHOLD;
    const restMaxChange =
      options.restMaxChangeThreshold ?? this.DEFAULT_REST_MAX_CHANGE;

    // Check rest first and ensure all readings are within 1 second of each other
    if (this.detectRest(readings, restMaxChange)) {
      const timeSpan =
        Number(readings[readings.length - 1].time) - Number(readings[0].time);
      if (timeSpan <= 5000) {
        // 5 seconds in milliseconds
        return 'rest';
      }
    }

    const deltas = readings
      .slice(1)
      .map((r, i) => r.altitude - readings[i].altitude);

    const isFall = this.detectFall(deltas, fallDrop, noiseThresh);
    const isRetreat = this.detectRetreat(deltas, noiseThresh);

    if (isFall && !isRetreat) return 'fall';
    if (isRetreat && !isFall) return 'retreat';
    if (isRetreat && isFall) {
      // If both patterns match, prefer retreat if the drops are smaller
      const maxDrop = Math.min(...deltas);
      return Math.abs(maxDrop) <= fallDrop ? 'retreat' : 'fall';
    }

    return null;
  }

  /**
   * From five readings, produce a ClimbEvent if classification matches.
   * Pass options to customize thresholds.
   */
  createEventFromReadings(
    readings: AltitudeReading[],
    options: ClassificationOptions = {}
  ): ClimbEvent | null {
    const type = this.classify(readings, options);
    if (!type) return null;

    const last = readings[readings.length - 1];
    return {
      id: crypto.randomUUID(),
      time: last.time,
      altitude: last.altitude,
      type,
    };
  }
}
