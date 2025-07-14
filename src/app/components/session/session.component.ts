import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton } from '@ionic/angular/standalone';
import { CanComponentDeactivate } from 'src/app/guards/session-exit.guard';
import { SessionService } from 'src/app/services/session.service';

@Component({
  selector: 'app-session',
  templateUrl: './session.component.html',
  styleUrls: ['./session.component.css'],
  imports: [IonButton],
})
export class SessionComponent implements CanComponentDeactivate {
  private sessionService = inject(SessionService);
  private routerService = inject(Router);
  private sessionEnded = false;

  canDeactivate(): boolean {
    return this.sessionEnded;
  }

  onEndSession() {
    console.log('Ending session...');
    this.sessionEnded = true;
    this.sessionService.endSession();
    this.routerService.navigate(['/tabs/home']);
  }
}
