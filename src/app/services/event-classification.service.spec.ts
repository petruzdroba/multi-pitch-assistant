// import { TestBed } from '@angular/core/testing';
// import { EventClassificationService } from './event-classification.service';
// import { AltitudeReading } from '../models/altitude-reading.interface';

// describe('EventClassificationService', () => {
//   let service: EventClassificationService;

//   beforeEach(() => {
//     TestBed.configureTestingModule({});
//     service = TestBed.inject(EventClassificationService);
//   });

//   const createReadings = (altitudes: number[]): AltitudeReading[] => {
//     return altitudes.map((alt, i) => ({
//       altitude: alt,
//       time: new Date(2024, 0, 1, 12, 0, i),
//     }));
//   };

//   describe('classify', () => {
//     it('should detect a fall when altitude drops significantly after climbing', () => {
//       // Pattern: climb -> climb -> fall -> stabilize -> stabilize
//       const readings = createReadings([1, 2.5, 2.7, 1.2, 1.0]);
//       expect(service.classify(readings)).toBe('fall');
//     });

//     it('should detect a retreat when altitude consistently decreases', () => {
//       // Pattern: start -> decrease -> decrease -> decrease -> decrease
//       const readings = createReadings([1.0, 0.5, 0.25, 0.1, 0.0]);
//       expect(service.classify(readings)).toBe('retreat');
//     });

//     it('should detect a rest when altitude changes are minimal', () => {
//       // Pattern: small variations within 10cm
//       const readings = createReadings([1.0, 1.05, 1.02, 1.07, 1.03]);
//       expect(service.classify(readings)).toBe('rest');
//     });

//     it('should return null when changes are within noise threshold', () => {
//       const readings = createReadings([1.0, 1.1, 1.0, 1.1, 1.0]);
//       expect(service.classify(readings)).toBeNull();
//     });

//     it('should not detect fall if drop happens in first reading', () => {
//       // Pattern: drop -> stable -> stable -> stable -> stable
//       const readings = createReadings([2.0, 1.0, 1.1, 1.0, 1.1]);
//       expect(service.classify(readings)).not.toBe('fall');
//     });

//     it('should handle invalid input', () => {
//       expect(service.classify([])).toBeNull();
//       expect(service.classify([...createReadings([1, 2, 3])])).toBeNull(); // too few readings
//       expect(service.classify(null as any)).toBeNull();
//     });

//     it('should respect custom thresholds', () => {
//       const readings = createReadings([1.0, 1.15, 1.12, 1.18, 1.14]);
//       // Should be rest with default threshold (0.1m)
//       expect(service.classify(readings)).not.toBe('rest');
//       // Should be rest with custom threshold (0.2m)
//       expect(service.classify(readings, { restMaxChangeThreshold: 0.2 })).toBe(
//         'rest'
//       );
//     });

//     describe('partial pattern matches', () => {
//       // it('should detect retreat when first 3 readings show decline then stabilize', () => {
//       //   // Pattern: decline -> decline -> decline -> flat -> flat
//       //   const readings = createReadings([3.0, 2.5, 2.0, 2.0, 2.0]);
//       //   expect(service.classify(readings)).toBe('retreat');
//       // });

//       it('should detect fall when climbing then falling in first 3 readings', () => {
//         // Pattern: climb -> fall -> fall -> stable -> stable
//         const readings = createReadings([1.0, 2.5, 1.5, 1.5, 1.5]);
//         expect(service.classify(readings)).toBe('fall');
//       });

//       it('should detect rest when first 3 readings are stable then slight movement', () => {
//         // Pattern: stable -> stable -> stable -> small up -> small down
//         const readings = createReadings([1.0, 1.02, 1.01, 1.05, 1.02]);
//         expect(service.classify(readings)).toBe('rest');
//       });

//       it('should detect fall with recovery climb after', () => {
//         // Pattern: climb -> fall -> fall -> climb -> climb
//         const readings = createReadings([1.0, 2.5, 1.5, 2.0, 2.2]);
//         expect(service.classify(readings)).toBe('fall');
//       });
//     });
//   });

//   describe('createEventFromReadings', () => {
//     it('should create event with correct properties', () => {
//       const readings = createReadings([1.0, 2.5, 2.7, 1.2, 1.0]); // fall pattern
//       const event = service.createEventFromReadings(readings);

//       expect(event).toBeTruthy();
//       expect(event?.type).toBe('fall');
//       expect(event?.altitude).toBe(1.0); // last reading
//       expect(event?.time).toBe(readings[4].time);
//       expect(event?.id).toBeTruthy(); // UUID should be present
//     });

//     it('should return null when no event is classified', () => {
//       const readings = createReadings([1.0, 1.1, 1.0, 1.1, 1.0]); // noise pattern
//       expect(service.createEventFromReadings(readings)).toBeNull();
//     });
//   });
// });
