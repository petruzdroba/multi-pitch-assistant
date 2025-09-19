import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Barometer } from 'capacitor-barometer';

@Injectable({ providedIn: 'root' })
export class AltitudeRecorderService {
  private altitudeSubject = new BehaviorSubject<number | null>(null);
  altitude$ = this.altitudeSubject.asObservable();

  private barometerListener: any = null;
  private lastEmittedAltitude: number | null = null;
  private lastEmissionTime = 0;
  private baselinePressure: number | null = null;

  private THROTTLE_INTERVAL_MS = 750;
  private MIN_ALTITUDE_CHANGE = 0.25;

  get lastAltitude(): number | null {
    return this.altitudeSubject.getValue();
  }

  async startRecording(): Promise<void> {
    try {
      const { available } = await Barometer.isAvailable();
      if (!available) {
        console.warn('[AltitudeRecorderService] Barometer not available');
        return;
      }

      if (!this.barometerListener) {
        this.barometerListener = await Barometer.addListener(
          'onPressureChange',
          (data: any) => {
            const pressure = data.pressure;

            if (
              typeof pressure === 'number' &&
              pressure > 300 &&
              pressure < 1100
            ) {
              // Set baselinePressure on first reading
              if (this.baselinePressure === null) {
                this.baselinePressure = pressure;
                console.debug(
                  `[AltitudeRecorderService] Baseline pressure set to ${pressure} hPa`
                );
                // Emit zero altitude at baseline
                this.altitudeSubject.next(0);
                this.lastEmittedAltitude = 0;
                this.lastEmissionTime = Date.now();
                return;
              }

              // Calculate altitude relative to baseline
              const altitude = this.convertPressureToRelativeAltitude(pressure);
              const now = Date.now();
              const timeSinceLast = now - this.lastEmissionTime;

              // Emit based on time interval or significant change
              let shouldEmit = false;
              let emissionReason = '';

              // Always emit after throttle interval
              if (timeSinceLast >= this.THROTTLE_INTERVAL_MS) {
                shouldEmit = true;
                emissionReason = 'time-based';
              }
              // Also emit immediately on significant changes
              else if (
                this.lastEmittedAltitude !== null &&
                Math.abs(altitude - this.lastEmittedAltitude) >= this.MIN_ALTITUDE_CHANGE
              ) {
                shouldEmit = true;
                emissionReason = 'change-based';
              }

              if (shouldEmit) {
                this.lastEmittedAltitude = altitude;
                this.lastEmissionTime = now;
                this.altitudeSubject.next(altitude);
                console.debug(
                  `[Barometer] ${emissionReason} emission: ${altitude.toFixed(2)} m`
                );
              }
            }
          }
        );
      }

      await Barometer.start();
      console.log('[AltitudeRecorderService] Recording started with optimized settings');
    } catch (err) {
      console.error(
        '[AltitudeRecorderService] Error starting barometer recording:',
        err
      );
    }
  }

  async stopRecording(): Promise<void> {
    try {
      await Barometer.stop();
      console.log('[AltitudeRecorderService] Recording stopped');
    } catch (err) {
      console.error('[AltitudeRecorderService] Error stopping barometer:', err);
    }

    if (this.barometerListener) {
      this.barometerListener.remove();
      this.barometerListener = null;
    }

    this.altitudeSubject.next(null);
    this.lastEmittedAltitude = null;
    this.lastEmissionTime = 0;
    this.baselinePressure = null;
  }

  // Calculate altitude difference relative to baseline pressure
  private convertPressureToRelativeAltitude(currentPressure: number): number {
    if (this.baselinePressure === null) {
      return 0;
    }
    return (
      44330 * (1 - Math.pow(currentPressure / this.baselinePressure, 1 / 5.255))
    );
  }
}
