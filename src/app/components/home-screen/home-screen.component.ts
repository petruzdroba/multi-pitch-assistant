import { Component, inject, ViewEncapsulation } from '@angular/core';
import { SessionService } from 'src/app/services/session.service';
import { Router } from '@angular/router';
import { IonCard, IonCardHeader, IonCardContent, IonCardTitle } from "@ionic/angular/standalone";

@Component({
  selector: 'app-home-screen',
  templateUrl: './home-screen.component.html',
  styleUrls: ['./home-screen.component.css'],
  encapsulation: ViewEncapsulation.None,
  imports: [IonCard, IonCardHeader, IonCardContent, IonCardTitle],
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
