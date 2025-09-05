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
  /** Number of readings to use for classification. */
  readingsCount?: number;
}

@Injectable({ providedIn: 'root' })
export class EventClassificationService {
  private readonly DEFAULT_NOISE_THRESHOLD = 0.4;
  private readonly DEFAULT_FALL_DROP = 0.4;
  private readonly DEFAULT_READINGS_COUNT = 8; // Increased from 5
  private readonly DEFAULT_REST_MAX_CHANGE = 0.25;

  private smoothReadings(readings: AltitudeReading[]): AltitudeReading[] {
    if (readings.length < 3) return readings;

    const smoothed = [readings[0]]; // Keep first reading as-is

    for (let i = 1; i < readings.length - 1; i++) {
      const avg = (readings[i - 1].altitude + readings[i].altitude + readings[i + 1].altitude) / 3;
      smoothed.push({
        ...readings[i],
        altitude: avg
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

  private detectRest(readings: AltitudeReading[], restMaxChange: number): boolean {
    // Check time span - rest should happen within reasonable time
    const timeSpan = Number(readings[readings.length - 1].time) - Number(readings[0].time);
    if (timeSpan > 8000) { // More than 8 seconds is too long for rest
      return false;
    }

    // Calculate standard deviation to measure stability
    const altitudes = readings.map(r => r.altitude);
    const mean = altitudes.reduce((sum, alt) => sum + alt, 0) / altitudes.length;
    const variance = altitudes.reduce((sum, alt) => sum + Math.pow(alt - mean, 2), 0) / altitudes.length;
    const stdDev = Math.sqrt(variance);

    // For rest, standard deviation should be very low
    return stdDev <= restMaxChange;
  }

  private detectFall(deltas: number[], fallDrop: number, noiseThresh: number): boolean {
    if (deltas.length < 4) return false;

    // Look for pattern: climb -> significant drop -> recovery/stabilization
    const firstHalf = Math.floor(deltas.length / 2);
    const climbPhase = deltas.slice(0, firstHalf);
    const fallPhase = deltas.slice(firstHalf);

    // Check for initial climbing (at least some positive movement)
    const hasClimb = climbPhase.some(d => d > noiseThresh);
    if (!hasClimb) return false;

    // Look for significant drop
    const hasSignificantDrop = fallPhase.some(d => d <= -fallDrop);
    if (!hasSignificantDrop) return false;

    // Check that the drop is followed by less severe changes (recovery)
    const dropIndex = fallPhase.findIndex(d => d <= -fallDrop);
    if (dropIndex === -1 || dropIndex === fallPhase.length - 1) return false;

    const afterDrop = fallPhase.slice(dropIndex + 1);
    const hasRecovery = afterDrop.every(d => d > -fallDrop);

    return hasRecovery;
  }

  private detectRetreat(deltas: number[], noiseThresh: number): boolean {
    if (deltas.length < 4) return false;

    // Split into decline and stabilization phases
    const declineCount = Math.ceil(deltas.length * 0.6); // First 60% should decline
    const declinePhase = deltas.slice(0, declineCount);
    const stabilizationPhase = deltas.slice(declineCount);

    // Check for consistent decline (most readings should be negative)
    const negativeCount = declinePhase.filter(d => d < -noiseThresh / 2).length;
    const declineRatio = negativeCount / declinePhase.length;

    if (declineRatio < 0.6) return false; // At least 60% should be declining

    // Check for stabilization (small changes)
    const stableCount = stabilizationPhase.filter(d => Math.abs(d) <= noiseThresh).length;
    const stabilizationRatio = stabilizationPhase.length > 0 ? stableCount / stabilizationPhase.length : 1;

    return stabilizationRatio >= 0.7; // At least 70% should be stable
  }

  classify(
    readings: AltitudeReading[],
    options: ClassificationOptions = {}
  ): ClassifiedType {
    const readingsCount = options.readingsCount ?? this.DEFAULT_READINGS_COUNT;

    if (!readings || readings.length !== readingsCount) {
      return null;
    }

    const fallDrop = options.fallDropThreshold ?? this.DEFAULT_FALL_DROP;
    const noiseThresh = options.allowedNoiseThreshold ?? this.DEFAULT_NOISE_THRESHOLD;
    const restMaxChange = options.restMaxChangeThreshold ?? this.DEFAULT_REST_MAX_CHANGE;

    // Apply smoothing to reduce sensor noise
    const smoothedReadings = this.smoothReadings(readings);

    // Sort by time to ensure proper sequence
    const sortedReadings = [...smoothedReadings].sort((a, b) =>
      Number(a.time) - Number(b.time)
    );

    // Check for rest first (most stable pattern)
    if (this.detectRest(sortedReadings, restMaxChange)) {
      return 'rest';
    }

    // Calculate deltas for pattern analysis
    const deltas = this.calculateDeltas(sortedReadings);

    // Check for fall and retreat patterns
    const isFall = this.detectFall(deltas, fallDrop, noiseThresh);
    const isRetreat = this.detectRetreat(deltas, noiseThresh);

    // Return single classification (prefer fall over retreat if both detected)
    if (isFall && !isRetreat) return 'fall';
    if (isRetreat && !isFall) return 'retreat';

    if (isFall && isRetreat) {
      // Both patterns detected - use total change to decide
      const totalChange = sortedReadings[sortedReadings.length - 1].altitude - sortedReadings[0].altitude;
      const maxDrop = Math.min(...deltas);

      // If there's a very significant single drop, it's likely a fall
      return Math.abs(maxDrop) > fallDrop * 1.5 ? 'fall' : 'retreat';
    }

    return null;
  }

  createEventFromReadings(
    readings: AltitudeReading[],
    options: ClassificationOptions = {}
  ): ClimbEvent | null {
    const type = this.classify(readings, options);
    if (!type) return null;

    const sortedReadings = [...readings].sort((a, b) => Number(a.time) - Number(b.time));
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

  getRecommendedOptions(scenario: 'sensitive' | 'balanced' | 'conservative'): ClassificationOptions {
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
