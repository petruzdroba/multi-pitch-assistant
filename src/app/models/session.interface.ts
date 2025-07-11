import { ClimbEvent } from './climb-event.interface';

export interface Session {
  id: string;
  timeStart: Date;
  timeEnd: Date;
  events: ClimbEvent[];

  // Added after session ends:
  type?: 'sport' | 'trad' | 'undefined';
  location?: string;
  notes?: string;
  completed?: boolean;
  pitchCount?: number;
}
