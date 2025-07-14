import { Component, inject } from '@angular/core';
import { SessionService } from 'src/app/services/session.service';
import { IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-home-screen',
  templateUrl: './home-screen.component.html',
  styleUrls: ['./home-screen.component.css'],
  imports: [IonButton],
})
export class HomeScreenComponent {
  private sessionService = inject(SessionService);

  onStartSession() {
    console.log('Starting session...');
    //add router change to a new tab
    this.sessionService.startSession();
  }
}
