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

  private THROTTLE_INTERVAL_MS = 1000; // 1 second throttle
  private MIN_ALTITUDE_CHANGE = 0.49; // minimum meters change to emit

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

              // Always emit after throttle interval
              const now = Date.now();
              if (now - this.lastEmissionTime >= this.THROTTLE_INTERVAL_MS) {
                this.lastEmittedAltitude = altitude;
                this.lastEmissionTime = now;
                console.debug(
                  `[Barometer] Pressure: ${pressure} hPa => Relative Altitude: ${altitude.toFixed(
                    2
                  )} m`
                );
                this.altitudeSubject.next(altitude);
              }
            }
          }
        );
      }

      await Barometer.start();
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
    this.baselinePressure = null; // <-- reset baseline when stopping
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
