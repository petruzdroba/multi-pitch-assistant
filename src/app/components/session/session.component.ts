import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { IonList, IonItem } from '@ionic/angular/standalone';
import { CanComponentDeactivate } from 'src/app/guards/session-exit.guard';
import { SessionService } from 'src/app/services/session.service';
import { AlertController } from '@ionic/angular';
import { Dialog } from '@capacitor/dialog';

@Component({
  selector: 'app-session',
  templateUrl: './session.component.html',
  styleUrls: ['./session.component.css'],
  encapsulation: ViewEncapsulation.None,
  imports: [IonItem, IonList, DatePipe, CommonModule],
})
export class SessionComponent implements CanComponentDeactivate {
  private sessionService = inject(SessionService);
  private routerService = inject(Router);
  private sessionEnded = false;
  private alertCtrl = inject(AlertController);

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
    const { value } = await Dialog.confirm({
      title: 'Confirm End',
      message: 'Are you sure you want to end the session?',
    });

    if (value) {
      console.log('Confirmed: Ending session...');
      this.sessionEnded = true;
      this.sessionService.endSession();
      setTimeout(() => {
        this.routerService.navigate(['/tabs/home']);
      }, 100);
    }
  }
}
