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
  ModalController,
} from '@ionic/angular/standalone';
import { CommonModule, DatePipe } from '@angular/common';
import { ClimbEvent } from 'src/app/models/climb-event.interface';
import { EditEventModalComponent } from './edit-event-modal/edit-event-modal.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-session-details',
  templateUrl: './session-details.component.html',
  styleUrls: ['./session-details.component.css'],
  imports: [
    DatePipe,
    CommonModule,
    FormsModule,

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
  ],
})
export class SessionDetailsComponent implements OnInit {
  private logService = inject(LogService);
  private routerService = inject(Router);
  private modalController = inject(ModalController);

  loadedSession = signal<Session | undefined>(undefined);
  constructor(private route: ActivatedRoute) {}

  async openModal(event: ClimbEvent | undefined = undefined) {
    const modal = await this.modalController.create({
      component: EditEventModalComponent,
      componentProps: { event: event },
    });
    modal.present();
    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm') {
      // this.message = `Hello, ${data}!`;
      console.log('modal data:', data);
    }
  }

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

  onEdit(event: ClimbEvent) {}

  onDelete(event: ClimbEvent) {}
}
