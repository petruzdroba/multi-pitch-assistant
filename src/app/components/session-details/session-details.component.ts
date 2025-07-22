import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Session } from 'src/app/models/session.interface';
import { LogService } from 'src/app/services/log.service';

@Component({
  selector: 'app-session-details',
  templateUrl: './session-details.component.html',
  styleUrls: ['./session-details.component.css'],
})
export class SessionDetailsComponent implements OnInit {
  private logService = inject(LogService);
  loadedSession = signal<Session | undefined>(undefined);
  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const sessionId = params['id'];
      // Load session details using the ID
      this.loadedSession.set(this.logService.getSessionById(sessionId));
      if (!this.loadedSession()) {
        console.error('Session not found:', sessionId);
      }
    });
  }
}
