import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Session } from 'src/app/models/session.interface';
import { LogService } from 'src/app/services/log.service';
import { IonProgressBar, IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-session-details',
  templateUrl: './session-details.component.html',
  styleUrls: ['./session-details.component.css'],
  imports: [IonProgressBar, IonButton],
})
export class SessionDetailsComponent implements OnInit {
  private logService = inject(LogService);
  private routerService = inject(Router);

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

  onCancel() {
    this.routerService.navigate(['/tabs/log'], { replaceUrl: true });
  }
}
