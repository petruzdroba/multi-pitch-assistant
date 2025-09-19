import { Injectable } from '@angular/core';
import { ClimbEvent } from '../models/climb-event.interface';
import { AltitudeReading } from '../models/altitude-reading.interface';

export type ClassifiedType =
  | 'fall'
  | 'retreat'
  | 'rest'
  | 'pitch-changed'
  | null;

export interface ClassificationOptions {
  /** Minimum drop in one reading to be considered a fall (meters). */
  fallDropThreshold?: number;
  /** Minimum overall altitude change to ignore as noise (meters). */
  allowedNoiseThreshold?: number;
  /** Maximum altitude change to be considered a rest (meters). */
  restMaxChangeThreshold?: number;
  /** Number of readings to use for classification. */
  readingsCount?: number;

  pitchChangeAltitudeThreshold?: number;
  /** Minimum rest time after climb to confirm pitch change (seconds). */
  pitchChangeRestTimeThreshold?: number;
}

@Injectable({ providedIn: 'root' })
export class EventClassificationService {
  private readonly DEFAULT_NOISE_THRESHOLD = 0.4;
  private readonly DEFAULT_FALL_DROP = 0.4;
  private readonly DEFAULT_READINGS_COUNT = 8; // Increased from 5
  private readonly DEFAULT_REST_MAX_CHANGE = 0.25;
  private readonly DEFAULT_PITCH_ALTITUDE_THRESHOLD = 8; // meters
  private readonly DEFAULT_PITCH_REST_TIME_THRESHOLD = 10; // seconds

  private smoothReadings(readings: AltitudeReading[]): AltitudeReading[] {
    if (readings.length < 3) return readings;

    const smoothed = [readings[0]]; // Keep first reading as-is

    for (let i = 1; i < readings.length - 1; i++) {
      const avg =
        (readings[i - 1].altitude +
          readings[i].altitude +
          readings[i + 1].altitude) /
        3;
      smoothed.push({
        ...readings[i],
        altitude: avg,
      });
    }

    smoothed.push(readings[readings.length - 1]); // Keep last reading as-is
    return smoothed;
  }

  private calculateDeltas(readings: AltitudeReading[]): number[] {
    const deltas: number[] = [];
    for (let i = 1; i < readings.length; i++) {
      deltas.push(readings[i].altitude - readings[i - 1].altitude);
    }
    return deltas;
  }

  private detectRest(
    readings: AltitudeReading[],
    restMaxChange: number
  ): boolean {
    // Check time span - rest should happen within reasonable time
    const timeSpan =
      Number(readings[readings.length - 1].time) - Number(readings[0].time);
    if (timeSpan > 8000) {
      // More than 8 seconds is too long for rest
      return false;
    }

    // Calculate standard deviation to measure stability
    const altitudes = readings.map((r) => r.altitude);
    const mean =
      altitudes.reduce((sum, alt) => sum + alt, 0) / altitudes.length;
    const variance =
      altitudes.reduce((sum, alt) => sum + Math.pow(alt - mean, 2), 0) /
      altitudes.length;
    const stdDev = Math.sqrt(variance);

    // For rest, standard deviation should be very low
    return stdDev <= restMaxChange;
  }

  private detectFall(
    deltas: number[],
    fallDrop: number,
    noiseThresh: number
  ): boolean {
    if (deltas.length < 4) return false;

    // Require some initial climb (first half of readings) above a minimal threshold
    const firstHalf = Math.floor(deltas.length / 2);
    const climbPhase = deltas.slice(0, firstHalf);
    const hasClimb = climbPhase.some((d) => d > noiseThresh / 2); // permissive: half of noiseThresh
    if (!hasClimb) return false;

    // Look for any significant drop beyond noise threshold
    const dropIndex = deltas.findIndex(
      (d) => d <= -fallDrop && d <= -noiseThresh
    );
    if (dropIndex === -1) return false;

    // No recovery requirement — falling means you stay down
    return true;
  }

  private detectRetreat(deltas: number[], noiseThresh: number): boolean {
    if (deltas.length < 4) return false;

    // Split into decline and stabilization phases
    const declineCount = Math.ceil(deltas.length * 0.6); // First 60% should decline
    const declinePhase = deltas.slice(0, declineCount);
    const stabilizationPhase = deltas.slice(declineCount);

    // Check for consistent decline (most readings should be negative)
    const negativeCount = declinePhase.filter(
      (d) => d < -noiseThresh / 2
    ).length;
    const declineRatio = negativeCount / declinePhase.length;

    if (declineRatio < 0.6) return false; // At least 60% should be declining

    // Check for stabilization (small changes)
    const stableCount = stabilizationPhase.filter(
      (d) => Math.abs(d) <= noiseThresh
    ).length;
    const stabilizationRatio =
      stabilizationPhase.length > 0
        ? stableCount / stabilizationPhase.length
        : 1;

    return stabilizationRatio >= 0.7; // At least 70% should be stable
  }

