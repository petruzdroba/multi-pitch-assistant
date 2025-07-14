import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonList, IonItem } from '@ionic/angular/standalone';
import { CanComponentDeactivate } from 'src/app/guards/session-exit.guard';
import { SessionService } from 'src/app/services/session.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-session',
  templateUrl: './session.component.html',
  styleUrls: ['./session.component.css'],
  imports: [IonItem, IonList, IonButton, DatePipe, CommonModule],
})
export class SessionComponent implements CanComponentDeactivate {
  private sessionService = inject(SessionService);
  private routerService = inject(Router);
  private alertCtrl = inject(AlertController);
  private sessionEnded = false;

  canDeactivate(): boolean {
    return this.sessionEnded;
  }

  getEvents() {
    return this.sessionService.session$().events;
  }

  test() {
    this.sessionService.recordEvent({
      id: crypto.randomUUID(),
      time: new Date(),
      type: 'manual-note',
      notes: 'Test event',
      altitude: Math.random() * 1000, // Example altitude
    });
  }

  async onEndSession() {
    const alert = await this.alertCtrl.create({
      header: 'Confirm',
      message: 'Are you sure you want to end the session?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'End Session', role: 'confirm' },
      ],
    });

    await alert.present();

    const { role } = await alert.onDidDismiss();

    if (role === 'confirm') {
      console.log('Ending session...');
      this.sessionEnded = true;
      this.sessionService.endSession();
      this.routerService.navigate(['/tabs/home']);
    }
  }
}
