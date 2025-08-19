import { DatePipe } from '@angular/common';
import { Component, inject, ViewEncapsulation } from '@angular/core';
import { Session } from 'src/app/models/session.interface';
import { LogService } from 'src/app/services/log.service';
import {
  IonCard,
  IonCardTitle,
  IonCardHeader,
  IonCardContent,
  AlertController,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';

@Component({
  selector: 'app-log',
  templateUrl: './log.component.html',
  styleUrls: ['./log.component.css'],
  encapsulation: ViewEncapsulation.None,
  imports: [IonCardContent, IonCardHeader, IonCardTitle, IonCard, DatePipe],
})
export class LogComponent {
  private logService = inject(LogService);
  private routerService = inject(Router);
  private alertCtrl = inject(AlertController);

  private longPressTimeout: any;
  private longPressTriggered: boolean = false;

  getSessions(): Session[] {
    return this.logService.logs$();
  }

  getDuration(start: Date, end: Date): string {
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const minutes = diffMins % 60;
      return (
        `${hours} hr${hours !== 1 ? 's' : ''}` +
        (minutes ? ` ${minutes} min` : '')
      );
    }
  }

  onOpenSession(sessionId: string) {
    if (this.longPressTriggered) return;
    this.routerService.navigate(['/tabs/session-details', sessionId]);
  }

  startLongPress(sessionId: string) {
    this.longPressTriggered = false;
    clearTimeout(this.longPressTimeout);

    this.longPressTimeout = setTimeout(() => {
      this.longPressTriggered = true;
      this.onLongPress(sessionId);
    }, 600);
  }

  cancelLongPress() {
    clearTimeout(this.longPressTimeout);
    this.longPressTimeout = null;
  }

  async onLongPress(sessionId: string) {
    const alert = await this.alertCtrl.create({
      header: 'Confirm Delete',
      message: 'Do you really want to delete this session?',
      cssClass: 'alert-glass',
      backdropDismiss: true,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Delete',
          role: 'destructive',
          cssClass: 'btn-glass',
          handler: () => {
            this.logService.deleteSession(sessionId)
          },
        },
      ],
    });

    await alert.present();
  }
}
