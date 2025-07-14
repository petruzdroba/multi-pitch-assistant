import { Component, inject } from '@angular/core';
import { IonButton } from '@ionic/angular/standalone';
import { SessionService } from 'src/app/services/session.service';

@Component({
  selector: 'app-session',
  templateUrl: './session.component.html',
  styleUrls: ['./session.component.css'],
  imports: [IonButton],
})
export class SessionComponent {
  private sessionService = inject(SessionService);
  startState: boolean = false;

  onStartSession() {
    console.log('Starting session...');
    this.startState = !this.startState;
    this.sessionService.startSession();
  }

  onEndSession() {
    console.log('Ending session...');
    this.startState = !this.startState;
    this.sessionService.endSession();
  }
}
