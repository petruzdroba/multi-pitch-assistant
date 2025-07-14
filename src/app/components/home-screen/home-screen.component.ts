import { Component, inject } from '@angular/core';
import { SessionService } from 'src/app/services/session.service';
import { IonButton } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home-screen',
  templateUrl: './home-screen.component.html',
  styleUrls: ['./home-screen.component.css'],
  imports: [IonButton],
})
export class HomeScreenComponent {
  private sessionService = inject(SessionService);
  private routerService = inject(Router);
  loading: boolean = false;

  onStartSession() {
    console.log('Starting session...');
    this.loading = true;

    setTimeout(() => {
      this.sessionService.startSession();
      this.routerService.navigate(['/tabs/session']);
      this.loading = false;
    }, 1000);
  }
}
