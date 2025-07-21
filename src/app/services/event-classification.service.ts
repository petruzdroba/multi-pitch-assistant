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
  private readonly DEFAULT_REST_MAX_CHANGE = 0.1; // 10 cm

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

    // REST: Check if all readings are within restMaxChange of each other
    const altitudes = readings.map((r) => r.altitude);
    const maxAlt = Math.max(...altitudes);
    const minAlt = Math.min(...altitudes);
    if (maxAlt - minAlt <= restMaxChange) {
      return 'rest';
    }

    // Compute deltas between consecutive readings
    const deltas = readings
      .slice(1)
      .map((r, i) => r.altitude - readings[i].altitude);

    // Quick noise check
    if (deltas.every((d) => Math.abs(d) < noiseThresh)) {
      return null;
    }

    // FALL: Look for significant drop after first reading
    // First find a climb, then a drop
    const firstClimb = deltas[0] > noiseThresh;
    const dropIndex = deltas.findIndex((d, i) => i > 0 && d <= -fallDrop);

    if (firstClimb && dropIndex !== -1) {
      // Check that subsequent readings don't show another big drop
      const afterDrop = deltas.slice(dropIndex + 1);
      if (afterDrop.every((d) => d > -fallDrop)) {
        return 'fall';
      }
    }

    // RETREAT: Check for consistent decline in first 3 readings, then flat
    const firstThreeDeltas = deltas.slice(0, 2); // Only need first 2 deltas to check 3 readings
    const lastDelta = deltas[2]; // Third reading's delta
    const finalDeltas = deltas.slice(2); // Last two transitions

    // First three readings must show decline (-ve deltas)
    const consistentDecline = firstThreeDeltas.every((d) => d < -noiseThresh);

    // Last two readings should be approximately equal (flat)
    const endsFlat = finalDeltas.every((d) => Math.abs(d) <= noiseThresh);

    if (consistentDecline && endsFlat) {
      return 'retreat';
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
