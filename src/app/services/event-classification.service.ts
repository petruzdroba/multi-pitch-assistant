import { Injectable } from '@angular/core';
import { ClimbEvent } from '../models/climb-event.interface';
import { AltitudeReading } from '../models/altitude-reading.interface';

export type ClassifiedType = 'fall' | 'retreat' | null;

export interface ClassificationOptions {
  /** Minimum drop in one reading to be considered a fall (meters). */
  fallDropThreshold?: number;
  /** Minimum overall altitude change to ignore as noise (meters). */
  allowedNoiseThreshold?: number;
}

@Injectable({ providedIn: 'root' })
export class EventClassificationService {
  // Default thresholds
  private readonly DEFAULT_NOISE_THRESHOLD = 0.5; // changes smaller than this are noise
  private readonly DEFAULT_FALL_DROP = 0.5; // drop >= this threshold defines a fall
  private readonly FLAT_THRESHOLD = 1; // allowable noise when checking decline
  private readonly READINGS_COUNT = 5;

  /**
   * Classify five altitude readings into 'fall' or 'retreat'.
   * Options allow customizing thresholds:
   * - fallDropThreshold: override min single-step drop for a fall
   * - allowedNoiseThreshold: override min change considered as event
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

    // Compute pairwise deltas: reading[i+1] - reading[i]
    const deltas = readings
      .slice(1)
      .map((r, i) => r.altitude - readings[i].altitude);

    // Quick noise check: ignore if all changes are within noise threshold
    if (deltas.every((d) => Math.abs(d) < noiseThresh)) {
      return null;
    }

    // 1) Detect fall: any single-step drop >= fallDrop, then no further drops >= fallDrop
    const fallIndex = deltas.findIndex((d) => d <= -fallDrop);
    if (fallIndex !== -1) {
      const subsequent = deltas.slice(fallIndex + 1);
      if (subsequent.every((d) => d > -fallDrop)) {
        return 'fall';
      }
    }

    // 2) Detect retreat: no single drop >= fallDrop AND strictly (or flat) declining overall
    const noBigDrops = deltas.every((d) => d > -fallDrop);
    const monotonicOrFlat = readings
      .slice(1)
      .every(
        (r, i) => r.altitude <= readings[i].altitude + this.FLAT_THRESHOLD
      );
    if (noBigDrops && monotonicOrFlat) {
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
