import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Barometer } from 'capacitor-barometer';

@Injectable({ providedIn: 'root' })
export class AltitudeRecorderService {
  private altitudeSubject = new BehaviorSubject<number | null>(null);
  altitude$ = this.altitudeSubject.asObservable();

  private barometerListener: any = null;

  async startRecording(): Promise<void> {
    try {
      const { available } = await Barometer.isAvailable();
      if (!available) {
        console.warn('[AltitudeRecorderService] Barometer not available');
        return;
      }

      // Register listener if not already registered
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
              const altitude = this.convertPressureToAltitude(pressure);
              console.debug(
                `[Barometer] Pressure: ${pressure} hPa => Altitude: ${altitude.toFixed(
                  2
                )} m`
              );
              this.altitudeSubject.next(altitude);
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
  }

  private convertPressureToAltitude(pressure: number): number {
    // Standard barometric formula
    const seaLevelPressure = 1013.25; // hPa
    return 44330 * (1 - Math.pow(pressure / seaLevelPressure, 1 / 5.255));
  }
}
