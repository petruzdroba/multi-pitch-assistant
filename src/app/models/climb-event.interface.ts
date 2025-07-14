export interface ClimbEvent {
  id: string;
  time: Date;
  type:
    | 'session-started'
    | 'session-ended'
    | 'fall'
    | 'fall-arrested'
    | 'pitch-changed'
    | 'rest'
    | 'retreat'
    | 'manual-note'
    | 'lead-started'
    | 'lead-ended'
    | 'second-started'
    | 'second-ended'
    | 'error'
    | 'belay';
  notes?: string; // post climb notes
}
