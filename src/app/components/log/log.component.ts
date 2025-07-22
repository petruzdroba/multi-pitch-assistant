import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Session } from 'src/app/models/session.interface';
import { LogService } from 'src/app/services/log.service';
import {
  IonCard,
  IonCardTitle,
  IonCardHeader,
  IonCardContent,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';

@Component({
  selector: 'app-log',
  templateUrl: './log.component.html',
  styleUrls: ['./log.component.css'],
  imports: [IonCardContent, IonCardHeader, IonCardTitle, IonCard, DatePipe],
})
export class LogComponent {
  private logService = inject(LogService);
  private routerService = inject(Router);

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
    this.routerService.navigate(['/tabs/session-details', sessionId]);
  }
}
