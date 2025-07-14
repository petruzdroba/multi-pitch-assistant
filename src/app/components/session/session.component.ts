import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
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
  private routerService = inject(Router);

  onEndSession() {
    console.log('Ending session...');
    this.sessionService.endSession();
    this.routerService.navigate(['/tabs/home']);
  }
}
