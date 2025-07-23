import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Session } from 'src/app/models/session.interface';
import { LogService } from 'src/app/services/log.service';
import {
  IonProgressBar,
  IonButton,
  IonItem,
  IonInput,
  IonList,
  IonFab,
  IonFabButton,
  IonIcon,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
} from '@ionic/angular/standalone';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-session-details',
  templateUrl: './session-details.component.html',
  styleUrls: ['./session-details.component.css'],
  imports: [
    IonProgressBar,
    IonButton,
    IonInput,
    IonItem,
    DatePipe,
    IonList,
    CommonModule,
    IonFab,
    IonFabButton,
    IonIcon,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
  ],
})
export class SessionDetailsComponent implements OnInit {
  private logService = inject(LogService);
  private routerService = inject(Router);

  loadedSession = signal<Session | undefined>(undefined);
  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const sessionId = params['id'];
      this.loadedSession.set(this.logService.getSessionById(sessionId));
      if (!this.loadedSession()) {
        console.error('Session not found:', sessionId);
      }
    });
  }

  onCancel() {
    this.routerService.navigate(['/tabs/log'], { replaceUrl: true });
  }
}
