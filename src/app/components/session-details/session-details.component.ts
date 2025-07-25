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
  name: string = '';

  constructor(private route: ActivatedRoute) {}

  async openModal(event: ClimbEvent | undefined = undefined) {
    const modal = await this.modalController.create({
      component: EditEventModalComponent,
      componentProps: { event: event, sessionId: this.loadedSession()?.id },
    });
    modal.present();
    const { data: updatedEvent, role } = await modal.onWillDismiss();

    if (role === 'confirm') {
      const session = this.loadedSession();
      if (session) {
        const updatedSession: Session = {
          ...session,
          events: session.events.map((e) =>
            e.id === updatedEvent.id ? { ...e, ...updatedEvent } : e
          ),
        };

        this.loadedSession.set(updatedSession);
        this.logService.updateEvent(updatedEvent, session.id);
      }
    }
  }

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const sessionId = params['id'];
      const session = this.logService.getSessionById(sessionId);
      this.loadedSession.set(session);
      if (session?.name) {
        this.name = session.name;
      }
    });
  }

  onCancel() {
    this.routerService.navigate(['/tabs/log'], { replaceUrl: true });
  }

  onNameChange() {
    const session = this.loadedSession();
    if (session) {
      this.loadedSession.set({ ...session, name: this.name });
      // Optionally update backend here too
    }
  }

  onDelete(event: ClimbEvent) {}

  onSubmit() {
    const session = this.loadedSession();
    if (!session) return;

    const updatedSession: Session = {
      ...session,
      name: this.name,
    };

    this.loadedSession.set(updatedSession);
    this.logService.updateSession(updatedSession);
    this.routerService.navigate(['/tabs/log'], { replaceUrl: true });
  }
}
