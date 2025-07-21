import { ClimbEvent } from './climb-event.interface';

export interface Session {
  id: string;
  timeStart: Date;
  timeEnd: Date;
  events: ClimbEvent[];

  // Added after session ends:
  name?:string;//To be added instead of climb on date
  type?: 'sport' | 'trad' | 'undefined';
  location?: { latitude: number; longitude: number };
  notes?: string;
  completed?: boolean;
  pitchCount?: number;
}