  private detectPitchChange(
    readings: AltitudeReading[],
    altitudeThreshold: number,
    restTimeThreshold: number
  ): boolean {
    if (readings.length < 6) return false;

    const totalGain =
      readings[readings.length - 1].altitude - readings[0].altitude;
    if (totalGain < altitudeThreshold) return false;

    const midPoint = Math.floor(readings.length * 0.6);
    const climbPhase = readings.slice(0, midPoint);
    const restPhase = readings.slice(midPoint);

    const climbGain =
      climbPhase[climbPhase.length - 1].altitude - climbPhase[0].altitude;
    if (climbGain / totalGain < 0.7) return false;

    if (restPhase.length < 3) return false;
    const restAltitudes = restPhase.map((r) => r.altitude);
    const restVariation =
      Math.max(...restAltitudes) - Math.min(...restAltitudes);
    if (restVariation > 1.5) return false;

    const restDuration =
      Number(restPhase[restPhase.length - 1].time) - Number(restPhase[0].time);
    if (restDuration / 1000 < restTimeThreshold) return false;

    return true;
  }

  classify(
    readings: AltitudeReading[],
    options: ClassificationOptions = {}
  ): ClassifiedType {
    const expectedCount = options.readingsCount ?? this.DEFAULT_READINGS_COUNT;
    if (!readings || readings.length !== expectedCount) {
      return null;
    }

    const fallDrop = options.fallDropThreshold ?? this.DEFAULT_FALL_DROP;
    const noiseThresh =
      options.allowedNoiseThreshold ?? this.DEFAULT_NOISE_THRESHOLD;
    const restMaxChange =
      options.restMaxChangeThreshold ?? this.DEFAULT_REST_MAX_CHANGE;
    const pitchAltThresh =
      options.pitchChangeAltitudeThreshold ??
      this.DEFAULT_PITCH_ALTITUDE_THRESHOLD;
    const pitchRestThresh =
      options.pitchChangeRestTimeThreshold ??
      this.DEFAULT_PITCH_REST_TIME_THRESHOLD;

    const smoothed = this.smoothReadings(readings);
    const sorted = [...smoothed].sort(
      (a, b) => Number(a.time) - Number(b.time)
    );
    const deltas = this.calculateDeltas(sorted);


    if (this.detectRest(sorted, restMaxChange)) {
      return 'rest';
    }

    if (this.detectFall(deltas, fallDrop, noiseThresh)) {
      return 'fall';
    }

    if (this.detectPitchChange(sorted, pitchAltThresh, pitchRestThresh)) {
      return 'pitch-changed';
    }

    if (this.detectRetreat(deltas, noiseThresh)) {
      return 'retreat';
    }

    return null;
  }

  createEventFromReadings(
    readings: AltitudeReading[],
    options: ClassificationOptions = {}
  ): ClimbEvent | null {
    const type = this.classify(readings, options);
    if (!type) return null;

    const sortedReadings = [...readings].sort(
      (a, b) => Number(a.time) - Number(b.time)
    );
    const last = sortedReadings[sortedReadings.length - 1];

    return {
      id: crypto.randomUUID(),
      time: last.time,
      altitude: last.altitude,
      type,
    };
  }

  getDefaultReadingsCount(): number {
    return this.DEFAULT_READINGS_COUNT;
  }

  getRecommendedOptions(
    scenario: 'sensitive' | 'balanced' | 'conservative'
  ): ClassificationOptions {
    switch (scenario) {
      case 'sensitive':
        return {
          readingsCount: 8,
          fallDropThreshold: 0.3,
          allowedNoiseThreshold: 0.3,
          restMaxChangeThreshold: 0.2,
        };
      case 'balanced':
        return {
          readingsCount: 8,
          fallDropThreshold: 0.4,
          allowedNoiseThreshold: 0.4,
          restMaxChangeThreshold: 0.25,
        };
      case 'conservative':
        return {
          readingsCount: 10,
          fallDropThreshold: 0.6,
          allowedNoiseThreshold: 0.5,
          restMaxChangeThreshold: 0.3,
        };
      default:
        return {};
    }
  }
}
