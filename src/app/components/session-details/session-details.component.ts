import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Session } from 'src/app/models/session.interface';
import { LogService } from 'src/app/services/log.service';
import {
  IonProgressBar,
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
import { AddEventModalComponent } from './add-event-modal/add-event-modal.component';
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

  private sortEventsByTime(events: ClimbEvent[]): ClimbEvent[] {
    return [...events].sort((a, b) => {
      // Always keep session-started first
      if (a.type === 'session-started') return -1;
      if (b.type === 'session-started') return 1;

      // Always keep session-ended last
      if (a.type === 'session-ended') return 1;
      if (b.type === 'session-ended') return -1;

      // Sort other events by time
      return a.time.getTime() - b.time.getTime();
    });
  }

  async openEditModal(event: ClimbEvent) {
    const modal = await this.modalController.create({
      component: EditEventModalComponent,
      componentProps: { event: event, sessionId: this.loadedSession()?.id },
    });
    modal.present();
    const { data: updatedEvent, role } = await modal.onWillDismiss();

    if (role === 'confirm') {
      const session = this.loadedSession();
      if (session) {
        const updatedEvents = session.events.map((e) =>
          e.id === updatedEvent.id ? { ...e, ...updatedEvent } : e
        );

        const updatedSession: Session = {
          ...session,
          events: this.sortEventsByTime(updatedEvents),
        };

        this.loadedSession.set(updatedSession);
        this.logService.updateEvent(updatedEvent, session.id);
      }
    }
  }

  async openAddModal() {
    const session = this.loadedSession();
    if (!session) return;

    const modal = await this.modalController.create({
      component: AddEventModalComponent,
      componentProps: { sessionId: session.id },
    });
    modal.present();
    const { data: newEvent, role } = await modal.onWillDismiss();

    if (role === 'confirm' && newEvent) {
      const updatedSession: Session = {
        ...session,
        events: this.sortEventsByTime([...session.events, newEvent]),
      };
      this.loadedSession.set(updatedSession);
    }
  }

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const sessionId = params['id'];
      const session = this.logService.getSessionById(sessionId);
      if (session) {
        // Sort events by time when loading the session
        const sortedSession = {
          ...session,
          events: this.sortEventsByTime(session.events)
        };
        this.loadedSession.set(sortedSession);
        if (sortedSession.name) {
          this.name = sortedSession.name;
        }
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

  onDelete(event: ClimbEvent) {
    const session = this.loadedSession();
    if (!session) return;

    this.logService.deleteEvent(event.id, session.id);

    const updatedSession: Session = {
      ...session,
      events: this.sortEventsByTime(session.events.filter((e) => e.id !== event.id)),
    };
    this.loadedSession.set(updatedSession);
  }

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
