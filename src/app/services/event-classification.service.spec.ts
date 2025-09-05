import { TestBed } from '@angular/core/testing';
import { EventClassificationService } from './event-classification.service';
import { AltitudeReading } from '../models/altitude-reading.interface';

describe('EventClassificationService (strict-match tests)', () => {
  let service: EventClassificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventClassificationService);
  });

  const createReadings = (altitudes: number[]): AltitudeReading[] =>
    altitudes.map((alt, i) => ({
      altitude: alt,
      time: new Date(2024, 0, 1, 12, 0, i),
    }));

  it('classifies fall (initial climb then a significant drop)', () => {
    const readings = createReadings([0.0, 0.0, 0.0, 0.0, 0.75, 0.0, 1.5, 0.0]);
    expect(service.classify(readings)).toBe('fall');
  });

  it('classifies retreat (consistent decline then stabilization)', () => {
    const readings = createReadings([
      0.0, 0.75, 0.75, 0.75, 0.0, 0.0, 0.0, 0.0,
    ]);
    expect(service.classify(readings)).toBe('retreat');
  });

  it('classifies rest for perfectly stable readings', () => {
    const readings = createReadings([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]);
    expect(service.classify(readings)).toBe('rest');
  });

  it('returns null for noisy/alternating readings that match nothing', () => {
    const readings = createReadings([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0]);
    expect(service.classify(readings)).toBeNull();
  });

  it('createEventFromReadings returns a fall event when fall is detected', () => {
    const readings = createReadings([0.0, 0.0, 0.0, 0.0, 0.75, 0.0, 1.5, 0.0]);
    const ev = service.createEventFromReadings(readings);
    expect(ev).toBeTruthy();
    expect(ev?.type).toBe('fall');
    expect(ev?.altitude).toBe(readings[7].altitude);
    expect(ev?.time).toEqual(readings[7].time);
  });

  it('createEventFromReadings returns a retreat event when retreat is detected', () => {
    const readings = createReadings([
      0.0, 0.75, 0.75, 0.75, 0.0, 0.0, 0.0, 0.0,
    ]);
    const ev = service.createEventFromReadings(readings);
    expect(ev).toBeTruthy();
    expect(ev?.type).toBe('retreat');
    expect(ev?.altitude).toBe(readings[7].altitude);
  });

  it('createEventFromReadings returns a rest event when rest is detected', () => {
    const readings = createReadings([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]);
    const ev = service.createEventFromReadings(readings);
    expect(ev).toBeTruthy();
    expect(ev?.type).toBe('rest');
  });

  it('createEventFromReadings returns null when no classification applies', () => {
    const readings = createReadings([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0]);
    const ev = service.createEventFromReadings(readings);
    expect(ev).toBeNull();
  });

  it('getDefaultReadingsCount returns 8', () => {
    expect(service.getDefaultReadingsCount()).toBe(8);
  });

  // --- detectFall tests ---

  it('detectFall should return true for a small climb followed by a drop', () => {
    const service = new EventClassificationService();
    const deltas = [0.25, 0.1, -0.5, -0.1, 0]; // first half has climb >= 0.2
    const result = (service as any).detectFall(deltas, 0.4, 0.4);
    expect(result).toBeTrue();
  });

  it('detectFall should return false if no climb in first half', () => {
    const service = new EventClassificationService();
    const deltas = [0.1, 0.05, -0.5, -0.1, 0]; // climb too small
    const result = (service as any).detectFall(deltas, 0.4, 0.4);
    expect(result).toBeFalse();
  });

  // --- detectRetreat tests ---

  it('detectRetreat should return true for consistent decline followed by stabilization', () => {
    const service = new EventClassificationService();
    const deltas = [-0.25, -0.3, -0.35, -0.3, -0.25, 0.05, 0.0, -0.05]; // first 60% declining, last 40% stable
    const result = (service as any).detectRetreat(deltas, 0.4);
    expect(result).toBeTrue();
  });

  it('detectRetreat should return false if decline is insufficient', () => {
    const service = new EventClassificationService();
    const deltas = [-0.1, -0.05, -0.05, -0.1, -0.05, 0.05, 0.0, -0.05]; // first 60% not enough negative
    const result = (service as any).detectRetreat(deltas, 0.4);
    expect(result).toBeFalse();
  });
});
