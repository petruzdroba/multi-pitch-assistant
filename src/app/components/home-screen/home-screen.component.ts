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

  async onStartSession() {
    console.log('Starting session...');
    this.loading = true;

    try {
      await this.sessionService.startSession();
      this.routerService.navigate(['/tabs/session']);
    } catch (error) {
      console.error('Failed to start session:', error);
      // Optionally notify user or handle error here
    } finally {
      this.loading = false;
    }
  }
}
